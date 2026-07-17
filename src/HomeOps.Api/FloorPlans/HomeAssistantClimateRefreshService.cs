using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed class HomeAssistantClimateRefreshService(
    HomeOpsDbContext db,
    HomeAssistantClimateProvider adapter,
    HomeAssistantClimateRefreshCoordinator coordinator,
    TimeProvider clock)
{
    private const string MetadataPrefix = "ha-refresh:";
    private HomeAssistantClimateRefreshSummary? latest;

    public HomeAssistantClimateRefreshSummary? LatestRefresh => latest;

    public async Task<IReadOnlyCollection<HomeAssistantClimateRefreshSummary>> RefreshEnabledProvidersAsync(CancellationToken cancellationToken)
    {
        var providers = await db.ClimateProviders.AsNoTracking()
            .Where(p => p.HouseholdId == SeedHousehold.Id && p.ProviderType == ProviderType.HomeAssistant && p.IsEnabled && !p.IsArchived)
            .OrderBy(p => p.DisplayName).ThenBy(p => p.Id)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);
        var results = new List<HomeAssistantClimateRefreshSummary>();
        foreach (var providerId in providers)
        {
            results.Add(await RefreshProviderAsync(providerId, cancellationToken));
        }
        return results;
    }

    public Task<HomeAssistantClimateRefreshSummary> RefreshProviderAsync(Guid providerId, CancellationToken cancellationToken) =>
        coordinator.RunProviderAsync(providerId, ct => RefreshProviderCoreAsync(providerId, null, null, ct), cancellationToken);

    public async Task<HomeAssistantClimateRefreshSummary?> RefreshRoomAsync(Guid roomId, CancellationToken cancellationToken)
    {
        var providerIds = await db.RoomClimateSourceMappings.AsNoTracking()
            .Where(m => m.RoomId == roomId && m.IsEnabled && !m.IsArchived && m.Provider!.ProviderType == ProviderType.HomeAssistant && m.Provider.IsEnabled && !m.Provider.IsArchived && m.Room!.IsEnabled && !m.Room.IsArchived)
            .Select(m => m.ProviderId).Distinct().ToListAsync(cancellationToken);
        if (providerIds.Count == 0) return null;
        var summaries = new List<HomeAssistantClimateRefreshSummary>();
        foreach (var providerId in providerIds)
        {
            summaries.Add(await coordinator.RunProviderAsync(providerId, ct => RefreshProviderCoreAsync(providerId, roomId, null, ct), cancellationToken));
        }
        latest = Combine(roomId, summaries);
        return latest;
    }

    public async Task<HomeAssistantClimateRefreshSummary?> RefreshMappingAsync(Guid mappingId, CancellationToken cancellationToken)
    {
        var mapping = await db.RoomClimateSourceMappings.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mappingId, cancellationToken);
        if (mapping is null) return null;
        return await coordinator.RunProviderAsync(mapping.ProviderId, ct => RefreshProviderCoreAsync(mapping.ProviderId, mapping.RoomId, mappingId, ct), cancellationToken);
    }

    public async Task<HomeAssistantClimateRefreshDiagnosticsDto?> GetProviderDiagnosticsAsync(Guid providerId, CancellationToken cancellationToken)
    {
        var provider = await db.ClimateProviders.AsNoTracking().FirstOrDefaultAsync(p => p.Id == providerId && p.ProviderType == ProviderType.HomeAssistant, cancellationToken);
        if (provider is null) return null;
        var mappings = await db.RoomClimateSourceMappings.AsNoTracking().Where(m => m.ProviderId == providerId).OrderBy(m => m.RoomId).ThenBy(m => m.SourceRole).Select(m => new HomeAssistantClimateMappingDiagnosticDto(m.Id, m.RoomId, m.SourceRole.ToString(), m.IsEnabled, m.IsArchived, m.Health.ToString(), m.LastCheckedUtc, m.LastSuccessfulUtc, m.DiagnosticSummary)).ToListAsync(cancellationToken);
        return new(provider.Id, provider.DisplayName, provider.IsEnabled, provider.IsArchived, ParseOutcome(provider.DiagnosticMetadata).ToString(), SafeProviderDiagnostic(provider.DiagnosticMetadata), mappings.MaxBy(m => m.LastCheckedUtc)?.LastCheckedUtc, mappings.MaxBy(m => m.LastSuccessfulUtc)?.LastSuccessfulUtc, mappings);
    }

    private async Task<HomeAssistantClimateRefreshSummary> RefreshProviderCoreAsync(Guid providerId, Guid? roomId, Guid? mappingId, CancellationToken cancellationToken)
    {
        var started = clock.GetUtcNow();
        var issues = new List<HomeAssistantClimateRefreshIssue>();
        try
        {
            var provider = await db.ClimateProviders.FirstOrDefaultAsync(p => p.Id == providerId, cancellationToken);
            if (provider is null || provider.ProviderType != ProviderType.HomeAssistant || !provider.IsEnabled || provider.IsArchived)
                return Store(new(providerId, started, clock.GetUtcNow(), HomeAssistantClimateRefreshOutcome.Skipped, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false, issues));

            var query = db.RoomClimateSourceMappings.Include(m => m.Room).Where(m => m.ProviderId == providerId && m.IsEnabled && !m.IsArchived && m.Room != null && m.Room.IsEnabled && !m.Room.IsArchived);
            if (roomId is not null) query = query.Where(m => m.RoomId == roomId.Value);
            if (mappingId is not null) query = query.Where(m => m.Id == mappingId.Value);
            var mappings = await query.OrderBy(m => m.RoomId).ThenBy(m => m.Priority).ToListAsync(cancellationToken);
            var roomsAttempted = mappings.Select(m => m.RoomId).Distinct().Count();
            var accepted = 0; var failed = 0;
            foreach (var group in mappings.GroupBy(m => m.RoomId))
            {
                try
                {
                    var result = await adapter.RefreshRoomAsync(group.Key, providerId, mappingId, cancellationToken);
                    accepted += result.SubmittedCount;
                    failed += result.FailedCount;
                }
                catch (OperationCanceledException) { throw; }
                catch
                {
                    failed += group.Count();
                    issues.Add(new("Room", providerId, group.Key, null, "RoomRefreshFailed", "Room refresh failed safely."));
                }
            }
            await db.Entry(provider).ReloadAsync(cancellationToken);
            var refreshedMappings = await db.RoomClimateSourceMappings.AsNoTracking().Where(m => mappings.Select(x => x.Id).Contains(m.Id)).ToListAsync(cancellationToken);
            var healthy = refreshedMappings.Count(m => m.Health == MappingHealth.Healthy);
            var missing = refreshedMappings.Count(m => m.Health == MappingHealth.Missing);
            var unavailable = refreshedMappings.Count(m => m.Health == MappingHealth.Unavailable);
            var needs = refreshedMappings.Count(m => m.Health is MappingHealth.NeedsReview or MappingHealth.Degraded or MappingHealth.Unverified);
            var outcome = DetermineOutcome(refreshedMappings, failed);
            provider.DiagnosticMetadata = MetadataPrefix + outcome;
            provider.UpdatedUtc = clock.GetUtcNow();
            await db.SaveChangesAsync(cancellationToken);
            return Store(new(providerId, started, clock.GetUtcNow(), outcome, roomsAttempted, roomsAttempted - refreshedMappings.Where(m => m.Health != MappingHealth.Healthy).Select(m => m.RoomId).Distinct().Count(), refreshedMappings.Where(m => m.Health != MappingHealth.Healthy).Select(m => m.RoomId).Distinct().Count(), mappings.Count, healthy, missing, unavailable, needs, accepted, 0, failed, false, issues));
        }
        catch (OperationCanceledException)
        {
            return Store(new(providerId, started, clock.GetUtcNow(), HomeAssistantClimateRefreshOutcome.Cancelled, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, true, issues));
        }
    }

    private HomeAssistantClimateRefreshSummary Store(HomeAssistantClimateRefreshSummary summary) { latest = summary; return summary; }
    private static HomeAssistantClimateRefreshOutcome DetermineOutcome(List<RoomClimateSourceMapping> mappings, int failed)
    {
        if (mappings.Count == 0) return HomeAssistantClimateRefreshOutcome.Unverified;
        if (mappings.All(m => m.Health == MappingHealth.Healthy)) return HomeAssistantClimateRefreshOutcome.Healthy;
        if (mappings.Any(m => m.DiagnosticSummary?.StartsWith("AuthenticationFailed:", StringComparison.OrdinalIgnoreCase) == true)) return failed == mappings.Count ? HomeAssistantClimateRefreshOutcome.AuthenticationFailure : HomeAssistantClimateRefreshOutcome.PartialFailure;
        if (mappings.All(m => m.Health == MappingHealth.Unavailable)) return HomeAssistantClimateRefreshOutcome.ProviderUnavailable;
        if (mappings.Any(m => m.DiagnosticSummary?.StartsWith("InvalidConfiguration:", StringComparison.OrdinalIgnoreCase) == true)) return HomeAssistantClimateRefreshOutcome.InvalidConnectionConfiguration;
        return HomeAssistantClimateRefreshOutcome.PartialFailure;
    }
    private static HomeAssistantClimateRefreshOutcome ParseOutcome(string? metadata) => metadata?.StartsWith(MetadataPrefix, StringComparison.OrdinalIgnoreCase) == true && Enum.TryParse<HomeAssistantClimateRefreshOutcome>(metadata[MetadataPrefix.Length..], out var outcome) ? outcome : HomeAssistantClimateRefreshOutcome.Unverified;
    private static string? SafeProviderDiagnostic(string? metadata) => metadata?.StartsWith(MetadataPrefix, StringComparison.OrdinalIgnoreCase) == true ? metadata : null;
    private HomeAssistantClimateRefreshSummary Combine(Guid? roomId, List<HomeAssistantClimateRefreshSummary> summaries) => new(null, summaries.Min(s => s.StartedUtc), summaries.Max(s => s.CompletedUtc), summaries.Any(s => s.Outcome != HomeAssistantClimateRefreshOutcome.Healthy) ? HomeAssistantClimateRefreshOutcome.PartialFailure : HomeAssistantClimateRefreshOutcome.Healthy, summaries.Sum(s => s.RoomsAttempted), summaries.Sum(s => s.RoomsSucceeded), summaries.Sum(s => s.RoomsFailed), summaries.Sum(s => s.MappingsAttempted), summaries.Sum(s => s.MappingsHealthy), summaries.Sum(s => s.MappingsMissing), summaries.Sum(s => s.MappingsUnavailable), summaries.Sum(s => s.MappingsNeedsReview), summaries.Sum(s => s.ObservationsAccepted), summaries.Sum(s => s.ObservationsIgnored), summaries.Sum(s => s.ObservationsFailed), summaries.Any(s => s.WasCancelled), summaries.SelectMany(s => s.Issues).ToList());
}

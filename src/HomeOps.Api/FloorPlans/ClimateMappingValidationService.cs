using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed class ClimateMappingValidationService(HomeOpsDbContext dbContext)
{
    public async Task<ClimateMappingValidationUpdateResult> MarkHealthyAsync(Guid householdId, Guid mappingId, ClimateMappingValidationMetadata? metadata = null, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.Healthy, metadata, requireActiveSource: true, reset: false, cancellationToken);

    public async Task<ClimateMappingValidationUpdateResult> MarkDegradedAsync(Guid householdId, Guid mappingId, string diagnosticSummary, ClimateMappingValidationMetadata? metadata = null, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.Degraded, (metadata ?? new ClimateMappingValidationMetadata()) with { DiagnosticSummary = diagnosticSummary }, requireActiveSource: false, reset: false, cancellationToken);

    public async Task<ClimateMappingValidationUpdateResult> MarkUnavailableAsync(Guid householdId, Guid mappingId, string diagnosticSummary, ClimateMappingValidationMetadata? metadata = null, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.Unavailable, (metadata ?? new ClimateMappingValidationMetadata()) with { DiagnosticSummary = diagnosticSummary }, requireActiveSource: false, reset: false, cancellationToken);

    public async Task<ClimateMappingValidationUpdateResult> MarkMissingAsync(Guid householdId, Guid mappingId, string diagnosticSummary, ClimateMappingValidationMetadata? metadata = null, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.Missing, (metadata ?? new ClimateMappingValidationMetadata()) with { DiagnosticSummary = diagnosticSummary }, requireActiveSource: false, reset: false, cancellationToken);

    public async Task<ClimateMappingValidationUpdateResult> MarkNeedsReviewAsync(Guid householdId, Guid mappingId, string diagnosticSummary, ClimateMappingValidationMetadata? metadata = null, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.NeedsReview, (metadata ?? new ClimateMappingValidationMetadata()) with { DiagnosticSummary = diagnosticSummary }, requireActiveSource: false, reset: false, cancellationToken);

    public async Task<ClimateMappingValidationUpdateResult> ResetToUnverifiedAsync(Guid householdId, Guid mappingId, CancellationToken cancellationToken = default) =>
        await ApplyAsync(householdId, mappingId, MappingHealth.Unverified, null, requireActiveSource: false, reset: true, cancellationToken);

    private async Task<ClimateMappingValidationUpdateResult> ApplyAsync(Guid householdId, Guid mappingId, MappingHealth health, ClimateMappingValidationMetadata? metadata, bool requireActiveSource, bool reset, CancellationToken cancellationToken)
    {
        if (householdId == Guid.Empty) return ClimateMappingValidationUpdateResult.Invalid("householdId", "Household id is required.");
        if (mappingId == Guid.Empty) return ClimateMappingValidationUpdateResult.Invalid("mappingId", "Mapping id is required.");

        var mapping = await dbContext.RoomClimateSourceMappings
            .Include(candidate => candidate.Room)
            .Include(candidate => candidate.Provider)
            .FirstOrDefaultAsync(candidate => candidate.Id == mappingId && candidate.HouseholdId == householdId, cancellationToken);
        if (mapping is null) return ClimateMappingValidationUpdateResult.NotFound("Mapping was not found for the supplied household.");
        if (mapping.Room is null || mapping.Provider is null || mapping.Room.HouseholdId != householdId || mapping.Provider.HouseholdId != householdId)
        {
            return ClimateMappingValidationUpdateResult.Invalid("householdId", "Mapping, Room, and Provider must belong to the same household.");
        }
        if (mapping.IsArchived) return ClimateMappingValidationUpdateResult.Invalid("mappingId", "Archived mappings cannot receive provider validation updates.");
        if (mapping.Room.IsArchived || !mapping.Room.IsEnabled) return ClimateMappingValidationUpdateResult.Invalid("roomId", "Mappings for archived or disabled Rooms cannot receive active validation updates.");
        if (mapping.Provider.IsArchived) return ClimateMappingValidationUpdateResult.Invalid("providerId", "Mappings for archived Providers cannot receive provider validation updates.");
        if (requireActiveSource && !mapping.IsEnabled) return ClimateMappingValidationUpdateResult.Invalid("mappingId", "Disabled mappings cannot be marked Healthy as active sources.");
        if (requireActiveSource && !mapping.Provider.IsEnabled) return ClimateMappingValidationUpdateResult.Invalid("providerId", "Mappings for disabled Providers cannot be marked Healthy as active sources.");

        var climateEnabled = await dbContext.RoomClimateConfigurations
            .AsNoTracking()
            .Where(config => config.RoomId == mapping.RoomId && config.HouseholdId == householdId)
            .Select(config => (bool?)config.IsClimateEnabled)
            .SingleOrDefaultAsync(cancellationToken);
        if (climateEnabled is null) return ClimateMappingValidationUpdateResult.Invalid("roomId", "Mapping Room must still have a climate configuration.");
        if (requireActiveSource && climateEnabled == false) return ClimateMappingValidationUpdateResult.Invalid("roomId", "Mappings for disabled climate configuration cannot be marked Healthy as active sources.");

        var metadataValidation = ValidateMetadata(metadata);
        if (!metadataValidation.Succeeded) return metadataValidation;

        if (reset)
        {
            mapping.Health = MappingHealth.Unverified;
            mapping.LastCheckedUtc = null;
            mapping.LastSuccessfulUtc = null;
            mapping.DiagnosticSummary = null;
        }
        else
        {
            var now = DateTimeOffset.UtcNow;
            mapping.Health = health;
            mapping.LastCheckedUtc = now;
            if (health == MappingHealth.Healthy)
            {
                mapping.LastSuccessfulUtc = now;
                mapping.DiagnosticSummary = null;
            }
            else if (metadata?.DiagnosticSummary is not null)
            {
                mapping.DiagnosticSummary = metadata.DiagnosticSummary.Trim();
            }
        }

        ApplyMetadata(mapping, metadata);
        mapping.UpdatedUtc = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return ClimateMappingValidationUpdateResult.Success(mapping.Id);
    }

    private static ClimateMappingValidationUpdateResult ValidateMetadata(ClimateMappingValidationMetadata? metadata)
    {
        if (metadata is null) return ClimateMappingValidationUpdateResult.Success(Guid.Empty);
        return ValidateLength(metadata.ExternalDisplayName, 240, nameof(metadata.ExternalDisplayName))
            ?? ValidateLength(metadata.ExternalSourceKind, 80, nameof(metadata.ExternalSourceKind))
            ?? ValidateLength(metadata.ExternalAreaId, 160, nameof(metadata.ExternalAreaId))
            ?? ValidateLength(metadata.ExternalAreaName, 160, nameof(metadata.ExternalAreaName))
            ?? ValidateLength(metadata.ExternalDeviceId, 160, nameof(metadata.ExternalDeviceId))
            ?? ValidateLength(metadata.ExternalDeviceName, 160, nameof(metadata.ExternalDeviceName))
            ?? ValidateLength(metadata.DiagnosticSummary, 500, nameof(metadata.DiagnosticSummary))
            ?? ClimateMappingValidationUpdateResult.Success(Guid.Empty);
    }

    private static ClimateMappingValidationUpdateResult? ValidateLength(string? value, int maxLength, string field)
    {
        return value is not null && value.Trim().Length > maxLength
            ? ClimateMappingValidationUpdateResult.Invalid(field, $"{field} must be {maxLength} characters or fewer.")
            : null;
    }

    private static void ApplyMetadata(RoomClimateSourceMapping mapping, ClimateMappingValidationMetadata? metadata)
    {
        if (metadata is null) return;
        if (metadata.ExternalDisplayName is not null) mapping.ExternalDisplayName = Clean(metadata.ExternalDisplayName);
        if (metadata.ExternalSourceKind is not null) mapping.ExternalSourceKind = Clean(metadata.ExternalSourceKind);
        if (metadata.ExternalAreaId is not null) mapping.ExternalAreaId = Clean(metadata.ExternalAreaId);
        if (metadata.ExternalAreaName is not null) mapping.ExternalAreaName = Clean(metadata.ExternalAreaName);
        if (metadata.ExternalDeviceId is not null) mapping.ExternalDeviceId = Clean(metadata.ExternalDeviceId);
        if (metadata.ExternalDeviceName is not null) mapping.ExternalDeviceName = Clean(metadata.ExternalDeviceName);
    }

    private static string? Clean(string value)
    {
        var trimmed = value.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}

public sealed record ClimateMappingValidationMetadata(
    string? ExternalDisplayName = null,
    string? ExternalSourceKind = null,
    string? ExternalAreaId = null,
    string? ExternalAreaName = null,
    string? ExternalDeviceId = null,
    string? ExternalDeviceName = null,
    string? DiagnosticSummary = null);

public sealed record ClimateMappingValidationUpdateResult(bool Succeeded, Guid? MappingId, IReadOnlyDictionary<string, string[]> ValidationErrors)
{
    public static ClimateMappingValidationUpdateResult Success(Guid mappingId) => new(true, mappingId, new Dictionary<string, string[]>());
    public static ClimateMappingValidationUpdateResult NotFound(string message) => Invalid("mappingId", message);
    public static ClimateMappingValidationUpdateResult Invalid(string field, string message) => new(false, null, new Dictionary<string, string[]> { [field] = [message] });
}

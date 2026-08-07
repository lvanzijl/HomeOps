using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Contracts.Households;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace HomeOps.Api.Households;

public sealed class HouseholdTimeZoneChangeService(
    HomeOpsDbContext dbContext,
    ICalendarSourceRefreshDispatcher refreshDispatcher,
    CalendarSourceSynchronizationEngine synchronizationEngine,
    TimeProvider? timeProvider = null)
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<HouseholdTimeZoneImpactDto> GetImpactAsync(Guid householdId, CancellationToken cancellationToken = default)
    {
        var manualQuery = dbContext.EventSeries.Where(series => series.EventSource!.HouseholdId == householdId && series.EventSource.IsSystem && series.EventSource.SourceType == EventSourceTypes.Manual);
        var manualTimed = await manualQuery.CountAsync(series => !series.IsAllDay, cancellationToken);
        var manualAllDay = await manualQuery.CountAsync(series => series.IsAllDay, cancellationToken);
        var imported = dbContext.EventSources.Where(source => source.HouseholdId == householdId && (source.SourceType == EventSourceTypes.ICalFeed || source.SourceType == EventSourceTypes.ICalFile));
        var enabled = await imported.CountAsync(source => source.IsEnabled, cancellationToken);
        var disabled = await imported.CountAsync(source => !source.IsEnabled, cancellationToken);
        return new HouseholdTimeZoneImpactDto(manualTimed, manualAllDay, enabled, disabled);
    }

    public async Task<HouseholdTimeZoneChangeResult> ChangeAsync(UpdateHouseholdTimeZoneRequest request, CancellationToken cancellationToken = default)
    {
        var household = await dbContext.Households.AsNoTracking().SingleAsync(candidate => candidate.Id == SeedHousehold.Id, cancellationToken);
        var impact = await GetImpactAsync(household.Id, cancellationToken);
        if (!string.Equals(household.TimeZoneId, request.ExpectedCurrentTimeZoneId, StringComparison.Ordinal))
        {
            return HouseholdTimeZoneChangeResult.Conflict(household.TimeZoneId, impact);
        }

        if (string.Equals(household.TimeZoneId, request.TimeZoneId, StringComparison.Ordinal))
        {
            return HouseholdTimeZoneChangeResult.Success(household.TimeZoneId, impact);
        }

        var enabledSources = await dbContext.EventSources.AsNoTracking()
            .Where(source => source.HouseholdId == household.Id && source.IsEnabled)
            .Where(source => source.SourceType == EventSourceTypes.ICalFeed || source.SourceType == EventSourceTypes.ICalFile)
            .OrderBy(source => source.Name)
            .ToListAsync(cancellationToken);
        var prepared = new List<CalendarSourcePreparedRefresh>();
        var failures = new List<HouseholdTimeZoneSourceFailureDto>();
        foreach (var source in enabledSources)
        {
            var refresh = await refreshDispatcher.PrepareAsync(source, request.TimeZoneId, true, cancellationToken);
            if (!refresh.Succeeded)
            {
                failures.Add(ToFailure(source, refresh.Snapshot));
            }
            else
            {
                prepared.Add(refresh);
            }
        }

        if (failures.Count > 0)
        {
            return HouseholdTimeZoneChangeResult.PreflightFailed(household.TimeZoneId, impact, failures);
        }

        IDbContextTransaction? transaction = null;
        if (dbContext.Database.IsRelational())
        {
            transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        }

        try
        {
            var trackedHousehold = await dbContext.Households.SingleAsync(candidate => candidate.Id == household.Id, cancellationToken);
            if (!string.Equals(trackedHousehold.TimeZoneId, request.ExpectedCurrentTimeZoneId, StringComparison.Ordinal))
            {
                if (transaction is not null) await transaction.RollbackAsync(cancellationToken);
                return HouseholdTimeZoneChangeResult.Conflict(trackedHousehold.TimeZoneId, impact);
            }

            var now = timeProvider.GetUtcNow();
            trackedHousehold.TimeZoneId = request.TimeZoneId;
            trackedHousehold.UpdatedUtc = now;
            foreach (var refresh in prepared)
            {
                await synchronizationEngine.ApplyPreparedSnapshotAsync(refresh.Source.Id, refresh.Snapshot, request.TimeZoneId, now, cancellationToken);
            }

            var disabledSources = await dbContext.EventSources
                .Where(source => source.HouseholdId == household.Id && !source.IsEnabled)
                .Where(source => source.SourceType == EventSourceTypes.ICalFeed || source.SourceType == EventSourceTypes.ICalFile)
                .ToListAsync(cancellationToken);
            foreach (var source in disabledSources)
            {
                source.NormalizationTimeZoneId = null;
                source.UpdatedUtc = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            return HouseholdTimeZoneChangeResult.Success(request.TimeZoneId, impact);
        }
        catch
        {
            if (transaction is not null) await transaction.RollbackAsync(CancellationToken.None);
            throw;
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }

    private static HouseholdTimeZoneSourceFailureDto ToFailure(EventSource source, CalendarProviderSnapshot snapshot)
    {
        var diagnostic = snapshot.Diagnostics.FirstOrDefault(item => item.Severity == CalendarEvents.ICalendar.ICalendarParseDiagnosticSeverity.Error);
        return new HouseholdTimeZoneSourceFailureDto(
            source.Id,
            source.Name,
            snapshot.FailureCode ?? diagnostic?.Code ?? "PreflightFailed",
            snapshot.FailureMessage ?? diagnostic?.Message ?? "De bron kon niet opnieuw worden genormaliseerd.");
    }
}

public sealed record HouseholdTimeZoneChangeResult(
    HouseholdTimeZoneChangeStatus Status,
    string TimeZoneId,
    HouseholdTimeZoneImpactDto Impact,
    IReadOnlyCollection<HouseholdTimeZoneSourceFailureDto> SourceFailures)
{
    public static HouseholdTimeZoneChangeResult Success(string zone, HouseholdTimeZoneImpactDto impact) => new(HouseholdTimeZoneChangeStatus.Success, zone, impact, []);
    public static HouseholdTimeZoneChangeResult Conflict(string zone, HouseholdTimeZoneImpactDto impact) => new(HouseholdTimeZoneChangeStatus.Conflict, zone, impact, []);
    public static HouseholdTimeZoneChangeResult PreflightFailed(string zone, HouseholdTimeZoneImpactDto impact, IReadOnlyCollection<HouseholdTimeZoneSourceFailureDto> failures) => new(HouseholdTimeZoneChangeStatus.PreflightFailed, zone, impact, failures);
}

public enum HouseholdTimeZoneChangeStatus { Success, Conflict, PreflightFailed }

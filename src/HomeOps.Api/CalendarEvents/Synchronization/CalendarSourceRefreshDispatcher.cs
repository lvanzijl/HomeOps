using System.Diagnostics;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed class CalendarSourceRefreshDispatcher(
    IICalFeedImporter feedImporter,
    IICalFileImporter fileImporter,
    CalendarSourceSynchronizationEngine synchronizationEngine,
    HomeOpsDbContext dbContext,
    TimeProvider? timeProvider = null) : ICalendarSourceRefreshDispatcher
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CalendarSourceRefreshDispatchResult> RefreshAsync(EventSource source, CancellationToken cancellationToken = default)
    {
        var timeZoneId = await dbContext.Households.AsNoTracking()
            .Where(household => household.Id == source.HouseholdId)
            .Select(household => household.TimeZoneId)
            .SingleAsync(cancellationToken);
        var prepared = await PrepareAsync(source, timeZoneId, false, cancellationToken);
        if (!IsSupportedSourceType(source.SourceType))
        {
            return Unsupported(source);
        }

        var syncResult = await synchronizationEngine.SynchronizeAsync(source, prepared.Snapshot, prepared.NormalizationTimeZoneId, cancellationToken);
        return CalendarSourceRefreshDispatchResult.FromSupported(syncResult);
    }

    public async Task<CalendarSourcePreparedRefresh> PrepareAsync(EventSource source, string householdTimeZoneId, bool forceFullLoad, CancellationToken cancellationToken = default)
    {
        var snapshot = source.SourceType switch
        {
            EventSourceTypes.ICalFeed => ToSnapshot(await feedImporter.ImportForZoneAsync(source, householdTimeZoneId, forceFullLoad, cancellationToken)),
            EventSourceTypes.ICalFile => ToSnapshot(await fileImporter.ImportForZoneAsync(source, householdTimeZoneId, cancellationToken)),
            _ => CalendarProviderSnapshot.Failed("UnsupportedProvider", $"Source type '{source.SourceType}' is not supported by refresh."),
        };

        return new CalendarSourcePreparedRefresh(source, householdTimeZoneId, ValidateSnapshot(snapshot));
    }

    public async Task<CalendarSourcePreparedRefresh> PrepareFeedReconnectAsync(EventSource source, string feedUrl, string householdTimeZoneId, CancellationToken cancellationToken = default)
    {
        var snapshot = ToSnapshot(await feedImporter.ImportUrlForZoneAsync(source, feedUrl, householdTimeZoneId, cancellationToken));
        return new CalendarSourcePreparedRefresh(source, householdTimeZoneId, ValidateSnapshot(snapshot));
    }

    private static CalendarProviderSnapshot ValidateSnapshot(CalendarProviderSnapshot snapshot)
    {
        if (snapshot.Status == CalendarProviderSnapshotStatus.Successful)
        {
            var duplicates = snapshot.Events.GroupBy(item => item.ProviderEventId, StringComparer.Ordinal).Where(group => group.Count() > 1).Select(group => group.Key).ToArray();
            if (duplicates.Length > 0)
            {
                snapshot = CalendarProviderSnapshot.Failed("DuplicateProviderEventId", $"Provider snapshot contains duplicate event identifiers: {string.Join(", ", duplicates)}.");
            }
            else if (snapshot.Diagnostics.Any(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Error))
            {
                snapshot = CalendarProviderSnapshot.Failed("ParseFailure", "Provider snapshot contained parser errors.", snapshot.Diagnostics);
            }
        }

        return snapshot;
    }

    public static bool IsSupportedSourceType(string sourceType) =>
        string.Equals(sourceType, EventSourceTypes.ICalFeed, StringComparison.Ordinal) ||
        string.Equals(sourceType, EventSourceTypes.ICalFile, StringComparison.Ordinal);

    private static CalendarProviderSnapshot ToSnapshot(ICalFeedImportResult importResult)
    {
        if (!importResult.Succeeded)
        {
            return CalendarProviderSnapshot.Failed(
                importResult.Failure?.Category.ToString() ?? "ICalFeedImportFailed",
                importResult.Failure?.Message ?? "iCal Feed import failed.",
                importResult.Diagnostics,
                importResult.Failure?.HttpStatusCode?.ToString());
        }

        if (importResult.RetrievalMetadata?.NotModified == true)
        {
            return CalendarProviderSnapshot.NotModified(importResult.Diagnostics, importResult.ProviderMetadata?.ProviderSourceId);
        }

        return CalendarProviderSnapshot.Successful(
            importResult.Events.Select(NormalizedProviderEvent.FromICalendar).ToList(),
            importResult.Diagnostics,
            importResult.ProviderMetadata?.ProviderSourceId);
    }

    private static CalendarProviderSnapshot ToSnapshot(ICalFileImportResult importResult)
    {
        if (!importResult.Succeeded)
        {
            return CalendarProviderSnapshot.Failed(
                importResult.Failure?.Category.ToString() ?? "ICalFileImportFailed",
                importResult.Failure?.Message ?? "iCal File import failed.",
                importResult.Diagnostics);
        }

        return CalendarProviderSnapshot.Successful(
            importResult.Events.Select(NormalizedProviderEvent.FromICalendar).ToList(),
            importResult.Diagnostics,
            importResult.ProviderMetadata?.ProviderSourceId);
    }

    private CalendarSourceRefreshDispatchResult Unsupported(EventSource source)
    {
        var attemptUtc = timeProvider.GetUtcNow();
        var result = CalendarSourceSynchronizationResult.Failed([
            new ICalendarParseDiagnostic(ICalendarParseDiagnosticSeverity.Error, "UnsupportedProvider", $"Source type '{source.SourceType}' is not supported by refresh.")
        ], TimeSpan.Zero, attemptUtc);
        return CalendarSourceRefreshDispatchResult.FromUnsupported(result);
    }
}

public sealed record CalendarSourceRefreshDispatchResult(
    bool Supported,
    CalendarSourceSynchronizationResult SynchronizationResult)
{
    public static CalendarSourceRefreshDispatchResult FromSupported(CalendarSourceSynchronizationResult result) => new(true, result);
    public static CalendarSourceRefreshDispatchResult FromUnsupported(CalendarSourceSynchronizationResult result) => new(false, result);
}

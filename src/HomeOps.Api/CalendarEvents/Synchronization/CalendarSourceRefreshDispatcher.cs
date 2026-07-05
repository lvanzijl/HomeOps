using System.Diagnostics;
using HomeOps.Api.CalendarEvents.ICalendar;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed class CalendarSourceRefreshDispatcher(
    IICalFeedImporter feedImporter,
    IICalFileImporter fileImporter,
    CalendarSourceSynchronizationEngine synchronizationEngine,
    TimeProvider? timeProvider = null) : ICalendarSourceRefreshDispatcher
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CalendarSourceRefreshDispatchResult> RefreshAsync(EventSource source, CancellationToken cancellationToken = default)
    {
        return source.SourceType switch
        {
            EventSourceTypes.ICalFeed => await RefreshFeedAsync(source, cancellationToken),
            EventSourceTypes.ICalFile => await RefreshFileAsync(source, cancellationToken),
            _ => Unsupported(source),
        };
    }

    public static bool IsSupportedSourceType(string sourceType) =>
        string.Equals(sourceType, EventSourceTypes.ICalFeed, StringComparison.Ordinal) ||
        string.Equals(sourceType, EventSourceTypes.ICalFile, StringComparison.Ordinal);

    private async Task<CalendarSourceRefreshDispatchResult> RefreshFeedAsync(EventSource source, CancellationToken cancellationToken)
    {
        var importResult = await feedImporter.ImportAsync(source, cancellationToken);
        var snapshot = ToSnapshot(importResult);
        var syncResult = await synchronizationEngine.SynchronizeAsync(source, snapshot, cancellationToken);
        return CalendarSourceRefreshDispatchResult.FromSupported(syncResult);
    }

    private async Task<CalendarSourceRefreshDispatchResult> RefreshFileAsync(EventSource source, CancellationToken cancellationToken)
    {
        var importResult = await fileImporter.ImportAsync(source, cancellationToken);
        var snapshot = ToSnapshot(importResult);
        var syncResult = await synchronizationEngine.SynchronizeAsync(source, snapshot, cancellationToken);
        return CalendarSourceRefreshDispatchResult.FromSupported(syncResult);
    }

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

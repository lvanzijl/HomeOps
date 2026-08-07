using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace HomeOps.Api.CalendarEvents;

public sealed class CalendarSourceLifecycleService(
    HomeOpsDbContext dbContext,
    ICalendarSourceRefreshDispatcher refreshDispatcher,
    CalendarSourceSynchronizationEngine synchronizationEngine,
    ICalFileContentStore fileContentStore,
    TimeProvider? timeProvider = null)
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CalendarSourceLifecycleResult> ArchiveAsync(Guid sourceId, CancellationToken cancellationToken = default)
    {
        var source = await ManagedSource(sourceId, cancellationToken);
        if (source is null) return CalendarSourceLifecycleResult.NotFound();
        var now = timeProvider.GetUtcNow();
        source.IsArchived = true;
        source.ArchivedUtc = now;
        source.IsEnabled = false;
        source.UpdatedUtc = now;
        await dbContext.SaveChangesAsync(cancellationToken);
        return CalendarSourceLifecycleResult.Success(source.Id);
    }

    public async Task<CalendarSourceLifecycleResult> RestoreAsync(Guid sourceId, CancellationToken cancellationToken = default)
    {
        var source = await dbContext.EventSources.AsNoTracking().SingleOrDefaultAsync(item => item.Id == sourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
        if (source is null) return CalendarSourceLifecycleResult.NotFound();
        if (!source.IsArchived || !CalendarSourceRefreshDispatcher.IsSupportedSourceType(source.SourceType)) return CalendarSourceLifecycleResult.Invalid("Alleen een gearchiveerde iCal-bron kan worden hersteld.");
        var refresh = await refreshDispatcher.RefreshAsync(source, cancellationToken);
        if (!refresh.SynchronizationResult.Succeeded) return CalendarSourceLifecycleResult.RefreshFailed(source.Id, refresh.SynchronizationResult);
        var tracked = await dbContext.EventSources.SingleAsync(item => item.Id == sourceId, cancellationToken);
        tracked.IsArchived = false;
        tracked.ArchivedUtc = null;
        tracked.IsEnabled = true;
        tracked.UpdatedUtc = timeProvider.GetUtcNow();
        await dbContext.SaveChangesAsync(cancellationToken);
        return CalendarSourceLifecycleResult.Success(source.Id, refresh.SynchronizationResult);
    }

    public async Task<CalendarSourceLifecycleResult> ReconnectFeedAsync(Guid sourceId, CalendarSourceFeedReconnectRequest request, CancellationToken cancellationToken = default)
    {
        var source = await dbContext.EventSources.AsNoTracking().SingleOrDefaultAsync(item => item.Id == sourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
        if (source is null) return CalendarSourceLifecycleResult.NotFound();
        if (source.SourceType != EventSourceTypes.ICalFeed) return CalendarSourceLifecycleResult.Invalid("Alleen een iCal-feed kan met een nieuw adres worden verbonden.");
        if (!Uri.TryCreate(request.FeedUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps) return CalendarSourceLifecycleResult.Invalid("Gebruik een geldig HTTPS-adres voor de iCal-feed.");
        var householdZone = await dbContext.Households.AsNoTracking().Where(item => item.Id == source.HouseholdId).Select(item => item.TimeZoneId).SingleAsync(cancellationToken);
        var prepared = await refreshDispatcher.PrepareFeedReconnectAsync(source, request.FeedUrl.Trim(), householdZone, cancellationToken);
        if (!prepared.Succeeded) return CalendarSourceLifecycleResult.PreflightFailed(source.Id, prepared.Snapshot);

        IDbContextTransaction? transaction = null;
        try
        {
            if (dbContext.Database.IsRelational()) transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var configuration = await dbContext.ICalFeedSourceConfigurations.SingleAsync(item => item.EventSourceId == sourceId, cancellationToken);
            configuration.FeedUrl = request.FeedUrl.Trim();
            configuration.ETag = null;
            configuration.LastModified = null;
            configuration.LastContentHash = null;
            configuration.UpdatedUtc = timeProvider.GetUtcNow();
            var trackedSource = await dbContext.EventSources.SingleAsync(item => item.Id == sourceId, cancellationToken);
            trackedSource.Name = request.Name.Trim();
            trackedSource.Icon = request.Icon.Trim();
            trackedSource.PollInterval = request.PollInterval switch
            {
                HomeOps.Contracts.Events.EventSourcePollInterval.EveryHour => EventSourcePollInterval.EveryHour,
                HomeOps.Contracts.Events.EventSourcePollInterval.EveryDay => EventSourcePollInterval.EveryDay,
                _ => EventSourcePollInterval.Every8Hours,
            };
            trackedSource.IsEnabled = trackedSource.IsArchived ? false : request.Enabled;
            trackedSource.UpdatedUtc = configuration.UpdatedUtc;
            await synchronizationEngine.ApplyPreparedSnapshotAsync(sourceId, prepared.Snapshot, householdZone, configuration.UpdatedUtc, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            return CalendarSourceLifecycleResult.Success(sourceId);
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

    public async Task<CalendarSourceLifecycleResult> RemoveAsync(Guid sourceId, CancellationToken cancellationToken = default)
    {
        var source = await dbContext.EventSources.Include(item => item.Configuration).SingleOrDefaultAsync(item => item.Id == sourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
        if (source is null) return CalendarSourceLifecycleResult.NotFound();
        if (source.IsSystemManualSource) return CalendarSourceLifecycleResult.Invalid("De handmatige gezinsagenda kan niet worden verwijderd.");
        var fileReference = (source.Configuration as ICalFileSourceConfiguration)?.FileReference;
        dbContext.EventSeries.RemoveRange(dbContext.EventSeries.Where(series => series.EventSourceId == sourceId));
        dbContext.EventSources.Remove(source);
        await dbContext.SaveChangesAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(fileReference))
        {
            var deleted = await fileContentStore.DeleteAsync(fileReference, cancellationToken);
            if (!deleted.Succeeded) return CalendarSourceLifecycleResult.Invalid(deleted.Error ?? "Het beheerde iCal-bestand kon niet worden verwijderd.");
        }
        return CalendarSourceLifecycleResult.Success(sourceId);
    }

    private Task<EventSource?> ManagedSource(Guid sourceId, CancellationToken cancellationToken) => dbContext.EventSources
        .SingleOrDefaultAsync(item => item.Id == sourceId && item.HouseholdId == SeedHousehold.Id && !item.IsSystem, cancellationToken);
}

public sealed record CalendarSourceLifecycleResult(bool Succeeded, bool Missing, Guid? SourceId, string? Error, CalendarProviderSnapshot? FailedSnapshot, CalendarSourceSynchronizationResult? RefreshResult)
{
    public static CalendarSourceLifecycleResult Success(Guid id, CalendarSourceSynchronizationResult? refresh = null) => new(true, false, id, null, null, refresh);
    public static CalendarSourceLifecycleResult NotFound() => new(false, true, null, null, null, null);
    public static CalendarSourceLifecycleResult Invalid(string error) => new(false, false, null, error, null, null);
    public static CalendarSourceLifecycleResult PreflightFailed(Guid id, CalendarProviderSnapshot snapshot) => new(false, false, id, snapshot.FailureMessage ?? "De feed kon niet worden ververst.", snapshot, null);
    public static CalendarSourceLifecycleResult RefreshFailed(Guid id, CalendarSourceSynchronizationResult result) => new(false, false, id, result.Diagnostics.FirstOrDefault(item => item.Severity == ICalendarParseDiagnosticSeverity.Error)?.Message ?? "De bron kon niet worden ververst.", null, result);
}

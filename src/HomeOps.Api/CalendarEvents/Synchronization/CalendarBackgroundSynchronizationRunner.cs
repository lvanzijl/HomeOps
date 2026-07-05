using System.Collections.Concurrent;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed class CalendarBackgroundSynchronizationRunner(
    IServiceScopeFactory scopeFactory,
    ILogger<CalendarBackgroundSynchronizationRunner> logger,
    TimeProvider? timeProvider = null)
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;
    private readonly ConcurrentDictionary<Guid, byte> inFlightSourceIds = new();

    public async Task RunDueSynchronizationsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var dispatcher = scope.ServiceProvider.GetRequiredService<ICalendarSourceRefreshDispatcher>();
            var now = timeProvider.GetUtcNow();

            var candidates = await dbContext.EventSources
                .AsNoTracking()
                .Where(source => source.HouseholdId == SeedHousehold.Id)
                .Where(source => source.IsEnabled)
                .Where(source => source.SourceType != EventSourceTypes.Manual && source.SourceType != "manual")
                .ToListAsync(cancellationToken);

            candidates = candidates
                .OrderBy(source => source.NextSyncAfterUtc)
                .ThenBy(source => source.Name)
                .ToList();

            foreach (var source in candidates)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                if (!CalendarSourceRefreshDispatcher.IsSupportedSourceType(source.SourceType))
                {
                    logger.LogDebug("Skipping calendar source {SourceId} because source type {SourceType} is not supported by background synchronization.", source.Id, source.SourceType);
                    continue;
                }

                if (!IsDue(source, now))
                {
                    logger.LogDebug("Skipping calendar source {SourceId} because it is not due for synchronization.", source.Id);
                    continue;
                }

                if (!inFlightSourceIds.TryAdd(source.Id, 0))
                {
                    logger.LogInformation("Skipping calendar source {SourceId} because synchronization is already in progress.", source.Id);
                    continue;
                }

                try
                {
                    logger.LogInformation("Starting background synchronization for calendar source {SourceId}.", source.Id);
                    var result = await dispatcher.RefreshAsync(source, cancellationToken);
                    logger.LogInformation(
                        "Completed background synchronization for calendar source {SourceId}. Supported={Supported} Succeeded={Succeeded} Created={CreatedCount} Updated={UpdatedCount} Deleted={DeletedCount} Unchanged={UnchangedCount}.",
                        source.Id,
                        result.Supported,
                        result.SynchronizationResult.Succeeded,
                        result.SynchronizationResult.CreatedCount,
                        result.SynchronizationResult.UpdatedCount,
                        result.SynchronizationResult.DeletedCount,
                        result.SynchronizationResult.UnchangedCount);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    logger.LogError(exception, "Background synchronization failed unexpectedly for calendar source {SourceId}.", source.Id);
                }
                finally
                {
                    inFlightSourceIds.TryRemove(source.Id, out _);
                }
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Calendar background synchronization scheduler iteration failed unexpectedly.");
        }
    }

    public static bool IsDue(EventSource source, DateTimeOffset now)
    {
        if (source.NextSyncAfterUtc is not null)
        {
            return source.NextSyncAfterUtc <= now;
        }

        var lastAttempt = source.LastSyncAttemptUtc ?? source.LastSuccessfulSyncUtc ?? source.LastFailedSyncUtc;
        return lastAttempt is null || lastAttempt.Value.Add(PollIntervalToDuration(source.PollInterval)) <= now;
    }

    public static TimeSpan PollIntervalToDuration(EventSourcePollInterval pollInterval) => pollInterval switch
    {
        EventSourcePollInterval.EveryHour => TimeSpan.FromHours(1),
        EventSourcePollInterval.EveryDay => TimeSpan.FromDays(1),
        _ => TimeSpan.FromHours(8),
    };
}

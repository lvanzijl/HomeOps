using System.Collections.Concurrent;

namespace HomeOps.Api.Weather;

public sealed class WeatherSnapshotCache
{
    private readonly ConcurrentDictionary<Guid, CacheEntry> snapshots = new();
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> refreshLocks = new();
    private readonly Func<DateTimeOffset> nowProvider;

    public WeatherSnapshotCache(Func<DateTimeOffset>? nowProvider = null)
    {
        this.nowProvider = nowProvider ?? (() => DateTimeOffset.UtcNow);
    }

    public bool TryGetSnapshot(Guid householdId, out FamilyBoardWeatherSnapshot? snapshot)
    {
        var nowUtc = nowProvider();
        if (snapshots.TryGetValue(householdId, out var entry))
        {
            snapshot = WithFreshnessStatus(entry.Snapshot, nowUtc);
            return true;
        }

        snapshot = null;
        return false;
    }

    public async Task<FamilyBoardWeatherSnapshot> GetOrRefreshAsync(
        Guid householdId,
        Func<CancellationToken, Task<FamilyBoardWeatherSnapshot>> refreshSnapshotAsync,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = nowProvider();
        if (snapshots.TryGetValue(householdId, out var existing))
        {
            if (existing.Snapshot.Freshness.IsFreshAt(nowUtc))
            {
                return existing.Snapshot;
            }

            StartBackgroundRefresh(householdId, refreshSnapshotAsync);
            return MarkStale(existing.Snapshot);
        }

        return await RefreshBlockingAsync(householdId, refreshSnapshotAsync, cancellationToken);
    }

    public void Remove(Guid householdId)
    {
        snapshots.TryRemove(householdId, out _);
    }

    private async Task<FamilyBoardWeatherSnapshot> RefreshBlockingAsync(
        Guid householdId,
        Func<CancellationToken, Task<FamilyBoardWeatherSnapshot>> refreshSnapshotAsync,
        CancellationToken cancellationToken)
    {
        var refreshLock = refreshLocks.GetOrAdd(householdId, _ => new SemaphoreSlim(1, 1));
        await refreshLock.WaitAsync(cancellationToken);

        try
        {
            var nowUtc = nowProvider();
            if (snapshots.TryGetValue(householdId, out var existing) && existing.Snapshot.Freshness.IsFreshAt(nowUtc))
            {
                return existing.Snapshot;
            }

            var refreshed = await RefreshSafelyAsync(householdId, refreshSnapshotAsync, cancellationToken);
            StoreRefreshResult(householdId, refreshed);
            return snapshots.TryGetValue(householdId, out var stored)
                ? WithFreshnessStatus(stored.Snapshot, nowProvider())
                : refreshed;
        }
        finally
        {
            refreshLock.Release();
        }
    }

    private void StartBackgroundRefresh(
        Guid householdId,
        Func<CancellationToken, Task<FamilyBoardWeatherSnapshot>> refreshSnapshotAsync)
    {
        var refreshLock = refreshLocks.GetOrAdd(householdId, _ => new SemaphoreSlim(1, 1));
        if (!refreshLock.Wait(0))
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                var refreshed = await RefreshSafelyAsync(householdId, refreshSnapshotAsync, CancellationToken.None);
                StoreRefreshResult(householdId, refreshed);
            }
            finally
            {
                refreshLock.Release();
            }
        });
    }

    private async Task<FamilyBoardWeatherSnapshot> RefreshSafelyAsync(
        Guid householdId,
        Func<CancellationToken, Task<FamilyBoardWeatherSnapshot>> refreshSnapshotAsync,
        CancellationToken cancellationToken)
    {
        try
        {
            return await refreshSnapshotAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            var nowUtc = nowProvider();
            return CreateUnavailableSnapshot(householdId, nowUtc, $"Weather refresh failed: {exception.Message}");
        }
    }

    private void StoreRefreshResult(Guid householdId, FamilyBoardWeatherSnapshot refreshed)
    {
        if (refreshed.ProviderStatus == WeatherProviderStatus.Available)
        {
            snapshots[householdId] = new CacheEntry(refreshed);
            return;
        }

        if (snapshots.TryGetValue(householdId, out var existing))
        {
            snapshots[householdId] = new CacheEntry(MarkStale(existing.Snapshot, refreshed.ProviderStatusMessage));
            return;
        }

        snapshots[householdId] = new CacheEntry(refreshed);
    }

    private static FamilyBoardWeatherSnapshot WithFreshnessStatus(FamilyBoardWeatherSnapshot snapshot, DateTimeOffset nowUtc) =>
        snapshot.ProviderStatus != WeatherProviderStatus.Available || snapshot.Freshness.IsFreshAt(nowUtc)
            ? snapshot
            : MarkStale(snapshot);

    private static FamilyBoardWeatherSnapshot MarkStale(FamilyBoardWeatherSnapshot snapshot, string? providerStatusMessage = null) =>
        snapshot with
        {
            ProviderStatus = WeatherProviderStatus.Stale,
            ProviderStatusMessage = providerStatusMessage ?? "Weather snapshot is stale while refresh is pending."
        };

    private static FamilyBoardWeatherSnapshot CreateUnavailableSnapshot(Guid householdId, DateTimeOffset nowUtc, string message) =>
        new(
            householdId,
            new CurrentWeather(0, 0, WeatherConditionCategory.Unknown, "Weather unavailable"),
            Array.Empty<HourlyWeatherSlot>(),
            Array.Empty<DailyWeatherSummary>(),
            new WeatherFreshness(nowUtc, nowUtc, nowUtc),
            WeatherProviderStatus.Unavailable,
            message);

    private sealed record CacheEntry(FamilyBoardWeatherSnapshot Snapshot);
}

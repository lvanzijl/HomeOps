using HomeOps.Api.Weather;

namespace HomeOps.Api.Tests.Weather;

public sealed class WeatherSnapshotCacheTests
{
    [Fact]
    public async Task GetOrRefreshAsync_WhenCacheIsMissing_WaitsForProviderAndStoresSnapshot()
    {
        var householdId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var cache = new WeatherSnapshotCache(() => now);
        var refreshCalls = 0;

        var snapshot = await cache.GetOrRefreshAsync(householdId, _ =>
        {
            refreshCalls++;
            return Task.FromResult(CreateSnapshot(householdId, now, now.AddMinutes(30)));
        });

        Assert.Equal(1, refreshCalls);
        Assert.Equal(WeatherProviderStatus.Available, snapshot.ProviderStatus);
        Assert.True(cache.TryGetSnapshot(householdId, out var cached));
        Assert.Same(snapshot, cached);
    }

    [Fact]
    public async Task GetOrRefreshAsync_WhenCachedSnapshotIsFresh_DoesNotCallProvider()
    {
        var householdId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var cache = new WeatherSnapshotCache(() => now);
        var refreshCalls = 0;

        await cache.GetOrRefreshAsync(householdId, _ =>
        {
            refreshCalls++;
            return Task.FromResult(CreateSnapshot(householdId, now, now.AddMinutes(30), 18));
        });

        var snapshot = await cache.GetOrRefreshAsync(householdId, _ =>
        {
            refreshCalls++;
            return Task.FromResult(CreateSnapshot(householdId, now, now.AddMinutes(30), 22));
        });

        Assert.Equal(1, refreshCalls);
        Assert.Equal(18, snapshot.Current.TemperatureCelsius);
        Assert.Equal(WeatherProviderStatus.Available, snapshot.ProviderStatus);
    }

    [Fact]
    public async Task GetOrRefreshAsync_WhenCachedSnapshotIsStale_ReturnsImmediatelyAndRefreshesInBackground()
    {
        var householdId = Guid.NewGuid();
        var currentTime = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var cache = new WeatherSnapshotCache(() => currentTime);
        var staleSnapshot = CreateSnapshot(householdId, currentTime.AddHours(-1), currentTime.AddMinutes(-5), 17);

        await cache.GetOrRefreshAsync(householdId, _ => Task.FromResult(staleSnapshot));
        currentTime = currentTime.AddMinutes(10);

        var refreshStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var allowRefreshCompletion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var refreshedSnapshot = CreateSnapshot(householdId, currentTime, currentTime.AddMinutes(30), 21);

        var returnedSnapshot = await cache.GetOrRefreshAsync(householdId, async _ =>
        {
            refreshStarted.SetResult();
            await allowRefreshCompletion.Task;
            return refreshedSnapshot;
        });

        Assert.Equal(WeatherProviderStatus.Stale, returnedSnapshot.ProviderStatus);
        Assert.Equal(17, returnedSnapshot.Current.TemperatureCelsius);

        await refreshStarted.Task.WaitAsync(TimeSpan.FromSeconds(3));
        allowRefreshCompletion.SetResult();

        FamilyBoardWeatherSnapshot? cached = null;
        for (var attempt = 0; attempt < 20; attempt++)
        {
            cache.TryGetSnapshot(householdId, out cached);
            if (cached?.Current.TemperatureCelsius == 21)
            {
                break;
            }

            await Task.Delay(25);
        }

        Assert.NotNull(cached);
        Assert.Equal(21, cached.Current.TemperatureCelsius);
        Assert.Equal(WeatherProviderStatus.Available, cached.ProviderStatus);
    }

    [Fact]
    public async Task GetOrRefreshAsync_WhenRefreshFailsWithoutExistingSnapshot_ReturnsUnavailableSnapshot()
    {
        var householdId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var cache = new WeatherSnapshotCache(() => now);

        var snapshot = await cache.GetOrRefreshAsync(householdId, _ => throw new InvalidOperationException("provider offline"));

        Assert.Equal(WeatherProviderStatus.Unavailable, snapshot.ProviderStatus);
        Assert.Contains("provider offline", snapshot.ProviderStatusMessage);
        Assert.Empty(snapshot.HourlySlots);
        Assert.Empty(snapshot.DailySummaries);
    }

    [Fact]
    public async Task GetOrRefreshAsync_WhenBackgroundRefreshFails_KeepsExistingSnapshotAsStale()
    {
        var householdId = Guid.NewGuid();
        var currentTime = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var cache = new WeatherSnapshotCache(() => currentTime);
        var staleSnapshot = CreateSnapshot(householdId, currentTime.AddHours(-1), currentTime.AddMinutes(-5), 16);

        await cache.GetOrRefreshAsync(householdId, _ => Task.FromResult(staleSnapshot));
        currentTime = currentTime.AddMinutes(10);

        _ = await cache.GetOrRefreshAsync(householdId, _ => throw new InvalidOperationException("provider offline"));

        FamilyBoardWeatherSnapshot? cached = null;
        for (var attempt = 0; attempt < 20; attempt++)
        {
            cache.TryGetSnapshot(householdId, out cached);
            if (cached?.ProviderStatus == WeatherProviderStatus.Stale && cached.ProviderStatusMessage?.Contains("provider offline") == true)
            {
                break;
            }

            await Task.Delay(25);
        }

        Assert.NotNull(cached);
        Assert.Equal(16, cached.Current.TemperatureCelsius);
        Assert.Equal(WeatherProviderStatus.Stale, cached.ProviderStatus);
        Assert.Contains("provider offline", cached.ProviderStatusMessage);
    }

    private static FamilyBoardWeatherSnapshot CreateSnapshot(
        Guid householdId,
        DateTimeOffset observedAtUtc,
        DateTimeOffset expiresAtUtc,
        decimal temperatureCelsius = 18) =>
        new(
            householdId,
            new CurrentWeather(temperatureCelsius, temperatureCelsius, WeatherConditionCategory.Clear, "Clear"),
            Array.Empty<HourlyWeatherSlot>(),
            Array.Empty<DailyWeatherSummary>(),
            new WeatherFreshness(observedAtUtc, observedAtUtc, expiresAtUtc),
            WeatherProviderStatus.Available);
}

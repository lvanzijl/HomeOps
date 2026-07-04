using HomeOps.Api.Households;
using HomeOps.Api.Weather.Projections;

namespace HomeOps.Api.Weather;

public sealed class WeatherApplicationService
{
    private readonly IWeatherSnapshotSource snapshotSource;
    private readonly WeatherSnapshotCache snapshotCache;
    private readonly DepartureAdviceEngine departureAdviceEngine;
    private readonly WeatherProjectionBuilder projectionBuilder;
    private readonly Func<DateTimeOffset> nowProvider;

    public WeatherApplicationService(
        IWeatherSnapshotSource snapshotSource,
        WeatherSnapshotCache snapshotCache,
        DepartureAdviceEngine departureAdviceEngine,
        WeatherProjectionBuilder projectionBuilder,
        Func<DateTimeOffset>? nowProvider = null)
    {
        this.snapshotSource = snapshotSource;
        this.snapshotCache = snapshotCache;
        this.departureAdviceEngine = departureAdviceEngine;
        this.projectionBuilder = projectionBuilder;
        this.nowProvider = nowProvider ?? (() => DateTimeOffset.UtcNow);
    }

    public async Task<HomeWeatherProjection> GetHomeWeatherAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = nowProvider();
        var snapshot = await GetSnapshotAsync(cancellationToken);
        var advice = departureAdviceEngine.CreateAdvice(snapshot, nowUtc);
        return projectionBuilder.ToHome(snapshot, advice, nowUtc);
    }

    public async Task<WeatherDetailProjection> GetWeatherDetailAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = nowProvider();
        var snapshot = await GetSnapshotAsync(cancellationToken);
        var advice = departureAdviceEngine.CreateAdvice(snapshot, nowUtc);
        return projectionBuilder.ToDetail(snapshot, advice, nowUtc);
    }

    public async Task<AgendaWeatherProjection> GetAgendaWeatherAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = nowProvider();
        var snapshot = await GetSnapshotAsync(cancellationToken);
        return projectionBuilder.ToAgenda(snapshot, nowUtc);
    }

    private Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(CancellationToken cancellationToken) =>
        snapshotCache.GetOrRefreshAsync(
            SeedHousehold.Id,
            refreshCancellationToken => snapshotSource.GetSnapshotAsync(SeedHousehold.Id, refreshCancellationToken),
            cancellationToken);
}

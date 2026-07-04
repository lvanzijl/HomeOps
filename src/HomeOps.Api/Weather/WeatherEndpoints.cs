using HomeOps.Api.Weather.Projections;

namespace HomeOps.Api.Weather;

public static class WeatherEndpoints
{
    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/weather").WithTags("Weather");

        group.MapGet("/home", async (WeatherApplicationService weatherService, CancellationToken cancellationToken) =>
            Results.Ok(await weatherService.GetHomeWeatherAsync(cancellationToken)))
            .WithName("GetHomeWeather")
            .Produces<HomeWeatherProjection>();

        group.MapGet("/detail", async (WeatherApplicationService weatherService, CancellationToken cancellationToken) =>
            Results.Ok(await weatherService.GetWeatherDetailAsync(cancellationToken)))
            .WithName("GetWeatherDetail")
            .Produces<WeatherDetailProjection>();

        group.MapGet("/agenda", async (WeatherApplicationService weatherService, CancellationToken cancellationToken) =>
            Results.Ok(await weatherService.GetAgendaWeatherAsync(cancellationToken)))
            .WithName("GetAgendaWeather")
            .Produces<AgendaWeatherProjection>();

        return app;
    }
}

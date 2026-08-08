using HomeOps.Api.Data;
using HomeOps.Api.Weather;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Households;

public static class HouseholdWeatherLocationEndpoints
{
    private const string ProviderName = "Open-Meteo";

    public static IEndpointRouteBuilder MapHouseholdWeatherLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/households/current/weather-location").WithTags("Households");

        group.MapGet("/", async (HomeOpsDbContext dbContext, WeatherSnapshotCache cache, CancellationToken cancellationToken) =>
            {
                var household = await LoadHouseholdAsync(dbContext, cancellationToken);
                cache.TryGetSnapshot(household.Id, out var snapshot);
                return Results.Ok(ToDto(household, snapshot));
            })
            .WithName("GetCurrentHouseholdWeatherLocation")
            .Produces<HouseholdWeatherLocationDto>();

        group.MapPut("/", async (
                UpdateHouseholdWeatherLocationRequest request,
                HomeOpsDbContext dbContext,
                WeatherSnapshotCache cache,
                CancellationToken cancellationToken) =>
            {
                var errors = Validate(request);
                if (errors.Count > 0)
                {
                    return Results.ValidationProblem(errors);
                }

                var household = await LoadHouseholdAsync(dbContext, cancellationToken);
                household.WeatherLocationDisplayName = request.DisplayName!.Trim();
                household.WeatherLatitude = request.Latitude;
                household.WeatherLongitude = request.Longitude;
                household.WeatherUnitSystem = request.UnitSystem!.Value;
                household.UpdatedUtc = DateTimeOffset.UtcNow;

                await dbContext.SaveChangesAsync(cancellationToken);
                cache.Remove(household.Id);

                return Results.Ok(ToDto(household, null));
            })
            .WithName("UpdateCurrentHouseholdWeatherLocation")
            .Produces<HouseholdWeatherLocationDto>()
            .ProducesValidationProblem();

        group.MapPost("/refresh", async (
                HomeOpsDbContext dbContext,
                WeatherApplicationService weatherService,
                CancellationToken cancellationToken) =>
            {
                var household = await LoadHouseholdAsync(dbContext, cancellationToken);
                if (!IsConfigured(household))
                {
                    return Results.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["weatherLocation"] = ["Configure a complete household weather location before refreshing."]
                    });
                }

                var snapshot = await weatherService.RefreshAsync(cancellationToken);
                return Results.Ok(ToDto(household, snapshot));
            })
            .WithName("RefreshCurrentHouseholdWeatherLocation")
            .Produces<HouseholdWeatherLocationDto>()
            .ProducesValidationProblem();

        return app;
    }

    private static Task<Household> LoadHouseholdAsync(HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        dbContext.Households.SingleAsync(household => household.Id == SeedHousehold.Id, cancellationToken);

    private static Dictionary<string, string[]> Validate(UpdateHouseholdWeatherLocationRequest request)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errors["displayName"] = ["A display name is required."];
        }
        else if (request.DisplayName.Trim().Length > 120)
        {
            errors["displayName"] = ["The display name cannot exceed 120 characters."];
        }

        if (request.Latitude is null or < -90 or > 90)
        {
            errors["latitude"] = ["Latitude must be between -90 and 90."];
        }

        if (request.Longitude is null or < -180 or > 180)
        {
            errors["longitude"] = ["Longitude must be between -180 and 180."];
        }

        if (request.UnitSystem is null || !Enum.IsDefined(request.UnitSystem.Value))
        {
            errors["unitSystem"] = ["Select a supported weather unit system."];
        }

        return errors;
    }

    private static HouseholdWeatherLocationDto ToDto(Household household, FamilyBoardWeatherSnapshot? snapshot)
    {
        var configured = IsConfigured(household);
        var status = snapshot?.ProviderStatus ?? WeatherProviderStatus.Unknown;

        return new HouseholdWeatherLocationDto(
            configured,
            household.WeatherLocationDisplayName,
            household.WeatherLatitude,
            household.WeatherLongitude,
            household.WeatherUnitSystem,
            ProviderName,
            status,
            snapshot?.Freshness.RefreshedAtUtc,
            GetSafeStatusMessage(configured, status));
    }

    private static bool IsConfigured(Household household) =>
        !string.IsNullOrWhiteSpace(household.WeatherLocationDisplayName) &&
        household.WeatherLatitude is not null &&
        household.WeatherLongitude is not null;

    private static string GetSafeStatusMessage(bool configured, WeatherProviderStatus status) =>
        !configured
            ? "Stel eerst een weerlocatie in."
            : status switch
            {
                WeatherProviderStatus.Available => "Open-Meteo is bereikbaar en de weergegevens zijn bijgewerkt.",
                WeatherProviderStatus.Stale => "De laatste weergegevens zijn verouderd. Probeer opnieuw.",
                WeatherProviderStatus.Unavailable => "Open-Meteo is nu niet bereikbaar. Probeer opnieuw.",
                _ => "De locatie is opgeslagen en wacht op een eerste verversing."
            };
}

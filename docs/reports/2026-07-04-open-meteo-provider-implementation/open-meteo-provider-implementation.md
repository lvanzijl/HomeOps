# Open-Meteo Provider Implementation

## Summary

Backend phase 2 of the FamilyBoard weather integration added only a small Open-Meteo provider. The provider communicates with Open-Meteo, parses provider data, and translates it into the existing provider-neutral FamilyBoard Weather Domain.

No cache, background refresh, API endpoint, DTO, Home projection, Agenda projection, detail projection, Home Assistant integration, fallback provider logic, database change, dependency change, project-file change, generated file, frontend change, or binary artifact was introduced.

## Implemented Provider

The implementation adds `OpenMeteoWeatherProvider` and `OpenMeteoLocation` under `HomeOps.Api.Weather.OpenMeteo`.

The provider:

- builds a forecast request for latitude/longitude coordinates;
- requests current weather, hourly weather, and daily summary fields;
- parses the JSON response with private Open-Meteo response models;
- creates a `FamilyBoardWeatherSnapshot` from the parsed response;
- returns `WeatherProviderStatus.Available` when the response can fill a snapshot;
- returns `WeatherProviderStatus.Unavailable` with a provider status message for HTTP, timeout, request, parse, or empty-response failures.

## Mapping Strategy

Open-Meteo knowledge is contained inside `HomeOps.Api.Weather.OpenMeteo`.

Mapped Open-Meteo fields:

- current `temperature_2m` → `CurrentWeather.TemperatureCelsius`;
- current `apparent_temperature` → `CurrentWeather.FeelsLikeTemperatureCelsius`;
- current `relative_humidity_2m` → `CurrentWeather.RelativeHumidityPercent`;
- current `weather_code` → `WeatherConditionCategory`;
- current `wind_speed_10m` → `CurrentWeather.WindSpeedKph`;
- current `precipitation_probability` → `CurrentWeather.PrecipitationChancePercent`;
- hourly `time`, `temperature_2m`, `weather_code`, `precipitation_probability`, and `wind_speed_10m` → `HourlyWeatherSlot`;
- daily `time`, `weather_code`, `temperature_2m_min`, `temperature_2m_max`, `precipitation_probability_max`, and `wind_speed_10m_max` → `DailyWeatherSummary`.

Open-Meteo weather codes are translated into FamilyBoard categories such as clear, mostly clear, partly cloudy, cloudy, fog, rain, heavy rain, snow, and thunderstorm. The provider does not expose Open-Meteo weather codes through the domain snapshot.

Departure advice is intentionally not populated by the provider. The provider now only produces weather facts in `FamilyBoardWeatherSnapshot`; departure advice is produced later by product logic.

## Error Handling

Provider errors are converted into an unavailable `FamilyBoardWeatherSnapshot` rather than exceptions leaking into future callers. The unavailable snapshot includes:

- `WeatherProviderStatus.Unavailable`;
- a provider status message suitable for backend diagnostics;
- unknown current weather;
- empty hourly slots;
- empty daily summaries;
- freshness timestamps set to the failure time.

Because no cache exists in this phase, stale status is not produced by the provider yet.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- Provider unit tests verify request construction, successful snapshot population, Open-Meteo weather-code mapping through the snapshot, and provider failure mapping to unavailable status.

## Future Integration Points

Future slices can register the provider through dependency injection, add caching or background refresh, expose API projections, and implement Home, Agenda, and detail-dialog projections. Those concerns were intentionally left out of this slice.

No Open-Meteo types are used outside the provider implementation and its focused provider tests.

## Modified Files

- `src/HomeOps.Api/Weather/OpenMeteo/OpenMeteoLocation.cs`
- `src/HomeOps.Api/Weather/OpenMeteo/OpenMeteoWeatherProvider.cs`
- `tests/HomeOps.Api.Tests/Weather/OpenMeteoWeatherProviderTests.cs`
- `docs/reports/2026-07-04-open-meteo-provider-implementation/open-meteo-provider-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

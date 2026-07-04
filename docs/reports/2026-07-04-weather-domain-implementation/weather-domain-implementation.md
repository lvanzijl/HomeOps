# Weather Domain Implementation

## Summary

Backend phase 1 of the FamilyBoard weather integration introduced only the internal Weather domain layer. No weather provider, data retrieval, API endpoint, dependency injection registration, database schema change, frontend change, or generated artifact was added.

## Implemented Domain

Added the following provider-neutral backend models under `HomeOps.Api.Weather`:

- `FamilyBoardWeatherSnapshot`: the normalized FamilyBoard weather facts aggregate for one household.
- `CurrentWeather`: current household weather suitable for later Home projections.
- `DepartureAdvice`: compact family-facing advice for leaving home, later produced by the Departure Advice Engine rather than by providers.
- `HourlyWeatherSlot`: bounded hourly forecast slots for later dashboard and agenda use.
- `DailyWeatherSummary`: daily forecast summaries for later overview projections.
- `WeatherFreshness`: observation, refresh, and expiration timestamps for freshness decisions.
- `WeatherProviderStatus`: internal provider availability state.
- `WeatherConditionCategory`: provider-independent condition vocabulary.
- `WeatherSeverity`: small severity scale for advice presentation.

## Design Decisions

The models are designed from FamilyBoard needs rather than from a specific external weather source. They describe household-facing concepts such as current conditions, daily summaries, departure guidance, and freshness instead of mirroring provider payloads.

The condition vocabulary intentionally uses normalized categories such as clear, cloudy, rain, thunderstorm, snow, fog, and wind. It does not include Open-Meteo field names, weather codes, request parameters, response shapes, or provider-specific concepts.

The snapshot keeps provider status as an internal health signal so future integrations can report whether weather data is available, stale, or unavailable without exposing provider-specific failure modes.

## Future Integration Points

Future slices can add a weather provider that maps Open-Meteo or Home Assistant data into these models. Later backend projections can derive Home, Agenda, and detail-dialog responses from `FamilyBoardWeatherSnapshot` and `DepartureAdvice` without changing the domain vocabulary.

No plugin architecture, generic weather engine, provider factory, endpoint, or database persistence was introduced in this slice.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.

## Modified Files

- `src/HomeOps.Api/Weather/CurrentWeather.cs`
- `src/HomeOps.Api/Weather/DailyWeatherSummary.cs`
- `src/HomeOps.Api/Weather/DepartureAdvice.cs`
- `src/HomeOps.Api/Weather/FamilyBoardWeatherSnapshot.cs`
- `src/HomeOps.Api/Weather/HourlyWeatherSlot.cs`
- `src/HomeOps.Api/Weather/WeatherConditionCategory.cs`
- `src/HomeOps.Api/Weather/WeatherFreshness.cs`
- `src/HomeOps.Api/Weather/WeatherProviderStatus.cs`
- `src/HomeOps.Api/Weather/WeatherSeverity.cs`
- `docs/reports/2026-07-04-weather-domain-implementation/weather-domain-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

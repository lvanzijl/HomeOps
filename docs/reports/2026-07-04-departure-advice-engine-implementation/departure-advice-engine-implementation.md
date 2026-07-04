# Departure Advice Engine Implementation

## Summary

Backend phase 4 of the FamilyBoard weather integration added only the provider-neutral Departure Advice Engine. The engine consumes the existing FamilyBoard Weather Domain and turns a shared `FamilyBoardWeatherSnapshot` into family-facing `DepartureAdvice` product logic.

No API endpoint, DTO, frontend change, Home projection, Agenda projection, detail projection, Home Assistant integration, provider fallback, weather history, database change, dependency change, project-file change, generated file, or binary artifact was introduced.

## Implemented Advice Engine

`DepartureAdviceEngine` evaluates one `FamilyBoardWeatherSnapshot` for a given backend time and optional departure time. It returns a `DepartureAdvice` with:

- a family-facing summary;
- severity;
- confidence;
- advice categories;
- compatibility booleans for rain protection, warm clothing, slippery conditions, and extra travel time.

Added advice categories:

- neutral;
- no jacket needed;
- light jacket;
- warm jacket;
- rain protection;
- sun protection;
- fill drink bottle;
- windy;
- slippery;
- extra travel time.

## Advice Strategy

The engine uses weather facts, not provider types. It considers:

- current temperature;
- feels-like temperature;
- current weather condition;
- rain conditions and precipitation chance;
- rain timing in the next three-hour departure window;
- current and near-term wind;
- UV index when available in the domain;
- warm-day signals from current and daily weather;
- temperature swing from daily high/low values;
- freshness;
- provider status.

Rain, heavy rain, thunderstorm, snow, strong wind, cold feels-like temperature, high UV, warm days, and large temperature swings can all change the advice categories. The engine avoids relying only on temperature.

## Confidence Strategy

Confidence is based on data quality and availability:

- provider unavailable always returns low-confidence cautious neutral advice;
- fresh available snapshots increase confidence;
- stale provider status or expired freshness lowers confidence;
- known current condition increases confidence;
- precipitation, wind, and relevant hourly slots increase confidence;
- missing or partial data avoids high confidence even when a summary can still be produced.

Low-confidence advice explicitly notes that certainty is low, preventing false certainty when data is missing or stale.

## Domain Review

The existing `WeatherFreshness` and `WeatherProviderStatus` still work together: freshness answers whether the snapshot is within its expected validity window, while provider status communicates the current health/quality of the provider-backed data.

A small domain responsibility refactor was made. `DepartureAdvice` was removed from `FamilyBoardWeatherSnapshot` because the phase 4 architecture places the engine after the cache. Providers and cache should carry weather facts only; the engine owns advice. This avoids placeholder advice in provider/cache code and keeps product interpretation separate from weather data retrieval.

`DepartureAdvice` was expanded with `DepartureAdviceConfidence` and `DepartureAdviceCategory` so future projections can present advice without parsing summary text. Optional UV fields were added to current, hourly, and daily weather facts so the engine can use UV when future providers supply it while remaining conservative when UV is missing.

## Design Decisions

The engine is a small pure product-logic class. It does not call providers, manage cache, depend on Open-Meteo, or mutate snapshots.

The departure window is intentionally simple: it considers hourly slots overlapping the requested departure time through the next three hours. This captures near-term rain/wind timing without adding itinerary, agenda, or routing logic.

The output keeps existing compatibility booleans while adding richer categories and confidence. This is a small compatibility-friendly refactor rather than a projection or UI contract.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet test HomeOps.sln --filter DepartureAdviceEngineTests` completed successfully.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- New advice-engine tests verify warm/dry no-jacket advice, near-term rain timing, strong wind, UV/heat advice, stale low-confidence advice, and unavailable-provider cautious advice.
- Existing Open-Meteo provider and weather cache tests continue to pass as part of the full solution test run.

## Future Integration Points

Future backend slices can call the engine after reading the shared household snapshot from cache. Home, Agenda, and Detail projections should consume `DepartureAdvice` from this engine rather than from providers.

API endpoints, DTOs, Home projection, Agenda projection, Detail projection, Home Assistant integration, provider fallback, weather history, database storage, and frontend work remain intentionally out of scope.

## Modified Files

- `src/HomeOps.Api/Weather/DepartureAdvice.cs`
- `src/HomeOps.Api/Weather/DepartureAdviceCategory.cs`
- `src/HomeOps.Api/Weather/DepartureAdviceConfidence.cs`
- `src/HomeOps.Api/Weather/DepartureAdviceEngine.cs`
- `src/HomeOps.Api/Weather/CurrentWeather.cs`
- `src/HomeOps.Api/Weather/HourlyWeatherSlot.cs`
- `src/HomeOps.Api/Weather/DailyWeatherSummary.cs`
- `src/HomeOps.Api/Weather/FamilyBoardWeatherSnapshot.cs`
- `src/HomeOps.Api/Weather/OpenMeteo/OpenMeteoWeatherProvider.cs`
- `src/HomeOps.Api/Weather/WeatherSnapshotCache.cs`
- `tests/HomeOps.Api.Tests/Weather/DepartureAdviceEngineTests.cs`
- `tests/HomeOps.Api.Tests/Weather/OpenMeteoWeatherProviderTests.cs`
- `tests/HomeOps.Api.Tests/Weather/WeatherSnapshotCacheTests.cs`
- `docs/reports/2026-07-04-departure-advice-engine-implementation/departure-advice-engine-implementation.md`
- `docs/reports/2026-07-04-open-meteo-provider-implementation/open-meteo-provider-implementation.md`
- `docs/reports/2026-07-04-weather-domain-implementation/weather-domain-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

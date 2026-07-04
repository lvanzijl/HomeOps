# Weather Projection Implementation

## Summary

Backend phase 5 of the FamilyBoard weather integration added only the backend projection layer for future weather consumers. The projection layer maps existing `FamilyBoardWeatherSnapshot` and `DepartureAdvice` data into stable backend response-shaped models for Home, Weather Detail, and Agenda.

No frontend, API endpoint, Home Assistant integration, provider fallback, extra weather logic, advice rule, cache logic, weather history, database storage, dependency change, project-file change, generated file, or binary artifact was introduced.

## Implemented Projections

Added projection models and a `WeatherProjectionBuilder` under `HomeOps.Api.Weather.Projections`.

Home projection includes:

- icon key and condition category;
- current temperature;
- departure advice;
- confidence;
- freshness;
- provider status and status message.

Weather Detail projection includes:

- departure advice;
- current summary;
- current weather;
- hourly forecast slots;
- daily summaries;
- detailed humidity, wind, precipitation, UV, observed, and refreshed values;
- freshness;
- provider status and status message.

Agenda projection includes only objective weather slots:

- slot start/end timestamps;
- temperature;
- condition;
- summary;
- freshness;
- provider status and status message.

Agenda intentionally contains no advice, raincoat recommendation, indoor/outdoor logic, or departure categories.

## Projection Strategy

The projection builder does direct mapping only:

- `FamilyBoardWeatherSnapshot.Current` maps to Home and Detail current weather fields;
- `FamilyBoardWeatherSnapshot.HourlySlots` maps to Detail hourly slots and Agenda weather slots;
- `FamilyBoardWeatherSnapshot.DailySummaries` maps to Detail daily summaries;
- `WeatherFreshness` maps to projected freshness with `IsFresh` calculated from the supplied backend time;
- `WeatherProviderStatus` and provider status messages are copied through;
- `DepartureAdvice` maps to Home and Detail advice projections only.

The projection layer does not call providers, refresh cache, compute advice, reinterpret weather conditions, classify rain, or decide family actions. Business logic remains in the provider, cache, and Departure Advice Engine.

## Domain Review

Compatibility booleans on `DepartureAdvice` are retained. They duplicate some information available in `DepartureAdviceCategory`, but they are useful compatibility affordances for future projections that need direct yes/no answers without category interpretation. Removing them now would not simplify the projection layer enough to justify the churn.

No domain refactor was required for projections. The existing separation remains appropriate:

- providers produce weather facts;
- cache owns freshness/lifecycle;
- Departure Advice Engine owns advice;
- projections shape existing information for future consumers.

## Design Decisions

The projection classes are backend response-shaped records, not API endpoints or generated contracts. They are intentionally internal to backend source organization until a later API slice decides how to expose them.

The Home and Detail projections include advice because those surfaces are expected to be advice-aware. The Agenda projection is deliberately objective and advice-free so later agenda features do not inherit raincoat, indoor/outdoor, or departure-specific decisions.

The icon key is a direct category-derived key. It is not a new weather classification and does not alter the domain condition.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet test HomeOps.sln --filter WeatherProjectionBuilderTests` completed successfully.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- New projection tests verify Home projection fields, Detail projection fields, Agenda objective-only shape, and freshness projection.
- Existing provider, cache, and advice-engine tests continue to pass as part of the full solution test run.

## Future Integration Points

Future API slices can expose these backend projections after route, contract, and frontend requirements are approved. Home can consume `HomeWeatherProjection`, the weather dialog can consume `WeatherDetailProjection`, and Agenda can consume `AgendaWeatherProjection` without knowing provider, cache, or advice-engine internals.

Home Assistant integration, frontend work, API endpoints, provider fallback, weather history, database storage, extra advice rules, and cache changes remain intentionally out of scope.

## Modified Files

- `src/HomeOps.Api/Weather/Projections/AgendaWeatherProjection.cs`
- `src/HomeOps.Api/Weather/Projections/AgendaWeatherSlotProjection.cs`
- `src/HomeOps.Api/Weather/Projections/CurrentWeatherProjection.cs`
- `src/HomeOps.Api/Weather/Projections/DailyWeatherProjection.cs`
- `src/HomeOps.Api/Weather/Projections/DepartureAdviceProjection.cs`
- `src/HomeOps.Api/Weather/Projections/HomeWeatherProjection.cs`
- `src/HomeOps.Api/Weather/Projections/HourlyWeatherProjection.cs`
- `src/HomeOps.Api/Weather/Projections/WeatherDetailProjection.cs`
- `src/HomeOps.Api/Weather/Projections/WeatherDetailsProjection.cs`
- `src/HomeOps.Api/Weather/Projections/WeatherFreshnessProjection.cs`
- `src/HomeOps.Api/Weather/Projections/WeatherProjectionBuilder.cs`
- `tests/HomeOps.Api.Tests/Weather/Projections/WeatherProjectionBuilderTests.cs`
- `docs/reports/2026-07-04-weather-projections-implementation/weather-projections-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

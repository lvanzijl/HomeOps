# Weather API Implementation

## Summary

Backend phase 6 of the FamilyBoard weather integration exposes the existing backend weather projections through stable API endpoints. The implementation adds request/response wiring, dependency injection, a small application service, and API tests.

No frontend, Home Assistant integration, provider fallback, new weather logic, new cache logic, new advice rule, database storage, dependency change, project-file change, generated file, or binary artifact was introduced.

## Implemented Endpoints

Added endpoints under `/api/weather`:

- `GET /api/weather/home` returns `HomeWeatherProjection`.
- `GET /api/weather/detail` returns `WeatherDetailProjection`.
- `GET /api/weather/agenda` returns `AgendaWeatherProjection`.

The endpoints expose only the existing projection classes. No extra API-only fields were added, and no provider information is exposed beyond the existing provider status and provider status message already present in the projections.

## Request Flow

The request flow is:

1. `WeatherEndpoints` receives the HTTP request.
2. The endpoint calls `WeatherApplicationService`.
3. `WeatherApplicationService` requests the household snapshot through `WeatherSnapshotCache`.
4. The cache refresh delegate calls `IWeatherSnapshotSource`.
5. The production source is `OpenMeteoWeatherSnapshotSource`, which wraps `OpenMeteoWeatherProvider` and configured latitude/longitude.
6. For Home and Detail, `WeatherApplicationService` passes the snapshot to `DepartureAdviceEngine`.
7. `WeatherProjectionBuilder` maps the snapshot and advice into the requested projection.
8. The endpoint returns the projection unchanged.

Controllers/endpoints do not know Open-Meteo, weather codes, or the cache implementation details. They only delegate to the application service.

## Design Decisions

`WeatherApplicationService` was added to keep endpoint handlers small and orchestration-only. It composes existing components without introducing new weather business logic.

`IWeatherSnapshotSource` was added as a small backend seam so the application service and tests do not depend directly on Open-Meteo. This does not introduce provider fallback or a plugin architecture; it is a narrow interface for the single configured weather source.

`OpenMeteoWeatherSnapshotSource` owns the production latitude/longitude request setup and keeps Open-Meteo-specific location construction outside endpoints and projections.

The API remains projection-first: Home, Detail, and Agenda responses are exactly the existing backend projections, not new DTOs or generated contracts.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet test HomeOps.sln --filter WeatherApiTests` completed successfully.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- New API tests verify Home, Detail, and Agenda endpoint responses, Agenda advice-free shape, and shared cache use across projection requests.
- Existing provider, cache, advice-engine, and projection tests continue to pass as part of the full solution test run.

## Future Integration Points

Future frontend slices can call the three weather endpoints once UI requirements are approved. Future API contract generation can be performed in a separate generated-contract slice if required.

Home Assistant integration, frontend work, provider fallback, additional weather logic, additional cache logic, new advice rules, database storage, and generated files remain intentionally out of scope.

## Modified Files

- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/Weather/IWeatherSnapshotSource.cs`
- `src/HomeOps.Api/Weather/WeatherApplicationService.cs`
- `src/HomeOps.Api/Weather/WeatherEndpoints.cs`
- `src/HomeOps.Api/Weather/WeatherLocationOptions.cs`
- `src/HomeOps.Api/Weather/OpenMeteo/OpenMeteoWeatherSnapshotSource.cs`
- `tests/HomeOps.Api.Tests/Weather/WeatherApiTests.cs`
- `docs/reports/2026-07-04-weather-api-implementation/weather-api-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

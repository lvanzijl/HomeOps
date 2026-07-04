# Weather API Client Contract

## Summary

The existing API contract/client workflow needed regeneration after backend weather API exposure. The OpenAPI contract and generated TypeScript client now include the FamilyBoard weather endpoints:

- `GET /api/weather/home`
- `GET /api/weather/detail`
- `GET /api/weather/agenda`

No Weather UI was built, no frontend screens were changed, and no new weather business logic was added.

## Existing Contract Workflow

The repository uses NSwag from `nswag.json`:

- `aspNetCoreToOpenApi` builds `src/HomeOps.Api/HomeOps.Api.csproj` in the `Testing` environment and writes `src/HomeOps.Contracts/openapi.json`.
- `openApiToTypeScriptClient` reads that OpenAPI document and writes `src/HomeOps.Client/src/api/homeOpsApiClient.ts`.

The existing documented command is:

```bash
npx --yes nswag run nswag.json
```

The frontend uses the generated `HomeOpsApiClient` for several API areas while some older areas still use hand-written fetch wrappers. The generated client is still the canonical contract/client workflow for endpoints that should be available to future frontend slices.

## Weather Endpoint Coverage

Before regeneration, neither `src/HomeOps.Contracts/openapi.json` nor `src/HomeOps.Client/src/api/homeOpsApiClient.ts` contained the weather endpoints.

After regeneration:

- OpenAPI contains `/api/weather/home` with `HomeWeatherProjection`.
- OpenAPI contains `/api/weather/detail` with `WeatherDetailProjection`.
- OpenAPI contains `/api/weather/agenda` with `AgendaWeatherProjection`.
- The generated TypeScript client contains `getHomeWeather()`.
- The generated TypeScript client contains `getWeatherDetail()`.
- The generated TypeScript client contains `getAgendaWeather()`.

The generated contract contains no Open-Meteo types. Provider status is exposed only through the existing projection `status` and `statusMessage` fields.

Agenda remains advice-free in the generated contract: `AgendaWeatherProjection` has only `slots`, `freshness`, `status`, and `statusMessage`.

## Generated Client Changes

Generated files changed:

- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`

The TypeScript client now includes projection classes/enums for:

- Home weather;
- Weather detail;
- Agenda weather;
- current/hourly/daily/detail/freshness projection shapes;
- departure advice projection for Home and Detail;
- weather condition, provider status, severity, advice confidence, and advice category enums.

## Fixes Applied

Ran the existing NSwag generation workflow:

```bash
npx --yes nswag run nswag.json
```

No manual client editing was performed. No extra endpoint fields were added. No dependency or project-file changes were required.

## Validation

- `dotnet --info` completed successfully.
- `npx --yes nswag run nswag.json` completed successfully.
- OpenAPI and generated TypeScript client were inspected for the three weather endpoints.
- OpenAPI and generated TypeScript client were checked for Open-Meteo leakage; no Open-Meteo types were found.
- Agenda generated contract shape was inspected and remains advice-free.
- `npm run build` from `src/HomeOps.Client` completed successfully.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- Git diff was checked for binary artifacts; none were present.

## Risks

Generated TypeScript enums are numeric because that is the current NSwag/default serialization pattern used by the existing repository. This preserves the existing contract generation behavior rather than changing serialization globally.

The frontend can now use the generated weather client methods, but no Weather UI was built in this slice.

## Modified Files

- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `docs/reports/2026-07-04-weather-api-client-contract/weather-api-client-contract.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

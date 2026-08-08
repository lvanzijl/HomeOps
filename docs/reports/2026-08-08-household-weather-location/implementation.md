# Phase 5 Slice 5.7 — Household weather location

**Status:** Completed on 2026-08-08.

## Outcome

- Household weather configuration persists a required display label, latitude, longitude, and metric/imperial unit preference. Fresh installs are truthfully unconfigured; the old process-wide Amsterdam default is removed.
- The generated household API reads and updates the complete setting and explicitly refreshes provider data. Saving validates every field, commits atomically, removes the household cache entry, and completes the onboarding checklist item.
- Open-Meteo receives the stored coordinates. Weather facts remain canonical Celsius/km/h; generated Home, detail, and Agenda projections carry the selected unit system so the client formats Celsius/km/h or Fahrenheit/mph consistently.
- Snapshot sources and the weather application service are background-safe singletons. Each real provider load creates its own dependency scope, so a stale-cache refresh never retains a request-scoped database context.
- Provider/cache exceptions are normalized before they reach API responses. Settings shows configured state, safe provider health, last refresh, and retry without raw exceptions or upstream response bodies.
- Settings keeps its approved fixed primary composition: one compact `Weerlocatie` quick action opens an internally scrolling bounded dialog with fixed actions and retained form input. The surface accepts coordinates plus a label and adds no geocoding, map, browser geolocation, or location permission.
- Migration `20260808135023_AddHouseholdWeatherLocation` adds the nullable location fields and safely defaults existing households to metric units.

## Viewport implementation

The implementation follows `viewport-analysis.md`: the main Settings grid and overflow owners are unchanged, and all variable weather status, validation, and guidance live in the dialog's internal scroll region. The action row remains fixed.

PostgreSQL-backed Playwright confirms zero body/document overflow at 1440×900 and 1366×768. Independent in-app inspection at 1366×768 measured a 672.7 px dialog, the save action ending at 732.6 px inside the 768 px viewport, and zero body/document overflow.

## Validation

| Gate | Result |
| --- | --- |
| Focused weather/location backend tests | Passed, including invalid coordinates, cache invalidation, onboarding, safe provider failure, persisted provider inputs, projections, and background-safe cache behavior |
| Focused weather Settings/frontend consumers | 51/51 passed |
| Full backend tests | 651/651 passed |
| Full frontend tests | 381/381 passed |
| Solution build | Passed; existing SQLitePCL `NU1903` warning remains |
| Frontend production build | Passed; existing large-chunk warning remains |
| PostgreSQL migration baseline | 4/4 passed through Rancher Desktop |
| EF migration list/model drift/idempotent script | Passed; generated script was outside the repository |
| Pinned NSwag 14.7.1, repeated generation | Hash-identical OpenAPI and TypeScript client output |
| PostgreSQL-backed Playwright | 16/16 passed, including both required viewports |
| Independent in-app browser | Coordinate-only dialog, normalized unconfigured state, fixed action visibility, and zero page overflow verified at 1366×768 |

Pinned generation hashes:

- OpenAPI: `A049231E34C4F26B3C5E30529DB4137B2201670BA5876B4C53EC9928C8E7822F`
- TypeScript client: `3C7F61589F9E35F91B005FF2C2B1A856E7D22B2BC54B95EAF76455C2C733F5FF`

## Boundary

This slice does not add address search, reverse geocoding, maps, browser location permission, raw provider diagnostics, forecast storage, notification/reminder behavior, or unrelated Settings/Woning changes. Phase 5 is closed; Phase 6 remains separate.

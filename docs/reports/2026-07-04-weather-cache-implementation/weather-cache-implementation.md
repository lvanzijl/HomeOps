# Weather Cache Implementation

## Summary

Backend phase 3 of the FamilyBoard weather integration added only the backend-internal weather snapshot cache and freshness layer. The Open-Meteo provider remains responsible for live data retrieval and provider-to-domain mapping; the cache is responsible for fast reads, freshness decisions, controlled refresh, stale-while-refresh behavior, and controlled failure behavior.

No API endpoint, DTO, frontend cache logic, database storage, distributed cache, dependency change, project-file change, generated file, Home Assistant integration, provider fallback, weather history, Home projection, Agenda projection, detail projection, or Departure Advice Engine was introduced.

## Implemented Cache

`WeatherSnapshotCache` stores one `FamilyBoardWeatherSnapshot` per household in backend memory. It exposes:

- `TryGetSnapshot` for a direct cache read that future Home, Agenda, or Detail services can use without provider knowledge;
- `GetOrRefreshAsync` for the backend refresh path that accepts a provider refresh delegate;
- `Remove` for explicit local cache eviction when a future backend flow needs it.

The cache uses per-household refresh locks so concurrent refresh requests for the same household do not create overlapping provider calls.

## Freshness Strategy

Freshness is determined by the existing `WeatherFreshness.IsFreshAt(nowUtc)` domain method. A snapshot is fresh while the current backend time is earlier than `ExpiresAtUtc`.

A fresh cached snapshot is returned immediately and the provider is not called. This means future Home reads can use a usable cached snapshot without waiting for a live Open-Meteo call.

## Snapshot Lifecycle

The lifecycle is:

1. No cached snapshot exists: `GetOrRefreshAsync` performs a controlled blocking refresh and stores the result.
2. A fresh cached snapshot exists: the cache returns it immediately.
3. A stale cached snapshot exists: the cache returns a stale-marked snapshot immediately and starts one background refresh for that household.
4. Background refresh succeeds: the household cache entry is replaced with the fresh provider snapshot.
5. Cache is explicitly removed: the next `GetOrRefreshAsync` behaves like an empty cache.

Home, Agenda, and Detail can later share this same household snapshot because the cache key is the household id, not the consuming surface.

## Failure Behaviour

If refresh fails and no previous snapshot exists, the cache returns and stores an unavailable snapshot with `WeatherProviderStatus.Unavailable`, unknown current weather, empty hourly slots, empty daily summaries, and a provider status message.

If refresh fails while a previous snapshot exists, the cache preserves the previous snapshot data and marks it as `WeatherProviderStatus.Stale` with the failure message. This keeps usable weather data available while still surfacing that refresh failed.

If a provider returns an unavailable snapshot while stale data exists, the cache also preserves the stale data rather than replacing it with an empty unavailable snapshot.

## Validation

- `dotnet --info` completed successfully with the configured local .NET environment.
- `dotnet test HomeOps.sln --filter WeatherSnapshotCacheTests` completed successfully.
- `dotnet build HomeOps.sln` completed successfully.
- `dotnet test HomeOps.sln` completed successfully.
- Cache tests verify empty-cache blocking refresh, fresh-cache provider avoidance, stale-while-refresh behavior, unavailable empty-cache behavior, and stale preservation after background refresh failure.
- Existing Open-Meteo provider tests continue to pass as part of the full solution test run.

## Design Decisions

The existing Weather Domain was suitable for caching because `FamilyBoardWeatherSnapshot` already contains household identity, freshness metadata, provider status, current weather, hourly slots, and daily summaries.

A small architecture improvement was added by keeping cache reads provider-neutral: `TryGetSnapshot` returns only the existing Weather Domain model, while `GetOrRefreshAsync` accepts a refresh delegate. This keeps Open-Meteo knowledge outside future Home/Agenda/Detail consumers without introducing a provider factory, plugin architecture, dependency injection wiring, or a generic provider engine.

The cache uses simple in-memory storage because the requirement is one backend-internal snapshot per household. Redis, distributed cache, database persistence, complex invalidation, and scheduler frameworks were intentionally avoided.

## Future Integration Points

Future backend slices can wire the cache into application services, register it with dependency injection, and expose Home, Agenda, or Detail projections that read from the shared household snapshot. Those future consumers should read `FamilyBoardWeatherSnapshot` from the cache and should not know about Open-Meteo provider types.

Caching remains fully backend-internal. Departure Advice, API endpoints, Home Assistant integration, Home projection, Agenda projection, and Detail projection are intentionally not implemented in this slice.

## Modified Files

- `src/HomeOps.Api/Weather/WeatherSnapshotCache.cs`
- `tests/HomeOps.Api.Tests/Weather/WeatherSnapshotCacheTests.cs`
- `docs/reports/2026-07-04-weather-cache-implementation/weather-cache-implementation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

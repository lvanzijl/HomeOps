# Home Assistant Climate Refresh Slice 14

## Summary
Implemented the backend refresh layer for Home Assistant room climate data. Enabled providers can now be refreshed periodically by a hosted service or manually through administrative service endpoints.

## Implemented
- Scoped refresh orchestration for all enabled Home Assistant providers, a single provider, a Room, and a diagnostic mapping path.
- Process-local provider-scoped coordination so concurrent requests for the same provider share one run.
- Thin cancellable hosted service registered outside Testing and VisualReview.
- Safe typed refresh summaries and diagnostics without tokens, headers, raw JSON, entity-state payloads, or stack traces.

## Refresh orchestration
The orchestration service selects enabled, non-archived Home Assistant providers, skips disabled or archived Rooms and mappings, groups work by provider, and delegates adapter parsing, validation, normalization, and ingestion to the accepted Home Assistant climate provider/read-model seam.

## Overlap prevention
A small in-process provider-scoped coordinator deduplicates simultaneous refreshes for one provider. Different providers can still refresh independently. This is intentionally process-local for the single-instance V1 architecture and is not a distributed lock for multi-instance deployments.

## Hosted scheduling
The hosted service uses centralized `HomeAssistantClimateRefresh` options, creates a scope per cycle, calls the orchestration service, logs counts only, respects shutdown cancellation, and catches failed cycles so later cycles can continue. No business logic was placed in the hosted service.

## Configuration
Defaults:
- `Enabled`: `true`
- `IntervalSeconds`: `300`
- `ProviderRequestTimeoutSeconds`: `10`
- `MaximumProviderConcurrency`: `4`

Options use startup validation. No cron expressions or per-Room schedule UI were added.

## Provider/mapping health
Provider status is summarized with safe refresh metadata. Mapping health remains in the existing health states: `Healthy`, `Missing`, `Unavailable`, `NeedsReview`, `Degraded`, and `Unverified`. Unrelated mapping failures remain isolated.

## Observation behavior
Accepted observations continue through the Room Climate Read Model, including newest-observation handling. Refresh failures do not fabricate replacement observations and do not erase existing valid observations. Heating is not inferred from temperature versus target.

## Manual refresh
Administrative endpoints were added for provider, Room, and mapping refresh plus safe provider diagnostics. They return typed DTOs and omit credentials, Authorization headers, raw JSON, entity payloads, and stack traces.

## Cancellation
Cancellation is propagated to adapter HTTP work and read-model ingestion. Completed Room updates may remain committed per existing isolation. Coordination is released in a `finally` path so later refreshes can run normally.

## Security/logging
Logs include provider ID, counts, outcomes, and durations/counts only. Tokens, Authorization headers, raw responses, entity-state JSON, command payloads, and exception text are not logged.

## Portability
No refresh execution state, coordination state, hosted-service state, refresh history, observations, commands, credentials, or raw provider payloads are exported or restored. Existing provider and mapping configuration portability is unchanged.

## Tests
Ran focused Home Assistant provider/mapping regressions, focused refresh coordination tests, the full backend suite, backend build, OpenAPI/TypeScript generation, and generated-client compile verification.

## Deferred scope
No frontend setup UI, OAuth, discovery, generic Home Assistant features, arbitrary service execution, lighting, presence, weather, energy, automation, generic scheduler/queue, dashboards, screenshots, or binary assets were added.

## Risks/limitations
- Coordination is process-local only; multi-instance deployments could still overlap between instances.
- Provider-level status is stored as bounded safe diagnostic metadata rather than a new refresh-history table.
- Refresh summaries are intentionally current-operation results, not unbounded persisted history.

## Modified files
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshOptions.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshModels.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshCoordinator.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshService.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateProvider.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshHostedService.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateRefreshEndpoints.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/appsettings.json`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `tests/HomeOps.Api.Tests/FloorPlans/HomeAssistantClimateRefreshCoordinatorTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

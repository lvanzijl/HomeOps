# Room Heating Control Reconciliation — 2026-07-15

## Summary
Implemented the backend-only Slice 11B reconciliation layer for temporary Room heating commands on top of the accepted Slice 11A command model.

## Implemented
- Added a scoped reconciliation service with deterministic clock input.
- Added expiry classification, pending timeout handling, automatic resume creation, provider completion processing, and observation-based target confirmation.
- Added a thin climate-specific hosted service hook outside Testing and VisualReview.
- Added focused reconciliation tests.

## Expiry policy
Temporary warmer/cooler commands in `Accepted` or `Succeeded` with `EffectiveUntilUtc <= now` and no superseding command are marked `Expired`, keep historical requested/confirmed values, receive `UpdatedUtc` and `CompletedUtc`, and no longer appear as current overrides. Pending commands older than five minutes are marked `Failed` with `PendingTimeout`.

## Automatic resume behavior
When schedule resume is explicitly supported and the provider is available, expiry creates one deterministic system resume command with idempotency key `system:auto-resume:{expiredCommandId}` and dispatches it through the existing provider boundary. Reconciliation runs do not create duplicates. If resume is unsupported or unavailable, the temporary command still expires and records a stable blocker code/message; no guessed provider operation is sent.

## Reconciliation model
Core logic lives in `RoomHeatingControlReconciliationService`, not in a background worker. It can be invoked directly by tests, by observation ingestion, or by the hosted scheduler.

## Provider completion
Added a provider-neutral completion seam that accepts command/reference identity, outcome, completion timestamp, optional confirmed target, optional schedule-resumed confirmation, and sanitized failure details. Processing updates only `Pending` or `Accepted` commands, rejects ownership mismatches, ignores terminal/stale commands, and is idempotent for repeated completions.

## Observation confirmation
Accepted temporary targets can become `Succeeded` only from newer same-room/same-mapping/same-provider observations with provider availability and matching target temperature within centralized tolerance. Current temperature alone is not used. Resume schedule success is not inferred from target changes because the current normalized read model has no explicit schedule-restored state.

## Stale completion protection
Stale completion checks cover terminal commands, superseded commands, mismatched Room/provider/mapping, and completion timestamps older than command request/acceptance. Ignored/conflict outcomes are deterministic and do not mutate observations.

## Concurrency hardening
The Slice 11A unique household/room/idempotency constraint remains the no-duplicate-dispatch foundation. Reconciliation uses existing rows, deterministic resume keys, and terminal-state checks so stale commands are not resurrected. Broader relational race coverage remains limited by the current in-memory-focused test harness.

## Hosted scheduling
`RoomHeatingControlReconciliationHostedService` creates a scope, invokes reconciliation approximately once per minute, supports cancellation, logs failures safely, and continues after failed cycles. It is registered only outside Testing and VisualReview.

## Capability/read-model impact
No public frontend controls were added. Capability/current override behavior continues to derive active state from command rows; expired due commands are excluded by time and become terminal after reconciliation. Existing command status fields expose pending, accepted, succeeded, expired, resume pending/succeeded/failed, and provider unavailable/failure information.

## Failure/retry policy
No broad retry engine was introduced. Pending acceptance times out after five minutes. Automatic resume is attempted once per expired temporary command via deterministic idempotency; provider unavailable/failure remains factual and visible rather than being reported as success.

## Portability
Operational command, reconciliation, completion, retry, and override state remain excluded from backup/export/restore. Restore does not restart, replay, or fabricate commands.

## Tests
Focused tests cover expiry boundaries, idempotency, automatic resume support/unavailability, pending timeout, completion application/staleness/ownership checks, and observation confirmation target rules. Existing Slice 11A hardening tests continue to pass.

## Deferred scope
No frontend controls were added. No real Home Assistant/provider integration was added. No generic scheduler, schedule editor, comfort logic, Stories, weather, presence, recommendations, history charts, screenshots, or binary assets were added.

## Risks/limitations
- Resume schedule success cannot yet be confirmed from observations without an explicit normalized schedule state in the read model.
- Deep simultaneous transaction race tests remain constrained by the repository's current in-memory test style; the model-level idempotency uniqueness test remains SQLite-backed.

## Modified files
- `src/HomeOps.Api/FloorPlans/RoomHeatingControl.cs`
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlReconciliationService.cs`
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlReconciliationHostedService.cs`
- `src/HomeOps.Api/FloorPlans/RoomClimateReadModelService.cs`
- `src/HomeOps.Api/Program.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomHeatingControlReconciliationTests.cs`
- `docs/reports/2026-07-15-room-heating-control-reconciliation/README.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

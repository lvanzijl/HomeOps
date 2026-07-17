# Room Heating Control Concurrency Hardening — 2026-07-17

## Summary
Hardened Slice 11B with focused relational SQLite coverage for command races and fixed concrete relational-provider defects discovered by those tests.

## Risks addressed
- Same-key idempotency races leaking unique-index database exceptions.
- SQLite relational tests exposing unsupported `DateTimeOffset` query translation in current-state and reconciliation queries.
- Different-key override ordering, failed newer commands, resume/override ordering, expiry/new-command ordering, duplicate automatic resume creation, stale completion, and pending-timeout/completion oscillation.

## Relational test setup
Tests use SQLite shared in-memory databases with a keep-alive connection and separate `HomeOpsDbContext` instances per operation. This exercises EF relational indexes and SQLite transaction behavior rather than EF InMemory behavior.

## Different-key override races
Added coverage proving sequential commit-order races with different idempotency keys keep exactly one factual current temporary command, supersede the older accepted temporary command, preserve both history rows, expose the latest command through capability, and do not mutate climate observations.

## Same-key idempotency races
Added coverage proving same-key/same-payload concurrent submissions result in one command row and one provider dispatch, while same-key/different-payload follow-up returns deterministic `IdempotencyKeyConflict` without mutating or redispatching the winner.

## Resume-versus-override races
Added coverage for resume followed by a newer override: the newer valid temporary command becomes current, stale completion for the previous temporary command is ignored, and derived current state remains stable.

## Expiry-versus-new-command races
Added coverage proving expiry creates one system resume for a due command, a newer override can still be recorded and queried, later manual resume determines current resume state, and repeated reconciliation does not duplicate the system resume command.

## Manual-versus-automatic resume
Manual resume after automatic expiry resume leaves one logical current resume state. Distinct manual and system command rows can coexist when their idempotency keys differ, but the deterministic system idempotency key prevents duplicate automatic resume rows.

## Completion races
Added coverage for stale temporary completion after superseding and completion/timeout ordering. Completion processing remains terminal-state guarded and does not mutate climate observations.

## Pending-timeout races
Added coverage for both deterministic orders: completion before timeout remains `Succeeded`; timeout before completion remains `Failed` and later completion is ignored.

## Transaction changes
No schema or migration was required. The only command-service behavior change is unique-index conflict recovery during initial command insert: after a relational conflict, the service reloads the existing idempotency row and returns either the same command response or deterministic `IdempotencyKeyConflict`.

## Derived-state verification
Race tests verify public capability/current-override state in addition to raw command rows, ensuring derived read behavior matches persisted command history.

## Tests
- New relational SQLite command race suite.
- Existing Slice 11A foundation hardening suite.
- Existing Slice 11B reconciliation suite.
- Full backend test suite.
- Backend build.
- NSwag regeneration check.
- Frontend generated-client build.

## Remaining limitations
The new suite uses deterministic commit-order coverage with relational SQLite. It does not introduce distributed locks, queues, process-wide locks, or a generic concurrency framework. Real provider adapters and frontend controls remain deferred.

## Modified files
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlService.cs`
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlReconciliationService.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomHeatingControlRelationalConcurrencyTests.cs`
- `docs/reports/2026-07-17-room-heating-control-concurrency-hardening/README.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

No new product scope was added. No generic lock, queue, or scheduler framework was introduced. No frontend or real provider integration was added.

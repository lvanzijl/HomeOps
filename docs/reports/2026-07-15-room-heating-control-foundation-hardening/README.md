# Room Heating Control Foundation Hardening — Slice 11A

## Summary
Added focused automated hardening coverage for the accepted Slice 11A backend foundation and fixed only concrete defects found while testing. No new product scope was added.

## Risks addressed
- Capability could be reported without a usable current observation/read model.
- Warmer/cooler direction validation was not proven.
- Provider exceptions needed safe normalization.
- Idempotency, superseding, persistence, portability, and generated contracts lacked focused proof.

## Capability coverage
Tests cover fully controllable rooms, bounded-control policy, configured/provider target ranges, allowed durations, warmer/resume/cooler actions, provider-unavailable blockers, shared-zone affected rooms, current override, latest command summary, and stable household-safe blocker codes.

## Temporary warmer coverage
Tests cover valid warmer commands, persisted command fields, accepted/succeeded/rejected/unavailable provider outcomes, provider command references in persistence, confirmed target storage, command status reads, target/duration validation, unsupported direction, and no climate-observation mutation.

## Temporary cooler coverage
Tests prove cooler is omitted/rejected unless fake provider capability explicitly supports it, validates target direction, and reuses the warmer idempotency/outcome path.

## Resume schedule coverage
Tests cover resume superseding active temporary commands, accepted and provider-confirmed succeeded resume, idempotent replay without redispatch, command visibility, and no fabricated schedule confirmation when the provider does not confirm it.

## Idempotency coverage
Tests prove same-key replay returns the existing command without redispatch and different payload reuse returns `IdempotencyKeyConflict` without mutating the original command. A SQLite-backed test proves the unique household/room/idempotency-key constraint.

## Superseding and derived override coverage
Tests cover sequential accepted warmer superseding, resume superseding, failed newer command preserving a valid current override, superseded commands not being current, requested/confirmed target exposure, effective-until preservation, and resume-pending derived state.

## Provider-boundary verification
The fake provider records capability, temporary, and resume contexts and verifies provider calls receive safe command/mapping context. Provider exceptions are normalized to safe failure codes/messages without exposing raw exception text.

## Persistence/migration verification
EF model tests assert the `RoomHeatingCommands` table, primary key, restrictive relationships, enum string conversions, decimal precision, nullable lifecycle columns, required idempotency/fingerprint values, length limits, indexes, self-reference, and uniqueness constraints. Idempotent migration script generation was run.

## API/generated contracts
Tests assert the heating-control OpenAPI routes, schemas, enums, typed response contracts, conflict/validation responses, and generated TypeScript methods/enums. OpenAPI and the generated client were regenerated rather than manually edited.

## Portability exclusion
Tests prove command rows, idempotency keys, provider command references, and derived override state are absent from export payloads. Existing climate configuration and provider mapping portability remains unchanged.

## Atomicity
Tests prove invalid targets, invalid durations, unsupported actions, idempotency conflicts, and provider failures do not create false active overrides or mutate climate observations.

## Tests
Focused hardening tests, regression suites, full backend suite, backend build, OpenAPI/client generation, TypeScript build, idempotent migration script generation, and final diff inspection were performed.

## Deferred to Slice 11B
Hosted expiry, reconciliation, observation-based completion, callbacks, stale completion handling, retries, race/fault-injection tests, frontend controls, and real Home Assistant integration remain deferred.

## Remaining limitations
- The default production provider remains intentionally unavailable until a real provider is introduced.
- Automatic expiry processing is still not implemented.
- Broad simultaneous-request hardening remains deferred.

## Modified files
See the repository diff for the authoritative file list.

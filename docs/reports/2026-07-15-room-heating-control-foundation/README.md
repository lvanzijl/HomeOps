# Room Heating Control Foundation — Slice 11A

## Summary
Implemented the backend foundation for provider-independent room heating commands. No frontend controls were implemented, no real Home Assistant client was added, no operational command state entered portability, expiry/reconciliation remains deferred, and no unrelated product scope was added.

## Implemented
- `RoomHeatingCommand` as the single authoritative operational record.
- EF persistence, migration, indexes, enum string storage, restrictive relationships, and idempotency uniqueness.
- Provider-neutral capability and command boundary with a default unavailable implementation.
- Capability, temporary warmer/cooler, resume schedule, and command status APIs.
- Typed OpenAPI and generated TypeScript client updates.

## Domain decisions
- No separate active override table was added.
- Current override state is derived from non-superseded command records.
- Commands are excluded from backup/export/restore.
- Targets are submitted explicitly; the backend rejects invalid targets instead of clamping.
- Submission does not fabricate provider success.

## Supported actions
- `TemporaryWarmer` is exposed when bounded control is valid and provider capability is available.
- `ResumeSchedule` is exposed when control is valid or an override/pending command exists.
- `TemporaryCooler` is modeled but only supported when provider capability explicitly enables it.

## Capability model
Capability returns controllability, supported actions, target range, allowed durations, provider availability, stable blockers, shared-zone metadata, current derived override, and latest command summary.

## Command lifecycle
Commands start as `Pending`, then move to `Accepted`, `Succeeded`, or `Failed` based on provider results. `Superseded` and `Expired` are persisted contract states; automatic expiry is deferred.

## Temporary override
Temporary commands validate room ownership, active room state, climate configuration, bounded policy, control mapping, provider availability, action support, target bounds, duration, and idempotency.

## Resume schedule
Resume schedule uses the same operational record, is idempotent, supersedes current temporary commands when accepted/succeeded, and does not fabricate a provider schedule confirmation.

## Provider boundary
The boundary receives safe FamilyBoard identifiers, mapping references, requested targets, durations, expiry, and command IDs. It returns provider-neutral accepted/rejected/unavailable outcomes plus safe confirmations or failure details.

## Idempotency and superseding
Same idempotency key plus same fingerprint returns the existing command without redispatch. Same key plus different fingerprint returns conflict. Accepted newer override/resume commands supersede older current temporary commands.

## Derived override state
Derived state reports no override, pending/accepted/succeeded temporary override, resume pending, latest failure data, requested/confirmed target, and effective-until without persisting a second state table.

## APIs/generated contracts
Added `/api/rooms/{roomId}/heating-control/capability`, `/temporary-warmer`, `/temporary-cooler`, `/resume-schedule`, and `/commands/{commandId}` with generated OpenAPI and TypeScript client methods.

## Persistence/migration
Added `RoomHeatingCommands` with operational command fields, enum strings, decimal precision, required idempotency/fingerprint values, indexes, unique idempotency constraint, restrictive FKs, and a self-reference for superseding.

## Portability
Calendar export/restore remains unchanged and does not include command rows, idempotency data, provider command references, or derived active override state.

## Tests
Build, OpenAPI generation, TypeScript compile verification, migration generation, and selected backend tests were run as listed in the final response. Full requested exhaustive test coverage remains a risk for this foundation-sized implementation.

## Deferred to hardening
Hosted expiry scheduler, reconciliation, observation-based completion, callbacks, retry handling, race/fault-injection hardening, stale completion processing, frontend controls, and real Home Assistant command integration remain deferred to Slice 11B or later.

## Risks/limitations
- The default provider is intentionally unavailable until a real or test provider is registered.
- No hosted process expires accepted commands automatically yet.
- No broad simultaneous-request race hardening was added.

## Modified files
See the repository diff for the authoritative file list.

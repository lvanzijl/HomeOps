# Floor/Room Portability Hardening — Woning Climate Floor Plans Slice 1 Follow-up

## Summary
Hardened the backend-only Floor and Room backup/restore path so malformed, ambiguous, invalid lifecycle, invalid ordering, invalid relationship, and unsupported RoomType data is rejected before destructive restore work begins. No production scope beyond Floor/Room portability hardening was added.

## Defects or risks addressed
- Prevented legacy-compatible restore from silently replacing current Floor/Room state when both Floor and Room collections are absent.
- Rejected malformed Floor/Room graphs before replacement, including duplicate identifiers, duplicate names, invalid references, invalid ordering, invalid archive/enabled combinations, unsupported RoomType values, and invalid FamilyMember associations.
- Made missing/cross-household/deleted FamilyMember references an explicit restore failure instead of silently nulling the association.

## Selected restore semantics
- Calendar portability keeps its existing full calendar replacement behavior.
- Floor/Room portability is full replacement only when both `Floors` and `Rooms` collections are present.
- Older backups that omit both collections are treated as legacy backups and leave current Floor/Room state unchanged.
- Present but empty collections are an explicit full replacement to an empty Floor/Room graph.

## Validation rules
- Floor and Room IDs must be non-empty and unique within the backup.
- Floor names are required and unique across active and archived restored Floors.
- Room names are required and unique within each Floor across active and archived restored Rooms.
- Room references must point to a Floor in the same restore payload.
- RoomType must parse to the supported product enum and is not silently mapped to `Other`.
- FamilyMember references must point to active FamilyMembers in the local household.
- Sort orders must be non-negative, unique in scope, and contiguous from zero.
- Archived records require archive timestamps, active records must not carry archive timestamps, and archived records must not be enabled.
- Active Rooms cannot be restored into archived or inactive Floors.

## Transactionality
- Floor/Room validation runs before the pre-restore snapshot and before destructive Floor/Room mutation.
- Restore uses the existing pre-restore snapshot safety pattern before replacement.
- Relational database restores now run inside a transaction that commits only after all restore changes save successfully.
- Tests assert failed Floor/Room restore leaves existing Floor/Room state unchanged.

## Backward compatibility
- Backups without Floor/Room collections remain valid and preserve current Floor/Room state.
- Backups with empty Floor/Room collections intentionally replace the Floor/Room graph with no Floors and no Rooms.
- Existing calendar portability tests continue to pass.

## Tests
- Added focused Calendar portability tests for duplicate Floor/Room IDs, duplicate names, missing Floor references, invalid names, invalid RoomType, invalid FamilyMember reference, invalid lifecycle state, invalid sort order, failed restore rollback, same Room names on different Floors, ordering preservation, archive-state preservation, valid FamilyMember preservation, legacy absent collections, explicit empty collection replacement, and pre-restore snapshot creation.

## Risks/limitations
- The current portability contract does not carry per-Floor or per-Room household IDs, so household mismatch validation is represented through payload-owned Floor references and local active FamilyMember validation.
- Malformed GUID text is normally rejected during JSON deserialization before `CalendarPortabilityService.RestoreAsync` receives a typed document; service-level validation covers `Guid.Empty` identifiers.

## Modified files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/reports/2026-07-12-floor-room-portability-hardening/floor-room-portability-hardening.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

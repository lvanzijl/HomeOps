# Floor-plan replacement lifecycle implementation report

## Summary
Implemented backend floor-scoped replacement reviews for floor-plan assets and Room overlays.

## Implemented
- Replacement review and Room review item persistence.
- Backend APIs for start, read/list, dispositions, reuse approval, overlay attachment, reset, readiness validation, activation, cancellation, and rollback.
- Compatibility metadata for safe preview candidate eligibility only.
- Atomic floor-level activation and rollback operations.
- Backup/export and restore payload support for reviews and review items.

## Domain decisions
- Review status is distinct from asset state.
- Compatibility flags never imply trust; they only allow candidate references.
- Approved replacement geometry is represented by a normal RoomOverlay on the replacement asset in non-Trusted state until activation.

## Review lifecycle
Reviews start in `InReview`, can become `Activated` or `Cancelled`, and active review uniqueness applies to Draft/InReview/ReadyToActivate.

## Room dispositions
Supported dispositions: PendingReview, ApprovedReuse, RedrawRequired, NotConfiguredYet, IntentionallyNotDrawn, and BlockedFallback.

## Overlay approval
Reuse copies candidate geometry to the replacement asset as `Valid`; label anchors are preserved or cleared by request. Candidate validation rejects invalid geometry and overlap with other approved replacement candidates.

## Activation
Activation validates asset state/content, room-item completeness, explicit dispositions, replacement geometry ownership, and overlap before switching asset trust atomically.

## Cancel and rollback
Cancellation leaves runtime setup unchanged. Rollback restores the prior asset as Active and demotes replacement overlays out of Trusted state when rollback content is present.

## API/contracts
Added minimal API endpoints under `/api/floors/{floorId}/floor-plan-replacement-reviews` with strongly typed request/response records.

## Persistence/migration
Added EF entities, DbSets, relationship configuration, indexes, and an EF migration for replacement reviews and items.

## Backup/restore
Export includes reviews and items. Restore validates graph shape, status/disposition enums, active-review uniqueness, item uniqueness, and approved overlay references.

## Validation
Errors are returned as validation problems or replacement review validation results without storage paths.

## Tests
Validated with solution build, the focused FloorPlans test filter, and the broader backend test suite. Added schema coverage for replacement review persistence constraints.

## Risks/limitations
- The legacy direct asset activate/rollback endpoints remain for compatibility; review endpoints implement the safe replacement lifecycle.
- Readiness status is reported by validation; automatic `ReadyToActivate` promotion is not required for activation.

## Deferred scope
Frontend review UI, image comparison, automatic geometry transformations, polygon editing UI, runtime rendering, climate readings, Stories, heating controls, and Home Assistant integration.

## Modified files
See git diff for exact source, migration, and documentation files.

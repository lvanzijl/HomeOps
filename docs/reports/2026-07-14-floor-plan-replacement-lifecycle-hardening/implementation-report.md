# Floor-plan replacement lifecycle hardening report

## Summary
Added focused backend hardening for Slice 7 replacement reviews without adding product scope.

## Risks addressed
- Direct replacement activation can no longer silently bypass replacement review when an Active asset already exists.
- Cancellation no longer applies to Activated reviews or repeated cancellations.
- Draft/Invalid/Archived replacement overlays cannot be approved for activation.
- RedrawRequired Rooms block readiness until replacement geometry is explicitly approved through the accepted approval path.
- Activated restore payloads must have a coherent Active/Replaced asset graph and Trusted approved replacement overlays.

## Review lifecycle coverage
Added API coverage for starting reviews, preserving runtime assets/overlays during review, duplicate active review rejection, missing Floor behavior, inactive Floor rejection, read/list behavior, deterministic Room item assertions, and cancellation behavior.

## Room disposition coverage
Added disposition transition coverage for RedrawRequired, NotConfiguredYet, IntentionallyNotDrawn, BlockedFallback, reset to PendingReview, and readiness blockers for PendingReview and missing Room items.

## Overlay approval coverage
Added coverage for reuse candidate copying, non-Trusted candidate state before activation, label anchor preserve/clear behavior, invalid geometry rejection, overlap rejection, and Draft overlay rejection.

## Readiness validation
Readiness remains derived and non-mutating. Tests cover PendingReview blockers, missing Room item blockers, complete ready review, fallback disposition readiness, and failed activation preserving state.

## Activation atomicity
Added coverage for successful floor-level activation and failed activation. Successful activation verifies old asset Replaced, replacement Active, approved replacement overlay Trusted, fallback Room without Trusted overlay, old Trusted overlay recoverable, one Active asset, and Activated review timestamp. Failed activation verifies the old trusted setup remains unchanged.

## Cancel and rollback
Added coverage that cancellation changes review status only and keeps assets/overlays unchanged. Added rollback coverage verifying previous asset Active, replacement asset Replaced, previous Trusted overlay retained, replacement overlay demoted from Trusted, and one Active asset remains.

## Legacy direct endpoint boundary
Initial direct activation remains supported. Direct activation of a replacement asset when an Active asset exists now returns BadRequest so normal replacement use cannot bypass review activation.

## Backup/restore verification
Added portability coverage for exporting/restoring InReview reviews and Room dispositions, duplicate Room item rejection with no mutation, and Activated review graph rejection when approved overlays are not Trusted in the payload. Restore now preserves Trusted state only for replacement overlays explicitly approved by Activated reviews; unreviewed Trusted input remains downgraded to Valid.

## Migration/schema verification
Existing schema test coverage was extended for replacement review tables, enum string persistence, one active review per Floor, review+Room uniqueness, overlay relationships, and delete behaviors.

## Tests
Ran focused replacement review API tests, replacement/overlay portability tests, FloorPlanAsset regression tests, Room Overlay regression tests, FloorPlans tests, and the full backend suite.

## Remaining limitations
No frontend replacement UI, image comparison, geometry transforms, runtime rendering, climate readings, Stories, heating controls, or Home Assistant scope was added. Database failure injection is covered by transaction structure and state-preservation failure tests, not by a provider-level fault-injection test.

## Modified files
See git diff for exact source, tests, and documentation changes.

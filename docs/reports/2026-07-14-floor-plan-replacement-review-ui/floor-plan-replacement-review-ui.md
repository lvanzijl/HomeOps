# Floor-plan Replacement Review UI — Contract Blocker Report

## Summary

FamilyBoard Woning Climate Floor Plans slice 8 was reviewed as a frontend-only Copilot slice. Implementation did not proceed because the generated frontend API client does not expose the replacement review lifecycle contracts required by the slice.

The product request explicitly requires the frontend to use the generated API client and backend state as the source of truth, and to stop rather than add hidden workarounds when the OpenAPI/client contract is missing or incorrect. The current contract exposes general floor-plan asset activation/rollback primitives, but it does not expose replacement review resources, room review items, room dispositions, readiness validation, activation of a review, cancellation, or review rollback operations.

## Implemented

No production UI was implemented for this slice.

The only repository changes are this blocker report and the current-state note. This preserves the product boundary and avoids inventing lifecycle state in the frontend.

## UX decisions

The planned Settings-side workflow remains unchanged:

- Entry belongs under **Settings > Woning**, not the runtime Woning page.
- Review must be a bounded, viewport-safe workspace with internal scrolling for the Room list and detail regions.
- Current and replacement plans should be compared side by side on desktop and through explicit tabs/toggles on tablet.
- Phone must allow status, fallback decisions, validation, cancellation, and activation confirmation where usable, while blocking precision polygon drawing/review with Dutch guidance.

These UX decisions were not implemented because the UI cannot safely determine or mutate review state without backend contracts.

## Review lifecycle

The requested Dutch lifecycle labels remain the required presentation mapping:

| Backend state | Dutch label |
| --- | --- |
| Draft | Concept |
| InReview | Wordt beoordeeld |
| ReadyToActivate | Klaar om te activeren |
| Activated | Geactiveerd |
| Cancelled | Geannuleerd |
| Invalid | Kan niet worden afgerond |

The generated client currently contains no replacement-review DTOs or methods that would allow this mapping to be applied to backend-owned review state.

## Room dispositions

The requested disposition labels remain the required canonical presentation mapping:

| Backend disposition | Dutch label |
| --- | --- |
| PendingReview | Nog beoordelen |
| ApprovedReuse | Bestaande grens gebruiken |
| RedrawRequired | Nieuwe grens tekenen |
| NotConfiguredYet | Later instellen |
| IntentionallyNotDrawn | Niet op de plattegrond tonen |
| BlockedFallback | Tijdelijk alleen in de kamerlijst |

No local enum or duplicated lifecycle model was added. The missing generated disposition contracts block implementation.

## Reuse review

Reusable-geometry review was not implemented. The frontend needs generated DTOs for reusable overlay candidates, compatibility metadata, label-anchor handling, and approve/reject mutations before it can safely show candidate geometry or persist approval.

## Redraw integration

The existing Settings Room Overlay Editor remains the intended implementation basis for redrawing replacement geometry. Integration was not implemented because attaching and approving replacement overlays through the replacement review API requires generated review-item/overlay-approval methods that are not present.

## Readiness

Readiness validation was not implemented. The generated client does not expose a replacement-review readiness endpoint or typed readiness result with blockers such as pending Rooms, missing geometry, overlaps, stale asset state, or derivative availability.

Readiness must come from the backend and must not be fabricated in the frontend.

## Activation

Review activation was not implemented. The current client exposes direct floor-plan asset activation, but the slice requires explicit floor-level activation through the replacement review lifecycle after backend readiness confirms activation is allowed. Using direct asset activation would bypass the required Room-by-Room review contract and was therefore rejected.

## Cancel and rollback

Review cancellation and activated-review rollback were not implemented. The generated client does not expose replacement-review cancellation, activated-review rollback availability, or review-scoped rollback validation/summary contracts.

The existing floor-plan asset rollback method is not sufficient for this slice because the requested workflow is review-scoped and must refresh assets, overlays, reviews, and Room items based on backend-owned replacement lifecycle state.

## Accessibility

No new accessibility implementation was added. The planned UI still needs:

- keyboard-accessible Room list navigation;
- accessible radio-group disposition controls;
- tab/segmented controls for plan comparison;
- alert/status roles for blockers and progress;
- structured readiness summaries;
- focus-trapped confirmation dialogs with focus restoration;
- non-color status labels.

## Responsive behavior

No responsive replacement-review workspace was added. The planned implementation must follow the viewport-first rule and avoid browser-level vertical scrolling on Settings primary surfaces by reserving fixed regions and using internal bounded scrolling.

## Tests

No replacement-review frontend tests were added because there is no generated contract to mock without inventing unsupported API shapes.

## Deferred scope

All requested runtime and out-of-scope areas remain deferred:

- asset upload UI;
- general asset activation UI;
- automatic geometry transformation;
- image registration;
- image-difference analysis;
- runtime `Klimaat in huis`;
- climate readings;
- Stories;
- heating controls;
- provider mapping UI;
- Home Assistant setup;
- screenshots or binary assets.

## Risks/limitations

- The frontend slice is blocked until the OpenAPI document and generated TypeScript client include replacement review lifecycle endpoints and DTOs.
- Implementing the UI against hand-written fetch calls, local enums, or `any` response normalization would violate the generated-client requirement and risk duplicating backend lifecycle rules.
- Direct asset activation/rollback endpoints exist, but they do not satisfy the requested replacement review workflow because they do not expose Room review items, disposition confirmation, readiness, cancellation, or review-scoped rollback state.

## Required backend/client contract before implementation

The frontend needs typed generated methods and DTOs for at least:

- discovering current/active replacement reviews per floor;
- starting a replacement review for a Validated replacement asset;
- listing Room review items;
- updating Room dispositions;
- approving/rejecting reusable geometry candidates;
- preserving/clearing replacement label anchors;
- attaching and approving replacement overlay geometry;
- validating readiness without mutation;
- activating the replacement review atomically;
- cancelling an active review;
- discovering activated-review rollback availability and summary;
- executing review-scoped rollback;
- returning stale/concurrent-state recovery signals in household-safe typed responses.

## Modified files

- `docs/reports/2026-07-14-floor-plan-replacement-review-ui/floor-plan-replacement-review-ui.md`
- `docs/state/current-state.md`

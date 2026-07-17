# Runtime Room Heating Controls — Slice 12

## Summary
Implemented frontend runtime heating controls inside the selected Room detail of `Klimaat in huis`.

## Implemented
- Loaded generated room heating-control capability for the selected Room.
- Added a separated `Verwarming` section below current climate facts.
- Added temporary warmer, generated-supported temporary cooler, and schedule resume actions.
- Added focused tests for capability, supported actions, shared-zone warning, submissions, retry idempotency, blockers, resume, and observed-target separation.

## UX decisions
Controls remain factual and bounded inside the selected-Room detail panel. Floor-plan overlays remain compact and read-only.

## Capability and blockers
The UI uses generated capability fields for controllability, supported actions, target range, durations, provider availability, current override, latest command, blockers, and shared-zone metadata. Blockers are translated to household-safe Dutch copy without raw provider identifiers or exception text.

## Temporary warmer
`Tijdelijk warmer` opens a compact dialog with current temperature, observed target, bounded target stepper, generated duration radio choices, calculated end time, shared-zone warning, and confirmation copy.

## Temporary cooler
`Tijdelijk koeler` is rendered only when `TemporaryCooler` is present in generated supported actions.

## Resume schedule
`Schema hervatten` uses the generated resume command wrapper and explains that FamilyBoard asks the climate system to resume the normal schedule without claiming success before backend confirmation.

## Command-state presentation
Pending, Accepted, Succeeded, Failed, Superseded, and Expired are mapped to Dutch labels. Accepted is presented as accepted, not confirmed completion.

## Active override
The current temporary override is shown separately from observed climate facts, including requested target, confirmed target where available, expiry, command state text, and resume-related copy.

## Idempotency UX
The UI generates one idempotency key per intentional command attempt, preserves it for ambiguous transport retry, and does not expose idempotency terminology to the household.

## Failure handling
Capability-load failure is isolated to the control section. Ambiguous command failure preserves retry details and offers retry/status refresh. Backend command failure states are displayed factually without mutating observed climate values.

## Shared-zone behavior
Shared-zone warnings use backend affected Room IDs resolved to visible room names where possible. Shared zones warn before confirmation and do not become blockers unless the backend reports blockers.

## Accessibility
Actions are real buttons. Duration choices are radios. Dialogs use `role="dialog"` and `aria-modal`. Progress uses `role="status"`, failures and shared-zone confirmation warnings use alert/status roles, and disabled actions include title reasons.

## Responsive behavior
Controls stay inside the existing bounded Room detail panel. The command dialog remains compact on desktop/tablet and becomes a bottom-aligned full-width sheet on phone-sized viewports. No browser-level page scrolling is introduced by the new control section.

## Tests
Focused Woning climate tests cover capability rendering, unsupported/provider-unavailable states, warmer submission, generated action visibility, ambiguous retry key reuse, resume schedule copy, and observed target separation. Production frontend build was run.

## Deferred scope
No weekly schedule editor, recurring programs, comfort scoring, recommendations, Stories, weather/presence automation, provider setup, Home Assistant client/setup, historical charts, screenshots, binary assets, floor-plan editing, or real provider integration was added.

## Risks/limitations
The generated command methods expose idempotency through generated request DTO fields; no handwritten networking or permanent workaround was added. Temporary polling was not added in this slice to keep behavior bounded and avoid a new polling framework.

## Modified files
- `src/HomeOps.Client/src/WoningClimatePage.tsx`
- `src/HomeOps.Client/src/WoningClimatePage.test.tsx`
- `src/HomeOps.Client/src/woningClimateApi.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-17-runtime-room-heating-controls/README.md`

Generated heating-control contracts are used directly. No handwritten API workaround was added. No observed climate value is changed optimistically. No schedule editor or real provider integration was added. No unrelated product scope was added.

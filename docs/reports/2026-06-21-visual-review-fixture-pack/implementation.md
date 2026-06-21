# Visual Review Fixture Pack Implementation

## Summary
- Added an explicit Visual Review Fixture Pack endpoint surface under `/api/visual-review-fixtures`.
- Added deterministic named scenarios: `visual-full`, `visual-mixed`, `visual-empty`, `visual-child-young`, `visual-child-older`, `visual-weekly-reset`, and `visual-shopping-lifecycle`.
- Scenario reset clears review-owned runtime data and repopulates the selected scenario with stable identifiers, timestamps, ordering inputs, and counts.
- Fixture data is not part of EF production seed data and does not run during normal application startup.

## Activation
- List scenarios: `GET /api/visual-review-fixtures/scenarios`.
- Reset/load a scenario: `POST /api/visual-review-fixtures/{scenarioName}/reset`.

## Determinism
- Anchor timestamp: `2026-06-21T09:00:00Z`.
- Review fixture identifiers use stable `77000000-0000-0000-0000-*` GUIDs.
- Scenario datasets avoid random values and fixture-local current time usage.

## Validation Notes
- Automated API coverage verifies scenario listing, deterministic repeated resets, isolation from manually added runtime rows, empty-state clearing, and unknown-scenario handling.

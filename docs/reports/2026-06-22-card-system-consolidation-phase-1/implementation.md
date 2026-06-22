# Card System Consolidation Phase 1

## Summary
- Introduced the shared card taxonomy: `Card`, `CardHeader`, `SummaryCard`, and `ReviewCard`.
- Migrated Home summary cards to `SummaryCard` while preserving the existing `home-summary-card` styling contract.
- Migrated Weekly Reset review cards to `ReviewCard` and shared `CardHeader` while preserving the existing `reset-card` and `reset-card-heading` styling contracts.

## Card taxonomy
- `Card`: foundation primitive for card-like surfaces. It owns the shared component boundary and maps card surfaces to their existing visual class contracts.
- `CardHeader`: shared header structure supporting eyebrow, title, meta, and actions without imposing a new visual treatment.
- `SummaryCard`: summary/dashboard card primitive currently preserving Home summary card appearance.
- `ReviewCard`: review/maintenance card primitive currently preserving Weekly Reset card appearance.

## Migration targets
- Home Agenda, Tasks, Motivation, and Lists summary cards now reuse `SummaryCard` and `CardHeader`.
- Weekly Reset review candidates, family goal, children’s goals, shopping review, and recap cards now reuse `ReviewCard` and `CardHeader`.
- Tasks panels were not migrated in this slice because the required Home and Weekly Reset targets provided the low-risk consolidation path without expanding scope.

## Cross-page rule check
- Duplication is reduced by moving summary and review card structure into shared primitives.
- User-visible behavior is preserved because the primitives intentionally keep existing CSS class contracts (`home-summary-card`, `home-card-header`, `reset-card`, and `reset-card-heading`) instead of normalizing colors, spacing, typography, or hierarchy.
- No workflows, navigation behavior, hierarchy, or data loading behavior were changed.

## Validation notes
- Automated frontend tests were run for the migrated Home and Weekly Reset surfaces.
- Full repository validation is tracked in the implementation handoff/final response.

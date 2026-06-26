# 2026-06-24 Design-System Consolidation

## Summary
Polished the existing HomeOps design language without changing workflows, APIs, layouts, or business behavior. The slice focused on shared visual rhythm for cards, dialogs, list rows, and family-facing copy.

## Preflight Findings
- Card-like surfaces used several close but different radii, shadows, and padding values.
- Dialogs already shared a blurred backdrop, but card elevation and sizing were split across Home, Tasks, Motivation, Helpful Moments, and avatar surfaces.
- Conversational panels used similar question animations with locally repeated timing values.
- List rows on the Home dashboard used a smaller radius than other rounded family cards.
- A few user-visible labels still exposed implementation terms such as “Agenda Widget,” “Placeholder Widget,” and technical missing-widget fallback copy.
- Weather connection copy used a developer-facing CSS name, though the visible copy was already family-safe.

## Design-System Improvements
- Added shared CSS tokens for card radius, dialog radius, panel radius, card spacing, and motion timing.
- Aligned widget cards with the warm rounded card treatment used by the Home dashboard.
- Standardized dialog elevation around the shared dialog shadow token.
- Reused the same dialog motion token for backdrop, card entrance, and conversational question transitions.

## Copy Improvements
- Replaced “Agenda Widget” with “Family agenda.”
- Replaced placeholder widget fallback copy with warmer “Coming later” / “A cozy family space for later” language.
- Replaced missing widget definition fallback with “This family space is not ready yet.”
- Renamed the weather CSS hook away from “placeholder” wording while preserving visible copy.

## Visual Consistency Improvements
- Cards now use the same radius and padding token where visually similar.
- Home summary rows use the shared panel radius and slightly more consistent internal spacing.
- Task management sections use the shared card radius rather than a hard-coded pixel value.
- Helpful Moments dialog width now follows the same 34rem dialog width philosophy as the other conversational dialogs.
- Helpful Moments question heading typography now aligns with the Tasks/Agenda conversational title scale.

## Verified
- Frontend tests were run.
- Frontend production build was run.
- Final diff was inspected for accidental generated or binary artifacts.

## Risks
- CSS-only consistency work can still cause minor visual shifts; no screenshots were produced per prompt constraints.
- Some implementation-oriented names remain in internal architecture files and tests because they are not user-facing copy.

## Modified Files
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/PlaceholderWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/TextWidget.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `docs/reports/2026-06-24-design-system-consolidation/2026-06-24-design-system-consolidation.md`

## Next Prompt Context
Continue with focused polish only if visual review identifies specific remaining inconsistencies. Avoid broad redesigns or new feature work; the product language is now consolidated around warm rounded cards, shared conversational dialog rhythm, and family-facing labels.

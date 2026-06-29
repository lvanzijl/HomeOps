# Home Layout Redesign

## Summary
Redesigned the FamilyBoard Home screen as a fuller desktop dashboard while preserving the existing Home concepts, data sources, navigation, dialogs, and product identity.

## Scope answers
- Was the Home layout redesigned? Yes. The Home screen now uses a larger family hero and an asymmetric dashboard grid instead of a compact equal-card composition.
- Does the dashboard now use nearly the full desktop surface? Yes. The Home dashboard has viewport-aware minimum height, larger family cards, and taller dominant dashboard cards.
- Are Agenda and Shopping now the dominant Home cards? Yes. Agenda and Boodschappen span the dominant top grid row.
- Are family members significantly more prominent? Yes. Family chips were recomposed into large person cards with much larger avatars and names.
- Were new features introduced? No. The slice reuses existing Home concepts and the existing list completion API already used by Shopping.
- Were backend/API/schema changes required? No.
- Was browser validation completed? Yes, with VisualReview runtime smoke validation of the Home dashboard.
- Was VisualReview used? Yes.
- Was the marketing storyboard updated? Yes, source-only storyboard descriptions were updated for redesigned Home scenes.
- Do prohibited binary artifacts remain? No prohibited binary artifacts were added.

## Implementation notes
- Reused existing agenda, task, shopping, motivation, and family member data.
- Increased Home shopping check targets for supermarket use without changing shopping data contracts.
- Kept Tasks and Motivation as supporting cards.

## Validation
- Frontend Home tests passed.
- Frontend build passed.
- .NET build passed after setting the required local CLI/NuGet environment.
- VisualReview runtime was launched and Home was loaded.
- `git diff --check` passed.
- `git status --short` was reviewed.

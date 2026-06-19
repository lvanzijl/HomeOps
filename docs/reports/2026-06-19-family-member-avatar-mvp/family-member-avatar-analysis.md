# Family Member Avatar Analysis

## Summary
Family Member Avatar MVP should replace decorative initials-only chips with configurable household member avatars that feel friendly while staying frontend-only and presentation-only.

## Implemented / Decisions
- MVP parts: age group, presentation, skin tone, hair color, hair style, glasses, shirt color, display color, initials, id, and name.
- Age group affects proportions only; it does not imply permissions, safety rules, or account status.
- Presentation controls a small visual cue set and remains neutral by default; it is not gender, identity, profile, or auth data.
- Skin tone, hair color/style, glasses, shirt color, and display color are enough to make members recognizable without external assets.
- Initials remain the required fallback when avatar configuration is missing.
- Future badge placeholders were analyzed as task count, points, warning/attention, and today involvement, but all remain out of scope because they would imply Tasks/Gamification/House Status or ownership semantics.

## Verified
- Analysis completed before implementation.

## Risks
- Frontend-only in-memory edits reset on reload until a future persistence slice defines a durable Family Member boundary.
- Richer avatar options could overtake Home if not kept compact.

## Modified Files
- Planned frontend avatar model, renderer, editor, Home integration, tests, and Phase 2 documentation only.

## Next Prompt Context
Implement persistence only if a future prompt explicitly scopes a Family Member backend boundary. Keep badges, tasks, points, ownership, profiles, authentication, and permissions out of avatar work.

# Domain Color System Decision

## Summary
HomeOps will use a centralized pastel domain color system so each major page feels family-friendly while retaining shared product cohesion.

## Decisions
- Domain families: Home warm amber/rose, Agenda violet, Lists amber, Tasks teal, House Status sky, Media rose, Gamification lime, Settings slate.
- Page backgrounds use very light domain tints and soft gradients; cards stay white or near-white for readability.
- Navigation buttons use each domain family. The active button uses the strongest accent in that family with white text.
- Hover and keyboard focus use the domain accent with a soft focus ring.
- Section accents may use the active domain accent; individual cards should not introduce arbitrary unrelated colors.
- Accessibility guardrails: active/focus states must remain visually obvious, text remains dark on pale backgrounds, and saturated accents are reserved for controls or compact accents rather than large page fields.

## Verified
- Decision captured before implementation.

## Risks
- Some existing source/event colors can still appear inside Agenda content; those are data-source indicators, not page/domain identity tokens.

## Modified Files
- `docs/reports/2026-06-20-domain-color-system/domain-color-system-decision.md`

## Next Prompt Context
Use the shared domain tokens for future major pages. Keep cards readable and avoid per-card unrelated color decoration.

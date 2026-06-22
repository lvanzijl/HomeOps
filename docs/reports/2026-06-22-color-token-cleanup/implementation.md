# Color Token Cleanup Implementation

## Summary
Color Token Cleanup added an explicit shared color vocabulary for product surfaces, borders, elevation, domain accents, and member tints while preserving the existing visual hierarchy and page behavior.

## Inventory Findings
Largest duplicated areas were:

- Neutral app surfaces: repeated white, subtle off-white, glass-white, and muted text values across workspace shell, widgets, forms, dialogs, and task/list rows.
- Warm card surfaces: Home summary cards, family member detail cards, placeholder cards, and emotional cards repeated warm backgrounds, warm borders, and warm shadows.
- Domain tints: workspace pages already used local `--domain-*` variables, but fallbacks repeated hardcoded colors rather than shared surface and border tokens.
- Member tints: family surfaces used `--member-color` directly for local color mixing and borders instead of a semantic member token layer.
- Elevation: neutral, warm, emotional, and dialog shadows were encoded per selector.

## Implementation
- Added root-level shared token families in `src/HomeOps.Client/src/styles.css`:
  - Text and brand tokens.
  - Surface tokens: app, default, subtle, warm, emotional, review, and glass surfaces.
  - Border tokens: default, subtle, warm, emotional, and review borders.
  - Elevation tokens: neutral, warm, emotional, and dialog shadows.
  - Domain and member token defaults.
- Migrated low-risk shared card and shell surfaces first, including workspace panels, widget cards, Home summary cards, family member detail cards, and domain placeholder pages.
- Migrated border and shadow fallbacks to shared tokens while retaining domain-specific overrides.
- Preserved emotional differentiation for Motivation and child/member contexts by routing them through review/emotional/member tokens instead of flattening their appearance.

## Cross-Page Rule Check
The product now shares a surface, border, and elevation vocabulary across operational pages, emotional pages, child/member surfaces, cards, widget shells, and dialogs. Domain and member differentiation remains explicit through semantic tokens. UX, navigation, layout, spacing, typography, and workflows were not intentionally changed.

## Validation Notes
This slice is architectural token cleanup only. No automated coverage was added because behavior and component contracts did not change.

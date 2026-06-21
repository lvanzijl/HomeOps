# HomeOps Asset Wave 1

## Scope

Created the first HomeOps-owned SVG asset wave as standalone artwork only. This slice does not integrate assets into product surfaces, replace Semantic Icon Layer Unicode mappings, modify behavior, alter workflows, or redesign pages.

## Asset inventory

### Helpful Moments

| Asset | Variants | Intended size range | Color slots used | Files |
| --- | --- | --- | --- | --- |
| `helpful-kindness` | `icon`, `spot`, `empty` | 16-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background, MemberColor | `helpful-kindness-icon.svg`, `helpful-kindness-spot.svg`, `helpful-kindness-empty.svg` |
| `helpful-teamwork` | `icon`, `spot`, `group` | 16-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background, MemberColor | `helpful-teamwork-icon.svg`, `helpful-teamwork-spot.svg`, `helpful-teamwork-group.svg` |
| `helpful-initiative` | `icon`, `spot` | 16-24 px, 96 px | Primary, Secondary, Accent, Highlight, Shadow, Background | `helpful-initiative-icon.svg`, `helpful-initiative-spot.svg` |
| `helpful-responsibility` | `icon`, `spot` | 16-24 px, 96 px | Primary, Secondary, Accent, Highlight, Shadow, Background | `helpful-responsibility-icon.svg`, `helpful-responsibility-spot.svg` |
| `helpful-routine` | `icon`, `spot`, `repeat` | 16-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background | `helpful-routine-icon.svg`, `helpful-routine-spot.svg`, `helpful-routine-repeat.svg` |

### Celebration

| Asset | Variants | Intended size range | Color slots used | Files |
| --- | --- | --- | --- | --- |
| `celebration-upcoming` | `icon`, `spot`, `hero` | 20-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background | `celebration-upcoming-icon.svg`, `celebration-upcoming-spot.svg`, `celebration-upcoming-hero.svg` |
| `celebration-ready` | `icon`, `spot`, `hero` | 20-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background | `celebration-ready-icon.svg`, `celebration-ready-spot.svg`, `celebration-ready-hero.svg` |
| `celebration-celebrated` | `icon`, `spot` | 20-24 px, 96 px | Primary, Secondary, Accent, Highlight, Shadow | `celebration-celebrated-icon.svg`, `celebration-celebrated-spot.svg` |
| `celebration-memory` | `icon`, `spot`, `keepsake` | 20-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background, NeutralWarm | `celebration-memory-icon.svg`, `celebration-memory-spot.svg`, `celebration-memory-keepsake.svg` |

### Child Ownership

| Asset | Variants | Intended size range | Color slots used | Files |
| --- | --- | --- | --- | --- |
| `child-my-progress` | `icon`, `spot` | 20-24 px, 96 px | Primary, Secondary, Accent, Highlight, Shadow, Background, MemberColor | `child-my-progress-icon.svg`, `child-my-progress-spot.svg` |
| `child-my-help-mattered` | `icon`, `spot`, `hero` | 20-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background, MemberColor | `child-my-help-mattered-icon.svg`, `child-my-help-mattered-spot.svg`, `child-my-help-mattered-hero.svg` |
| `child-family-participation` | `icon`, `spot`, `group` | 20-24 px, 96 px, 160 px | Primary, Secondary, Accent, Highlight, Shadow, Background, MemberColor | `child-family-participation-icon.svg`, `child-family-participation-spot.svg`, `child-family-participation-group.svg` |
| `child-today` | `icon`, `section` | 16-24 px, 64 px | Primary, Secondary, Accent, Highlight, Background | `child-today-icon.svg`, `child-today-section.svg` |
| `child-this-week` | `icon`, `section` | 16-24 px, 64 px | Primary, Secondary, Accent, Highlight, Background, MemberColor | `child-this-week-icon.svg`, `child-this-week-section.svg` |

### Core UI

| Asset | Variants | Intended size range | Color slots used | Files |
| --- | --- | --- | --- | --- |
| `ui-add` | `icon` | 16-24 px | currentColor | `ui-add-icon.svg` |
| `ui-close` | `icon` | 16-24 px | currentColor | `ui-close-icon.svg` |
| `ui-back` | `icon` | 16-24 px | currentColor | `ui-back-icon.svg` |

## Folder structure

```text
src/HomeOps.Client/src/assets/homeops/
├── celebration/
├── child-ownership/
├── core-ui/
└── helpful-moments/
```

## Color-slot usage

The SVG files use CSS custom properties as semantic color slots so future token-based recoloring can remap the artwork without changing individual paths:

- `--asset-primary`
- `--asset-secondary`
- `--asset-accent`
- `--asset-highlight`
- `--asset-shadow`
- `--asset-background`
- `--asset-neutral-warm`
- `--asset-member-color`

Core UI icons intentionally use `currentColor` so controls can inherit text/button color from the consuming surface.

## Validation notes

- SVG files include `viewBox`, semantic asset and variant metadata, intended-size metadata, title, and description.
- Icon variants use a 24 x 24 viewBox and simplified silhouettes intended to remain recognizable at 16 px.
- Spot variants use a 96 x 96 viewBox with 2-5 rounded layers, small highlights, and soft contact shadows.
- Hero, empty, group, repeat, and keepsake variants use a 160 x 160 viewBox for larger illustration contexts.
- The wave avoids trophies, coins, gems, shops, leaderboards, rankings, and streak-flame reward cues.

## Risks

- These are first-pass vector assets and have not been reviewed in browser-rendered product contexts because integration was intentionally out of scope.
- The assets use fallback CSS color values only as local preview defaults; final palette mapping still needs product token integration in a later slice.
- Some larger variants reuse the core semantic silhouette with extra background/context layers to preserve consistency; future art direction review may request more differentiated compositions.

## Follow-up recommendations

1. Add asset preview documentation or Storybook-style visual review in a later slice without changing product behavior.
2. Route these files through the Semantic Icon Layer only when a dedicated integration slice explicitly requests it.
3. Define token mappings for the semantic color slots before removing Unicode fallbacks.
4. Perform child-size visual QA at 16, 20, 24, 64, 96, and 160 px before product rollout.

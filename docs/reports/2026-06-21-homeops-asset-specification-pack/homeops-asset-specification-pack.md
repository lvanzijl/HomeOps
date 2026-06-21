# HomeOps Asset Specification Pack

## Executive Summary

HomeOps should create owned SVG assets from a formal semantic specification rather than from isolated feature requests. The asset system should preserve the current product direction: warm, rounded, pastel, emotionally clear, child-safe, and maintainable across Home, Motivation, Child Workspace, Celebration, Helpful Moments, Tasks, Lists, Weekly Reset, and future surfaces.

This pack defines the first reusable asset language for HomeOps. It does not create artwork, SVGs, PNGs, migrations, code, or tests. It specifies names, intent, usage, sizes, color slots, priorities, and future SVG requirements so later implementation can proceed through the Semantic Icon Layer without visual drift.

The highest-impact work is not generic navigation icon replacement. The strongest UX lift comes from assets that carry emotional meaning: Helpful Moments, Celebration, Child Ownership, Progress, and Avatar V2. Core UI icons should still be standardized early, but they should remain visually quiet and support the family-facing assets rather than compete with them.

Recommended first wave:

1. Helpful Moments: `helpful-kindness`, `helpful-teamwork`, `helpful-initiative`, `helpful-responsibility`, `helpful-routine`.
2. Celebration states: `celebration-upcoming`, `celebration-ready`, `celebration-celebrated`, `celebration-memory`.
3. Child ownership/progress: `child-my-progress`, `child-my-help-mattered`, `child-family-participation`, `child-today`, `child-this-week`.
4. Core controls needed to remove fragile Unicode from primary flows: `ui-add`, `ui-close`, `ui-back`.

## Asset Family Prioritization

| Priority | Asset family | UX impact | Rationale |
| --- | --- | --- | --- |
| P0 | Helpful Moments | Very high | Converts recognition from text/card styling into a consistent emotional language. These moments are already the strongest relational feature and need child-readable visual identity. |
| P0 | Celebration | Very high | Celebration is visible but still underpowered emotionally. Owned assets can make upcoming, ready, celebrated, and memory states feel vivid and distinct. |
| P0 | Child Ownership | Very high | Child Workspace needs assets that say “my progress,” “my help mattered,” and “we did this together” without rankings or reward-economy cues. |
| P0 | Progress | High | Progress appears across Motivation, Child Workspace, goals, tasks, and family contribution. A consistent visual metaphor reduces confusion and supports child comprehension. |
| P0 | Core UI Icons | Medium-high | Add, close, and back currently risk inconsistent Unicode treatment. Standardizing controls improves polish and accessibility, but emotional impact is lower than family assets. |
| P1 | Avatar V2 | High | Avatars are central to identity and member color personalization. This is high-value but larger in scope, so base/fallback rules should be specified before full asset production. |
| P1 | Navigation | Medium | Useful for long-term consistency across shell/workspaces, but current navigation is less emotionally urgent than child and celebration assets. |
| P1 | Empty States | Medium | Empty states improve onboarding and quiet surfaces, especially Motivation, Helpful Moments, Tasks, and Lists. They should follow once the core emotional language exists. |
| P1 | Memory / Keepsake | Medium-high | Memory overlaps with Celebration and Helpful Moments. It should reuse Wave 1 celebration-memory language before expanding into a broader family-history set. |
| P2 | Household Planning | Medium | Today, this week, recurring routine, and calendar/event metaphors are useful but can reuse child/progress/navigation foundations first. |
| P2 | Lists / Shopping / Packing | Medium-low | Helpful for polish, but not currently the main emotional gap. Keep generic list/checklist assets until later. |
| P2 | Weekly Reset | Medium | Needs visual identity eventually, but should wait until core domain and progress assets are stable. |
| P2 | House / Media / Environment | Low for current scope | Future-safe taxonomy only. Do not create until those surfaces are explicitly advanced. |

## Helpful Moments Specification

Helpful Moments assets must communicate family appreciation, not achievement badges, discipline, points, trophies, or transactional rewards. They should work as small semantic icons in feeds and as larger spot illustrations in child-facing or empty-state contexts.

| Asset name | Semantic meaning | Surfaces used | Small icon usage | Large illustration usage | Color slots | Required SVG variants | Future extensibility |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `helpful-kindness` | Caring action noticed by family. | Motivation Helpful Moments, Child Workspace appreciation cards, future celebration-memory highlights. | 16/20/24 px card label icon; avoid tiny facial detail. | 96/160 px empty-state or child recognition moment. | Primary=warm rose/coral, Secondary=soft cream, Accent=deep berry, Highlight=warm white, Shadow=soft amber. | `icon`, `spot`, `empty`. | Can extend to sibling care, pet/plant care, comfort, sharing. |
| `helpful-teamwork` | Helping together as a family or pair. | Motivation, Child Workspace, Family Goal contribution story, Ready celebration recap. | 16/20/24 px two-hands / linked-shapes mark. | 96/160 px shared puzzle/block/circle composition. | Primary=soft teal, Secondary=warm yellow, Accent=deep teal, Highlight=cream, Member Color=optional participant tint. | `icon`, `spot`, `group`. | Can expand to multi-member group compositions without ranking. |
| `helpful-initiative` | Started helpful action without being asked. | Helpful Moments feed, parent recognition form, child pride recap. | 16/20/24 px small spark/path/raised hand metaphor. | 96/160 px child-safe “first step” path or seed/sprout. | Primary=soft mint, Secondary=light sky, Accent=deep green, Highlight=warm white, Shadow=soft green. | `icon`, `spot`. | Can support “tried something new” and “noticed what needed doing.” |
| `helpful-responsibility` | Took care of a real household responsibility. | Helpful Moments, task completion appreciation, individual goal context. | 16/20/24 px shield/check/house-care mark without police/badge feel. | 96/160 px gentle house/tool/check composition. | Primary=soft blue, Secondary=cream, Accent=deep slate-blue, Highlight=white, Shadow=blue-gray. | `icon`, `spot`. | Can extend to pet care, room care, school prep, recurring household jobs. |
| `helpful-routine` | Kept a routine or repeated care habit. | Helpful Moments, routines, Today/This Week child areas, recurring task context. | 16/20/24 px loop/calendar-dot/check mark. | 96/160 px soft loop/path with repeated friendly markers. | Primary=soft lavender, Secondary=soft peach, Accent=deep violet, Highlight=white, Shadow=lavender-gray. | `icon`, `spot`, `repeat`. | Can later support morning/evening, bedtime, school-day, weekly routines. |

Rules:

- Recognition assets may use hearts, hands, stars, sparkles, notes, or house-care metaphors, but not trophies, medals, leaderboards, coins, gems, shops, or ranked badges.
- The `icon` variant must be readable at 16 px with no text inside the SVG.
- The `spot` variant may include 2-5 layers, tiny highlights, and a soft contact shadow.
- Member color may accent a note pin, small dot, sleeve, or background blob, but should not recolor the whole semantic asset.

## Celebration Specification

Celebration assets must communicate anticipation, family arrival, warm completion, and keepsake memory. They should feel like a shared family ritual, not reward payout mechanics.

| Asset name | Semantic meaning | Emotional intensity | Surfaces used | Color slots | SVG requirements | Variant requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `celebration-upcoming` | A planned shared family moment is getting closer. | Medium: warm anticipation, not maximum excitement. | Home Motivation tile, Motivation celebration surface, Child Workspace hero/family goal. | Primary=soft golden, Secondary=peach, Accent=deep orange, Highlight=cream glow, Shadow=warm amber. | Must read as future/anticipation; use ribbon/path/calendar-spark metaphor without implying scheduled calendar functionality unless surface already has dates. | `icon`, `spot`, `hero`. |
| `celebration-ready` | The family has arrived and can celebrate now. | High: joyful and hard to miss. | Home, Motivation, Child Workspace hero, ReadyToCelebrate surface. | Primary=gold, Secondary=coral, Accent=deep celebratory orange, Highlight=warm white sparkle, Shadow=soft gold. | Strong silhouette; may include confetti/sparkles but should stay controlled and not noisy. | `icon`, `spot`, `hero`, `motion-ready` future-safe static frame. |
| `celebration-celebrated` | The celebration happened and is warmly complete. | Medium-low: satisfied, proud, calm. | Motivation celebration surface, celebration history, Child Mode recent memories. | Primary=soft mint, Secondary=gold, Accent=deep green/teal, Highlight=cream, Shadow=soft green. | Must not look like an active CTA. Prefer completed ribbon/check/soft confetti settled composition. | `icon`, `spot`. |
| `celebration-memory` | A completed celebration became family history. | Warm and nostalgic. | Celebration Memory cards, Motivation history, Child Workspace recent memory. | Primary=soft lavender, Secondary=cream, Accent=deep plum, Highlight=warm gold, Shadow=lavender-gray. | Keepsake/card/bookmark/photo-placeholder metaphor without implying photo upload. | `icon`, `spot`, `keepsake`. |

Rules:

- Celebration assets should reuse a shared celebration grammar: soft ribbon, sparkles, rounded badge/card shape, and warm glow.
- `celebration-ready` is the only high-intensity state. Other states must remain quieter so urgency is meaningful.
- Memory assets should preserve warmth without looking like archived administration.
- Do not use money, prizes, shopping bags, trophies, gems, levels, or achievement medals.

## Child Ownership Specification

Child ownership assets should support pride and belonging without competition. They should help children understand “I can see what I am doing,” “my help mattered,” and “our family did this together.”

| Asset name | Semantic purpose | Child age relevance | Surface usage | Size requirements |
| --- | --- | --- | --- | --- |
| `child-my-progress` | Represents the child’s current growth or movement toward a goal. | Ages 3-5 need simple filled path/star; ages 6-8 can understand path/milestone; ages 9-12 need less childish progress styling. | Child hero, individual goals, Motivation personal goals. | 20/24 px icon; 64/96 px spot; 160 px hero optional. |
| `child-my-help-mattered` | Makes contribution emotionally visible after helpful action or recap. | Ages 3-5 need heart/hand clarity; ages 6-8 need “my help moved us”; ages 9-12 need authentic contribution evidence, not babyish stickers. | Child Workspace, contribution story, celebration-ready/celebrated recaps. | 20/24 px icon; 96 px spot; 160 px hero for celebration ownership. |
| `child-family-participation` | Shows family togetherness without ranks. | All ages; especially useful for sibling sensitivity because it avoids per-child scorekeeping. | Family Goal, Motivation story, celebration memory, Home motivation summary. | 20/24 px icon; 96/160 px group spot. |
| `child-today` | Marks immediate child-owned tasks and current-day focus. | Ages 3-5 need concrete sun/day icon; older children need clean section marker. | Child Workspace Today section, task summaries, Home today links. | 16/20/24 px icon; 64 px section spot optional. |
| `child-this-week` | Marks short-horizon goals and weekly progress. | Ages 6-12 understand week arc; ages 3-5 need simplified repeated-dot path. | Child Workspace This Week, individual goals, Weekly Reset child summary future. | 16/20/24 px icon; 64 px section spot optional. |

Rules:

- Do not create per-child ranking assets, “top helper” assets, streak flames, score counters, or competitive medals.
- Avatar presence may indicate belonging, but asset composition must not order family members by contribution.
- Age-aware expression should be handled by variant tone, not separate product semantics.

## Avatar V2 Specification

Avatar V2 should remain a reusable member identity system powered by safe, composable layers. It should support personalization while preserving consistent scale, accessibility, and fallback behavior.

### Required base assets

- `avatar-base-head-round`
- `avatar-base-head-soft-square`
- `avatar-base-face-eyes-default`
- `avatar-base-face-smile-default`
- `avatar-base-face-smile-soft`
- `avatar-base-face-neutral-soft`
- `avatar-base-cheeks-soft`
- `avatar-base-neck`
- `avatar-base-shoulders`
- `avatar-fallback-initials-badge`

### Hair categories

- `avatar-hair-none`
- `avatar-hair-short-soft`
- `avatar-hair-short-curly`
- `avatar-hair-bob-soft`
- `avatar-hair-long-soft`
- `avatar-hair-ponytail-soft`
- `avatar-hair-puffs-soft`
- `avatar-hair-coils-soft`
- `avatar-hair-cap-safe` future optional

Hair color slots: `HairPrimary`, `HairSecondary`, `HairHighlight`.

### Glasses categories

- `avatar-glasses-none`
- `avatar-glasses-round`
- `avatar-glasses-soft-square`
- `avatar-glasses-half-frame`

Glasses color slots: `AccessoryPrimary`, `AccessoryHighlight`, optional lens transparency.

### Shirt categories

- `avatar-shirt-tee`
- `avatar-shirt-hoodie-soft`
- `avatar-shirt-collar-soft`
- `avatar-shirt-sweater-soft`
- `avatar-shirt-overalls-soft`

Shirt color slots: `Member Color`, `ShirtSecondary`, `Highlight`, `Shadow`.

### Accessory categories

- `avatar-accessory-none`
- `avatar-accessory-hairclip`
- `avatar-accessory-headband`
- `avatar-accessory-soft-hat`
- `avatar-accessory-star-pin`
- `avatar-accessory-heart-pin`

Accessories must remain small and non-status-bearing. They should not imply rewards, ranks, purchases, unlocks, or achievements unless a future scoped cosmetics system exists.

### Background categories

- `avatar-bg-soft-blob`
- `avatar-bg-circle`
- `avatar-bg-squircle`
- `avatar-bg-household-ring`
- `avatar-bg-member-color-wash`

### Layer ordering

1. Background badge/blob.
2. Soft contact shadow.
3. Neck/shoulders/shirt.
4. Head/base skin.
5. Cheeks and face details.
6. Hair back layer.
7. Hair front layer.
8. Glasses.
9. Accessories.
10. Optional member-color ring.
11. Fallback initials overlay only when avatar composition is unavailable.

### Color slots

- `SkinPrimary`
- `SkinSecondary`
- `Cheek`
- `HairPrimary`
- `HairSecondary`
- `HairHighlight`
- `Member Color`
- `ShirtPrimary`
- `ShirtSecondary`
- `AccessoryPrimary`
- `AccessorySecondary`
- `BackgroundPrimary`
- `BackgroundSecondary`
- `InkSoft`
- `Highlight`
- `Shadow`

### Fallback rules

- If any chosen layer is unavailable, render the nearest category default rather than failing the avatar.
- If avatar metadata is missing, render `avatar-fallback-initials-badge` using member initials and member color.
- If member color is missing, use the neutral family/member palette token, not a random generated color.
- If a color slot fails contrast for eyes/glasses/facial features, fall back to `InkSoft` for details.
- Avatar assets must work at 32, 48, 64, 96, and 160 px.

## Core UI Icon Specification

Core UI icons should be stable semantic assets routed through the Semantic Icon Layer. They should not carry domain-specific emotion unless intentionally tinted by the consuming surface.

| Semantic name | Asset name | Asset rules | Reuse strategy |
| --- | --- | --- | --- |
| `add` | `ui-add` | Rounded plus, no fullwidth Unicode, optical balance at 16/20/24 px. | Use for create/add across members, tasks, lists, goals, Helpful Moments. |
| `close` | `ui-close` | Rounded cross with generous touch target; avoid sharp “error” feel. | Use for modals, dialogs, panels. Do not reuse as delete. |
| `back` | `ui-back` | Soft left arrow/chevron; works with text labels. | Use for navigation return only. |
| `edit` | `ui-edit` | Friendly pencil/edit mark; not overly technical. | Use for editing existing entities. |
| `save` | `ui-save` | Prefer check/save semantic over floppy-disk nostalgia unless testing proves recognition issue. | Use for committing form changes. |
| `delete` | `ui-delete` | Gentle trash/remove symbol; must not look playful. | Use for destructive actions with label/confirmation. |
| `expand` | `ui-expand` | Rounded down/right chevron or open panel mark. | Use for accordions/details. |
| `collapse` | `ui-collapse` | Complementary up/left chevron or close panel mark. | Use for accordions/details; not modal close. |

Rules:

- Core icons should be single-color or two-layer maximum by default.
- They should support `currentColor` when used as UI controls.
- They should have a 24 x 24 viewBox and optical padding that works at 16 px.
- Separate filled emotional versions are not needed for core controls.

## Size System

| Size name | Pixel target | Usage |
| --- | --- | --- |
| Tiny | 12 px | Inline metadata, dense labels, rare status hints. Avoid detailed assets. |
| Small | 16 px | Standard inline text-adjacent icons and compact buttons. Must use simplified `icon` variants. |
| Medium | 20 px | Section labels, cards, mobile/tablet touch-adjacent UI. Default for many semantic icons. |
| Large | 24 px | Buttons, primary card headers, accessible touch UI. Core icon viewBox target. |
| Feature | 32 px | Compact feature identity in cards, tiles, and section markers. |
| Spot Small | 64 px | Small empty states, child section decoration, compact celebration states. |
| Spot | 96 px | Primary emotional card artwork, Helpful Moments spot art, celebration cards. |
| Illustration | 160 px | Hero areas, onboarding, child workspace emotional moments. |
| Hero | 240 px | Rare large hero/empty-state artwork; only when surface hierarchy supports it. |

Separate SVG variants are needed when:

- The asset must be readable at both 16 px and 96+ px.
- The large version contains internal details that would blur or vanish at small sizes.
- The silhouette changes by emotional state, such as `celebration-ready` versus `celebration-memory`.
- A hero illustration needs additional background, family group context, or soft shadow.

Separate SVG variants are not needed when:

- The same simple core UI icon scales cleanly from 16 to 24 px.
- Only color changes are required.
- The consuming surface can provide background, shadow, or member color externally.

## Color Slot System

HomeOps assets should use named color slots rather than hardcoded per-asset colors. Slot mapping can vary by domain or theme while asset semantics remain stable.

### Standard slots

| Slot | Purpose |
| --- | --- |
| `Primary` | Main recognizable fill for the asset. |
| `Secondary` | Supporting fill or adjacent shape. |
| `Accent` | Deeper accessible detail color for legibility and emphasis. |
| `Highlight` | Small upper-left soft highlight or warm glint. |
| `Shadow` | Soft internal/contact shadow or lower-layer depth. |
| `Background` | Blob, badge, card, or halo area when included in SVG. |
| `InkSoft` | Facial features, tiny strokes, glasses detail, or line details. |
| `Member Color` | Family member personalization accent. |
| `StatePositive` | Completion/success tint when semantically required. |
| `StateWarning` | Gentle caution tint; avoid alarmist use. |
| `StateDanger` | Destructive/error tint for UI only; not family celebration/recognition assets. |
| `NeutralWarm` | Cream/off-white fills, note paper, soft base. |
| `NeutralBorder` | Low-contrast edges when needed. |

### Slot rules

- Most assets should use 2-3 pastel fills plus one deeper accent.
- `Accent` must meet contrast needs for small details where practical.
- `Member Color` should personalize accents, rings, sleeves, pins, or small marks, not overwrite core semantic meaning.
- `Highlight` should be small, rounded, and consistent with upper-left soft lighting.
- `Shadow` should be subtle and local; avoid dramatic drop shadows inside SVGs.
- Status colors should not be baked into recognition or celebration assets unless the asset itself represents that state.

## Asset Creation Order

### Wave 1 — Emotional foundation and Unicode replacement

Create the minimum assets that make the family-facing product feel owned:

1. Helpful Moments five semantic icons and spot variants.
2. Celebration four state icons and spot variants, plus hero for upcoming/ready.
3. Child ownership five semantic icons and selected spot variants.
4. Core `add`, `close`, and `back` controls.

Why: These assets touch the highest-impact emotional surfaces and remove the most fragile direct Unicode/emoji dependency in child, motivation, celebration, and home contexts.

### Wave 2 — Avatar V2 base and progress expansion

Create Avatar V2 base/head/face/hair/shirt/background layers and additional progress/milestone/contribution variants.

Why: Avatars require more production discipline and should be built after the color/size/slot system has been validated by Wave 1.

### Wave 3 — Navigation, empty states, and secondary domains

Create navigation icons, empty-state illustrations, Weekly Reset identity, Lists/Tasks refinements, household planning, and future house/media placeholders only as scoped.

Why: These improve polish and coverage, but they depend on the product-wide semantic language established by Waves 1 and 2.

## First SVG Wave Definition

Wave 1 must create only the following asset set. No extra mascot, badge, reward, navigation set, avatar set, PNG export, or mockup should be added in this wave.

| Asset name | Required variants | Sizes | Color slots | Surfaces |
| --- | --- | --- | --- | --- |
| `helpful-kindness` | `icon`, `spot`, `empty` | 16/20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, optional Member Color | Motivation, Child Workspace, Helpful Moments empty state. |
| `helpful-teamwork` | `icon`, `spot`, `group` | 16/20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, Member Color optional | Motivation, Child Workspace, Family Goal contribution. |
| `helpful-initiative` | `icon`, `spot` | 16/20/24, 96 | Primary, Secondary, Accent, Highlight, Shadow | Helpful Moments feed, child pride recap. |
| `helpful-responsibility` | `icon`, `spot` | 16/20/24, 96 | Primary, Secondary, Accent, Highlight, Shadow | Helpful Moments, Tasks-to-recognition bridge. |
| `helpful-routine` | `icon`, `spot`, `repeat` | 16/20/24, 96 | Primary, Secondary, Accent, Highlight, Shadow | Helpful Moments, Today/This Week, routines. |
| `celebration-upcoming` | `icon`, `spot`, `hero` | 20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, Background | Home, Motivation, Child hero/family goal. |
| `celebration-ready` | `icon`, `spot`, `hero` | 20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, Background | Home, Motivation, Child hero, ReadyToCelebrate. |
| `celebration-celebrated` | `icon`, `spot` | 20/24, 96 | Primary, Secondary, Accent, Highlight, Shadow | Motivation, celebration status/history. |
| `celebration-memory` | `icon`, `spot`, `keepsake` | 20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, NeutralWarm | Motivation history, Child recent memories. |
| `child-my-progress` | `icon`, `spot` | 20/24, 64/96 | Primary, Secondary, Accent, Highlight, Shadow, Member Color | Child hero, individual goals, Motivation personal goals. |
| `child-my-help-mattered` | `icon`, `spot`, `hero` | 20/24, 96, 160 | Primary, Secondary, Accent, Highlight, Shadow, Member Color | Child Workspace, contribution recap, celebration ownership. |
| `child-family-participation` | `icon`, `spot`, `group` | 20/24, 96/160 | Primary, Secondary, Accent, Highlight, Shadow, Member Color optional | Family Goal, Motivation, Celebration Memory. |
| `child-today` | `icon`, `section` | 16/20/24, 64 | Primary, Secondary, Accent, Highlight | Child Today section, task summaries. |
| `child-this-week` | `icon`, `section` | 16/20/24, 64 | Primary, Secondary, Accent, Highlight | Child This Week section, weekly progress. |
| `ui-add` | `icon` | 16/20/24 | currentColor, optional Accent | Add controls across app. |
| `ui-close` | `icon` | 16/20/24 | currentColor, optional Accent | Dialog/panel close controls. |
| `ui-back` | `icon` | 16/20/24 | currentColor, optional Accent | Navigation back controls. |

## UX Impact Analysis

| Rank | Surface | Wave impact | Why |
| --- | --- | --- | --- |
| 1 | Child Workspace | Wave 1 highest, Wave 2 high | Child assets, Helpful Moments, Celebration, and Avatar V2 all directly improve the child’s sense of identity, progress, and belonging. |
| 2 | Motivation | Wave 1 highest | Motivation holds the clearest Goal → Progress → Celebration → Memory story and benefits from every emotional asset family. |
| 3 | Celebration | Wave 1 highest | Celebration state assets make anticipation, readiness, completion, and memory emotionally distinct. |
| 4 | Helpful Moments | Wave 1 highest | Recognition becomes more than text and card styling; the five categories gain consistent semantics. |
| 5 | Home | Wave 1 medium-high | Home gains clearer celebration and motivation summary language without overloading the operational dashboard. |
| 6 | Weekly Reset | Wave 3 medium | Weekly Reset needs identity eventually, but it should inherit the mature progress/participation vocabulary after Wave 1. |
| 7 | Tasks | Wave 1 low-medium, Wave 3 medium | Tasks benefit indirectly through Today, responsibility, routine, and progress assets; deeper task-specific icons can wait. |
| 8 | Lists | Wave 3 low-medium | Lists need polish and empty states, but current emotional gaps are elsewhere. |

## Next Prompt Context

HomeOps now has a formal Asset Specification Pack. The next prompt should request one narrow implementation slice only if asset creation is intended. Recommended next slice:

- Create Wave 1 SVG assets only.
- Do not alter domain behavior, database schema, migrations, generated clients, or product features.
- Route assets through the existing Semantic Icon Layer rather than embedding SVGs directly in feature components.
- Preserve the semantic names and variants defined in this pack.
- Keep artwork soft, rounded, pastel, layered-flat, and child-safe.
- Do not introduce reward-economy symbols such as coins, gems, shops, leaderboards, rankings, trophies, or streak flames.
- Validate that existing tests still pass if implementation changes are made in a later slice.

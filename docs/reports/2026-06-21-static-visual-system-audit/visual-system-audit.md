# Static Visual System Audit

## Executive Summary

Static code analysis shows that HomeOps mostly follows the agreed visual direction at the product-shell level, but compliance is uneven below that shell.

The strongest alignment is the centralized domain color map and workspace shell: each workspace receives a domain class, navigation buttons use the same family, and the shared panel uses subtle domain-tinted gradients while cards remain white or near-white. This matches the documented family-friendly, pastel, card-based direction.

The main gaps are implementation consistency and asset readiness:

- Domain colors exist, but many feature-level components still hardcode amber/orange, slate, violet, or status colors instead of consuming domain tokens.
- Weekly Reset is mapped to `domain-home`, so it has no distinct page identity despite being a top-level workspace.
- Cards share a broad rounded, soft-shadow language, but there are multiple component-specific card systems rather than one reusable card contract.
- Iconography still relies on Unicode arrows, stars, checkmarks, plus signs, hearts, sparkles, and celebration emoji.
- Avatar visuals are code-drawn CSS shapes and are the most asset-ready area; celebrations, Helpful Moments, and memory surfaces are still tightly coupled to Unicode glyphs and CSS styling.

Verdict: **mostly directionally compliant, not yet design-system mature**. The implementation matches the agreed visual language in intent and broad page treatment, but token usage, card composition, and iconography need consolidation before a HomeOps SVG asset library can be introduced cleanly.

## Domain Color Compliance

### Inventory

The implementation defines workspace-to-domain class mapping in `domainColors.ts`:

- Home: `domain-home`
- Agenda: `domain-agenda`
- Lists: `domain-lists`
- Tasks: `domain-tasks`
- Motivation: `domain-motivation`
- House Status: `domain-house`
- Media: `domain-media`
- Gamification: `domain-gamification`
- Weekly Reset: `domain-home`
- Settings: `domain-settings`

CSS domain families define the common token shape:

- `--domain-accent`
- `--domain-accent-strong`
- `--domain-tint`
- `--domain-tint-2`
- `--domain-border`

The workspace shell applies the active domain class to the page container and applies every workspace's domain class to its navigation button. The shared `.workspace-panel` uses `--domain-tint`, white, and `--domain-tint-2`; active navigation uses `--domain-accent`; hover and focus use `--domain-accent` in a soft ring.

### Page-by-page compliance

| Surface | Compliance | Findings |
| --- | --- | --- |
| Home | Mostly compliant | Uses `domain-home`; shell, panel, hero, shared cards, and navigation align with warm pastel home identity. Home-specific internals still hardcode amber/violet/teal accents for summary cards. |
| Tasks | Mostly compliant | Uses `domain-tasks`; task page has tokenized borders, shadows, headings, form backgrounds, focus states, and buttons. Earlier hardcoded slate styles remain above token overrides, creating cleanup debt. |
| Lists | Partial | Lists workspace receives `domain-lists`, but the list page is rendered through `ShoppingListWidget`, which largely uses older generic widget/list styling rather than a richer lists-domain visual system. Home list summary uses hardcoded amber border accents. |
| Motivation | Mostly compliant | Uses `domain-motivation` and has an orange/amber encouragement palette matching the family motivation direction. However, many motivation and celebration colors are hardcoded rather than token-derived. |
| Child Workspace | Partial | Child pages are accessed through Family Member pages, and the active domain class is forced to `domain-home`. Member color CSS variables drive child visuals; that supports personalization, but child surfaces do not have a dedicated child/domain token family. |
| Weekly Reset | Weak | Weekly Reset is a top-level workspace but maps to `domain-home`. Its CSS uses generic slate borders and white cards, not home-domain or reset-specific tokens. This is the most obvious domain identity gap. |

### Violations and inconsistencies

- **Weekly Reset has no independent domain identity.** It is top-level navigation but borrows `domain-home`, then its own cards use generic slate hardcoded colors.
- **Motivation and child experience visuals use many hardcoded amber/orange colors.** The result is visually aligned today but brittle if the domain color system changes.
- **Home summary cards mix domain accents manually.** Agenda, Lists, and Tasks accents inside Home are hardcoded, not derived from domain classes or reusable cross-domain summary tokens.
- **The token system is CSS-only.** There is no TypeScript-accessible token inventory beyond class names, so inline styles and component-level dynamic colors bypass the system easily.

## Hardcoded Color Audit

### Uses token system

Good token usage appears in:

- Workspace panel background and border.
- Workspace navigation default, hover, focus, and active states.
- Shared white/near-white card override for `.widget-card`, `.home-summary-card`, `.family-member-detail-card`, `.tasks-page`, and `.domain-placeholder-page`.
- Tasks page overrides for heading color, form background, focus ring, buttons, and row borders.
- Motivation page top-level domain token definition and some card border/shadow usage.
- Member/avatar visuals through `--member-color`, `--avatar-bg`, `--avatar-skin`, `--avatar-hair`, and `--avatar-shirt`.

### Uses hardcoded color

Hardcoded colors are concentrated in `src/HomeOps.Client/src/styles.css` and appear in several categories:

1. **Base neutrals and legacy shell colors**
   - `#172033`, `#f5f7fb`, `#d7ddea`, `#5c667a`, `#1f2a44`, `#fbfcff`, `#ffffff`.
   - Some are reasonable base tokens, but they are not named as tokens.

2. **Legacy violet interaction colors**
   - `#4f46e5`, `#312e81`, `#7c3aed`, `#f5f3ff`.
   - These predate or sit beside domain tokens and can make non-agenda surfaces inherit violet actions.

3. **Home and summary accents**
   - Home hero and cards hardcode `#fff7ed`, `#ecfeff`, `#fdf2f8`, `#ead7c7`, `#fffdf8`, `#eadfd1`, `#7c3aed`, `#f59e0b`, and `#14b8a6`.
   - These reinforce the current look but bypass the domain color system.

4. **Task legacy slate colors**
   - Tasks still define `rgba(255, 255, 255, 0.82)`, `rgba(148, 163, 184, ...)`, `#0f172a`, `#64748b`, `#475569`, `#f8fafc`, and `#e2e8f0` before later domain-token overrides.
   - This is likely technical debt from pre-domain Tasks styling.

5. **Motivation/celebration amber-orange palette**
   - Extensive use of `#fff7ed`, `#fed7aa`, `#9a3412`, `#7c2d12`, `#ffedd5`, `#fb923c`, `#facc15`, `#fef3c7`, `#fdba74`, and related rgba colors.
   - Directionally correct, but not tokenized enough.

6. **Status colors**
   - Error/success/warning colors such as `#b91c1c`, `#991b1b`, `#065f46`, `#ecfdf5`, `#fef2f2`, `#fffbeb`, `#92400e` appear directly.
   - These should become semantic tokens if used across the app.

7. **Inline/component colors**
   - Family member add defaults hardcode `#c7d2fe`, `#f1c27d`, `#111827`, and `#60a5fa` in `WorkspaceShell.tsx`.
   - Agenda source markers use event source hex values through inline `backgroundColor`. These are data-source indicators, not page identity tokens, and are acceptable if intentionally kept separate.
   - Helpful Moments passes member display colors through inline CSS variables, which is appropriate for family-member personalization.

### Likely technical debt

Highest-risk hardcoded color debt:

1. Duplicated Helpful Moments CSS block appears twice with the same hardcoded palette.
2. Weekly Reset uses hardcoded generic slate styling instead of domain tokens.
3. Motivation/celebration hardcoded amber palette should become semantic motivation/celebration tokens.
4. Home cross-domain summary accents should use domain references rather than direct hex values.
5. Legacy violet action colors remain in shared components where domain-aware action styling would be safer.

## Card System Audit

### Current card languages

The implementation has a shared general direction: rounded rectangles, white/near-white backgrounds, soft borders, gentle shadows, and touch-friendly padding. This is consistent with the intended HomeOps feel.

However, there is not one card system. There are several local card families:

- `.widget-card` for generic widget hosting.
- `.home-summary-card` for Home summary areas.
- `.family-member-detail-card` for member detail and parent administration content.
- `.tasks-page`, `.task-create-form`, and `.task-item` for task-specific surfaces.
- `.motivation-header`, `.family-goal-card`, `.individual-goal-card`, `.family-goal-form` for Motivation.
- `.child-progress-card`, `.child-goal-card`, `.child-hero-area`, `.family-celebration-card`, and `.child-memory-card` for child experience.
- `.helpful-moment-card` and `.helpful-moments-section` for recognition notes.
- `.celebration-surface`, `.home-celebration-surface`, `.celebration-memory-card`, and `.celebration-memory-section` for celebration/memory.
- `.weekly-reset-hero`, `.reset-card`, and `.reset-row` for Weekly Reset.
- `.empty-state-card` for empty states.

### Compliance

The visual language is coherent enough for the current product: soft, family-friendly, pastel, card-based, and mostly touch-friendly.

The maintainability issue is that card styling is feature-owned rather than system-owned. Border radii range from `0.875rem` to `2rem`; shadows vary widely; some cards use domain borders, some use member color, and others use raw rgba values. This creates drift risk as more domains are added.

### Diverging pages

- **Weekly Reset** diverges most: compact, generic slate cards with minimal visual connection to the rest of the family-friendly domain language.
- **Lists** is still widget-oriented and less domain-expressive than Tasks or Motivation.
- **Child Workspace** intentionally diverges with larger hero treatment and member-color personalization; this is acceptable, but it should still rest on shared card primitives.
- **Helpful Moments** has a repeated CSS block and a distinct note-card language that could become a shared recognition-card primitive.

## Iconography Audit

### Inventory

Current iconography sources:

- Unicode arrows: `→` in Motivation story labels.
- Unicode stars/checkmarks: `★`, `✓` for goal progress and child task completion.
- Emoji celebration and warmth glyphs: `🎉`, `✨`, `💛`.
- Fullwidth plus: `＋` for adding family members.
- Multiplication sign: `×` for modal close buttons.
- CSS-drawn avatar parts: spans for face, hair, eyes, glasses, smile, shirt.
- Data-source color dots: inline colored circles in Agenda.
- Existing SVG asset: only `public/favicon.svg` was found as a static asset.

### Unicode/emoji reliance by area

- **Motivation:** arrows, star/check progress, celebration emoji, heart/memory glyph.
- **Home:** celebration emoji and plus sign.
- **Child Workspace / Family Member page:** celebration emoji, sparkle emoji, heart glyph, checkmarks.
- **Avatar editor/member management:** close `×`.
- **Agenda:** no icon library; uses color dots for source identity.

### Icon libraries and SVG assets

No external icon library usage was found in the inspected frontend source. No reusable SVG asset library exists yet. This reduces dependency risk but means the future HomeOps visual language migration will require adding an icon/asset abstraction rather than swapping a library implementation.

## Asset Library Readiness

### Ready areas

- **Avatars:** strongest readiness. Family avatars are encapsulated in `FamilyAvatar.tsx` with member data passed through CSS variables. This component can later render SVG/avatar assets behind the same component boundary.
- **Family member colors:** member display colors already flow through CSS variables, which can continue to power asset tinting.
- **Agenda source markers:** source colors are data-driven and isolated as small marker spans.

### Partially ready areas

- **Celebration surfaces:** visual presentation is centralized in named components/classes, but the celebration icon is a hardcoded emoji inside the component. Replacing it is straightforward if a `CelebrationIcon` or asset slot is introduced.
- **Helpful Moments:** cards use member initials and hardcoded note styling. They are structurally ready for a note/avatar/asset treatment, but the current visual grammar is CSS-only.
- **Child Hero Area:** structure is strong and visual responsibilities are reasonably separated, but hero celebration/memory glyphs are Unicode.

### Not ready areas

- There is no shared asset registry, icon component, SVG loading convention, or visual asset naming scheme.
- Unicode glyphs are embedded directly in page/component markup, so replacement requires touching multiple feature components.
- Celebration, Helpful Moment, memory, and progress visuals do not have semantic asset slots yet.

## Child Experience Visual Audit

The child experience is one of the better-structured visual areas for future enhancement.

Strengths:

- Child Mode has a dedicated hero-first structure with avatar, age context, current goal, progress, family goal context, and celebration visibility.
- Age-aware branches distinguish early-child and school-age treatment.
- Member colors flow through CSS variables, enabling personalized but controlled visuals.
- Helpful Moments are embedded as recognition cards rather than management records.
- Parent administration is visually separated from Child Mode.

Risks:

- Child experience visuals are split across `FamilyMemberPage.tsx`, `FamilyAvatar.tsx`, `HelpfulMoments.tsx`, and a large shared stylesheet. This makes stronger visual treatment possible but not cleanly modular.
- Celebration and memory glyphs are direct Unicode/emoji, not replaceable asset slots.
- Warm amber/orange child visuals are hardcoded rather than expressed as child/motivation/celebration tokens.
- The active shell domain remains `domain-home` for family member pages. That is acceptable for now, but future child surfaces may need an explicit family/child visual identity.

Verdict: **good structural readiness, moderate styling debt**.

## Visual Consistency Audit

### Shared cohesion

Home, Tasks, Lists, Motivation, Child Workspace, and Weekly Reset mostly share these product traits:

- Rounded cards.
- White/near-white content surfaces.
- Pastel page/panel backgrounds.
- Soft shadows.
- Large touch targets.
- Friendly labels and warm copy.
- Low-saturation backgrounds with stronger accents reserved for controls, borders, and compact markers.

### Inconsistencies

- **Domain identity strength varies.** Tasks and Motivation are much more domain-colored than Lists and Weekly Reset.
- **Cards are similar but not standardized.** The app feels cohesive in broad strokes, but implementation details are feature-specific.
- **Iconography is inconsistent.** Some areas use text-only, some use Unicode symbols, and avatars are CSS-drawn.
- **Home uses cross-domain colors manually.** It references agenda/list/task accents with hardcoded borders rather than a shared domain-summary mechanism.
- **Weekly Reset feels like a functional admin page.** It currently has less family-friendly visual identity than the rest of the system.

## Design System Risks

### Critical

No critical visual-system risks were found. The current implementation does not contradict the agreed family-friendly, pastel, card-based direction at the product level.

### Major

1. **Hardcoded palette sprawl.** Color decisions are scattered through the stylesheet, making the domain system easy to bypass.
2. **No semantic asset/icon abstraction.** Unicode symbols are embedded directly, so future SVG migration will be a multi-component cleanup.
3. **Multiple card systems.** Feature-specific cards can continue to drift without shared card primitives or CSS variables.
4. **Weekly Reset domain mismatch.** A top-level workspace has no distinct visual identity and does not fully use the domain system.
5. **Duplicated Helpful Moments CSS.** Duplicate styling increases the chance of inconsistent future edits.

### Minor

1. Legacy violet shared action colors remain in places where domain-aware actions would be better.
2. Status colors are hardcoded rather than semantic.
3. Avatar color defaults are hardcoded in component code.
4. Lists still reads as widget-era styling rather than a mature domain page.
5. The design system does not expose named spacing/radius/shadow tokens.

## HomeOps Asset Roadmap Readiness

### Migration difficulty

Overall difficulty: **moderate**.

The transition to HomeOps SVG assets is feasible because the app does not depend on an external icon library and many visuals are already isolated into recognizable components. The difficult part is that the current implementation lacks a semantic icon/asset layer, so the first migration step must introduce one.

### By asset category

- **HomeOps SVG icons:** moderate. Need a shared `Icon`/`HomeOpsAsset` component and replacement of Unicode glyphs across Motivation, Home, Child Workspace, and dialogs.
- **Celebration assets:** easy to moderate. Celebration surfaces are named and concentrated, but emoji are inline.
- **Helpful Moment assets:** moderate. Recognition cards are centralized but use member initials and hardcoded styling; future assets need a semantic slot such as appreciation note, kindness, teamwork, initiative, routine, or responsibility.
- **Family identity assets:** moderate. Family avatars are componentized and can evolve, but no asset library or avatar SVG pack exists.
- **Avatar evolution:** easiest. `FamilyAvatar` is a clean component boundary with data-driven colors and traits.

## Recommended First UX Cleanup Slice

**Highest-value single cleanup: introduce semantic visual tokens and asset slots for encouragement/celebration glyphs, starting with replacing direct Unicode/emoji usage behind a small shared icon/asset component.**

Scope should remain small:

- Add a frontend-only `HomeOpsIcon` or `VisualSymbol` component with semantic names such as `celebration`, `memory`, `progressStep`, `completedStep`, `storyArrow`, `add`, and `close`.
- Keep rendering the same Unicode symbols initially to avoid redesign.
- Replace direct glyph usage in Motivation, Home celebration, Child Workspace/Family Member page, and dialogs with the shared component.
- Do not introduce a full asset library yet.
- Do not change behavior, layout, or copy.

Why this slice first:

- It directly supports the future SVG migration without requiring visual redesign.
- It reduces scattered iconography debt.
- It creates a stable seam for HomeOps-owned assets.
- It is lower risk than refactoring all color tokens or all cards at once.

## Next Prompt Context

Perform one small visual-system cleanup slice only. Do not redesign pages. Introduce a semantic frontend visual-symbol/icon component that initially preserves existing glyph output, then replace direct Unicode/emoji usage in the most central family/motivation surfaces. Keep behavior unchanged, do not create migrations, and do not run the application unless explicitly requested.

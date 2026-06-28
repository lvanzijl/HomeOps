# FamilyBoard Asset Library Architecture

## Summary

FamilyBoard should build a complete **FamilyBoard Asset Library**, not only a narrow icon library. The product is now visually mature enough that scattered icon replacement will not solve the larger consistency problem: FamilyBoard needs one durable visual language for icons, status marks, domain symbols, empty states, small illustrations, celebrations, rewards, and future Home integrations.

Explicit answers:

- **Should FamilyBoard build an Asset Library instead of only an icon library?** Yes. Icons are the first deliverable, but the long-term system should include semantic iconography, spot illustrations, empty states, celebration/reward assets, status graphics, decorative primitives, and future Home integration symbols.
- **Should Avatar V2 remain separate?** Yes. Avatar V2 is already a successful identity system and should remain Family Member-owned, SVG-only, deterministic, and separate from the generic FamilyBoard Asset Library. It may share high-level design values, but not registry ownership or implementation primitives unless a future deliberate bridge is approved.
- **Which assets belong in Phase 1?** Core semantic icons only: Agenda event-type icons, shell/domain/navigation icons, utility actions, Shopping bag/store icons, task/status/check icons, and Weekly Reset readiness icons.
- **Which illustrations should exist?** Small supporting illustrations should exist for empty Home onboarding, Agenda empty day/week/list, Tasks empty/complete states, Shopping empty/ready states, Motivation celebration/reward moments, Weekly Reset completion, Settings backup/restore reassurance, and future Home integration onboarding/empty states. Hero illustrations should be rare.
- **Which pages should never receive hero artwork?** Settings, Agenda's operational Month/Week/List surfaces, Tasks' default operational workspace, and Family Member detail pages should never receive persistent hero artwork because they are utility/work surfaces where large art competes with the task.
- **How should future Home features fit into the system?** Energy, solar, battery, EV charging, appliances, heating, and sensors should become domain-specific asset families inside the same semantic visual language, with simple status variants and no separate integration-specific art style.
- **Were any binary artifacts created?** No. This analysis created one Markdown report only.

## Preflight

Read before analysis:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- Latest SVG Asset Audit: `docs/reports/2026-06-28-familyboard-svg-asset-audit/familyboard-svg-asset-audit.md`
- Latest Preview Video report: `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`
- Latest Wide Viewport report: `docs/reports/2026-06-28-familyboard-wide-viewport-layout/familyboard-wide-viewport-layout.md`
- Latest Family Member Compact Layout report: `docs/reports/2026-06-28-family-member-compact-layout/family-member-compact-layout.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Existing visual systems

### Avatar V2

- **Current role:** Family Member identity, personalization, and avatar editing.
- **Assessment:** Successful. It is owned, deterministic, SVG-only, warm, and already product-specific.
- **Recommendation:** Keep separate. Avatar V2 should not be merged into generic icons or illustrations. It can follow the same emotional tone, color restraint, and accessibility principles, but it should remain its own renderer/configuration system.

### HomeOpsIcon

- **Current role:** The closest thing to a semantic visual layer. It imports current SVG assets and exposes named variants such as add, back, close, celebration, child ownership, helpful moments, progress, routine, sparkle, teamwork, and open/completed fallbacks.
- **Assessment:** Useful prototype of the future registry, but still limited and partly URL/image based. Several names still rely on raw fallback symbols.
- **Recommendation:** Evolve into or replace with a proper `FamilyBoardIcon` semantic registry backed by inline React SVG components. Keep the semantic naming idea; remove product reliance on text-symbol fallbacks over time.

### Existing SVG asset folders

- **Current role:** Owned assets under `src/HomeOps.Client/src/assets/homeops/`, including celebration, child ownership, core UI, and helpful moments.
- **Assessment:** Good proof that owned assets work, but folder organization reflects current slices rather than a stable design-system taxonomy.
- **Recommendation:** Migrate conceptually toward a library organized by asset type and semantic domain, not by one-off feature slice. Existing SVGs should be reviewed for fit before being adopted into the long-term library.

### Inline SVG

- **Current role:** Avatar V2 rendering and some specialized visual output.
- **Assessment:** Correct for deterministic generated avatars and ideal for future icons when implemented as React components.
- **Recommendation:** Use inline React SVG components for icons and reusable vector assets. Avoid opaque `<img>` for core UI semantics where styling, `currentColor`, and accessibility are needed.

### CSS decorative elements

- **Current role:** Card accents, soft backgrounds, rings, progress bars, swatches, dialog overlays, and layout decoration.
- **Assessment:** Appropriate when decorative and non-semantic.
- **Recommendation:** Keep. CSS decoration should not be forced into the asset library unless the shape becomes reusable, meaningful, or branded enough to require governance.

### Emoji and browser glyphs

- **Current role:** Agenda event types, settings gear, open arrows, checks, ellipses, close marks, shopping placeholder symbol, and latent icon fallbacks.
- **Assessment:** Main visual-language debt. Rendering varies by platform and clashes with the FamilyBoard style.
- **Recommendation:** Replace in Phase 1 for high-impact surfaces and prohibit new user-facing emoji/browser glyphs as product iconography.

### Browser-native controls and text punctuation

- **Current role:** Inputs, separators, ellipses in loading text, punctuation, and normal copy.
- **Assessment:** Not all symbols are iconography debt. Text punctuation and loading ellipses are acceptable when they are copy, not visual identity.
- **Recommendation:** Do not over-correct punctuation. Focus on symbols used as icons, status marks, or decorative product visuals.

## Asset categories

A complete FamilyBoard Asset Library should eventually include:

### Core shell and navigation

- Home
- Agenda
- Tasks
- Shopping
- Motivation
- Weekly Reset
- Family Members
- Settings
- Future Home/integrations
- Back/open/close/navigation affordances

### UI utility icons

- Add
- Edit
- Delete
- Save
- Cancel/close
- Open panel
- Expand/collapse
- More/options
- Search/filter/sort when introduced
- Import/export/restore/download/upload
- Warning/info/success/error

### Status and feedback

- Ready
- Pending
- Completed
- Skipped
- Needs review
- Empty
- Offline/unavailable when integrations arrive
- Sync/import/export success/failure if needed
- Gentle attention markers, avoiding alarmist visuals

### Agenda

- Birthday
- Holiday/vacation
- School
- Sport
- Health
- Shopping/errand
- Home
- Work
- Media/activity
- Generic event
- Calendar source/status indicators when integrations arrive

### Tasks

- Task
- Routine/recurring
- Today
- Tomorrow
- This week
- Later/Someday
- Shared household
- Assigned person marker
- Done/reopen
- Review/archive when visually needed

### Shopping

- Shopping bag
- Grocery list
- Store/storefront
- Basket/cart in FamilyBoard style
- Pantry/household supplies if introduced
- Recently added
- Checked item
- Other lists

### Motivation and emotional assets

- Family goal
- Personal goal
- Appreciation/helpful moment
- Encouragement
- Progress
- Celebration
- Memory
- Teamwork
- Reward preview
- Gentle sparkle/confetti motifs

### Weekly Reset

- Reset loop
- Review
- Ready for next week
- Needs attention
- Recap/closure
- Family check-in
- Planning rhythm

### Family

- Household
- Adult/parent
- Child
- Shared family
- Member management
- Avatar editor entry point
- Identity-adjacent support icons that do not duplicate Avatar V2

### Empty states and onboarding

- First household setup
- No Agenda events
- No Tasks due
- Shopping list empty/ready
- No Motivation goal yet
- Weekly Reset complete
- Settings backup/restore reassurance
- Future integration not connected

### Rewards and celebrations

- Family celebration
- Small success mark
- Reward unlocked
- Streak/ritual completion if introduced
- Confetti/sparkle decorations
- Badges only if future roadmap explicitly introduces them

### Decorative primitives

- Soft blobs
- Rounded tiles
- Rays/sparkles
- Mini confetti
- Card corner marks
- Progress accents
- Background motifs

### Home integrations

- Energy
- Solar panels
- Battery
- EV charging
- Washing machine
- Dishwasher
- Heating
- Temperature
- Humidity
- Motion/contact sensors
- Water/leak sensors
- Air quality
- Device unavailable/offline
- Automation/routine

## Library architecture

Recommended conceptual structure:

```text
FamilyBoardAssets
  icons/
    core-ui/
    navigation/
    domains/
    status/
    agenda/
    tasks/
    shopping/
    motivation/
    weekly-reset/
    settings/
    home-integrations/
  illustrations/
    spot/
    empty-states/
    onboarding/
    celebration/
    home-integrations/
  decorations/
    motifs/
    confetti/
    card-accents/
  registry/
    iconRegistry
    illustrationRegistry
    assetMetadata
  guidelines/
    naming
    accessibility
    visual-language
AvatarV2
  renderer/configuration remains separate
```

This is an architecture recommendation, not a folder-creation instruction.

### Maintainability principles

- Assets should be registered semantically, not imported ad hoc from page components.
- Domain pages should ask for `agenda.school`, `status.ready`, or `shopping.bag`, not a raw file path.
- Every asset should have metadata: category, intended sizes, decorative vs meaningful usage, allowed color behavior, and status of production readiness.
- The library should have a small public API and private internal drawing primitives.
- Pages should not invent one-off icon styles.
- The library should distinguish icons, illustrations, and decorations. A spot illustration should not be reused as a dense 16px icon.
- Avatar V2 should be documented next to the library as a sibling visual system, not nested inside the generic registry.

## Technical architecture

### React SVG components

Use React SVG components for production icons and reusable vector assets. Each icon should be a tree-shakable component that can render at standard sizes without raster dependencies.

Recommended component contract:

- `size`: token or number, defaulting to `20` or `24` depending on icon family.
- `title`: optional accessible title when the icon conveys meaning without adjacent text.
- `decorative`: default true when the label is already present in text.
- `className`: styling hook.
- `strokeWidth`: rarely exposed; prefer fixed family tokens.

### Semantic registry

Create a semantic registry rather than page-local imports. The registry should map stable product meanings to components:

- `core.add`
- `core.close`
- `navigation.settings`
- `agenda.school`
- `tasks.tomorrow`
- `status.ready`
- `shopping.store`
- `integration.evCharging`

The registry is the contract. Underlying SVG drawing can improve without changing page code.

### `currentColor` and CSS variables

- Monoline or mostly stroked icons should use `currentColor` by default.
- Soft fills may use CSS variables such as `--asset-fill-soft`, `--asset-accent`, or domain tokens.
- Icons should inherit domain colors safely but remain readable on pastel backgrounds.
- Do not hard-code page-specific colors inside icons except for approved multi-tone illustrations.

### Sizing

Recommended sizes:

- 16px: dense metadata/status only.
- 20px: compact buttons and inline labels.
- 24px: navigation and primary actions.
- 32px: cards and empty-state icons.
- 48-64px: spot illustration marks.
- 96-160px: rare empty-state or onboarding illustrations.

### Accessibility

- Decorative icons: `aria-hidden="true"`.
- Meaningful icon-only buttons: explicit `aria-label` on the button, not only the SVG.
- Meaningful standalone SVGs: accessible title/description.
- Do not encode status only by color; pair with text, shape, or accessible label.
- Avoid motion that cannot respect reduced-motion preferences.

### Theming

- Assets should work on white, warm off-white, and pastel domain backgrounds.
- Light theme is the current priority; do not over-engineer dark mode unless a future roadmap slice requires it.
- Color should be token-driven so future theme changes do not require rewriting SVG paths.

### Tree shaking and bundling

- Export components individually and avoid importing the full library for one icon.
- Keep registry mappings static and lightweight.
- Avoid third-party icon packages unless deliberately adopted as drawing references, which is not recommended for this owned visual language.

### Naming

Use semantic names, not physical drawing names:

- Prefer `agenda.health` over `stethoscope`.
- Prefer `shopping.ready` over `bagWithCheck`.
- Prefer `status.needsReview` over `orangeExclamation`.
- Use aliases only when multiple domains share a drawing intentionally.

### Asset validation

Future implementation slices should validate:

- No emoji/browser glyphs in user-facing icon slots.
- Icons remain readable at 16px, 20px, and 24px.
- Meaningful icons have labels or adjacent text.
- No binary assets were added.
- Bundle impact remains small.

## Visual language guidelines

FamilyBoard should feel warm, calm, legible, and recognizable. It should not look like a corporate admin dashboard, a generic emoji board, or a toy/game interface.

### Icon style

- Rounded stroke endings and joins.
- Consistent stroke width, likely 1.75-2px on a 24px viewBox.
- Soft geometric forms with slightly rounded corners.
- Simple silhouettes that remain legible at small sizes.
- Minimal internal detail.
- Optional small filled accent shapes for warmth, but not full-color emoji rendering.
- Avoid sharp technical symbols unless softened.

### Illustration style

- Simple vector spot illustrations.
- Rounded, friendly forms.
- Pastel fills with restrained contrast.
- One clear idea per illustration.
- No photorealism, gradients-heavy art, or complex scenes.
- No binary raster files.

### Fill and color

- Icons: primarily `currentColor`, with optional soft fill accents.
- Illustrations: 2-4 tokenized colors maximum.
- Domain compatibility: assets should sit naturally on Home, Agenda lavender, Tasks teal, Shopping amber, Motivation rose, Weekly Reset green/blue, and Settings neutral surfaces.
- Status color must supplement text, not replace it.

### Friendliness and child friendliness

- Friendly does not mean childish. Use soft shapes, approachable metaphors, and warmth without making operational pages feel like a game.
- Child-facing or family-member surfaces can be slightly more playful, but still controlled.
- Rewards and celebrations can be more expressive than navigation icons, but must remain in-family.

### Animation philosophy

- Default: static.
- Use animation only for meaningful feedback: completion, save success, Weekly Reset closure, gentle celebration.
- Keep motion short, subtle, and reduced-motion aware.
- Avoid looping decorative animation on operational pages.

## Illustration strategy

Large artwork must earn its space. FamilyBoard is a household operations product, so default workspaces should prioritize content, not decoration.

| Page | Recommended illustration level | Rationale |
| --- | --- | --- |
| Home | Small supporting illustration only in onboarding/empty household states. No persistent hero artwork. | Home is the dashboard; family status and summaries are the hero. Persistent art would compete with operational clarity. |
| Agenda | Small empty-state and source/setup illustrations only. Never persistent hero artwork on Month/Week/List. | Agenda needs dense planning readability. Event icons and empty-day graphics are enough. |
| Tasks | Small empty/complete-state illustrations. Never persistent hero artwork on the default task workspace. | Tasks is action-heavy; large art would slow scanning and make chores feel less direct. |
| Shopping | Small supporting illustration in empty/ready list states and maybe compact shopping header mark. Avoid large hero artwork by default. | Shopping benefits from warmth but still needs fast list entry and store scanning. |
| Motivation | Small supporting illustration in dashboard cards; hero-like celebration only for explicit celebration moments. | Motivation is the most emotional surface, but large art should be tied to achievement, not always-on decoration. |
| Family Member | No generic hero illustration. Avatar V2 is the identity artwork. Small support icons only. | Family Member pages should not compete with the member's avatar. Avatar V2 remains primary. |
| Weekly Reset | Small-to-medium closure illustration only after completion; no large hero before work is done. | Ritual closure can be memorable, but pre-work art would increase vertical weight. |
| Settings | No hero artwork. Small reassurance illustrations for backup/restore/import empty states are acceptable. | Settings is administrative and should stay calm, readable, and trustworthy. |

Illustrations that should exist eventually:

- Empty household / first setup board.
- Quiet Agenda day/week.
- Tasks all done.
- Shopping ready/empty bag.
- Family goal celebration.
- Appreciation/helpful moment.
- Weekly Reset complete.
- Backup/export saved.
- Integration not connected yet.
- Device unavailable/offline, when Home integrations ship.

Pages that should never receive persistent hero artwork:

- Settings.
- Agenda Month/Week/List operational views.
- Tasks default workspace.
- Family Member detail pages.
- Dense future Home integration dashboards where status/data must lead.

## Asset roadmap

### Phase 1 — Core semantic icons

Goal: eliminate the most visible platform-dependent iconography and establish the technical pattern.

Recommended scope:

- Agenda event type icons: birthday, holiday, school, sport, health, shopping, home, work, media, generic.
- Shell/navigation/domain icons: Home, Agenda, Tasks, Shopping, Motivation, Weekly Reset, Family, Settings.
- Utility icons: add, back, close, open panel, edit, delete, save, more/options.
- Status icons: ready, pending, completed, needs review, warning/info.
- Shopping icons: bag, store, list.
- Tasks icons: task, recurring/routine, tomorrow, done.
- Weekly Reset icons: reset loop, ready, pending.

Non-goals:

- No broad illustration pass.
- No reward economy.
- No Avatar V2 changes.
- No binary assets.
- No future Home integration implementation.

### Phase 2 — Empty states and spot illustrations

Goal: make quiet states and onboarding feel intentionally FamilyBoard without consuming workspace space.

Recommended scope:

- Home first-setup empty state.
- Agenda quiet day/week/list empty states.
- Tasks all-done and no-due-task states.
- Shopping empty/ready state.
- Motivation no-goal and appreciation empty states.
- Settings backup/restore reassurance.
- Integration-not-connected placeholder pattern.

### Phase 3 — Celebration and reward assets

Goal: create emotional assets for moments that deserve delight.

Recommended scope:

- Family goal complete.
- Personal goal progress milestone.
- Helpful moment/appreciation.
- Weekly Reset complete.
- Small confetti/sparkle motifs.
- Reward preview assets only if the product roadmap explicitly adds rewards.

### Phase 4 — Home integration domain assets

Goal: expand the visual language into household systems without fragmenting style.

Recommended scope:

- Energy, solar, battery, EV charging.
- Washing machine, dishwasher, heating.
- Temperature, humidity, motion/contact, leak/water, air quality.
- Online/offline, normal/attention, active/idle status variants.
- Integration setup and disconnected empty-state spot illustrations.

### Phase 5 — Governance and tooling hardening

Goal: prevent icon sprawl after the library grows.

Recommended scope:

- Asset contribution checklist.
- Visual QA sheet/contact sheet generated from SVG components.
- Lint or test for raw emoji/browser glyphs in icon slots.
- Accessibility snapshot tests for icon-only controls.
- Documentation of allowed sizes, colors, and semantic names.

## Growth strategy for Home integrations

Future Home features should fit the same system through a **Home Integrations** asset family, not through vendor-like or device-specific artwork.

Recommendations:

- Use shared device/status grammar: device outline + small status badge/energy motion indicator.
- Keep all devices in the same rounded stroke family.
- Do not mimic manufacturer icons.
- Use semantic names: `integration.solar`, `integration.battery`, `integration.evCharging`, `integration.washingMachine`, `integration.dishwasher`, `integration.heating`, `integration.sensor.motion`, `integration.sensor.leak`.
- Define status overlays: normal, active, paused, attention, offline, unavailable.
- Use data first. Icons should support readings, not replace them.
- Avoid creating a separate technical icon style for Home features; a solar panel and a birthday cake should feel drawn by the same FamilyBoard hand, even if their domains differ.

## Risks

- **Icon sprawl:** Too many one-off icons without semantic governance will recreate the current inconsistency.
- **Inconsistent stroke widths:** Mixing 1px, 2px, filled emoji-like, and outline assets will make the library feel patched together.
- **Mixed illustration styles:** One cute illustration, one technical diagram, and one generic stock-like drawing would weaken brand recognition.
- **Confusing icons and illustrations:** A detailed spot illustration cannot simply be shrunk into a toolbar icon.
- **Over-design:** Large artwork on operational pages could reduce clarity and increase vertical scroll.
- **Excessive categories:** Too much taxonomy can make contribution difficult. Start small and expand only when assets exist.
- **Accessibility regressions:** Icon-only controls without labels and status conveyed only by color would reduce usability.
- **Binary asset drift:** PNG/JPG/WebP/PDF assets would undermine scalability, theming, and repository cleanliness.
- **Avatar V2 boundary erosion:** Folding Avatar V2 into generic assets would blur identity, personalization, and UI icon concerns.
- **Future integration mismatch:** Technical Home features could become visually cold if their icons are designed separately from the family product language.

## Recommendation

Build the **FamilyBoard Asset Library** as a long-term design-system layer, beginning with a small Phase 1 icon implementation. Treat the previous SVG Asset Audit as the first tactical debt list, but do not stop at emoji replacement. The strategic target is a semantic, accessible, SVG-only visual language that covers product navigation, operational status, emotional moments, empty states, and future household integrations.

Recommended next implementation slice:

1. Create the semantic icon architecture.
2. Implement the Phase 1 high-impact icon set.
3. Replace visible Agenda emoji, Shopping placeholder glyph, shell/settings glyph, open/check/status fallbacks, and Weekly Reset readiness glyphs.
4. Keep Avatar V2 untouched except for documentation that it is a sibling visual system.
5. Validate no binary assets, no production image files, and no raw icon glyphs remain in the targeted surfaces.

## Modified files

- `docs/reports/2026-06-28-familyboard-asset-library-architecture/familyboard-asset-library-architecture.md`

## Binary artifact confirmation

- No SVG assets created.
- No PNG files created.
- No JPG/JPEG files created.
- No GIF files created.
- No WEBP files created.
- No PDF files created.
- No video files created.
- No binary artifacts created.

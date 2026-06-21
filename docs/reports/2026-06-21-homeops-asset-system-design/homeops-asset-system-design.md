# HomeOps Asset System Design

## Executive Summary

HomeOps should move from Unicode-backed semantic icons to a HomeOps-owned asset system that feels like a warm household companion rather than an enterprise dashboard. The system should be soft, rounded, pastel, emotionally expressive, and consistent across child-facing, family-facing, and parent-facing surfaces.

The recommended direction is a **layered soft-illustration system**: simple filled SVG shapes, gentle internal highlights, sparse soft shadows, and no hard external outlines by default. HomeOps assets should behave as reusable semantic product language, not as a generic icon pack. The core asset promise is: **children can recognize what matters, parents can trust the tone, and the product can scale without visual drift**.

The first wave should focus on the surfaces where assets will carry the most meaning and reduce the most Unicode dependency: Celebration, Helpful Moments, Child Workspace progress/ownership, Avatar V2 foundations, and shared semantic navigation/status assets. The existing Semantic Icon Layer is the correct migration bridge; it should become the public asset lookup surface while the implementation behind each semantic name moves from Unicode to owned SVG assets gradually.

## Visual Language

### Design personality

HomeOps should feel closer to a household storybook, family game console, and child-safe helper than to a productivity suite. The visual system should communicate:

- **Warmth:** friendly, emotionally positive, and low-stress.
- **Safety:** no sharp, aggressive, alarmist, or punitive shapes.
- **Belonging:** family contribution, shared progress, and gentle recognition.
- **Clarity:** immediately understandable symbols for children and adults.
- **Durability:** assets should still feel appropriate after years of use, not novelty-only.

### Outlines vs. no outlines

Recommendation: **mostly no hard outlines**.

Use:

- Soft filled shapes with strong silhouettes.
- Internal separation through adjacent pastel fills.
- Occasional subtle darker edge strokes only where readability requires it.
- Very thin strokes for facial features, glasses, strings, handles, or tiny details.

Avoid:

- Black icon-style outlines.
- Uniform line-icon treatment.
- Material-style single-weight stroked icons.
- FontAwesome-like glyph silhouettes.

Rationale: hard outline systems pull HomeOps toward generic iconography. Soft silhouettes and light detail better support the Nintendo / Animal Crossing / Disney Junior direction.

### Flat vs. layered

Recommendation: **layered flat illustration**.

Use 2-5 simple layers per asset:

1. Base shape.
2. Secondary color area.
3. Small highlight.
4. Optional soft contact shadow.
5. Optional expressive detail.

This gives enough dimensionality to feel ownable without becoming painterly or expensive to produce.

Avoid:

- Single-color flat glyphs as the default asset language.
- Highly rendered 3D or skeuomorphic art.
- Overly detailed illustrations that cannot scale down.

### Gradients

Recommendation: **controlled micro-gradients only**.

Use gradients for:

- Very soft background blobs.
- Celebration glow.
- Memory warmth.
- Avatar cheek or hair highlights when subtle.

Avoid gradients for:

- Every icon fill.
- Core semantic shape recognition.
- Small navigation icons where gradients become noisy.

Default asset fills should work without gradients. Gradients should be enhancement, not identity.

### Highlights

Recommendation: **yes, but tiny and consistent**.

Use highlights as rounded capsule or oval shapes with low opacity. Highlight placement should usually be upper-left to match a shared soft-light model. Highlights should make assets feel friendly and tactile, not glossy.

### Shadows

Recommendation: **soft contact shadows, not dramatic drop shadows**.

Use:

- Small oval ground shadows for larger illustrations.
- Minimal inner separation shadows for overlapping layers.
- No shadow for tiny UI icons unless needed for contrast.

Avoid:

- Heavy card-like shadows inside SVGs.
- Long shadows.
- High-contrast enterprise elevation.

### Shape language

Recommendation: **rounded, pudgy, asymmetrical-but-balanced**.

Common geometry:

- Rounded rectangles.
- Soft circles and ovals.
- Squircle-like containers.
- Organic blobs for backgrounds.
- Short, thick, friendly strokes.
- Large eyes / small smiles only for avatars and character-like objects, not every object.

Avoid:

- Sharp triangles except as tiny directional hints.
- Thin technical lines.
- Dense geometric grids.
- Aggressive warning shapes unless required for safety-critical states.

### Color philosophy

Recommendation: **pastel semantic families with accessible contrast anchors**.

Color should be organized as:

- **Domain families:** Home, Agenda, Lists, Tasks, Motivation, Family/Child, Celebration, Memory, Settings, Weekly Reset, House, Media.
- **Emotional families:** calm, focus, progress, appreciation, celebration, memory, care, caution.
- **Personalization colors:** family member display colors and avatar options.
- **Neutral anchors:** warm off-white backgrounds, soft ink text, gentle borders.

Asset colors should usually use 2-3 pastel fills plus one deeper accessible accent. The deeper accent should support details and small-size legibility without making the asset feel corporate.

## Asset Taxonomy

HomeOps should organize assets by semantic product meaning rather than by visual shape. A single asset may appear in multiple surfaces, but ownership should stay semantic.

### 1. Core shell and navigation

- Home
- Agenda / calendar
- Lists
- Tasks
- Motivation
- Family / members
- Child mode
- Parent mode
- Weekly Reset
- Settings
- House Status
- Media
- Back / close / add / edit / save / delete
- Overflow / more / expand / collapse

### 2. Household time and planning

- Today
- Tomorrow
- This week
- Upcoming
- Later
- Calendar event
- Recurring routine
- Birthday
- Family appointment
- School / activity
- Reminder-like visual marker, without implementing reminders

### 3. Tasks and routines

- Task
- Shared household task
- Child-owned task
- Unassigned task
- Completed task
- Reopened task
- Overdue / needs attention
- Due today
- No-date task
- Routine
- Clean-up / tidy
- Chore-like household care

### 4. Lists and memory aids

- Shopping
- Packing
- Checklist
- Active item
- Completed item
- List archive / later
- Pantry / household supplies
- Errand
- Remember-this note

### 5. Motivation and goals

- Family goal
- Individual goal
- Progress
- Milestone
- Contribution
- Encouragement
- Gentle effort
- Finished goal
- Goal paused / archived
- No ranking / togetherness visual metaphor

### 6. Helpful Moments

- Kindness
- Teamwork
- Initiative
- Responsibility
- Routine
- Appreciation note
- Family noticed
- Thank you
- Helping hands
- Caring action

### 7. Celebration

- Upcoming celebration
- Ready to celebrate
- Celebrated
- Celebration memory
- Family ritual
- We did it
- Confetti / sparkle / ribbon
- Keepsake card
- Shared treat / shared outing / shared fun

### 8. Memory and history

- Memory
- Family story
- Keepsake
- Photo placeholder, without implying photo upload if not implemented
- Past celebration
- Weekly recap
- What went well
- Family timeline marker

### 9. Child experience

- Child hero
- My progress
- My help mattered
- Family participation
- Today section
- This week section
- Child-safe success
- Parent area / grown-up area
- Age-aware simple star/check vocabulary

### 10. Avatar V2

- Base face/head
- Skin tone layers
- Hair styles
- Hair colors
- Eyes
- Mouths
- Glasses
- Shirts
- Accessories
- Optional background badge/blob
- Family member fallback initials
- Future unlocked cosmetics, if later scoped

### 11. Empty states and onboarding

- Empty calendar
- Empty list
- Empty task list
- Empty motivation state
- Empty Helpful Moments state
- Empty child progress
- First family goal
- First helpful moment
- First celebration memory
- Setup / getting started

### 12. Feedback and status

- Success
- Gentle warning
- Error
- Offline / unavailable
- Loading / waiting
- Saved
- Unsaved changes
- Validation help
- Needs review
- Completed

### 13. Household and environment, future-safe

- House
- Room
- Door / window
- Plant / pet-safe household warmth
- Temperature / sensor placeholder, without implementing integrations
- Media night / family TV placeholder
- Maintenance / care

## Helpful Moments Assets

Helpful Moments should not look like badges, points, discipline records, or achievement stickers. They should look like **family appreciation made visible**.

### Kindness

Visual metaphor:

- Two soft hands sharing a small heart.
- A blanket or warm scarf being offered.
- A small smiling helper object, such as a cup of cocoa or flower, only if culturally neutral.

Feeling:

- Gentle, caring, emotionally warm.
- Quietly meaningful rather than flashy.

Avoid:

- Trophy imagery.
- Hero/savior imagery.
- Overly sentimental crying-face visuals.

### Teamwork

Visual metaphor:

- Multiple hands holding one soft puzzle piece.
- Family figures moving a rounded block together.
- Two or three stars connected by a soft loop.

Feeling:

- Together, cooperative, shared lift.
- No winner/loser implication.

Avoid:

- Sports medals or podiums.
- Competitive team logos.
- Corporate collaboration icons.

### Initiative

Visual metaphor:

- A small sprout appearing from a pot.
- A hand raising a tiny flag.
- A lightbulb with soft rounded glow, but redrawn as HomeOps-owned and non-enterprise.

Feeling:

- “I noticed and started.”
- Curious, proactive, proud but not boastful.

Avoid:

- Lightning bolts as the main metaphor.
- Startup/innovation icon language.

### Responsibility

Visual metaphor:

- A small backpack or basket being carried.
- A checked soft clipboard with rounded corners.
- A house-shaped token held carefully.

Feeling:

- Dependable, trusted, capable.
- Encouraging rather than burdensome.

Avoid:

- Heavy weights.
- Stern shield/check imagery.
- Adult productivity symbolism.

### Routine

Visual metaphor:

- A circular path of soft dots around a sun/moon pair.
- A toothbrush/bed/book sequence simplified into rounded tokens.
- A calendar page with a cozy repeat loop.

Feeling:

- Predictable, calm, “we do this together.”
- Low-pressure consistency.

Avoid:

- Streak-fire imagery as default.
- Alarm-clock stress.
- Punitive missed-day visuals.

## Celebration Assets

Celebration assets should carry emotional progression from anticipation to arrival to memory. The state should be readable before copy is read.

### Upcoming

Visual feeling:

- Warm anticipation.
- Something delightful is coming closer.
- Calm excitement, not urgency.

Recommended metaphors:

- Wrapped gift on a soft path.
- Calendar with tiny confetti seeds.
- Balloon not yet released.
- Cozy doorway with light behind it.

Visual treatment:

- Muted celebration colors.
- Small sparkles.
- Forward motion path.
- Partial reveal / “almost there” composition.

### Ready To Celebrate

Visual feeling:

- Arrival moment.
- “We did it.”
- Immediate family joy.

Recommended metaphors:

- Open gift.
- Balloon cluster lifted.
- Confetti pop.
- Family table with a small celebratory centerpiece.

Visual treatment:

- Highest energy in the system.
- Brighter accent, more sparkles, larger silhouette.
- Still pastel and soft; never casino-like or noisy.

### Celebrated

Visual feeling:

- Warm afterglow.
- The celebration happened and mattered.
- Pride without ongoing urgency.

Recommended metaphors:

- Confetti gently settled.
- Ribbon with check-like fold.
- Candle or lantern glow.
- Completed celebration card.

Visual treatment:

- Softer saturation than Ready.
- Stable, grounded composition.
- A visible completion marker, but not a generic check-only icon.

### Memory

Visual feeling:

- Keepsake-quality family history.
- “We remember this together.”
- Cozy, reflective, and emotionally durable.

Recommended metaphors:

- Memory card in a rounded album.
- Small framed family star.
- Ribboned keepsake box.
- Scrapbook page with soft corner tabs.

Visual treatment:

- Warm neutrals, peach, cream, soft amber.
- Less motion, more stillness.
- Optional tiny sparkle as preserved joy, not active celebration.

## Child Experience Assets

Child-facing assets should help children understand ownership without making the product feel transactional. The guiding question is: **“Can a child see where they are, what they helped with, and why it mattered?”**

### Child Hero

Visual direction:

- Avatar is the primary identity anchor.
- Hero background should be a soft personalized blob or room-like stage using member color.
- Goal/progress symbols should orbit or sit near the avatar, not overwhelm it.

Ownership representation:

- “This is my space” through avatar, name color, and familiar personal motif.
- Avoid locked profiles, account badges, or permission-looking visuals.

### Contribution

Visual direction:

- Use helping hands, small carried objects, or a family path marker.
- Represent contribution as visible support, not points earned.
- Show a child’s effort as part of the family story.

Ownership representation:

- A child-colored token placed into a shared family goal shape.
- A small personal mark on a shared progress path.

### Family Participation

Visual direction:

- Multiple family-colored tokens contributing to one shared object.
- Shared table, house, path, garden, or blanket metaphors.
- Child’s color can be highlighted without making others disappear.

Ownership representation:

- “I am one of us,” not “I beat others.”
- Use inclusive clustering instead of ranking order.

### Progress

Visual direction:

- Progress path, growing garden, filling jar, or star trail.
- For younger children, use fewer larger marks.
- For school-age children, allow slightly richer progress detail.

Ownership representation:

- Personal progress uses the child’s avatar/color.
- Family progress uses the shared family palette plus small child contribution markers.

Avoid:

- Leaderboards.
- Coin piles.
- Punitive empty holes.
- Red failure states for incomplete child work.

## Avatar V2

Avatar V2 should become a layered SVG avatar system that preserves the current family-member boundary while improving visual quality, consistency, and extensibility.

### Recommended architecture

Use a **composable layered SVG avatar renderer** rather than pre-rendered full-character assets.

Layer order:

1. Background blob / personal badge shape.
2. Neck / shoulders.
3. Shirt.
4. Head / ears.
5. Hair back layer.
6. Face details.
7. Hair front layer.
8. Glasses.
9. Accessories.
10. Optional tiny status adornment, only when a future slice explicitly scopes it.

The renderer should accept avatar configuration and map each selected part to a known SVG layer. It should also preserve initials fallback for missing or unsupported configuration.

### Asset organization

Recommended future structure:

```text
assets/
  homeops/
    icons/
      semantic/
      navigation/
      status/
    illustrations/
      celebration/
      helpful-moments/
      empty-states/
      child-experience/
      weekly-reset/
    avatars/
      bases/
      hair/
      eyes/
      mouths/
      glasses/
      shirts/
      accessories/
      backgrounds/
    tokens/
      asset-colors.ts
      asset-registry.ts
```

This structure separates UI-scale icons from larger illustrations and keeps avatar parts isolated from other product assets.

### Color handling

Use three color modes:

1. **Fixed semantic palette:** for product meaning such as celebration, warning, memory, and Helpful Moment categories.
2. **Token-inherited palette:** for domain and theme-compatible icons.
3. **User/member palette:** for avatar skin tone, hair, shirt, and member display color.

Avatar parts should avoid arbitrary per-path hardcoding where customization is expected. Skin, hair, shirt, and background should be color slots. Small facial features may use stable neutral tokens.

### Extensibility

Avatar V2 should support future additions without schema churn where possible:

- Versioned part identifiers.
- Unknown-part fallback behavior.
- Stable defaults per family member.
- Optional accessory categories.
- Age/proportion variants that affect shape scale only, not permissions or identity.
- No reward/unlock semantics unless a later product slice explicitly adds them.

### Future customization

Safe future options:

- More hair shapes.
- More glasses.
- Shirt patterns.
- Cozy accessories such as bow, cap, hoodie, hair clip.
- Background motifs such as stars, leaves, clouds, dots.

Avoid by default:

- Status badges implying tasks, points, warnings, ranks, or behavior scores.
- Cosmetic stores or unlocks before Reward Economy is intentionally designed.
- Overly realistic identity attributes.

## SVG Technical Direction

### SVG organization

Each asset should have:

- Stable semantic id.
- Category.
- Intended sizes.
- Color mode.
- Accessibility label strategy.
- Theming behavior.
- Replacement policy.

Recommended id pattern:

```text
category.semantic.variant.state
```

Examples:

- `celebration.family.upcoming.default`
- `celebration.family.ready.default`
- `helpful.kindness.default`
- `child.progress.path.default`
- `avatar.hair.curly.short`
- `nav.tasks.default`

### Semantic asset mapping

The current Semantic Icon Layer should evolve into a broader **HomeOps Asset Registry**. Components should request semantic assets by meaning, not by file path.

Recommended conceptual mapping:

```text
semanticName -> assetId -> SVG source + metadata + fallback
```

The fallback can remain Unicode during migration, but the public component API should not expose Unicode as the product contract.

### Dynamic recoloring strategy

Use CSS variables for controlled recoloring:

- `--asset-primary`
- `--asset-secondary`
- `--asset-accent`
- `--asset-highlight`
- `--asset-shadow`
- `--asset-ink`
- `--asset-member-color`

SVGs should prefer `currentColor` only for simple monochrome UI glyphs. Rich HomeOps illustrations should use explicit semantic variables so recoloring is predictable.

### Theme compatibility

HomeOps currently targets a light, warm, household-friendly palette. The asset system should still be future-compatible with theme changes by ensuring:

- Important contrast is not dependent on pale-on-pale combinations.
- Text is never embedded in SVG assets.
- Status meaning is not color-only.
- Asset metadata can identify dark-theme unsafe assets if a dark theme is later introduced.
- Color slots are tokenized rather than hardcoded when assets need theme awareness.

### Maintainability rules

- Do not let feature components import arbitrary SVG files directly once the registry exists.
- Do not create one-off duplicates for every surface.
- Use variants only when the emotional state or size truly changes.
- Keep small icons simple and larger illustrations expressive.
- Preserve semantic fallbacks for unsupported assets.
- Document each new asset’s intended use at creation time.

## Migration Strategy

The safest migration is:

```text
Direct Unicode usage
→ Semantic Icon Layer
→ HomeOps Asset Registry
→ Owned SVG assets
→ Unicode fallback removal only after coverage is complete
```

### Phase 1: Stabilize semantic names

- Treat existing semantic icon names as product contracts.
- Add missing semantic names before adding visual assets.
- Remove remaining direct Unicode only through semantic mapping, not by swapping random SVG imports into components.

### Phase 2: Introduce asset registry behind the layer

- Extend the semantic layer to support SVG metadata and illustration-scale assets.
- Keep existing Unicode fallback values.
- Allow a component to render either icon-scale or illustration-scale assets through the same semantic lookup concept.

### Phase 3: Replace highest-value symbols first

Start with:

- Celebration states.
- Helpful Moment categories.
- Child progress/contribution symbols.
- Shared add/close/back controls.
- Navigation icons.

This creates visible improvement without requiring every asset category to be ready.

### Phase 4: Avatar V2 renderer

- Build Avatar V2 behind the existing avatar component boundary.
- Preserve current avatar configuration fields where possible.
- Map existing hair/glasses/shirt choices to V2 parts.
- Keep initials fallback.

### Phase 5: Decommission Unicode fallbacks gradually

Only remove Unicode fallbacks after:

- All semantic names used in production surfaces have owned SVG assets.
- Visual review confirms consistency.
- Accessibility behavior is verified.
- Bundle/performance impact is understood.

### UX disruption controls

- Replace state families together, not one state at a time. For example, do all celebration states together.
- Keep layout boxes stable so assets do not shift cards unexpectedly.
- Do not change copy and assets in the same migration unless explicitly scoped.
- Do not introduce new product concepts while migrating visuals.

## Design System Risks

### Critical risks

1. **Style drift across product areas**
   - Celebration, Helpful Moments, Child Workspace, Weekly Reset, and Tasks could each develop separate illustration styles.
   - Mitigation: define asset primitives, review every new asset against the visual language, and maintain one registry.

2. **Asset sprawl without semantic ownership**
   - Teams may create one-off icons for each card or empty state.
   - Mitigation: require taxonomy category, semantic id, intended surfaces, and reuse notes for every asset.

3. **Avatar V2 becoming a reward economy by accident**
   - Accessories can imply unlocks, points, or purchases.
   - Mitigation: keep avatar customization presentation-only unless a later prompt explicitly scopes unlocks or rewards.

4. **Child-facing visuals becoming too game-like**
   - Celebration and progress assets could drift into coins, streaks, or leaderboards.
   - Mitigation: use contribution, growth, care, and togetherness metaphors rather than currency or competition.

### Major risks

1. **Token mismatch between CSS and SVG**
   - SVGs may hardcode colors while app surfaces use domain tokens.
   - Mitigation: define asset color variables and a small color-slot contract.

2. **Small-size readability loss**
   - Soft layered assets may become muddy at navigation/icon sizes.
   - Mitigation: create separate icon-scale simplifications for small sizes.

3. **Accessibility and contrast gaps**
   - Pastel assets can fail contrast if used as the only state indicator.
   - Mitigation: pair visuals with text/state labels and use deeper accent details.

4. **Inconsistent emotional intensity**
   - Ready celebration could be too loud while Memory is too quiet.
   - Mitigation: define emotional intensity levels by state and review families as sets.

5. **Performance and bundle growth**
   - SVG illustrations and avatar layers can grow quickly.
   - Mitigation: lazy-load large illustrations, keep icons inline/symbolized only where useful, and avoid unused bundled variants.

### Minor risks

1. **Overuse of sparkles/hearts**
   - Warmth can become repetitive.
   - Mitigation: expand metaphor range: garden, path, blanket, table, lantern, keepsake.

2. **Too many pastel oranges in Motivation/Celebration**
   - Surfaces may blur together.
   - Mitigation: assign distinct accent families for appreciation, progress, celebration, and memory.

3. **Generic empty-state illustrations**
   - Empty states can feel like stock SaaS artwork.
   - Mitigation: tie them to HomeOps household metaphors.

## Recommended First Asset Wave

If only one asset wave is created first, it should prioritize highly visible, emotionally meaningful, reusable assets.

1. **Celebration state family**
   - Upcoming, Ready To Celebrate, Celebrated, Memory.
   - Highest emotional impact and directly replaces prominent emoji.

2. **Helpful Moments category family**
   - Kindness, Teamwork, Initiative, Responsibility, Routine, generic Appreciation.
   - High reuse across Motivation, Child Workspace, Family Member pages, Weekly Reset recap, and future recognition flows.

3. **Child ownership/progress family**
   - Child Hero motif, My Progress, My Help Mattered, Family Participation, This Week, Today.
   - High impact for child comprehension and product identity.

4. **Avatar V2 base kit**
   - Base head/face, 4-6 hair styles, glasses, shirts, background blobs, initials fallback treatment.
   - Strongest long-term personalization foundation.

5. **Core semantic controls and navigation icons**
   - Add, close, back, edit, save, Home, Tasks, Lists, Motivation, Agenda, Family, Weekly Reset.
   - Provides baseline consistency and reduces remaining Unicode/control glyph reliance.

6. **Progress and completion symbols**
   - Star, check, milestone, progress path, completed but gentle.
   - Reused by Motivation, Child Workspace, Tasks, and Weekly Reset.

7. **Empty-state starter set**
   - First family goal, first helpful moment, empty tasks, empty list, empty calendar.
   - Useful but lower emotional urgency than celebration/child surfaces.

## UX Impact Analysis

### 1. Child Workspace

Child Workspace benefits the most because assets can reduce reading burden and make identity, progress, contribution, and family belonging instantly legible. Current child-facing surfaces already have a strong journey structure; owned assets would make the journey feel coherent and magical rather than copy-heavy.

Expected impact:

- Better child comprehension.
- Stronger ownership through avatar and member-color assets.
- Less reliance on explanatory copy.
- More emotionally distinctive HomeOps identity.

### 2. Celebration

Celebration is the second-highest impact area because visual state is central to the experience. Upcoming, Ready, Celebrated, and Memory need distinct emotional progression. Owned assets can make Ready To Celebrate feel like the product’s emotional peak without adding new mechanics.

Expected impact:

- Clearer state recognition.
- Stronger anticipation and arrival moment.
- More keepsake-like memory surface.
- Replacement of generic celebration emoji with HomeOps-owned language.

### 3. Helpful Moments

Helpful Moments should feel like family appreciation, not a feed. Category-specific assets can make kindness, teamwork, initiative, responsibility, and routine recognizable while preserving the non-competitive model.

Expected impact:

- Faster scanning.
- Warmer recognition.
- Better connection to family contribution story.
- More reusable visual language for Weekly Reset recaps.

### 4. Motivation

Motivation is currently concept-heavy and benefits from visual compression. Assets can replace repeated explanation of contribution, progress, celebration, and memory with a recognizable story chain.

Expected impact:

- Less copy needed.
- Stronger page identity.
- Better relationship between goals, helpful moments, celebrations, and memories.

### 5. Home

Home should stay summary-first, so assets must be compact and restrained. The biggest benefit is clearer domain scanning for Agenda, Lists, Tasks, Motivation, and ready celebrations.

Expected impact:

- Better at-a-glance dashboard recognition.
- Stronger family-friendly first impression.
- Better visual continuity with deeper pages.

### 6. Weekly Reset

Weekly Reset currently has weaker domain identity and would benefit from recap, review, and “what went well” assets. However, it is more parent-facing and less continuously visible than Child Workspace or Home.

Expected impact:

- Warmer maintenance ritual.
- Less administrative feel.
- Better link from review chores to family recognition.

### 7. Tasks

Tasks benefit from ownership, due-state, shared-household, and completion assets, but visual intensity should remain lower than child/celebration surfaces. Tasks should stay practical and readable.

Expected impact:

- Better ownership scanning.
- More approachable responsibility language.
- Reduced enterprise task-manager feel.

### 8. Lists

Lists benefit from shopping, packing, checklist, and empty-state assets, but the current UX impact is lower because list rows remain text/action dominant. Assets should support memory and quick recognition without clutter.

Expected impact:

- Friendlier list empty states.
- Clearer list category identity.
- Moderate improvement to dashboard scanning.

## Next Prompt Context

Use this report as the design brief for the first HomeOps asset creation slice. The next prompt should not ask for broad implementation. It should choose one constrained asset wave and require only asset specifications or SVG creation for that wave.

Recommended next slice:

> Create the first HomeOps-owned SVG asset wave for Celebration states only: Upcoming, Ready To Celebrate, Celebrated, and Memory. Follow the HomeOps Asset System Design visual language. Do not modify product behavior, database schema, API contracts, or unrelated UI. Wire assets only through the existing Semantic Icon Layer / asset registry boundary if implementation is explicitly requested.

Important boundaries for the next slice:

- Do not create a generic icon library clone.
- Do not introduce rewards, points, unlocks, badges, leaderboards, or purchases.
- Do not change copy while changing assets unless explicitly requested.
- Do not bypass the semantic layer with arbitrary direct imports.
- Keep Celebration states visually coherent as one family.

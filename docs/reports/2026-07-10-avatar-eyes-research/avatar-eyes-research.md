# Executive Summary

Eyes V1 should introduce **identity-oriented eye styles**, not a broad expression system. The strongest long-term design is to keep three concepts separate:

- **Eye style**: the stable identity shape of the eyes.
- **Eye color**: a future appearance/color attribute.
- **Expression / animation**: transient states such as blink, wink, happy closed eyes, angry eyes, sleepy eyes, and surprised eyes.

For FamilyBoard, Eyes V1 should be deliberately small: **four eye styles** that preserve the current warm, readable, rounded avatar identity while adding meaningful family-member differentiation:

1. **Classic Round** — compatibility default matching the current eye language.
2. **Soft Almond** — slightly elongated, friendly, mature, and broadly useful.
3. **Gentle Arc** — softer upper-lid impression without becoming a closed-eye expression.
4. **Bright Wide** — a larger, more open identity shape for younger/playful avatars.

This avoids a catalog full of nearly indistinguishable micro-variants and postpones expression-driven states until a dedicated expression/reaction layer exists. The renderer already has the right anatomy anchors (`leftEye`, `rightEye`, `eyeLineY`) and deterministic layer pattern. Eyes should eventually become their own renderer layer between the base head and mouth/front-hair/glasses layers, but the research recommendation does **not** require broader renderer architecture changes.

# Repository Review

## Instructional constraints

Repository instructions require this task to remain research-only, keep the changeset proportional, avoid speculative implementation, and avoid unsupported validation claims. Because this is not implementation work, `docs/state/current-state.md` and phase roadmap files are intentionally not updated.

The relevant repository-local instruction sources reviewed were:

- `AGENTS.md`
- `.github/copilot-instructions.md`

## Current avatar architecture

The FamilyBoard avatar stack is already well-positioned for Eyes V1:

- The renderer is SVG-based and deterministic.
- Anatomy resolution centralizes the face anchors.
- Mouths already became a dedicated facial renderer layer.
- Glasses are a dedicated eyewear layer aligned to the same eye anchors.
- The catalog/editor path is data-driven enough to add a future `eye.style` slot without redesigning the editor.
- Persistence stores catalog selections generically, while legacy Avatar V2 config remains intentionally narrower.

## Current face rendering

The current face is rendered inside `renderHeadAndFace`. The base layer includes ears, head shape, highlight, and hard-coded eyes. The current eyes are:

- two dark filled circles at the left and right eye anchors;
- two small warm-white catchlights;
- no separate eye style property;
- no eye color property;
- no eyebrow layer.

This gives the system a simple and highly readable default, but it makes eyes part of the base face rather than a replaceable facial feature.

## Current anatomy constraints

`resolveAvatarAnatomy` defines three head variants with tuned face placement:

- `round`: eye spread 19, eye line lower than head top by 49.
- `oval`: eye spread 17, eye line lower than head top by 55.
- `wide`: eye spread 21, eye line lower than head top by 46.

These anchors are already exactly what Eyes V1 needs. Eye styles should draw relative to `anatomy.face.leftEye`, `anatomy.face.rightEye`, and `anatomy.face.eyeLineY`; they should not define independent per-head coordinates except for tiny renderer-local tuning if absolutely necessary.

## Mouth renderer constraints

Mouths V1 established the current facial-feature precedent:

- Mouth is a catalog category, not a special editor special case.
- Mouth uses a stable renderer token model.
- Missing mouth config falls back to a compatibility default.
- Mouth rendering is isolated in `avatar-v2-layer-mouth`.
- The layer sits after base head/face and before front hair/glasses/accessory layers.
- Mouth style variants are treated as stable selected appearance, even when some mouth names imply mood.

Eyes should follow the same architecture pattern but with a narrower initial catalog.

## Glasses renderer constraints

Glasses render as a dedicated `avatar-v2-layer-glasses` group and are aligned to the eye anchors. Framed glasses use lens rectangles or rounded rectangles, sunglasses fill the lenses, and novelty styles use star/heart paths centered over the eye positions.

This has three consequences for Eyes V1:

1. Eye styles must remain inside the current lens footprint.
2. No eye style should require moving glasses or changing lens geometry.
3. Sunglasses may obscure eyes almost entirely, and that is acceptable; the renderer should not special-case hidden eye styles.

## Layer ordering constraints

The current assembled order is:

1. back hair;
2. shirt;
3. base head/face;
4. mouth;
5. behind-front-hair accessory;
6. front hair;
7. glasses;
8. hair highlights;
9. accessory.

For Eyes V1, the clean target order is:

1. back hair;
2. shirt;
3. base head without eyes;
4. eyes;
5. mouth;
6. behind-front-hair accessory;
7. front hair;
8. glasses;
9. hair highlights;
10. accessory.

That preserves the rule that glasses sit over eyes, front hair can cover part of the face, and facial features remain above the skin/head base.

## Catalog and editor constraints

The catalog already has:

- slot-based selections;
- editor panels with category IDs;
- renderer bindings with optional layer names;
- default selections;
- active/default item status handling;
- existing Face panel grouping for mouth and eyewear.

Eyes V1 should therefore be a normal catalog category, likely `eye.style`, with slot `eyeStyle`, binding layer `eyes`, and a default item equivalent to the current round eyes. It should live in the Face editor panel near mouth and eyewear. The best panel order is likely **Eyes → Mouth → Eyewear**, because eyes are identity anatomy, mouth is expression/affect, and eyewear is an accessory overlay.

## Existing report history constraints

The Mouths V1 report emphasized compatibility defaults, dedicated layers, shared ink/stroke constants, catalog-first modelling, and additive layering. The glasses research report emphasized face-accessory grouping and avoiding a standalone glasses taxonomy. The accessories and clothing reports reinforce the same principle: add narrow catalog slices that preserve renderer stability and do not expand persistence or editor concepts unnecessarily.

Eyes V1 should continue that pattern: small catalog slice, stable renderer layer, compatibility default, and no persistence/editor redesign.

# Industry Research

The useful lesson from mature avatar systems is not that FamilyBoard should copy their exact eye shapes. The lesson is that eyes are usually a **high-signal identity feature** while expressions are usually a **state system** layered on top.

## Apple Memoji

Apple positions Memoji as personalized avatars with separate customization of facial attributes such as skin tone, hairstyle, eyes, brows, nose, lips, ears, facial hair, eyewear, and headwear. Apple also allows color selection across multiple visible traits. Sources reviewed: Apple Support, “Use Memoji on your iPhone or iPad Pro” (https://support.apple.com/en-us/111115), Apple App Store story “Make Your Own Memoji” (https://apps.apple.com/us/iphone/story/id1445637997), and Apple Watch Memoji guide (https://support.apple.com/guide/watch/memoji-apdfb5de8996/watchos).

Why it works:

- Eyes and brows are separate identity controls, which lets users tune likeness without baking emotion into the eye shape.
- Eyewear and headwear are not treated as eye anatomy; they are overlays/accessories.
- Memoji can animate, but the customizable identity traits remain stable underneath the animation state.
- The system supports detailed personalization while retaining a consistent brand style.

FamilyBoard takeaway: model eye shape as identity, leave blink/wink/reaction behavior to a later state layer, and preserve separation from eyewear and brows.

## Nintendo Mii

Mii systems are built around highly adjustable facial features. Public documentation and historical descriptions of Mii creation emphasize selectable facial features such as hair, eyes, nose, mouth, head shape, size, position, color, and alignment. Source reviewed: Nintendo support pages for Mii account/profile usage (https://www.nintendo.com/en-gb/Support/Troubleshooting/How-to-Change-a-Nintendo-Account-Mii-1378989.html) and Nintendo/Mii historical reference material (https://en.wikipedia.org/wiki/Mii, used only for broad historical context where official UI-level details are sparse).

Why it works:

- Mii eyes are simple, abstract, and readable at tiny sizes.
- Large variation is achieved with a small number of primitive parameters: shape, scale, rotation, position, and color.
- The abstraction invites users to recognize a person without demanding realism.
- Expressions in games are runtime states; the base Mii eye selection is the identity baseline.

FamilyBoard takeaway: simple geometry can carry identity if it is readable, symmetrical, and anchored consistently. Avoid over-rendered eyes.

## Ready Player Me

Ready Player Me is a cross-app 3D avatar platform. Public partner/developer material describes customizable avatars and interoperable usage across many apps. Some partner documentation describes eye customization by shape, color, and size. Sources reviewed: Ready Player Me Unity SDK customization guide (https://github.com/readyplayerme/rpm-unity-sdk-core/blob/main/Documentation~/CustomizationGuide.md), DeepMotion partner overview (https://www.deepmotion.com/companion-tools/ready-player-me), and Niloom.AI Ready Player Me character documentation (https://docs.niloom.ai/documentation/key-features/generative-ai/genai-assets-individual-assets/characters-ready-player-me).

Why it works:

- The avatar has stable identity geometry, while animation and eye behavior can be handled by runtime systems.
- Eye color and shape can exist as persistent identity traits because the 3D model has enough resolution to make them visible.
- Interoperability favors slot-based data and clear separation between base traits and wearables.

FamilyBoard takeaway: keep the data model slot-based and future-compatible, but do not introduce eye color until it is visibly useful in FamilyBoard's small SVG portraits.

## Xbox Avatar

Microsoft's current support pages confirm Xbox Avatar Editor deprecation, while original avatar customization support refers to style/customize flows. Sources reviewed: Xbox Avatar Editor app FAQ (https://support.xbox.com/en-US/help/account-profile/profile/xbox-avatar-editor-app-faq) and Xbox profile/avatar customization support (https://support.xbox.com/en-US/help/account-profile/profile/customize-gamerpic).

Why it worked historically:

- Avatar identity was built from stable body/face/clothing/accessory selections.
- Expression and pose were presentation states rather than the same thing as facial feature identity.
- Wearables were separated from anatomical features.

FamilyBoard takeaway: even systems that later de-emphasize avatars used the same durable distinction: identity traits persist; expressive presentation changes around them.

## Bitmoji

Bitmoji presents itself as a personal emoji/avatar system with a large library of moods and stickers. Snapchat support separates avatar appearance editing from profile/selfie/scene presentation. Snap developer documentation also exposes facial animation states such as Happy, Angry, and Curious for Bitmoji avatars. Sources reviewed: Bitmoji homepage (https://www.bitmoji.com/), Snapchat Bitmoji editing support (https://help.snapchat.com/hc/en-us/articles/7012345832596-How-do-I-create-and-edit-my-Bitmoji-avatar), Bitmoji support on individual facial-feature editing (https://support.bitmoji.com/hc/en-us/articles/360001493886-Avatar-doesn-t-look-like-me), and Snap developer Bitmoji Avatar overview (https://developers.snap.com/lens-studio/features/bitmoji-avatar/overview).

Why it works:

- The avatar is a stable identity, while stickers and facial animation provide expressive variety.
- The system succeeds because users can recognize themselves across many moods.
- Expressions are numerous because they are generated as content states, not all stored as separate identity selections.

FamilyBoard takeaway: do not overload eye style with emotions. FamilyBoard can later support reactions without turning every reaction into a permanent eye option.

## Cross-system synthesis

Across these systems, eye systems work when they satisfy four rules:

1. **Persistent likeness and transient emotion are separate.** Eye anatomy establishes identity; expression modifies or animates it.
2. **The default remains iconic.** Users should not need to customize eyes for the avatar to feel alive.
3. **Eye customization is constrained by the overall art direction.** The eye set must look like one system, not a pack of unrelated cartoons.
4. **Overlays remain overlays.** Glasses, sunglasses, masks, face paint, and headwear should not redefine eye anatomy.

# Identity vs Expression

Eyes should represent **identity first** in Eyes V1.

They may eventually participate in expression, but identity and expression should remain separate concepts.

## Recommended conceptual model

- `eye.style`: stable identity shape.
- Future `eye.color`: stable identity color, only if visible and valuable.
- Future `expression`: transient face state that may override or compose eyes, brows, and mouth.
- Future `animation`: blink/reaction timing, not a saved avatar identity attribute.

## Why separation is better long-term

Separating identity and expression avoids these problems:

- A user choosing “sleepy eyes” because the shape resembles them accidentally makes the avatar permanently tired.
- A user choosing “angry eyes” creates a negative default tone on a family dashboard.
- Mouth and eye combinations explode combinatorially if every emotion is stored as independent permanent eye and mouth styles.
- Future animations become harder if closed/wink/happy eyes are already regular identity options.
- Glasses and eyebrows become more complex if eye styles are both identity anatomy and emotion states.

## Recommended answer

Eyes should support **identity now** and support **expression later through a separate expression/reaction system**. Eyes can be one component that expression states affect, but expression states should not be stored as ordinary eye styles in Eyes V1.

# Eye Style Recommendations

## Smallest useful Eyes V1 collection

The smallest useful set is **four styles**.

A set of three would provide default, elongated, and large/open, but it would not provide enough softness variation for family members who should read as calm/gentle without looking sleepy. A set of five or more would likely add tiny differences that are hard to distinguish in small dashboard avatars.

## Proposed Eyes V1 styles

### 1. Classic Round

Purpose: compatibility default.

Design intent:

- Closest to the current eyes.
- Dark circular pupils/eyes with small catchlights.
- Friendly and readable at compact sizes.
- Should be the default for all existing avatars.

Why it belongs:

- Preserves existing avatar identity.
- Provides a safe fallback.
- Defines the FamilyBoard eye language.

### 2. Soft Almond

Purpose: mature, calm, broadly human variation.

Design intent:

- Slightly horizontal oval/almond silhouette.
- Still rounded; no sharp eyeliner points.
- Catchlights remain subtle and consistent.
- Dark fill remains dominant.

Why it belongs:

- Adds meaningful identity variation without implying a mood.
- Works for adults and older children.
- Fits under all regular glasses lens shapes.

### 3. Gentle Arc

Purpose: softer, warmer identity without becoming closed/happy eyes.

Design intent:

- Slight upper-lid/arc impression over a visible dark eye body.
- Not a closed-eye curve.
- Not sleepy, angry, or coy.
- Maintains both eyes open and readable.

Why it belongs:

- FamilyBoard's visual tone is warm and supportive.
- Gives avatars a gentle face option without introducing explicit emotion states.
- Useful for caregivers/parents and calm child avatars.

### 4. Bright Wide

Purpose: open, energetic, youthful identity.

Design intent:

- Slightly larger eye body than Classic Round.
- Catchlights stay small; avoid anime sparkle.
- No huge sclera field.
- Must remain balanced with the current mouth sizes.

Why it belongs:

- Adds a playful/young-feeling option.
- Provides visible variation even at small sizes.
- Complements existing playful hair, clothing, and accessory assets.

## Styles intentionally not recommended for Eyes V1

- **Narrow**: too easily reads as suspicious, tired, annoyed, or unfriendly.
- **Angled**: drifts toward emotion and can look angry.
- **Anime large**: conflicts with FamilyBoard's rounded dashboard style.
- **Hyper-realistic iris/sclera styles**: too detailed for small SVG avatars.
- **Asymmetrical identity eyes**: should be reserved for expressions or accessibility/representation work only after the base system is stable.
- **Closed/wink eyes**: expression states, not identity styles.

# Renderer Assessment

## Where eyes should become their own layer

Eyes should become a dedicated layer after the base head and before the mouth:

`base head` → `eyes` → `mouth` → `front hair` → `glasses` → `highlights/accessory`

The base layer should retain head, ears, skin fill, outline, and head highlight. Eye geometry should move out of the base group into `avatar-v2-layer-eyes` when Eyes V1 is implemented.

## Does the existing architecture support this naturally?

Yes. The current renderer already supports this naturally because:

- `resolveAvatarAnatomy` already exposes left/right eye anchors and eye line.
- Mouths V1 already proved that a facial feature can move from hard-coded base geometry into its own layer.
- `renderAvatarV2Svg` already composes fixed ordered renderer functions.
- The catalog already has renderer bindings and layer metadata.
- The adapter already maps catalog slots to renderer config for mouth and eyewear.

No broad renderer redesign is necessary.

## Interaction with mouths

Eyes and mouths should be independent identity/expression components. Eyes V1 should not change mouth rendering. The only design rule is proportional balance: the largest eye style must not overpower open-mouth/laughing mouth styles, and the gentlest eye style must not make sad/determined mouths look unintentionally severe.

## Interaction with glasses

Glasses should remain above eyes. Eyes should not know which glasses style is selected. The renderer should not special-case eye styles for sunglasses, novelty frames, or thick frames.

## Interaction with future eyebrows

Future eyebrows should be a separate layer above eyes and below glasses/front hair. A likely future ordering is:

`base head` → `eyes` → `eyebrows` → `mouth` → `front hair` → `glasses`

Brows should carry much of the expressive burden later. That is another reason Eyes V1 should avoid angry/sad/surprised eye states.

## Renderer changes not recommended

Do not introduce:

- dynamic layer negotiation;
- per-glasses eye overrides;
- per-head custom eye art files;
- SVG asset generation;
- animation primitives;
- expression composition;
- eye color palettes;
- eyebrow placeholders.

Those are future-slice concerns.

# Glasses Compatibility

Every Eyes V1 style should work with:

- regular glasses;
- thick-frame glasses;
- round glasses;
- rectangular glasses;
- soft-square glasses;
- sunglasses;
- novelty star glasses;
- novelty heart glasses.

This should be true without special-case rendering.

## Compatibility rules

- Eye width must stay inside the existing lens footprint.
- Eye height must not collide with frame stroke or bridge.
- Catchlights should be visible when lenses are clear, but not required through sunglasses.
- Novelty glasses may partially obscure eye shapes; this is acceptable because novelty eyewear is intentionally dominant.
- Eye styles should not shift the eye anchor positions.
- No eye style should require lens geometry changes.

## Sunglasses

Sunglasses should simply render on top and obscure or mute the eyes. FamilyBoard should not add special logic to hide eyes under sunglasses unless later visual validation shows overdraw artifacts. The current filled sunglasses lens model already implies occlusion.

# Visual Design Principles

Eyes must preserve the FamilyBoard identity: warm, approachable, readable, and simple.

## Geometry

- Keep eye centers exactly on the anatomy anchors.
- Preserve current eye spacing per head variant.
- Keep the visual mass close to the current 5px-radius eyes.
- Avoid sharp outer corners.
- Keep both eyes symmetrical.
- Avoid expressive tilt in identity styles.

## Stroke and fill

- Use the current dark warm eye fill as the baseline.
- Use minimal stroke only where needed for almond/arc clarity.
- Avoid heavy outlines that compete with glasses frames.
- Keep line thickness consistent with current face language and mouth strokes.
- Do not introduce high-contrast sclera-heavy eyes in V1.

## Catchlights

- Keep catchlights small and warm-white.
- Use at most one catchlight per eye in V1.
- Keep catchlight placement mirrored and subtle.
- Avoid sparkle clusters, star highlights, or anime-style reflections.

## Pupil / iris detail

- Treat the V1 eye as a simple dark eye shape, not a detailed iris/pupil construction.
- Do not add visible iris rings in V1.
- Do not add multicolor iris gradients.

## Readability at small sizes

- Every style must be distinguishable in the compact family-avatar size.
- If two styles only differ at large preview size, one should be removed.
- Styles should be tested with dark hair, glasses, sunglasses, and multiple head shapes when implemented.

## Tone boundaries

Avoid drifting toward:

- anime eyes;
- sarcastic/mean narrowed eyes;
- dramatic eyelashes;
- beauty-makeup semantics;
- realistic wet-eye rendering;
- heavy gender coding.

# Scalability Assessment

The recommended eye system scales cleanly if Eyes V1 stays identity-only.

## Eyebrows

Future eyebrows can be added as their own category/layer. Brows should carry expression-rich changes such as worried, focused, excited, and angry. Keeping Eyes V1 neutral makes brows easier to add later.

## Eye color

A future eye color slot can be added without redesign if eye artwork has a separable fill or iris region. V1 should not expose it unless the chosen style actually makes color visible.

## Expressions

A future expression system can map expression states to composed overrides:

- happy: eyebrows + mouth + optional eye compression;
- surprised: eyebrows + widened eyes + surprised mouth;
- sleepy: lids + mouth;
- wink: one-eye override plus mouth;
- angry/focused: brows primarily, eyes secondarily;
- blink: animation state, not saved identity.

This composition is much cleaner than storing each expression as a permanent eye style.

## Animation

Blinking and reactions should be runtime or presentation states. Eyes V1 should not encode timing, closed lids, or animation metadata.

## Reactions

FamilyBoard may eventually use avatars in task completion, encouragement, agenda reminders, or family status moments. Those reactions should be expression presets that compose existing identity features rather than replacing the user's chosen identity.

# Risks

## Too many styles too early

A large eye catalog would increase editor complexity and visual QA without proportionate user value. The small avatar size makes subtle variants hard to distinguish.

## Expression leakage

Narrow, closed, wink, angry, sleepy, and surprised eyes would make emotion feel permanent. This is the highest design risk.

## Glasses conflicts

If eye shapes become too wide/tall or too detailed, glasses will obscure them or create visual clutter. V1 should design inside the current lens footprint.

## Loss of current warmth

The current round eyes are simple and friendly. Overly stylized eyes could make avatars feel less FamilyBoard and more generic cartoon/avatar-app.

## Future eyebrow conflict

If Eyes V1 encodes brow-like emotion into the eye shape, future eyebrows will either duplicate that expression or fight it.

## Accessibility and representation

Some users may expect eye shapes to represent ethnicity, disability, or identity. FamilyBoard should be careful not to label styles in ways that imply ethnicity, personality, or mood. Neutral names such as “Classic,” “Soft,” “Gentle,” and “Bright” are safer than names like “Asian,” “sleepy,” or “angry.”

# FamilyBoard Recommendation

If implementing Eyes V1 tomorrow, ship a **small identity-eye collection** and postpone everything expression-related.

## Ship now

- A new identity category for eye style.
- Four styles:
  - Classic Round;
  - Soft Almond;
  - Gentle Arc;
  - Bright Wide.
- A compatibility default matching current eyes.
- A dedicated eye renderer layer using existing anatomy anchors.
- Catalog/editor integration through the existing Face panel.
- No special-case glasses rendering.

## Postpone

- Eye color.
- Eyebrows.
- Wink.
- Closed eyes.
- Happy eyes.
- Angry eyes.
- Sleepy eyes.
- Surprised eyes.
- Blinking.
- Reactions/animation.
- Makeup/eyelashes.
- Per-eye asymmetry.

## Architectural decisions to make now

- Treat eye style as an identity slot, not an expression slot.
- Reserve expression for a future composed face-state system.
- Design the eye renderer so color could later be separated, even if V1 only uses dark fill.
- Keep eyes independent from mouth and eyewear selections.
- Put glasses above eyes in layer order.
- Leave future eyebrows as a separate layer rather than baking brow shapes into eyes.

## Intentionally avoid

- Adding many subtle variants.
- Encoding moods as eye styles.
- Adding eye color before it is visibly meaningful.
- Creating SVG asset files.
- Expanding persistence beyond catalog selections.
- Adding renderer abstractions not needed by Eyes V1.
- Redesigning the editor.
- Repositioning existing face anatomy.

# Proposed Eyes V1 Scope

Eyes V1 should include only:

1. **Catalog category**: `eye.style` with four active items.
2. **Renderer config concept**: `eyes: { style }` or equivalent, following the mouth pattern.
3. **Dedicated layer**: `avatar-v2-layer-eyes`.
4. **Default**: Classic Round, visually equivalent to current eyes.
5. **Editor placement**: Face panel, before mouth and eyewear.
6. **Validation**: existing catalog validation patterns for slot/category/default correctness.
7. **Visual QA target**: all four styles across round/oval/wide heads, with clear glasses, sunglasses, novelty glasses, multiple hair styles, and compact avatar sizes.

The scope should not include implementation of expressions, animation, color, eyebrows, screenshots, or generated assets as part of this research task.

# Future Opportunities

## Expressions V1

Create a separate expression system that composes eyes, brows, and mouths for temporary reactions. This could support family-dashboard moments such as task completion, encouragement, reminders, and celebration.

## Eyebrows V1

Add eyebrows as a separate identity/expression layer. Brows can provide significant personality and emotion while leaving eye shapes neutral.

## Eye Color V1

Add eye color only if later artwork introduces visible iris regions that remain readable at compact sizes and under glasses.

## Blink / idle animation

A future animation system could support subtle blinking in larger contexts. It should not run constantly in small dashboard views if it distracts from household information.

## Accessibility representation

Future additions could consider medically relevant or identity-relevant options, such as eye patch, monocle, or low-vision eyewear, but those should live in face accessories/eyewear rather than eye anatomy.

## Reaction presets

FamilyBoard could eventually provide named reactions such as proud, focused, excited, tired, and celebrating. These should be transient presentation states, not saved eye-style identity options.

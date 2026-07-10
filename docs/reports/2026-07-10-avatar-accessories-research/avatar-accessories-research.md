# Executive Summary

FamilyBoard should keep **Accessories** as the user-facing top-level editor area, but evolve its internal taxonomy from one generic `accessory.style` slot into multiple accessory families organized by **wearable region first** and **accessory type second**. The best long-term structure is:

- **Face**: Eyewear now; later face accessories only if they have clear family value and do not turn the avatar into a costume system.
- **Head**: hats, crowns, helmets, party hats, and other objects that sit on top of the head.
- **Hair**: bows, clips, ribbons, flowers, and headbands that are attached to or woven through hair.
- **Neck**: necklaces and scarves.
- **Body / Costume detail**: small torso decorations only when they are identity-supporting and not better represented as clothing.

For users, the editor should continue to say **Accessories** rather than splitting the main navigation into Face / Head / Accessories. Splitting the top-level navigation would make the current Face panel ambiguous because eyes, mouth, and eyewear already live there. The scalable model is: top-level panels remain stable, while the Accessories panel gains clear sections such as Eyewear, Hats, Hair accessories, and Neck accessories.

The existing renderer and catalog are stable enough for Accessories V2 if the next slice is deliberately scoped. The current renderer already has face anchors, body/chest anchors, head-top and hair-side mounts, a dedicated glasses layer, and a split headband path for curly hair occlusion. The current catalog already supports editor panels, category ordering, item tags, renderer bindings, mount points, grouping labels, defaults, and preview hiding. However, the current **single** `accessoryStyle` slot cannot represent long-term coexistence such as glasses + hat + necklace. A larger catalog should therefore add **new accessory-family slots** rather than overloading the current slot.

Accessories V2 should not redesign the renderer, editor, persistence model, or catalog. It should add metadata and slots only where the current model naturally expects them. The first curated expansion should be practical and family-friendly: 12 items covering headwear, hair accessories, and neck accessories while avoiding novelty-only assets.

# Repository Review

## Instructions and constraints reviewed

Reviewed `.github/copilot-instructions.md`, repository `AGENTS.md`, and the repository-local instructions included with this task. This report intentionally does not change production code, renderer code, editor code, catalog data, persistence, tests, screenshots, SVG assets, roadmap files, or current-state files.

## Current renderer constraints

The Avatar V2 renderer is a deterministic inline SVG renderer with typed renderer config. It currently models:

- `GlassesStyle` as a dedicated renderer concept with `none`, regular frame variants, sunglasses, star glasses, and heart glasses.
- `AccessoryStyle` as a single optional accessory family with `none`, hair/head ornaments, headband, crown, and a chest star.
- `AvatarMountPoint` as `chestCenter`, `hairLeft`, `hairRight`, and `headTop`.
- Anatomy anchors for head, face, ears, body, and mounts.
- Layer order: back hair, shirt, base head, eyes, mouth, behind-front-hair accessory, front hair, glasses, hair highlights, accessory.

Important renderer details:

- The current mount system already works for small head/hair/chest accessories.
- Glasses are not implemented as generic accessories; they use a dedicated `avatar-v2-layer-glasses` layer above eyes and before hair highlights/accessories.
- The headband is the strongest proof of the existing layering model. It can render normally or split into rear and visible segments for `curlyPlayful`, preventing the band from unrealistically floating over all hair.
- The renderer currently assumes one generic accessory in `config.accessory`. That is the key long-term limit.

## Current catalog constraints

The shared catalog is already the correct source of truth for product taxonomy. It contains:

- `editorPanels` that group categories into Skin, Hair, Face, Clothing, and Accessories.
- `categories` with slots, order, required/optional behavior, `allowsNone`, presentation settings, tags, and preview behavior.
- `items` with stable IDs, renderer bindings, tags, legacy IDs, labels, accessibility labels, and optional renderer mount points.
- `optionGroups` derived through `group.*` tags.
- Defaults for normalized selections.

Current relevant slots include:

- `eyeStyle`, `mouthStyle`, and `eyewearStyle` in Face.
- `accessoryStyle` and `accessoryColor` in Accessories.
- `clothingStyle`, primary clothing color, and secondary clothing color in Clothing.

The catalog can already support multiple accessory families as multiple categories. It does **not** need a new catalog format for Accessories V2. It does need clearer family metadata if the catalog grows beyond roughly 20 accessory items.

## Editor organization constraints

Avatar Editor V4 is already data-driven. The editor exposes a horizontal category rail and a bounded option surface. It renders sections by catalog panel and catalog category rather than hard-coded feature controls.

Relevant constraints:

- Large catalogs must fit in the existing bounded editor architecture; primary page scrolling is not allowed.
- Category sections already support headings when a panel contains multiple categories.
- Swatches already support tag grouping; tile sections currently render as grids but do not have nested visual grouping inside a tile category.
- The editor should avoid top-level navigation churn because Skin / Hair / Face / Clothing / Accessories is now stable.

## Existing reports reviewed as constraints

- Avatar Editor V4 established that the editor is adaptive, catalog-driven, and should not require users to step through a wizard.
- Accessories V1 established that glasses belong conceptually in Accessories but are surfaced through Face/Eyewear because their renderer layer and user mental model are face-specific.
- Clothing V3 established the preferred expansion pattern: add catalog entries and renderer assets within a stable architecture; do not add speculative framework.
- Eyes V1 established the Face panel ordering and compatibility-default approach.
- Mouths V1 established the pattern of adding a stable identity category with a default and no migration.

# Industry Research

## Apple Memoji

Apple Memoji scales by using **human-recognizable body/face categories** rather than a single undifferentiated accessories bucket. Apple lists skin, hairstyle, head shape, eyes, brows, nose, lips, ears, facial hair, eyewear, and headwear as separate customization concepts. It also lets users select colors for skin, hair, glasses, or hats. Sources: Apple App Store Memoji story, https://apps.apple.com/us/iphone/story/id1445637997; Apple Watch Memoji guide, https://support.apple.com/guide/watch/memoji-apdfb5de8996/watchos.

Why this scales:

- Users can find items by where they appear on the avatar.
- High-conflict items such as eyewear and headwear are separated.
- Color customization is attached to the relevant family rather than hidden in one global accessory color.
- The system leaves room for many variants without forcing every item into one list.

FamilyBoard lesson: keep body-region sections visible in the editor, but do not necessarily split every region into top-level navigation.

## Nintendo Mii

Nintendo Mii is intentionally restrained. Mii customization is strongest around facial features, proportions, and simple identity markers. Public documentation and references describe glasses and hats as available Mii attributes, while Nintendo support notes that certain hats or accessories unlocked in StreetPass Mii Plaza are context-specific and not globally available in Mii Maker. Sources: Mii reference, https://en.wikipedia.org/wiki/Mii; Nintendo support, https://en-americas-support.nintendo.com/app/answers/detail/a_id/662/~/items-unlocked-in-streetpass-mii-plaza-not-appearing-in-mii-maker.

Why this scales:

- Mii avoids catalog sprawl in the core identity editor.
- Most expressiveness comes from adjustable facial features rather than many wearable objects.
- Context-specific rewards can exist without polluting the core editor.

FamilyBoard lesson: accessories should remain curated. Seasonal or achievement-style accessories should be tagged and possibly filtered, not dumped into the default identity set.

## Ready Player Me

Ready Player Me is a cross-platform 3D avatar system. Third-party documentation describes avatar customization through hairstyle/color, mouth, outfit selection, and accessories such as glasses, hats, and earrings, with real-time preview and individual style/color choices. Ready Player Me is also positioned as interoperable across many apps and games, which encourages a normalized asset taxonomy. Sources: Niloom Ready Player Me character documentation, https://docs.niloom.ai/documentation/key-features/generative-ai/genai-assets-individual-assets/characters-ready-player-me; DeepMotion Ready Player Me partner description, https://www.deepmotion.com/companion-tools/ready-player-me.

Why this scales:

- Asset families are separated enough to support interoperability.
- Accessories are treated as attachable assets with predictable regions.
- Real-time preview offsets catalog depth because users can immediately evaluate fit.

FamilyBoard lesson: renderer attachments and catalog slots should remain explicit. A generic single accessory slot is convenient early, but it blocks interoperability between families later.

## Xbox Avatar

Xbox Avatars scaled through a wardrobe/closet model with clothing, props, body customization, color changes, and a marketplace-like item catalog. Historical references describe clothing, props, a large built-in closet, store items, and compatibility challenges between original and newer avatar systems. Source: Xbox Avatar reference, https://en.wikipedia.org/wiki/Xbox_Avatar.

Why this scales:

- Wardrobe organization supports a large item count.
- Store/closet separation handles owned, rewarded, and newly browsed content.
- Props are separate from worn clothing/accessories.
- Compatibility boundaries are explicit.

FamilyBoard lesson: do not mix handheld props, costumes, clothing, and small identity accessories into the same slot. FamilyBoard does not need a marketplace model, but it should tag seasonal/holiday/occupational items separately from core identity accessories.

## Bitmoji

Bitmoji scales through a broad avatar wardrobe and regularly refreshed outfit/accessory catalog. Official Bitmoji messaging emphasizes a personal avatar and a large sticker library; Bitmoji support describes browsing customization options by sliding through feature icons; industry coverage describes branded digital wardrobes and regularly refreshed virtual apparel. Sources: Bitmoji site, https://www.bitmoji.com/; Bitmoji support, https://support.bitmoji.com/hc/en-us/articles/360039735371-I-can-t-find-an-option-I-ve-seen-before; Vogue Ralph Lauren/Bitmoji coverage, https://www.vogue.com/article/ralph-lauren-thinks-people-want-to-shop-their-bitmoji; Vogue Valentino/Bitmoji coverage, https://www.vogue.com/article/would-you-buy-valentino-for-your-bitmoji.

Why this scales:

- The editor separates avatar identity features from wardrobe browsing.
- Fashion drops can be refreshed without changing the underlying avatar model.
- Brand/seasonal content can exist as catalog content rather than renderer architecture.

FamilyBoard lesson: seasonal and themed accessories should be metadata-driven catalog subsets, not new renderer concepts unless they require genuinely new anchors/layers.

## Roblox

Roblox is the strongest example of large-scale accessory taxonomy. It uses accessory types such as hat, hair, face, neck, shoulder, front, back, and waist. Roblox Creator documentation also defines rigid accessory specifications and attachment/size rules by accessory type, while API references expose `AccessoryType` values including Hat, Hair, Face, Neck, and Shoulder. Sources: Roblox Creator Hub rigid accessory specifications, https://create.roblox.com/docs/avatar/rigid-accessories/specifications; Roblox API `AccessoryType`, https://robloxapi.github.io/ref/enum/AccessoryType.html; Roblox accessory overview, https://roblox.fandom.com/wiki/Accessory.

Why this scales:

- Accessory type is effectively a renderer/attachment contract.
- Users browse by broad wearable region.
- Attachment, size, adjustment, and coexistence rules can be enforced per region.
- Large catalogs become manageable because each item declares where it belongs.

FamilyBoard lesson: FamilyBoard should not copy Roblox's complexity, but it should adopt the principle that accessory taxonomy and renderer attachment rules must align.

# Taxonomy Assessment

## Option 1: Keep only “Accessories”

Pros:

- Simple user-facing navigation.
- Matches the current editor panel.
- Avoids top-level proliferation.
- Works for small catalogs.

Cons:

- Breaks down beyond roughly 10–15 items because hats, hair clips, glasses, necklaces, and costume details become one mixed grid.
- Makes coexistence rules hard to explain.
- Encourages a single-slot implementation that prevents glasses + hat + necklace combinations.

Assessment: keep **Accessories** as the top-level editor panel, but do not keep it as the only internal taxonomy.

## Option 2: Top-level Face / Head / Accessories

Pros:

- Mirrors common avatar systems.
- Makes location obvious.
- Reduces mixed accessory grids.

Cons:

- Conflicts with the current Face panel, which already contains eyes, mouth, and eyewear.
- Makes “Head” ambiguous with Hair.
- Adds top-level editor complexity for a feature that is still secondary to identity and clothing.
- Forces users to know whether a headband is Head, Hair, or Accessories before seeing it.

Assessment: not recommended as top-level navigation.

## Option 3: Accessories panel with region/type sections

Recommended.

Structure:

- Accessories
  - Eyewear, if FamilyBoard chooses to keep it visible in Accessories in the future; currently it also fits Face.
  - Hats / Headwear.
  - Hair accessories.
  - Neck accessories.
  - Body details / costume details.

Pros:

- Preserves stable editor navigation.
- Matches user mental models: “I want something on the head / hair / neck.”
- Aligns with renderer attachment needs.
- Scales to 50+ items through sections and filters.
- Allows coexistence through family slots.

Cons:

- Requires more catalog categories/slots over time.
- Requires careful section ordering and labels.
- A few items remain ambiguous: crown can be headwear or costume; headband can be hair accessory or headwear.

Assessment: best fit for FamilyBoard.

## How users should think

Users should primarily think by **body region**, then by **accessory type**, with visual grouping as a secondary aid.

- Body region answers “where does this go?”
- Accessory type answers “what kind of thing is it?”
- Visual grouping answers “is this everyday, seasonal, dress-up, fantasy, or occupational?”

This hierarchy is more scalable than type-only grouping because “flower,” “bow,” and “hair clip” are different types but share one hair-side renderer problem. It is also more scalable than visual grouping because “holiday” can apply to hats, neckwear, clothing, and hair accessories.

# Renderer Assessment

## Existing attachment points

Already available:

- `hairLeft`: good for flowers, clips, small bows, side ribbons.
- `hairRight`: good for flowers, clips, small bows, side ribbons.
- `headTop`: good for crowns, party hats, small top-of-head items, and potentially simple caps.
- `chestCenter`: good for chest pins and torso badges, though some current chest details may be better treated as clothing in the long term.
- Face eye anchors and eye line: already used by glasses.
- Mouth anchor: used by mouths, not suitable for accessories yet.
- Ear anchors: present as anatomy, but not currently exposed as mount points.
- Body neck/shoulder/chest anatomy: present, but only `chestCenter` is exposed as a mount.

## Useful future anchor points

Eventually useful, but not required for Accessories V2 unless that slice includes these groups:

- `headFront` / `forehead`: for caps, visors, tiaras, and items that should align to the front hairline.
- `headTopLeft` / `headTopRight`: for asymmetrical bows, party hats, or angled helmets without overusing `hairLeft`/`hairRight`.
- `earLeft` / `earRight`: for earrings or ear accessories if FamilyBoard ever adds them.
- `neckCenter`: for necklaces, scarves, ties, and medallions.
- `shoulderLeft` / `shoulderRight`: for backpack straps or shoulder accessories, likely out of scope for near-term FamilyBoard.
- `faceCenter` / `noseBridge`: for masks, face paint, or costume noses, intentionally postponed.

## Shared layers by accessory group

Natural layer families:

- **Eyewear**: dedicated glasses layer above eyes/mouth and below final hair highlights/accessories. Already stable.
- **Hair accessories**: final accessory layer for visible clips/bows/flowers; special split layer for headbands where hair occlusion matters.
- **Headwear**: likely needs a headwear layer near the front-hair boundary. Some hats should sit behind front hair; some should cover hair. Accessories V2 should avoid complex full hats unless the renderer can support the necessary occlusion.
- **Neck accessories**: should render above shirt but below head/face or just above shirt depending on geometry. Scarves may need to overlap the lower face/neck; necklaces usually sit on the shirt/neck area.
- **Chest/body details**: render with or above clothing. Many should be considered clothing variants rather than accessories.

## Coexistence and mutual exclusivity from a renderer perspective

The current renderer supports glasses + one generic accessory because glasses are separate from `config.accessory`. It does not support hat + bow + necklace simultaneously because all non-eyewear accessories are collapsed into one `accessory` config.

Natural coexistence:

- Glasses + hair clip/bow/flower.
- Glasses + hat, if hat does not cover eyewear temples in a visibly broken way.
- Glasses + necklace.
- Hat + necklace.
- Hair accessory + necklace.

Natural mutual exclusion:

- Hat + helmet + crown + party hat: one headwear slot.
- Bow + flower + hair clip + ribbon: one hair-accessory slot at first.
- Necklace + scarf: probably one neckwear slot at first because scarves can occlude necklaces.
- Headband + hat: mutually exclusive unless a future renderer explicitly supports band-under-hat combinations.
- Helmet + hair clips/bows: usually mutually exclusive because helmets cover hair.

# Catalog Assessment

## Does the current catalog support multiple accessory families?

Yes, if multiple categories and slots are added. The current catalog already supports:

- Multiple categories inside one editor panel.
- Optional categories with `allowsNone` and defaults.
- Renderer bindings per item.
- Tags and group metadata.
- Mount-point metadata on renderer bindings.
- Editor grouping through `group.*` tags.

## Is additional grouping metadata sufficient?

For browsing only, yes. For actual avatar state, no.

Grouping metadata can help show items as Hair accessories, Hats, Neckwear, Seasonal, Holiday, or Costume. However, grouping does not allow coexistence. If every item remains in `accessoryStyle`, selecting a necklace would replace a bow. That is not a taxonomy problem; it is a slot model problem.

## Are new selection slots required?

Yes for long-term growth.

Recommended slots:

- Keep `eyewearStyle` as its own face/eyewear slot.
- Replace future use of generic `accessoryStyle` with more specific optional slots over time:
  - `hairAccessoryStyle`
  - `headwearStyle`
  - `neckAccessoryStyle`
  - optionally `bodyAccessoryStyle` only if chest/body details remain separate from clothing.
- Keep `accessoryColor` temporarily if color palettes remain simple, but plan for family-specific color slots if needed:
  - `hairAccessoryColor`
  - `headwearColor`
  - `neckAccessoryColor`

For Accessories V2 tomorrow, the smallest safe option is to add one or two new slots for the families being expanded, not a universal multi-accessory array. A generic array of equipped accessories would be more flexible but would be a persistence/editor/renderer redesign, which is explicitly not needed now.

# Editor Assessment

The editor should expose a larger accessory catalog through the existing Accessories panel, not a redesign.

Recommended behavior within existing architecture:

- Keep the top-level rail stable: Skin, Hair, Face, Clothing, Accessories.
- Inside Accessories, show separate sections by category:
  - Hair accessories
  - Headwear
  - Neck accessories
  - Optional Body detail, only if needed
- Keep each section single-select with a visible “None” tile.
- Use section headings when multiple accessory families are shown.
- Use item labels for larger or ambiguous accessories; tiny visual-only tiles work poorly once hats and neckwear are introduced.
- Use ordering to put everyday/core items before seasonal or fantasy items.
- Use tags such as `core`, `seasonal`, `holiday`, `fantasy`, `occupation`, `sport`, and `dress-up` for future filtering.

Evaluation of requested editor patterns:

- **Sections:** recommended; already supported by category structure.
- **Grouping:** recommended via category boundaries first, `group.*` tags second.
- **Filters:** not needed for 10–15 items, useful around 30+ items, likely required around 50+ items.
- **Nested groups:** postpone. They risk turning the editor into a catalog browser.
- **Scrolling:** internal option-surface scrolling is acceptable if bounded; page scrolling is not.
- **Discoverability:** labels and representative preview tiles matter more than deep filtering for the next slice.

# Coexistence Rules

## Recommended allowed combinations

- Glasses + bow.
- Glasses + flower clip.
- Glasses + hair clip.
- Glasses + headband, subject to current headband occlusion behavior.
- Glasses + hat, if the specific hat artwork is designed not to collide with glasses.
- Glasses + necklace.
- Glasses + scarf.
- Hat + necklace.
- Hair accessory + necklace.
- Crown + glasses.
- Party hat + glasses.

## Recommended mutually exclusive combinations

- Hat + helmet + crown + party hat + cap + beanie + sun hat: one `headwearStyle` slot.
- Bow + flower + hair clip + ribbon + side star clip: one `hairAccessoryStyle` slot initially.
- Necklace + scarf: one `neckAccessoryStyle` slot initially.
- Headband + most hats: mutually exclusive at first, because both occupy the hairline/head-top region.
- Helmet + hair accessory: mutually exclusive unless a future helmet is deliberately small or open.
- Chest star + necklace/scarf may coexist visually, but should be postponed because chest decorations overlap clothing identity and may be better represented through clothing.

## Where rules should live

Rules should be **catalog-driven with renderer safeguards**.

Catalog-driven:

- Slots define most mutual exclusion naturally: one headwear item, one hair accessory, one neck accessory.
- Item metadata can declare `family`, `region`, `slot`, and future incompatibility tags.
- Editor can avoid presenting invalid simultaneous combinations.

Renderer-driven:

- Renderer should own physical layer safety: occlusion, anchor placement, and special cases like headband + curly hair.
- Renderer should not be the main policy engine for product taxonomy.
- If an invalid combination reaches the renderer, it should degrade predictably rather than corrupt the SVG.

# Initial Accessory Collection

Recommended first curated Accessories V2 expansion: 12 items. This assumes existing eyewear remains as-is and existing head/hair ornaments are either retained or gradually mapped into clearer families.

## Headwear

1. **Baseball cap**
   - Everyday, gender-neutral, high-recognition item.
   - Tests whether the renderer can support brim/front-hair interaction without becoming a full hat system.

2. **Beanie**
   - Everyday cold-weather option.
   - Visually distinct from a cap and useful for family identity without being novelty-only.

3. **Sun hat**
   - Practical seasonal item with a different silhouette.
   - Useful for summer/vacation avatars without being holiday-specific.

4. **Party hat**
   - Celebration-focused and appropriate for birthdays or family events.
   - Good seasonal/event accessory but still universally understandable.

5. **Crown**
   - Existing tiny crown proves the concept; a clearer crown supports playful child identity.
   - Should stay in headwear and be mutually exclusive with hats.

6. **Helmet**
   - Represents safety/sport/occupation without needing logos or brands.
   - Good test case for intentionally covering hair and excluding hair accessories.

## Hair accessories

7. **Bow**
   - Existing asset already validates the need; belongs in hair accessories rather than generic accessories.
   - High child-recognition value.

8. **Flower clip**
   - Existing asset already validates the need; friendly, readable, and not tied to one season.

9. **Hair clip / barrette**
   - More everyday than a star or flower.
   - Provides a neutral option for users who want small personalization without costume styling.

10. **Ribbon**
   - Distinct from bow if implemented as a trailing ribbon or tied hair detail.
   - Useful for softer identity variation while staying family-friendly.

## Neck accessories

11. **Necklace / pendant**
   - Adds a new region without interfering with face or hair.
   - Good coexistence proof for glasses + hair accessory + neckwear.

12. **Scarf**
   - Practical cold-weather accessory.
   - Useful for seasonal but not holiday-specific expression; should be mutually exclusive with necklace.

## Items to avoid in the first expansion

- Earrings: require ear anchors and careful hair occlusion.
- Masks: strong face occlusion and high expression impact.
- VR headsets: novelty and face-layer complexity.
- Headphones: larger ear/head interaction and hair conflicts.
- Animal ears, horns, wings, backpacks: fantasy/costume expansion, not foundational Accessories V2.
- Ties: may belong to clothing rather than accessories.

# Scalability Assessment

The current architecture can grow to 50+ accessories **if** FamilyBoard stops treating all non-eyewear accessories as a single slot.

## 50+ accessories

Feasible with:

- Multiple slots by family.
- Category sections inside Accessories.
- Tags for grouping and future filtering.
- Defaults and `allowsNone` for every optional family.
- Renderer bindings that declare layer and mount point.

Not feasible cleanly with:

- One `accessoryStyle` list containing every item.
- One universal `accessoryColor` if hats, scarves, and jewelry need different color behavior.

## Seasonal accessories

Supported through metadata. Seasonal items should be catalog-tagged and optionally filtered. They should not require new renderer architecture unless they introduce a new body region.

## Holiday accessories

Supported through tags and possibly visibility status. Holiday items should avoid being default/core items and should not crowd everyday choices.

## Fantasy accessories

Technically supported, but product-risky. Fantasy accessories such as horns, elf ears, wings, and magical crowns affect identity more strongly than everyday accessories. They should be postponed until FamilyBoard decides whether fantasy identity is part of the product tone.

## Occupational accessories

Partially supported. Helmets, aprons, and simple badges can work. More specific occupational gear risks becoming costumes or clothing. Occupational items should be evaluated item by item.

# Risks

- **Slot proliferation:** Too many family-specific slots could make persistence and editor summaries noisier. Mitigation: add only slots that enable real coexistence.
- **Renderer clipping:** Hats and helmets can collide with hair. Mitigation: start with simple silhouettes and explicit mutual exclusion.
- **Catalog overload:** More accessories can make the bounded editor feel crowded. Mitigation: sectioning now, filters later.
- **Ambiguous ownership:** Some items could be clothing or accessory. Mitigation: if it changes the garment silhouette, treat it as clothing; if it is a detachable adornment, treat it as accessory.
- **Legacy compatibility:** Existing `accessoryStyle` items need a migration story if they are split into new families later. Mitigation: keep `accessoryStyle` as compatibility until a dedicated compatibility slice maps old IDs.
- **Color complexity:** One accessory color may not be enough for hats plus jewelry plus scarves. Mitigation: keep simple for V2; add family-specific colors only when needed.

# FamilyBoard Recommendation

If implementing Accessories V2 tomorrow:

## Taxonomy

Use **Accessories** as the top-level editor panel. Internally structure it by accessory family:

- Hair accessories
- Headwear
- Neck accessories
- Optional body detail, only if explicitly needed

Keep Eyewear in the Face panel for now because eyes, mouth, and glasses form the facial identity cluster. Do not move eyewear unless the editor later adds cross-panel accessory filtering.

## Editor organization

Use the existing editor architecture:

- Accessories panel with multiple catalog categories.
- One visible section per accessory family.
- “None” item in each optional section.
- Labels visible for non-tiny items.
- Core everyday items first; seasonal/fantasy/occupational later.
- No nested browse UI in V2.
- No top-level rail changes.

## Renderer assumptions

Assume:

- Glasses remain separate and coexist with accessories.
- Hair accessories use existing hair-left/hair-right/headband logic.
- Simple headwear may use `headTop` only if its geometry is designed for that anchor.
- Neck accessories need a future `neckCenter` anchor before implementation.
- Helmets/full hats should be mutually exclusive with hair accessories unless explicitly designed.

Do not assume:

- Arbitrary accessories can stack in one SVG layer.
- Hats can be added without hair occlusion decisions.
- Neckwear can safely use `chestCenter` forever.

## Catalog additions

Add metadata before or alongside new items:

- `family` or tags equivalent to `family.headwear`, `family.hairAccessory`, `family.neckAccessory`.
- `region.head`, `region.hair`, `region.neck`, `region.face`, `region.body` tags.
- `theme.core`, `theme.seasonal`, `theme.holiday`, `theme.fantasy`, `theme.occupation` tags.
- Renderer binding layer/mount metadata for every item.
- New optional slots for the families included in V2, rather than expanding only `accessoryStyle`.

## Intentionally postpone

- Multi-accessory arrays.
- Drag/position/scale adjustment UI.
- Nested editor browsing.
- Earrings.
- Masks and face coverings.
- Headphones.
- Back/shoulder/waist accessories.
- Fantasy wings/horns/animal ears.
- Marketplace/closet/unlock systems.
- Family-specific accessory inventories.

# Proposed Accessories V2 Scope

Recommended V2 should be one implementation slice, not a full accessory platform.

Scope:

- Add accessory-family taxonomy in catalog metadata.
- Add one or two new accessory slots depending on renderer readiness:
  - safest: `hairAccessoryStyle` and `headwearStyle`;
  - include `neckAccessoryStyle` only if a `neckCenter` anchor is explicitly added and validated.
- Curate 10–15 core accessories, prioritizing existing renderer-compatible regions.
- Preserve existing eyewear.
- Preserve existing `accessoryStyle` compatibility.
- Do not implement production assets until each selected item has a clear layer and coexistence rule.

Best first V2 subset if minimizing renderer risk:

- Hair accessories: bow, flower clip, hair clip, ribbon.
- Headwear: crown, party hat, baseball cap, beanie, sun hat.
- Optional neckwear only if the neck anchor is added: necklace, scarf.

# Future Opportunities

- Add `neckCenter`, `earLeft`, `earRight`, `headFront`, `headTopLeft`, and `headTopRight` anchors as separate renderer slices when needed.
- Add catalog filter chips once accessories exceed roughly 30 active items.
- Add seasonal visibility rules or featured groups without changing persistence.
- Split accessory colors by family if hats, jewelry, and scarves need different palettes.
- Add fantasy/costume accessories only after deciding whether that tone belongs in FamilyBoard.
- Add accessibility-oriented accessories such as hearing aids or medical patches only with careful representation review and appropriate anchors.
- Add occupational accessories through restrained, non-branded, family-friendly items such as helmets or aprons rather than full uniforms.

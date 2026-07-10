# Executive Summary

FamilyBoard should **not** introduce **Glasses** as a dedicated top-level avatar
customization category. Instead, glasses should live inside a broader
**Face Accessories** category, exposed as a prominent, first-shown **eyewear**
group so that users still find glasses immediately.

Across mature avatar ecosystems (Apple Memoji, Nintendo Mii, Xbox Avatar, Meta
Avatars, Ready Player Me, Bitmoji, Roblox, ZEPETO, VRChat), glasses are almost
never a standalone identity-level trait. They are consistently modeled as one
accessory occupying an anatomical **slot** (eyewear / face) and are surfaced in
the UI as a family within an accessories or face grouping. This pattern scales,
keeps the top-level category list short and stable, and produces clean layering
rules against hair, hats, helmets, eyes, eyebrows, facial hair, and future masks
or visors.

FamilyBoard's current catalog already models accessories as a single-slot
`accessory.*` category holding head/hair ornaments. Adopting a region-oriented
**Face Accessories** grouping now — before glasses ship — is a cheap taxonomy
decision. Retrofitting it after users have saved avatars that reference a
`glasses` category would require a data migration. The recommendation is to
choose the scalable grouping up front and feature eyewear prominently within it.

---

# Industry Research

The consistent industry pattern is a separation between **how accessories are
stored/rendered** (anatomical slots or wearable anchors) and **how they are
presented** (grouped by body region or accessory family). "Glasses" is a *slot
value* or *sub-family*, not a first-class category peer to hair, skin, or
clothing.

| System | How glasses are organized | Dedicated category? | Grouped under accessories? |
|---|---|---|---|
| **Apple Memoji** | An **Eyewear** tab within the Memoji editor, sibling to Headwear and Hearing Devices | No | Yes — accessory-level tab |
| **Nintendo Mii** | Grouped with facial add-ons (glasses / mole / facial hair style tabs) rather than an identity trait | No | Yes — facial accessory grouping |
| **Xbox Avatar** | Under an **Accessories / Face** grouping alongside hats and jewelry | No | Yes |
| **Meta Avatars** | Within a **Face** accessories group (glasses beside face-region items), separate from Headwear | No | Yes — face region |
| **Ready Player Me** | A wearable **eyewear** slot in a slot-driven avatar model | No | Yes — slot/accessory |
| **Bitmoji** | Under **Accessories**, eyewear picker | No | Yes |
| **Roblox** | Catalog items bound to an **EyewearAccessory** slot, one of many accessory slots | No | Yes — slot-based |
| **ZEPETO** | Under **Accessories → eyewear** | No | Yes |
| **VRChat** | No fixed category; wearables/props bind to head/eye anchor points | No | Yes — anchor-bound wearable |

Two recurring organizing principles:

- **Data / rendering model:** named **wearable slots** (eyewear, headwear, face,
  neck). Slots enforce mutual exclusivity where required (one pair of glasses at
  a time) while allowing coexistence where appropriate (glasses + hat).
- **UX presentation:** items grouped by **body region or family** — "Face
  Accessories", "Headwear", "Jewelry" — with eyewear a browsable family inside
  the relevant group.

The systems that scale to the largest catalogs (Roblox, Ready Player Me, VRChat,
Memoji) most strongly favor the slot model with region-based presentation.

---

# UX Analysis

**Discoverability.** Glasses are the single most common avatar accessory, so a
prominent, obvious entry point is a genuine UX requirement. However, "top-level
category" and "immediately findable" are not the same thing. Mature systems
satisfy discoverability by making eyewear the *first or most prominent family*
inside an accessories / face group — not by promoting glasses to an
identity-level trait beside hair and skin tone.

**Usability.** A region- or family-based grouping keeps the top-level navigation
short and scannable. Users reason about their avatar by body area ("something on
the face", "something on the head"), which matches a Face Accessories grouping
better than a long, flat list of one-item-per-type categories.

**User expectations.** Users coming from Memoji, Mii, Roblox, or Bitmoji already
expect glasses to live under an eyewear/accessories grouping. Meeting that
learned expectation reduces surprise. A dedicated "Glasses" category would be an
outlier that looks odd the moment a second face accessory (sunglasses, eye
patch, VR headset) appears next to it.

**Conclusion.** Discoverability can be fully preserved by featuring eyewear as
the default, top-of-list family inside Face Accessories, without paying the cost
of a standalone category.

---

# Architectural Analysis

**Option A — Dedicated "Glasses" category.**
- *Pros:* immediate discoverability; trivial to add as a single-select category;
  simple mental model for a one-off addition.
- *Cons:* optimizes for exactly one item type. The moment a second eye-region
  accessory arrives, you must either overload the "Glasses" label (so it no
  longer describes its contents) or add another parallel top-level category
  (category sprawl). Anatomical layering constraints — glasses, monocles, eye
  patches, goggles, VR headsets all compete for the same eye/face layer — are
  hidden by unrelated top-level categories, making conflict rules awkward later.

**Option B — "Face Accessories" category (recommended).**
- *Pros:* industry-aligned; gives glasses a natural, discoverable home; absorbs
  every future eye/face-front accessory (sunglasses, monocle, eye patch,
  goggles, AR glasses, visor, VR headset, masks) without new top-level
  categories; keeps the top-level list short and stable; the region grouping
  maps directly onto the layer that these items share, so conflict/override
  rules become a general slot rule instead of special cases.
- *Cons:* requires an internal grouping/sub-family concept (eyewear vs. full-face
  vs. other) so the group does not become an undifferentiated bucket.

**Option C — Single generic "Accessories" category.**
- *Pros:* simplest possible taxonomy; matches FamilyBoard's current single
  `accessory.*` slot.
- *Cons:* mixes head/hair ornaments, eyewear, neckwear, and full-face items into
  one flat list. As the catalog grows this becomes hard to scan, and it provides
  no natural place to express region-specific layering or mutual-exclusion rules
  (e.g. "only one eyewear item at a time" vs. "glasses and hat may coexist").

**Option D — Pure slot/anchor model with no user-facing grouping.**
- *Pros:* maximally flexible; matches Roblox/VRChat internals.
- *Cons:* overkill for FamilyBoard's family-friendly, curated catalog; a
  slot-only model still needs a presentation grouping for users, which brings us
  back to Face Accessories as the UX layer.

**Long-term scalability.** Options B and D scale; A and C do not. A produces
top-level sprawl; C produces one giant flat list. B combines a scalable internal
structure (region/slot) with a stable, small top-level footprint, which is the
best long-term fit for FamilyBoard.

---

# Layering Analysis

Avatar systems render accessories as ordered layers over the base face, and
group accessories by the anatomical region they occupy so that layering and
mutual-exclusion rules can be expressed generally rather than per item.

Relevant regions and their layer relationships for FamilyBoard's listed items:

- **Base face layers:** skin/head, eyes, eyebrows — the lowest layers.
- **Eye / face-front region (shared eyewear layer):** regular / thick-frame /
  round / rectangular glasses, sunglasses, sport sunglasses, reading glasses,
  safety glasses, star glasses, heart glasses, novelty glasses, steampunk
  goggles, ski goggles, monocles, eye patches, AR glasses. These sit *above*
  eyes/eyebrows and are typically **mutually exclusive** with one another (one
  eyewear item at a time). They usually render *below* hair that falls over the
  face and *below* head/full-face coverings.
- **Head / crown region (headwear layer):** hats, helmets. These render above
  hair at the crown and generally **coexist** with eyewear. Some helmets and
  hats need to hide or reshape hair.
- **Full-face / override region:** face masks, respirators, visors, ski goggles
  worn as full coverage, and VR headsets. These are the most disruptive: they
  often need to **suppress** or replace conflicting layers — e.g. a VR headset
  or full visor hides eyewear and may hide eyes/eyebrows; a respirator or face
  mask hides the mouth region and may interact with facial hair.
- **Facial hair:** renders on the base face; must be layered so that eyewear
  temples and full-face coverings interact correctly (glasses over facial hair;
  a respirator may cover part of it).

**Implication.** These constraints are naturally expressed when accessories are
organized by region/slot with defined layer order and override rules. A single
"Glasses" category cannot host non-glasses eye-region items, and a flat generic
"Accessories" bucket provides no structure to say "these items share a layer and
exclude each other" or "this item hides that layer." A Face Accessories grouping
built on region/slot semantics captures all of the above cleanly.

---

# Scalability Assessment

Evaluated against FamilyBoard's assumed future catalog (regular/thick/round/
rectangular glasses, sunglasses, sport sunglasses, reading, safety, star, heart,
novelty glasses, steampunk goggles, ski goggles, VR headsets, AR glasses,
monocles, eye patches, face masks, respirators, visors, costume accessories):

- **Dedicated "Glasses":** fails fast. It cleanly holds only the ~11 glasses-like
  items; monocles and eye patches are a stretch, and goggles, VR headsets, AR
  glasses, masks, respirators, visors, and costume accessories have no home
  without new top-level categories. Every new type risks another category or an
  overloaded label. Poor scaling.

- **Generic "Accessories":** technically holds everything, but as a single flat
  list of 20+ heterogeneous items across multiple body regions it becomes hard
  to scan and offers no structural place for region-specific layering rules.
  Mediocre scaling.

- **Face Accessories (region/slot-based):** scales well. New eyewear variants
  extend the eyewear family; masks/respirators/visors/VR headsets extend a
  full-face family with override rules; costume accessories and other regional
  items (neck, ears) become additional families/slots — all without touching the
  top-level category count. Strong scaling.

- **Pure slot/anchor model:** scales technically but needs a presentation layer;
  in practice converges on Face Accessories for the UI.

Face Accessories provides the best ratio of future flexibility to top-level UI
stability.

---

# Recommendation

**Adopt a broader "Face Accessories" category and place glasses inside it as a
prominent, first-shown eyewear family. Do not create a standalone "Glasses"
top-level category.**

Rationale:

1. **Industry alignment.** Memoji, Mii, Xbox, Meta, Ready Player Me, Bitmoji,
   Roblox, ZEPETO, and VRChat all treat glasses as an accessory within a face /
   eyewear grouping, never as an identity-level category. Matching this meets
   learned user expectations.
2. **Scalability.** A region-oriented Face Accessories category absorbs all of
   FamilyBoard's assumed future items (sunglasses through VR headsets, monocles,
   eye patches, masks, respirators, visors, costume accessories) without adding
   top-level categories, keeping navigation short and stable.
3. **Clean layering.** Grouping by face region maps directly onto the shared
   eyewear layer and the full-face override layer, so mutual-exclusion and
   hide/override rules against hair, hats, helmets, eyes, eyebrows, facial hair,
   and future masks/visors are expressed generally rather than as special cases.
4. **Low switching cost now, high cost later.** FamilyBoard's catalog is still
   small (a single `accessory.*` slot with head/hair ornaments). Choosing the
   grouping before glasses ship avoids a future schema/data migration away from a
   `glasses` category id on saved avatars.

**Keeping glasses immediately discoverable.** Within the Face Accessories
category, present **Eyewear** as the default-selected, top-of-list family so the
first thing a user sees when opening Face Accessories is glasses. Use a clear,
recognizable label/icon for eyewear. This delivers the "find glasses instantly"
expectation without promoting glasses to a top-level trait — the same approach
Memoji (Eyewear tab) and Roblox (eyewear slot) use.

---

# Risks

**Dedicated "Glasses" category**
- *Architecture:* forces category sprawl or label overloading as soon as a second
  face accessory is added; layering/exclusion rules become per-category special
  cases; saved avatars referencing a `glasses` id require migration if later
  merged into a broader group.
- *UX:* becomes an inconsistent outlier next to other accessories; long, shallow
  top-level list as more accessory types arrive.

**Generic "Accessories" category**
- *Architecture:* no structural place to express region-specific layering or
  mutual exclusion; head, eye, neck, and full-face items share one undifferentiated
  bucket.
- *UX:* a large flat list becomes hard to scan; glasses lose prominence among
  unrelated ornaments.

**Face Accessories category (recommended)**
- *Architecture:* requires an internal grouping/slot concept (eyewear vs.
  full-face vs. other) up front; if that internal structure is skipped it can
  degrade toward the generic-accessories problem.
- *UX:* eyewear must be deliberately featured/first, or discoverability of the
  most common accessory could regress; needs clear labeling so users know face
  items live here rather than under a head/hair accessories group.

**Cross-cutting**
- Full-face items (VR headsets, respirators, visors, ski goggles) that override
  or hide other layers add rendering complexity regardless of taxonomy; the
  grouping choice only affects how cleanly those override rules can be modeled
  (Face Accessories models them most cleanly).

---

# Proposed Category Hierarchy

Conceptual hierarchy only — no implementation details.

```
Avatar Customization (top level)
├── Skin Tone
├── Head / Face Shape
├── Eyes
├── Eyebrows
├── Facial Hair
├── Hair (Style, Color)
├── Clothing (Style, Color)
├── Head Accessories        (crown/headwear region)
│   ├── Hats
│   ├── Helmets
│   └── Headbands / crowns / bows (existing head-hair ornaments)
└── Face Accessories        (face region — NEW broader category)
    ├── Eyewear   ← featured / default-first family (glasses discoverable here)
    │   ├── Regular glasses (thick-frame, round, rectangular)
    │   ├── Sunglasses (regular, sport)
    │   ├── Reading glasses
    │   ├── Safety glasses
    │   ├── Novelty glasses (star, heart, other novelty)
    │   ├── Monocle
    │   └── Eye patch
    ├── Goggles              (steampunk goggles, ski goggles)
    ├── Full-Face Coverings  (may override eyes/eyewear/mouth layers)
    │   ├── Face masks
    │   ├── Respirators
    │   ├── Visors
    │   └── VR headsets
    ├── Smart / AR Eyewear   (AR glasses)
    └── Costume Face Accessories
```

Notes on the hierarchy (conceptual):

- **Eyewear** is the default, first-shown family inside Face Accessories, so
  glasses remain immediately discoverable.
- Items within **Eyewear** are mutually exclusive with one another (one eye-region
  item at a time); **Full-Face Coverings** may hide or override the eyewear and
  eye layers.
- **Head Accessories** (hats/helmets) remain a separate region and generally
  coexist with Face Accessories.
- Future regional accessories (neck, ears) would be added as additional families
  under an accessories grouping, never as new top-level categories.

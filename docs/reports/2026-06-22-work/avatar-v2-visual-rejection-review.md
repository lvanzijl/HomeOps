# Avatar V2 Visual Rejection Review

## Summary
This review treats the six generated showcase SVGs as production illustration candidates, not as renderer or SVG-validity artifacts. The user concern is valid: several combinations still look visually wrong even if the SVGs render deterministically.

Do not ship the full showcase set as-is. `showcase-03.svg` and `showcase-06.svg` should be rejected. The most problematic hairstyle is `curlyPlayful`, especially in dark plum, because it still reads more like a helmet or heavy cap with decorative grooves than naturally growing hair. The suspected headband is actually a problem in `showcase-03.svg`: it sits as a face-level stripe over the curl mass, competes with the bang shape, and makes the front hair harder to understand. The larger issue is asset quality and art direction, not engine quality.

## Showcase-by-Showcase Review

### `showcase-01.svg`
**Assessment: Ship with caveat.**

Hair:
- `shortMessy` immediately reads as hair.
- Growth direction is mostly believable from crown to fringe.
- BackHair and FrontHair agree enough to read as one short, layered style.
- The dark cocoa color remains readable because the silhouette has clear brow-level edges and internal strokes do not fully disappear.
- A child would likely identify it as hair.

Accessories:
- The star is mounted in a plausible hair-right location.
- It competes slightly with the angular bang because both create sharp points near the right forehead.
- It still looks intentional rather than accidental.

Overall avatar:
- Coherent and readable.
- The star/bang overlap is busy but not broken.
- The silhouette makes sense.

### `showcase-02.svg`
**Assessment: Ship.**

Hair:
- `longSoft` reads clearly as long hair.
- Growth direction is believable: top cap sweeps into side and back masses.
- BackHair and FrontHair agree better than the other long or curly samples.
- The warm brown color remains readable.
- A child would identify it as long hair.

Accessories:
- The flower belongs naturally on the left hair mass.
- It does not create major visual confusion.
- It looks decorative and intentional.

Overall avatar:
- Strongest of the set.
- The silhouette is stable and coherent.
- No obvious broken visual element.

### `showcase-03.svg`
**Assessment: Do not ship.**

Hair:
- `curlyPlayful` reads as hair only after inspection; the first read is a rounded purple cap with incised decorative lines.
- Growth direction is weak. The internal arcs suggest curls, but they do not establish where the hair grows from or how it falls.
- The front triangular point at center forehead is too sharp and graphic for a curly hairstyle.
- BackHair and FrontHair agree in color and outline, but not in physical behavior. The back mass reads like a helmet dome while the front mass reads like a separate scalloped visor.
- In dark plum, the style becomes less believable because the large filled cap and dark outlines dominate the curl information.
- A child might call it hair, but may also read it as a hat, helmet, or costume cap.

Accessories:
- The headband is a real problem here.
- It sits across the same visual zone as the bangs and appears pasted over the hair rather than wrapping around the head.
- It competes with the curl strokes and creates a confusing salmon stripe across the forehead.
- It looks intentional as an accessory, but not physically integrated with the hairstyle.

Overall avatar:
- The silhouette is understandable, but the hair/headband combination draws attention for the wrong reason.
- The avatar looks coherent below the forehead; the failure is concentrated in the hair/accessory zone.

### `showcase-04.svg`
**Assessment: Ship with caveat.**

Hair:
- `shortMessy` reads as hair.
- Growth direction is acceptable.
- BackHair and FrontHair are coherent.
- The chestnut color keeps the style readable.
- A child would identify it as hair.

Accessories:
- The bow location is plausible, but it collides visually with the glasses and angular bang.
- It competes with the right glasses lens and temple line.
- The bow still reads as a bow, but the combination is crowded.

Overall avatar:
- Does not look broken.
- The upper-right face area is overloaded, so this combination should be used cautiously.

### `showcase-05.svg`
**Assessment: Ship with caveat.**

Hair:
- The untagged swept short style reads as hair.
- Growth direction is mostly believable from left-to-right sweep.
- Back and front masses agree reasonably well.
- The warm brown hair remains readable against darker skin.
- A child would identify it as hair.

Accessories:
- The chest star belongs to clothing rather than hair, and its placement is understandable.
- It does not compete with the hairstyle.
- It looks intentional.

Overall avatar:
- Coherent and generally shippable.
- The glasses dominate the face but do not create a broken read.

### `showcase-06.svg`
**Assessment: Do not ship.**

Hair:
- `curlyPlayful` has the same core problems as `showcase-03.svg`.
- It reads as a heavy purple cap before it reads as curls.
- Growth direction is weak, especially around the top-right where the accessory lands.
- BackHair and FrontHair are layered coherently, but the physical form still feels helmet-like.
- Dark plum makes the front mass too solid and reduces hair believability.
- A child could identify it as hair, but the read is not immediate enough for production artwork.

Accessories:
- The leaf pin is the most problematic accessory in the set.
- At this size and color, it reads like a peach, shell, ear, or wound-shaped sticker rather than a hair leaf.
- It is mounted on a busy curved edge of the curl mass and fights the hair silhouette.
- It creates visual confusion and looks accidental.

Overall avatar:
- This is the most problematic showcase.
- The avatar body and face are fine, but the hair/accessory zone looks wrong enough to reject the sample.

## Rejected Assets
- `curlyPlayful` hairstyle: do not ship in its current form. It needs redesign, not minor tweaking.
- `leafPin` accessory: do not ship in its current form. It needs redesign, not minor tweaking.
- Current `headband` accessory with `curlyPlayful`: do not ship in this combination. The headband asset may be salvageable for simpler hair, but its current placement and shape are not production-ready with this hairstyle.

## Rejected Combinations
- `showcase-03.svg`: `curlyPlayful` + `headband` should not ship.
- `showcase-06.svg`: `curlyPlayful` + `leafPin` should not ship.
- `shortMessy` + bow + glasses, as shown in `showcase-04.svg`, is not rejected outright, but should be treated as a crowded combination requiring QA before broad use.

## Root Cause Analysis

### `showcase-03.svg`
Cause: multiple causes.
- Hair silhouette: the top mass is too helmet-like for curls.
- Hair flow: internal arcs do not clearly describe growth direction.
- Hair layering: front hair behaves like a separate visor over a dome.
- Highlight placement: highlights decorate the cap but do not clarify curl volume.
- Accessory placement: the headband crosses the bang/curl focal area instead of wrapping convincingly behind and around the hair.
- Accessory design: the thick salmon band has too much visual priority and reads as a graphic stripe.

### `showcase-06.svg`
Cause: multiple causes.
- Hair silhouette: same helmet-like `curlyPlayful` problem.
- Hair flow: weak curl growth and weak directional logic.
- Highlight placement: decorative marks do not rescue the dark plum cap.
- Accessory placement: the leaf pin lands on a busy edge where it interrupts the hair outline.
- Accessory design: the leaf reads as an unrelated organic blob at avatar scale.

## Recommended Redesigns
- Redesign `curlyPlayful` from the silhouette up. It should have recognizable curl clusters or lock groupings, softer forehead behavior, and less of a single helmet cap. Avoid the sharp central forehead triangle unless the style is intentionally anime-like.
- Redesign `leafPin` before shipping. It needs a clearer leaf silhouette, a more obvious center vein, and a color/value relationship that does not read as skin, shell, peach, or injury.
- Redesign the `headband` mounting behavior for curly hair. It should either sit behind foreground curls with partial occlusion, wrap around the head volume, or be limited to simpler hairstyles where it does not cross bangs.
- Rework dark plum hair presentation for `curlyPlayful`. The style needs enough value separation and curl-specific silhouette information to remain readable without relying on thin internal strokes.

## Ship / Do Not Ship Assessment
- `showcase-01.svg`: Ship with caveat.
- `showcase-02.svg`: Ship.
- `showcase-03.svg`: Do not ship.
- `showcase-04.svg`: Ship with caveat.
- `showcase-05.svg`: Ship with caveat.
- `showcase-06.svg`: Do not ship.

Overall: do not continue into editor work assuming these assets are production-ready. The renderer can produce deterministic SVGs, but the art assets still need a targeted redesign pass.

## Next Prompt Context
Avatar V2 visual rejection review completed for `showcase-01.svg` through `showcase-06.svg`. The most problematic showcase is `showcase-06.svg`. The most problematic hairstyle is `curlyPlayful`. The suspected headband is a legitimate problem in `showcase-03.svg`, but the deeper blocker is the `curlyPlayful` hair asset and its accessory interactions. This is an asset-quality/art-direction issue rather than an engine-quality issue. Before editor work continues, redesign `curlyPlayful`, redesign `leafPin`, and revise or constrain `headband` placement with curly hair.

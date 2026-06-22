# Curly Hairstyle Concept Exploration

## Summary
CurlyPlayful is treated as rejected for this exploration. The previous samples did not prove meaningful hairstyle diversity, so this slice does not defend or incrementally tweak that concept.

Three isolated SVG-only comparison samples were created with identical round head anatomy, skin tone, shirt, face, no glasses, no accessory, and dark plum hair color. Only the hairstyle changed:

- `curly-concept-a.svg` — Tight Curl Clusters.
- `curly-concept-b.svg` — Loose Wavy Curls.
- `curly-concept-c.svg` — Playful Child Curls.

This is a concept exploration artifact set, not a production asset-library expansion. No editor UI, persistence, production integration, new avatar systems, new head variants, clothing assets, accessories, gamification, or unlockables were added.

## Concept A Review — Tight Curl Clusters
Concept A uses separate rounded curl groups across the crown with a connected lower curl band.

- Immediate hair read: Strong. The mass sits clearly on top of the head and frames the forehead.
- Immediate curly-hair read: Strongest of the set. The repeated rounded clusters make curl identity obvious without needing labels.
- Growth direction: Acceptable. The clusters imply growth from a central crown down toward the forehead and sides, though it is more symbolic than naturalistic.
- Dark-color readability: Strong. The silhouette remains readable because the scalloped outer contour survives even with dark plum fill.
- Small-size readability: Strong. The five large curl lobes are broad enough to remain identifiable when scaled down.
- Child identification: Strong. A child is likely to call it curly hair because the large circular groups are direct and simple.

Verdict: Best production direction candidate. It has the clearest curly identity and the safest small-size read.

## Concept B Review — Loose Wavy Curls
Concept B uses a lower-volume cap with flowing side waves and side-mass back hair.

- Immediate hair read: Strong. It reads as hair because the cap and side lengths connect believably to the head.
- Immediate curly-hair read: Moderate. It reads more as wavy or long soft hair than distinctly curly hair.
- Growth direction: Best of the set. The sweep from crown into side waves is believable and consistent.
- Dark-color readability: Good. The broad silhouette survives dark colors, but the curl identity depends more on interior strokes.
- Small-size readability: Moderate. At small sizes it may collapse into a general long-hair or side-swept style.
- Child identification: Mixed. A child would likely identify it as hair, but may not identify it specifically as curly hair.

Verdict: Second-best. It is believable and visually calm, but not curly enough to solve the CurlyPlayful blocker by itself.

## Concept C Review — Playful Child Curls
Concept C uses an asymmetrical, stylized child-focused curl silhouette with side puffs and a lively crown.

- Immediate hair read: Good. The placement and side puffs read as hair.
- Immediate curly-hair read: Good, but less disciplined than Concept A. It is playful and curly, but the shape language is busier.
- Growth direction: Weakest of the set. The asymmetry gives charm, but the large curl blobs and strokes do not fully explain how the hair grows from crown to fringe.
- Dark-color readability: Good. The larger shapes remain visible, but some interior definition may compress.
- Small-size readability: Moderate to good. The silhouette is distinctive, but the asymmetry could read as messy rather than intentionally curly.
- Child identification: Good. A child would likely identify it as funny or bouncy hair, though not as reliably as Concept A.

Verdict: Rejected for now. It has charm, but it is less controlled and less believable than A, while not as naturally flowing as B.

## Comparison
Concept A and Concept C both use rounded curl groups, but Concept A is structured as a clear crown of distinct curl clusters while Concept C is intentionally asymmetrical and more cartoon-like. Concept B is fundamentally different from both: it lowers the volume, emphasizes waves and side flow, and avoids the clustered-curl silhouette.

Ranking:

1. Best: Concept A — Tight Curl Clusters.
2. Second-best: Concept B — Loose Wavy Curls.
3. Rejected: Concept C — Playful Child Curls.

## Recommended Direction
Proceed with Concept A as the editor-worthy direction candidate, subject to a future production asset slice. It best satisfies the original curly-hair problem because it immediately reads as hair, immediately reads as curly hair, stays readable in dark colors, remains recognizable at small sizes, and is likely identifiable by a child.

Concept B should be preserved only as a secondary reference for a future separate wavy/loose-curl style. It should not be used as the primary replacement for rejected CurlyPlayful because its curly identity is weaker.

## Rejected Direction
Reject Concept C for Avatar V2 production direction at this time. It is visually playful, but the growth direction is weaker and the asymmetrical curl language risks reading as messy hair rather than a reliable curly hairstyle option.

CurlyPlayful also remains rejected. None of these artifacts should be interpreted as CurlyPlayful being fixed or production-ready.

## Verification
Pre-flight environment setup was run before analysis and implementation:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet:$HOME/.dotnet/tools"
dotnet --version
```

Result: `10.0.301`.

Programmatic verification:

- Avatar V2 targeted tests passed.
- Client test suite passed.
- Client production build passed.
- Concept SVG artifacts are standalone SVG only, with no raster image tags and no external URL references.
- Existing Avatar V2 renderer files were not changed by this concept slice, so the existing deterministic SVG pipeline remains functional.

## Risks
- This is an illustration critique based on local SVG samples, not a user-tested child recognition study.
- Concept A is editor-worthy as a direction, but it is not yet integrated as a production hairstyle asset.
- Dark-color readability was reviewed against dark plum hair only; a future production slice should check the full hair palette and accessory matrix.
- Concept B could be valuable later as a separate loose-wave option, but using it as the main curly replacement would leave the curly-hair blocker partially unresolved.

## Next Prompt Context
CurlyPlayful remains rejected. The strongest replacement direction is Concept A, Tight Curl Clusters. Concept B is second-best and may inform a future loose-wavy style, but it is not curly enough to be the primary fix. Concept C is rejected because it is charming but less believable and less controlled. A future implementation slice should convert Concept A into the Avatar V2 renderer only if explicitly requested, preserving SVG-only deterministic output and `AvatarAnatomy` as the source of truth.

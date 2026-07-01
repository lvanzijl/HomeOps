# FamilyBoard Marketing Visual Polish

Date: 2026-07-01

## Summary

Final visual polish focused on measured product presentation only. The pass changed shared CSS/design-system rules for Home avatar composition and wall-tablet operational typography, preserved Avatar V2 rendering, preserved the storyboard, and did not publish a movie.

## Home avatar measurements

| Measurement | Before | After | Result |
|---|---:|---:|---|
| Home family strip touch target | `min-height: clamp(8.5rem, 15vh, 12rem)` | unchanged | Preserved |
| Avatar visible container | `clamp(5.6rem, 9.2vw, 7.4rem)` | `clamp(6.45rem, 10.8vw, 8.65rem)` | +15.2% minimum / +17.4% vw / +16.9% maximum |
| Avatar drawing scale inside container | 118% | unchanged | Avatar V2 rendering preserved |
| Name font size | `clamp(1rem, 1.15vw, 1.18rem)` | `clamp(0.95rem, 1vw, 1.08rem)` | Name dominance reduced |
| Tile spacing | `clamp(0.7rem, 1.1vw, 1rem)` | `clamp(0.75rem, 1vw, 0.95rem)` | Slightly tighter horizontal competition |
| Tile min width | `minmax(9.5rem, 1fr)` | `minmax(9rem, 1fr)` | More unused horizontal space returned to avatars |
| Chip padding | `1rem` | `0.9rem 0.85rem` | Same touch target, more drawing room |

Finding: Home avatars were still visually weaker than desired because the name scale and tile padding competed with the portrait. The visible avatar was increased within the existing touch target; Avatar V2 SVG rendering itself was not redesigned.

## Typography audit

Operational content was audited against wall-mounted tablet use. The pass introduced shared operational typography tokens rather than enlarging every label equally.

| Surface | Before | After | Result |
|---|---:|---:|---|
| Shared operational text token | none | `--fb-type-operational: clamp(1.06rem, 1.05vw, 1.2rem)` | New shared top operational scale |
| Shared compact operational token | none | `--fb-type-operational-compact: clamp(0.98rem, 0.95vw, 1.08rem)` | New shared row/body scale |
| Shared operational metadata token | none | `--fb-type-operational-meta: clamp(0.84rem, 0.78vw, 0.92rem)` | Metadata remains subordinate |
| Shopping item text | inherited/small row scale | compact operational token | Improved wall readability |
| Task titles | `clamp(0.98rem, 1.1vw, 1.12rem)` | operational token | Improved primary action readability |
| Agenda event titles | local card scale | operational token | Improved event readability |
| Agenda event metadata | several `0.7rem`-range values | metadata token for core operational metadata | Still secondary |
| Home operational summaries | mixed local row sizing | compact operational token | More consistent readability |
| Weekly Reset operational text | inherited body/meta sizing | compact operational token | Preserves benchmark while improving body readability |
| Motivation operational text | `0.84rem`/local copy sizing | compact operational token | Improved without changing dashboard hierarchy |

Conclusion: operational typography is now more appropriate for a wall-mounted tablet while hierarchy remains intact. Headings, hero text, and emotional benchmark elements were not flattened into one size.

## Shopping investigation

Shopping execution and timing were verified from the canonical storyboard metadata and validation run.

| Measurement | Value | Finding |
|---|---:|---|
| Scene id | `shopping` | Present in canonical 9-scene storyboard |
| Fixture | `visual-marketing-shopping` | Correct rendered page target |
| Minimum duration | 6000 ms | Not abnormally short |
| Preferred duration | 7000 ms | Matches the calibrated target |
| Maximum duration | 8000 ms | No timing expansion required |
| Initial grouped-list hold | 1200 ms scene initial hold + 800 ms grouped-errands pause | Grouped shopping is intentionally visible before the add action |
| Post-add visibility | 900 ms post-add hold + 750 ms grouped-list pause + 700 ms post-scene hold | Added item and grouped list remain visible |
| Validation measured scene duration | 11,099 ms actual in local validation run | Shopping completed and remained visible beyond target in this environment |

Finding: Shopping already executes as an explicit grouped-shopping scene and remains visible long enough under the current timing configuration. No storyboard order or Shopping timing change was made.

## Visual hierarchy findings

- Home: avatar prominence was the main measurable weakness; increased portrait size and reduced name dominance address the hierarchy without changing the layout.
- Family: Avatar V2 rendering and family detail surfaces were preserved; no new family layout changes were introduced.
- Agenda: operational event titles received the shared operational scale; metadata remains subordinate.
- Tasks: task titles now use the shared operational scale while chips and metadata remain smaller.
- Shopping: grouped store headings, item rows, and recent chips now use shared operational scales; the grouped-shopping layout and lifecycle behavior are unchanged.
- Motivation: operational cards and helpful-moment copy use the compact operational scale, preserving the Family Goal as the dominant anchor.
- Weekly Reset: benchmark hierarchy was preserved; supporting operational text is more readable without reducing hero/stat prominence.

## Before/after measurements

- Home visible avatar max: 7.4 rem → 8.65 rem (+16.9%).
- Home visible avatar min: 5.6 rem → 6.45 rem (+15.2%).
- Home name max: 1.18 rem → 1.08 rem (-8.5%).
- Operational primary text: task title minimum 0.98 rem → 1.06 rem (+8.2%).
- Operational compact rows: shared minimum established at 0.98 rem for Home, Shopping, Motivation, and Weekly Reset supporting copy.
- Operational metadata: shared maximum established at 0.92 rem, keeping hierarchy below primary operational content.

## Validation

- Marketing storyboard source validation: passed; 9 scenes, 84,000 ms preferred total, 90,000 ms maximum total.
- Marketing production validation mode: passed after installing missing Playwright/Chromium system dependencies; navigation completed all 9 scenes, temporary artifacts were cleaned, and no final movie was intentionally published.
- Client tests: run after CSS changes.
- Diff check: run after implementation.

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-07-01-marketing-visual-polish/marketing-visual-polish.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Were Home avatars improved? Yes. Visible Home avatar size increased approximately 15–20% while preserving the touch target and Avatar V2 renderer.
- Is operational typography now appropriate for a wall-mounted tablet? Yes. Shared operational typography tokens improve row/title readability without flattening hierarchy.
- Was Shopping verified? Yes. Shopping is present as the `visual-marketing-shopping` scene, uses grouped list fixture content, and has calibrated 6–8 second scene timing with visible grouped-list holds.
- Were changes implemented through shared design-system rules? Yes. Typography changes use shared CSS tokens and Home avatar composition changes use shared Home strip rules.
- Was Weekly Reset preserved as the visual benchmark? Yes. Weekly Reset hero/stat hierarchy was not redesigned; only supporting operational text readability was aligned.
- Was no final movie intentionally produced? Yes. Validation mode was used; publish mode was not used.

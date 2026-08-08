# Phase 6 Slice 6.0 — Motivation viewport analysis

**Status:** Approved on 2026-08-08 for Slices 6.3 and 6.4.

## Current page composition

Motivation is a fixed-height primary workspace with one dashboard grid:

- top-left: the shared family-goal card;
- top-right: a compact helpful-moment/appreciation preview with create and history actions;
- bottom, full width: a celebration/story card summarizing the family celebration, memories, personal goals, and detail destinations.

Family-goal create/edit, progress details, memories, personal-goal management, helpful-moment creation, and appreciation history already use dialogs. The page currently lacks an explainable progress ledger/correction path, helpful-moment edit/delete, and family-goal stop/archive lifecycle.

## Measurements and the current overflow defect

Live inspection used the isolated PostgreSQL `visual-full` fixture at 1280×720. Body and document vertical overflow were both 0 px, and the existing Playwright primary-page guard passes at 1440×900 and 1366×768. Zero document scroll does not mean the current composition fits correctly:

| Region | Measured height/content | Result |
| --- | ---: | --- |
| Motivation page body | 574 px | Bounded, `overflow: hidden` |
| Dashboard grid | 549 px | Top row 333 px; bottom row 204 px |
| Family-goal card | 331 px client / 588 px content | `overflow: hidden`; content is clipped |
| Family-goal summary row | 244 px client / 576 px content | Descendants escape the reserved row |
| Progress/proof block | 216 px, ending at y=490 | Extends below the card's y=471 boundary |
| Next-step storyline | Starts at y=615 | Entirely outside the visible goal card |
| Fixed goal actions | y=417–458 | Painted over overflowing progress content |
| Helpful-moment preview | 313 px | Fits and remains bounded |
| Celebration/story card | 204 px | Fits and remains bounded |

The defect is therefore internal clipping and overlap, not document scrolling. Adding a ledger summary, correction button, helpful-moment actions, or goal archive controls without first compacting the goal card would deepen the regression. The approved analysis supersedes the current primary-card composition for all Phase 6 Motivation work.

Current bounded detail surfaces are a useful base: the progress dialog measured 448 px high with zero document overflow, the personal-goal grid owns its own vertical scroller, and the appreciation-history dialog stayed within the 720 px viewport. Appreciation history currently lets its entire dialog scroll; Phase 6 should instead keep its header/actions fixed and make the feed the overflow owner.

## Primary and secondary information

Always-visible primary information:

- family-goal title;
- current progress, target, unit, and one progress bar;
- one truthful sentence identifying the approved progress source/semantics;
- compact access to progress/audit detail and family-goal management;
- two newest helpful moments plus add/history actions;
- compact celebration, memories, and personal-goal summaries in the bottom story region.

Contextual/secondary information:

- immutable ledger rows, source detail, timestamps, and correction relationships;
- correction form and reason;
- detailed proof/stat tiles and repeated next-step/celebration copy;
- all helpful moments and their edit/delete actions;
- personal-goal full list/editing;
- family-goal stop/archive confirmation and archived history;
- celebration memory history.

No ledger, history, archive list, or edit form belongs in the default dashboard grid.

## Approved composition

```text
Motivation page body (overflow hidden)
└── Story grid: columns minmax(0,1.3fr) minmax(22rem,.92fr)
    ├── Goal card (top-left; compact summary minmax(0,1fr) + fixed actions)
    ├── Appreciation preview (top-right; exactly two preview rows)
    └── Celebration/story strip (bottom, full width; compact summaries/actions)

Bounded contextual surfaces
├── Progress ledger + compensating correction
├── Family-goal edit / stop-archive confirmation / archived history
├── Helpful-moment create/edit/delete + internally scrolling history feed
├── Personal-goal management
└── Celebration memories/details
```

### Required primary-card compaction

- Keep one title/anticipation block, one current/target progress block, one short source-semantics line, and one fixed action row.
- Remove the duplicate full `FamilyCelebrationDisplay`, two large proof tiles, and off-screen storyline from the default goal card. Celebration belongs in the existing bottom story region; detailed proof belongs in progress detail.
- At the observed stricter viewport the top card has about 331 px. After padding, gap, and a roughly 53 px action row, the summary must fit in approximately 240 px without overlap or hidden required content.
- `overflow: hidden` remains a safety boundary only after content fits. It must not be used to conceal required controls or copy.

### Slice 6.3 placement

- Slice 6.3 must decide and document authoritative progress semantics before finalizing the source sentence. The UI cannot imply manual progress if only attributed completed tasks count, or vice versa.
- Extend `Meer voortgang` into a bounded ledger workspace with fixed header and action row, an internally scrolling ledger body, source type/id, time, delta, reason, and correction reference.
- `Correctie toevoegen` transitions the same dialog into a compensating-entry form; do not stack dialogs and do not mutate existing ledger rows.
- Backfill entries and task completion/reopen effects appear in the ledger, not as more default-page tiles.

### Slice 6.4 placement

- Keep exactly two helpful moments in the default preview. Add a compact per-row action/menu only if it fits without increasing preview row count or card height.
- Appreciation history becomes a fixed-header, internally scrolling feed. Edit and delete use the same bounded surface or a single replacement state; delete requires explicit confirmation and retained error recovery.
- Family-goal stop/archive belongs in the existing family-goal management surface. Confirmation names the goal and explains the effect on progress/history/celebration; it replaces the dialog body rather than stacking.
- Archived family goals are reached through an existing story/history destination. Restore is exposed only if Slice 6.4's semantics explicitly permit it.
- Removed-member references remain rendered as historical attribution; they do not create a new page region.

## Viewport-fit justification

The dashboard grid itself already stays within the viewport and passes the exact 1440×900 and 1366×768 document-scroll guard. At the stricter live 1280×720 measurement, the grid provides a 333 px top row and 204 px bottom row. Compacting the goal summary to the stated budget makes every required default action fit inside the existing grid without changing row sizes.

All variable-length Phase 6 information moves into dialog bodies with `minmax(0, 1fr)` and `overflow-y: auto`; headers and action rows remain fixed. Helpful-moment count, ledger length, archived-goal count, and personal-goal count therefore cannot alter page height.

## Risks, trade-offs, and alternatives

- Removing proof/celebration duplication makes the primary card less visually rich, but the same information remains in the bottom story strip and detail surfaces and becomes actually readable.
- An internally scrolling family-goal card was rejected: the primary current progress and actions must remain visible together, and nested card scrolling would hide core state.
- A full-width single-column Motivation document was rejected because it reintroduces page flow and vertical document scrolling.
- A fourth persistent dashboard card for ledger/history was rejected because it would shrink all three current primary regions.
- Per-row helpful-moment actions can crowd the preview; if they do, keep them in the history dialog and expose only one compact menu trigger in previews.
- Fixed dialog actions must not cover the final ledger/history row, and error messages must remain within the dialog's scroll/layout budget.

Implementation must follow this composition. A material change to the three-region dashboard, goal-card information hierarchy, or bounded lifecycle strategy requires revising this analysis before implementation.

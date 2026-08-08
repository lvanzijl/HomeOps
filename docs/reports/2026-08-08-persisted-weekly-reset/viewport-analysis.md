# Weekly Reset persisted workflow — viewport analysis

## Scope and current composition

Phase 4 Slice 4.5 changes the primary Weekly Reset page. The workspace shell already reserves a fixed application viewport, a compact navigation/header region, and a `minmax(0, 1fr)` page body. Inside that body, Weekly Reset currently renders a document-style stack: a second hero, three metric cards, a large intention card, five review/recap cards whose heights follow their data, a completion card, and a status line. The page body therefore becomes the overflow owner and the whole page scrolls vertically.

The current page also derives readiness from candidates disappearing after unrelated source mutations. Family- and individual-goal keep buttons do nothing, shopping candidates have no actions, skip exists only in React state, and there is no explicit completion or history surface.

## Why the reserved region is exceeded

- The shell header and Weekly Reset hero repeat title/context and consume two fixed vertical bands.
- Three standalone metrics and the intention card use substantial height before the first decision.
- Five cards are laid out by content height. Every candidate adds rows and buttons to the global page height.
- Contribution recap content is unbounded and shares the same document flow as required decisions.
- Completion is after all variable content, so the primary finish action cannot remain visible.

This structure exceeds both 1440×900 and common 1366×768 laptop regions under realistic candidate data. CSS compaction alone cannot make arbitrary candidate and history volume safe.

## Primary and secondary content

Primary content is the current household/week identity, persisted status and progress, unresolved candidate decisions, visible mutation feedback, explicit completion, and the intentional skip action. Those controls must remain available without document scrolling.

Secondary content is explanatory ritual copy, contribution counts and moments, celebration memories, resolved candidates, and prior-week history. It must remain accessible, but it may be summarized, filtered, and internally scrolled.

## Approved composition

The Weekly Reset page becomes a fixed-height three-row grid inside the existing shell body:

1. **Compact command band (`auto`)** — week range, Open/Completed state, persisted `resolved / total` progress, and named History and Skip actions. The existing shell header remains the page title; the redundant large hero and standalone metric grid are removed.
2. **Reset workspace (`minmax(0, 1fr)`)** — a two-column grid. The wider primary column contains category filters and one internally scrolling candidate list. Each row shows its snapshotted label/context, current decision state, pending/error feedback, and every valid action for that candidate type. The narrower secondary rail summarizes completed tasks/helpful moments and shows a bounded, internally scrolling recap. Resolved rows remain visible through a filter so progress is auditable without changing page height.
3. **Completion footer (`auto`)** — status explanation plus `Week afronden`. The button is disabled until every required candidate has a persisted decision. Completed and skipped sessions render read-only outcome copy and timestamp in the same reserved footer.

History opens from the command band in one viewport-bounded dialog. The left side lists prior reset instances; the right side shows the selected instance's snapshotted candidates and decisions. Both lists own their overflow. Skip uses a smaller bounded confirmation dialog and completes the weekly instance with a distinct `Skipped` outcome; it never masquerades as a candidate decision or “decide later.”

At widths below 920px, the workspace changes from columns to two reserved rows with the candidate list receiving the larger share. At heights below 780px, padding and explanatory copy compact; the command and completion bands remain visible. No content count may alter the three global row allocations.

## Data and interaction contract

- The server creates or resumes one reset instance per household and household-local Monday week start.
- Candidate membership and display labels are snapshotted when the instance is first created. Changed or deleted source records therefore remain intelligible in history.
- Candidate types are task, family goal, individual goal, and shopping list. Decisions are persisted with the candidate, optional actor label, and timestamp.
- Task actions are carry forward, later, or archive where valid. Goal and shopping actions are carry forward or archive. If a snapshotted source no longer exists, acknowledge resolves it without pretending a source mutation succeeded.
- The server applies a source mutation and records its decision in one save. Repeating the same decision is idempotent; changing an Open-session decision is supported and replaces its timestamp/actor.
- Progress comes only from persisted candidate decisions. Source records disappearing or new candidates appearing after session creation do not silently change progress.
- Completion is rejected while any candidate is unresolved. Completion and skip are idempotent and lock the instance read-only.
- Loading the page after navigation or refresh resumes the same current-week instance. History is server-backed and read-only.
- Pending state disables only the affected mutation or terminal action. Errors retain the candidate, chosen context, and retry path.

## Viewport fit justification

The shell already fixes the application to the viewport. Weekly Reset will set `height: 100%`, `min-height: 0`, and `overflow: hidden`; only the candidate list, recap rail, and bounded history dialog use `overflow: auto`. The command and completion bands have compact content-driven height, leaving the remaining height to a true `minmax(0, 1fr)` workspace. At 1440×900 and 1366×768 the two-column composition retains practical decision-row width; the short-height density rule preserves the same information architecture. Document/body vertical overflow must remain zero in the isolated browser suite.

## Risks, trade-offs, and alternatives

- Freezing candidates means a new eligible record created midweek waits for the next reset. This is intentional: stable progress and truthful history take precedence over a moving target.
- Source mutation may make a candidate stale. An explicit acknowledge action preserves completion without rewriting history or claiming the source was changed.
- A wizard was considered, but it hides overall progress and makes cross-category review slower. One filtered internal list keeps decisions comparable and resumable.
- Keeping the current five-card masonry with individual scroll areas was rejected because it creates multiple competing scroll owners and still pushes completion below the fold.
- A separate History primary page was rejected because Slice 4.5 can provide complete read-only review in a bounded dialog without expanding navigation or routing scope.

This report is the Slice 4.5 implementation authority. Runtime layout and interaction changes must follow it; a material information-architecture change requires revising this analysis before implementation continues.

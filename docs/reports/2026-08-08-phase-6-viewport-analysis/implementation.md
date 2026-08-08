# Phase 6 Slice 6.0 — Mandatory primary-page analyses

**Status:** Completed on 2026-08-08.

## Outcome

- Approved a separate Shopping viewport contract for Slices 6.1–6.2.
- Approved a separate Motivation viewport contract for Slices 6.3–6.4.
- Recorded current composition, primary/secondary hierarchy, always-visible content, internal overflow owners, exact lifecycle placement, alternatives, risks, and viewport budgets.
- Confirmed Shopping's execution-first structure is the correct authority, while identifying a content-box card overshoot that Slice 6.1 must remove.
- Identified a real Motivation internal-overflow regression: a 331 px hidden-overflow goal card contains 588 px of content at 1280×720, so progress, celebration, storyline, and actions clip/overlap despite zero document scroll. Motivation implementation may not begin by merely adding controls; it must first realize the approved compact goal-card contract.
- Created `docs/roadmap/phase-6.md` and advanced only Slice 6.0. No audit finding is marked complete because Slices 6.1–6.4 remain.

## Validation

| Gate | Result |
| --- | --- |
| Repository, master plan, audit, source, CSS, and test inspection | Passed |
| Isolated PostgreSQL `visual-full` fixture | Loaded without touching the normal HomeOps database |
| Live Shopping composition and management dialog inspection | Completed at 1280×720; 0 px document/body overflow; host overshoot documented |
| Live Motivation dashboard and detail-dialog inspection | Completed at 1280×720; 0 px document/body overflow; internal clipping/overlap measured and documented |
| Existing Playwright primary-page viewport guard | 1/1 passed at 1440×900 and 1366×768 |
| Product builds/tests | Not run; this slice changes documentation only |

## Boundary

This slice changes documentation only. It does not modify Shopping or Motivation source, shared styles, APIs, persistence, migrations, fixtures, generated contracts, Phase 1 history, or later-phase scope.

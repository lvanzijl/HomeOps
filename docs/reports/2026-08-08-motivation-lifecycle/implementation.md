# Phase 6 Slice 6.4 — Motivation lifecycle completion

Slice 6.4 completes `MOT-02` and `MOT-03` without changing the approved three-region Motivation dashboard.

## Delivered behavior

- Helpful moments can be corrected through an expected-update contract and softly removed after explicit confirmation.
- Browser/client timestamp precision is normalized to milliseconds so optimistic concurrency is stable across JSON and JavaScript `Date` conversion.
- Removed family members remain named on historical appreciation. A correction may retain that removed member, but new reattribution requires an active member.
- Weekly Reset excludes softly removed appreciation while retaining removed-member attribution for visible history.
- Stopping a family goal archives it, prevents future task contributions, and retains its ledger, projected progress, and celebration state.
- Archived goals appear in the existing story/history dialog. Restore is available only when no active family goal exists; the API returns conflict rather than silently replacing one.
- Appreciation edit/delete, family-goal stop confirmation, and archived history replace or scroll inside existing bounded dialogs.

Migration `20260808185514_CompleteMotivationLifecycle` adds helpful-moment update/delete state and the family-goal archive timestamp. Existing appreciation update timestamps are backfilled from creation time at millisecond precision; historical archive dates are not invented.

## Validation

- Focused backend lifecycle tests: 27/27, followed by helpful-moment post-fix tests 5/5.
- Focused frontend Motivation/appreciation tests: 21/21.
- Full backend: 661/661.
- Full frontend: 390/390.
- PostgreSQL migration/model baseline: 5/5.
- API and frontend production builds pass.
- Pinned NSwag 14.7.1 ran twice; the generated client SHA-256 remained `F8AF6C73E885E1316455CB550BF193561AE937CBC48D8695889458B2B916D5FA`.
- Isolated PostgreSQL-backed Playwright: 20/20, including appreciation correction/removal, family-goal archive/restore, and the global no-document-scroll checks at 1440×900 and 1366×768.
- Independent in-app inspection at 1280×720 measured zero document overflow, a 331/331 px goal card, a bounded 706 px appreciation-history dialog, a 570/570 px editor, and a 211/211 px stop confirmation.

The existing SQLite package advisory remains visible during restore/test output and is unrelated to this slice.

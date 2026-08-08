# Phase 5 Slice 5.3 — Room climate configuration UI

## Outcome

Settings → Woning now provides a usable room-level climate policy workflow. Active rooms expose `Klimaat instellen` or `Klimaat bewerken`; the bounded editor persists climate enablement, bedtime relevance, optional preferred temperature and humidity ranges, and heating-policy intent through the generated API client. Archived rooms stay non-editable and explain that restoration is required first.

The form reports new/unsaved, saving, saved, unchanged, validation, and backend-error states. It rejects incomplete, out-of-range, reversed, and equal range bounds before sending, requires a temperature range for bounded heating intent, clears bedtime relevance when climate is disabled, and retains edited input when the backend rejects a save. Configuration read failures now surface as Woning errors instead of being treated as an unconfigured room.

## Viewport implementation

The implementation follows the revised [viewport analysis](./viewport-analysis.md). A real Chromium pass exposed an existing fixed-height overlap: the room list collapsed behind Home Assistant, floor-plan, and archive siblings. The analysis was revised before layout code changed. The selected-floor header and summary remain fixed, while the active room list and existing integration/archive material now occupy separate bounded internal-scroll regions. The nested climate editor owns an internally scrolling form body and a fixed action footer.

No provider/source mappings, credentials, provider lifecycle, floor-plan upload, runtime heating authority, or weather settings were added.

## Regression coverage

- generated request construction for every editable field;
- new, saving, saved, unchanged, validation, and backend-error state;
- supported temperature/humidity limits and strict minimum-below-maximum validation;
- bounded-control temperature requirement;
- draft retention after backend failure;
- explicit disable behavior and bedtime clearing;
- configuration load failure visibility;
- persistence of every editable field through a fresh database scope and API round trip;
- browser create, validation, edit, refresh persistence, disable, archived-room guidance, and fixed-viewport interaction;
- no document-level vertical scrolling at 1440×900 and 1366×768.

## Validation

- Focused frontend tests: 18/18 passed.
- Focused climate API/persistence tests: 5/5 passed.
- Full frontend suite: 366/366 passed with the established 20-second timeout budget.
- Full backend suite: 641/641 passed.
- Solution build and frontend production build: passed.
- PostgreSQL migration baseline: 4/4 passed through Rancher Desktop.
- EF migration list, pending-model check, and idempotent migration script: passed.
- Pinned NSwag 14.7.1: two generations produced identical OpenAPI and TypeScript-client SHA-256 hashes.
- PostgreSQL-backed Playwright suite: 12/12 passed.
- Independent in-app browser inspection: valid save and strict validation passed; no console errors; zero body/document overflow at both required viewports; the 1366×768 editor kept its footer inside the viewport and contained 260 px of overflow inside the form body.

The solution build still reports the repository's existing `SQLitePCLRaw.lib.e_sqlite3` advisory, the EF CLI still reports its existing 10.0.1-versus-10.0.4 version warning, and the frontend build still reports the existing large-chunk warning. None was introduced by this slice.

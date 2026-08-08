# Phase 5 Slice 5.5 — Floor-plan upload and replacement entry

## Outcome

Settings → Woning now gives the selected floor a real `Plattegrond uploaden` or `Nieuwe plattegrond uploaden` action. The bounded workflow accepts SVG, PNG, JPG, and JPEG up to 10 MiB, retains the selected file after recoverable failure, and leaves content detection, truncation checks, dimension limits, SVG sanitization, and atomic storage authoritative on the existing backend ingestion endpoint.

After upload, the dialog shows the server-produced safe derivative, normalized filename/type/dimensions, and validation summary before any activation. A first plan requires an explicit `Plattegrond activeren` action and then offers the existing room-boundary editor. A replacement never activates directly: it starts the existing replacement-review lifecycle, where the current plan remains active until review completes.

Phone guidance is explicit. File selection and upload remain available, while room-boundary checking and drawing are recommended on a larger screen.

## Viewport implementation

The approved composition keeps a compact floor-plan card inside the existing secondary Woning scroll owner and places file guidance, progress, errors, derivative preview, and next actions in a fixed-header/footer dialog with an internally scrolling body.

PostgreSQL-backed Chromium exposed a pre-existing placement defect after a replacement review started: the full review workspace rendered inside the small secondary region, leaving controls in the accessibility tree while the clipped Settings root intercepted pointer input. The viewport analysis was revised before the layout fix. The secondary region now keeps only a compact review/resume card, and active review opens as a dedicated bounded Woning sub-workspace with a named return action. This preserves the primary room-management composition and document-scroll prohibition.

## Validation

- Focused frontend: 20/20 across upload, Woning, replacement review, and room-overlay behavior.
- Focused floor-plan backend: 8/8, including unsafe SVG sanitization, invalid/mismatched media, truncated raster data, dimension limits, byte limits, atomic write failure, activation, replacement protection, and derivative/backup behavior.
- Full frontend: 374/374 with the established 20-second timeout budget.
- Full backend: 643/643.
- Builds: `dotnet build HomeOps.sln --no-restore` and the frontend production build passed. Only the existing SQLitePCL advisory and bundle-size warnings remain.
- PostgreSQL migration baseline: 4/4; EF migration list, pending-model check, and idempotent script generation passed. The existing EF tool/runtime version warning remains.
- Generated contracts: pinned NSwag 14.7.1 ran twice with identical hashes (`openapi.json` `EBEBCAA620B18DAA1AE046EC34BCD2476D75BBA680DC288B6085A92A4E20318C`, TypeScript client `2398F87182ACE6610B992568965512186ED54DE5E9371FB84AC7FA155083F43F`). No generated-contract change was required.
- PostgreSQL-backed Playwright: 14/14, including invalid client media, sanitized preview, explicit first activation, replacement entry, cancellation, retry, and zero document overflow at 1440×900 and 1366×768.
- Independent in-app browser: active-plan state, compact review resume, dedicated-workspace entry, clickable cancellation, confirmation, return navigation, zero error logs, and zero body/document overflow at 1280×720.

The first Playwright attempt stopped on an ambiguous preview-text selector. After that test-only correction, browser validation exposed the real inline-review pointer interception described above; the revised composition passed the clean final run.

## Scope boundary

Changes are limited to the existing floor-plan ingestion/replacement-review entry path, Settings → Woning composition and styles, focused frontend/backend/browser tests, and Phase 5 documentation. No endpoint, DTO, database model, migration, generated contract, provider credential/lifecycle, runtime heating authority, or weather behavior changed.

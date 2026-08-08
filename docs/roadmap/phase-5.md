# Phase 5 — House, climate, and household settings

Phase 5 completes the Woning setup-to-runtime chain: reliable schema upgrades, reachable climate runtime, editable room climate configuration and mappings, floor-plan onboarding, provider lifecycle, and household weather configuration.

**Phase status:** In progress.

| Slice | Status | Outcome |
| --- | --- | --- |
| 5.1 Repair and prove the Home Assistant migration | Completed 2026-08-08 | Restored EF discovery for the existing resume-strategy migration, proved clean and active-database upgrades, added safe migration health detail, and verified the live provider endpoint after upgrade. |
| 5.2 House navigation and viewport analysis | Completed 2026-08-08 | Promoted Woning to primary navigation, added stable shared routes, and made every runtime availability state explicit within the approved viewport-safe composition. |
| 5.3 Room climate configuration UI | Completed 2026-08-08 | Added generated-contract room policy editing, strict range validation, durable save states, lifecycle guidance, and bounded browser-safe composition. |
| 5.4 Provider/source mapping management | Completed 2026-08-08 | Added the bounded room/role mapping workspace with safe source editing, priority and enablement controls, health, archive/restore, and dependency validation. |
| 5.5 Floor-plan upload and replacement entry | Completed 2026-08-08 | Added safe multipart upload, derivative preview, explicit first activation, and dedicated bounded replacement-review entry. |
| 5.6 Provider credential and lifecycle management | Not started | Make provider configuration and lifecycle safe, explicit, and operationally honest. |
| 5.7 Household weather location | Not started | Make weather location household-configurable with visible refresh health. |

## Slice 5.1 implementation boundary

Migration `20260717124500_AddHomeAssistantResumeStrategyConfiguration` remains the single historical schema operation. Its restored designer metadata composes the exact preceding target model with the five resume-strategy properties, making the migration discoverable in its original position without a second competing migration or snapshot change.

The PostgreSQL regression gate now requires a clean schema to contain every resume-strategy column. A second fixture migrates to `20260715205518_AddRoomHeatingCommands`, inserts a representative enabled Home Assistant provider using the legacy diagnostic format, applies the repaired migration, verifies the safe backfill, upgrades to latest, and calls `GET /api/climate-providers/` through the real Npgsql-backed API host.

Normal startup records pending migration count before applying migrations and records healthy, pending, or failed state afterward. `/health` returns HTTP 503 when migrations are pending or failed and exposes only status, count, check time, and the fixed `MigrationApplyFailed` code. The underlying exception remains server-log-only; connection data and exception text are not returned.

Validation: focused migration/health tests 7/7; full backend 640/640; full frontend 354/354 with the documented 20-second timeout budget; solution and frontend builds; required PostgreSQL migration tests 4/4; `dotnet ef migrations list`; no EF model drift; idempotent migration script generation; and two hash-identical pinned NSwag 14.7.1 generations. The implementation report is `docs/reports/2026-08-08-home-assistant-migration-repair/implementation.md`.

## Slice 5.2 implementation boundary

The approved viewport analysis promotes `Woning` to the existing primary navigation rather than adding a second entry rail or burying runtime status in Settings. One shared route map now owns `/`, `/agenda`, `/taken`, `/boodschappen`, `/motivatie`, `/woning`, `/woning/klimaat`, `/instellingen`, and `/weekritueel`; initial loads, in-app navigation, reloads, and browser history resolve through that same map.

The compact Woning summary distinguishes loading, error, empty, available, and degraded states. The detailed climate view renders its established bounded three-region composition only after data loads successfully, adds explicit loading/error/empty surfaces, and preserves truthful unconfigured/provider-unavailable copy plus backend-authoritative disabled heating controls. Configuration editing, provider mapping, plan upload, credentials, and provider lifecycle remain in Slices 5.3–5.6.

Validation: focused frontend tests 37/37; full frontend 360/360 with the established 20-second timeout budget; full backend 640/640; solution and frontend builds; PostgreSQL migration tests 4/4; EF list/model-drift/idempotent-script checks; two hash-identical pinned NSwag 14.7.1 generations; and PostgreSQL-backed Playwright 11/11. Real-browser inspection and the automated guard both confirm zero document-level vertical overflow for Woning summary and climate detail at 1440×900 and 1366×768. The approved analysis and implementation report are under `docs/reports/2026-08-08-house-navigation/`.

## Slice 5.3 implementation boundary

Settings → Woning now gives every active room one compact generated-contract action: `Klimaat instellen` for a missing configuration and `Klimaat bewerken` for a persisted configuration. The nested bounded editor exposes explicit climate enablement, bedtime relevance, optional temperature and relative-humidity ranges, and `HeatingPolicyIntent`. It constructs `UpsertRoomClimateConfigurationRequest` and nested `ClimateRangeDto` instances from the generated client, enforces the backend's strict minimum/maximum and supported bounds before submission, and keeps user input through backend failures.

The editor distinguishes new/unsaved, saving, saved, unchanged, validation, and backend-error states. Disabling climate also clears bedtime relevance in the submitted request. Archived rooms remain outside editable configuration and the existing restore region now explains that restoration is required first. Configuration load failures are surfaced instead of being silently represented as an unconfigured room.

The approved viewport analysis was revised after real Chromium revealed an existing right-panel sibling-overlap defect. The selected-floor header and summary remain fixed; the active room list and existing Home Assistant/floor-plan/archive content now own separate primary and secondary internal-scroll regions. The editor has its own internally scrolling body and fixed footer. Provider mappings, credentials, provider lifecycle, floor-plan upload, runtime heating authority, and weather configuration remain deferred.

Validation: focused frontend 18/18 and climate API/persistence 5/5; full frontend 366/366; full backend 641/641; solution and frontend production builds; PostgreSQL migration baseline 4/4; EF list/model-drift/idempotent-script checks; two hash-identical pinned NSwag 14.7.1 generations; and PostgreSQL-backed Playwright 12/12. Automated and independent in-app browser checks confirm create/validate/edit/disable behavior, refresh persistence, archived-room guidance, visible fixed actions, no browser console errors, and zero body/document overflow at 1440×900 and 1366×768. See `docs/reports/2026-08-08-room-climate-configuration/`.

## Slice 5.4 implementation boundary

Settings → Woning now lists every active room in the Home Assistant overview and opens one room-scoped mapping workspace from `Koppelingen beheren`. Within the bounded dialog, mappings are grouped by semantic role and ordered by priority; active and archived mappings remain separate. Create and edit use generated provider, source-reference, role, priority, and enablement contracts. Archive is explicitly confirmed, restore revalidates the room/provider/configuration dependencies, and local plus server validation reject duplicate active role priorities and duplicate provider/source pairs.

Health, last check, last success, safe diagnostic summary, and shared heating-source state remain read-only. `UpdateClimateMappingRequest` no longer accepts diagnostic text, so normal configuration edits cannot erase or forge provider-owned diagnostics. No provider discovery endpoint currently exists; the UI therefore uses the typed external entity reference and exposes no free Home Assistant service, method, payload, or JSON editor.

The approved viewport analysis was revised after isolated Chromium exposed a visually overlapping secondary card despite zero document overflow. The Home Assistant card now keeps a real minimum block size inside the existing secondary internal-scroll region, so later archived-room content cannot cover or intercept mapping actions. The mapping dialog keeps a fixed header/footer, internal-scroll body, and zero document overflow at 1440×900 and 1366×768.

Validation: focused frontend 8/8 and mapping backend 7/7; full frontend 370/370 with the established 20-second timeout budget; full backend 642/642; solution and frontend production builds; PostgreSQL migration baseline 4/4; EF list/model-drift/idempotent-script checks; two hash-identical pinned NSwag 14.7.1 generations; and PostgreSQL-backed Playwright 13/13. Independent in-app browser checks covered create, edit/disable, archive-state presentation, restore-to-review, safe fields, both target viewports, and zero console errors. See `docs/reports/2026-08-08-climate-mapping-management/`.

## Slice 5.5 implementation boundary

Settings → Woning now exposes a compact selected-floor upload/replace action backed by the existing multipart asset-ingestion endpoint. The bounded dialog performs immediate filename/size checks, retains recoverable failures, and shows the server-produced safe derivative plus normalized filename, media type, dimensions, and validation summary before any activation. The server remains authoritative for real media detection, the 10 MiB limit, truncation, raster dimensions, SVG sanitization, and atomic storage.

First uploads require explicit activation and then offer the existing room-boundary editor. Uploading over an active plan cannot activate directly; it starts the existing replacement-review lifecycle. Phone copy allows file upload but recommends a larger screen for boundary review/drawing.

Browser validation revised the approved composition after proving that the full replacement workspace was not operable inside the secondary scroll region. That region now keeps only a compact review/resume card. Active review replaces the normal Woning management composition with its own bounded sub-workspace and named return action, matching the existing boundary-editor strategy without document scrolling.

Validation: focused frontend 20/20 and floor-plan backend 8/8; full frontend 374/374; full backend 643/643; both builds; PostgreSQL migration baseline 4/4; EF list/model-drift/idempotent-script checks; two hash-identical pinned NSwag 14.7.1 generations with no generated diff; and PostgreSQL-backed Playwright 14/14. Independent browser checks confirmed the active/replace/resume flow, operable cancellation, no error logs, and zero document overflow at 1280×720; automated checks cover 1440×900 and 1366×768. See `docs/reports/2026-08-08-floor-plan-upload-entry/`.

## Fixed boundaries

- Work remains one numeric slice and one commit per run.
- Slice 5.1 repairs migration discovery and diagnostics only; it does not redesign Settings or Woning.
- Slice 5.2 changes reachability, shared routing, and runtime state presentation only; configuration and provider-management workflows remain deferred.
- Slice 5.3 edits room policy only; provider/source mapping, credentials, floor-plan ingestion, runtime control, and weather remain deferred.
- Slice 5.4 manages typed climate source mappings only; provider credentials/lifecycle, floor-plan upload, runtime control expansion, and weather remain deferred.
- Slice 5.5 reuses floor-plan ingestion, activation, boundary editing, and replacement review; provider credentials/lifecycle, runtime control expansion, and weather remain deferred.
- Further primary-page layout work still requires its own approved viewport analysis.
- Provider credentials and lifecycle remain Slice 5.6.
- Weather location remains Slice 5.7.

## Phase exit criteria

- [x] Provider endpoint and DB upgrades are healthy.
- [x] House runtime is reachable through an approved viewport-safe composition.
- [x] Climate configuration and mapping lifecycle work end to end.
- [x] A normal user can upload the first floor plan.
- [ ] Provider credentials remain secret and lifecycle is manageable.
- [ ] Weather location is household-configurable.

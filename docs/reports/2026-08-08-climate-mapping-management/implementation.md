# Phase 5 Slice 5.4 — Provider/source mapping management

## Outcome

`Koppelingen beheren` now opens a complete room-scoped mapping workspace instead of merely focusing the room list. The Home Assistant overview includes rooms with and without active mappings; the nested dialog groups mappings by semantic role, orders active candidates by priority, separates archived mappings, and keeps all lifecycle feedback inside a bounded surface.

Users can create a typed provider/entity mapping, edit the safe source metadata, priority, and enabled state, archive with explicit confirmation, and restore after server-side dependency validation. The editor rejects non-integer/negative priorities, duplicate non-archived priorities within a room/role, and duplicate active provider/source pairs before submission; the backend remains authoritative for concurrent conflicts and room, provider, and climate-policy dependencies.

Mapping health, last check, last success, diagnostic summary, and shared heating-zone state are visible but not editable. The backend write DTO no longer accepts `DiagnosticSummary`, preventing normal mapping edits from clearing or forging provider-owned diagnostic information. No provider discovery endpoint currently exists, so the UI uses the established typed `ExternalSourceReferenceDto`; it does not expose Home Assistant service names, methods, payloads, or arbitrary JSON.

## Viewport implementation

The approved analysis keeps the Woning page's fixed header/summary and primary/secondary internal-scroll regions. The mapping workspace uses one room dialog with a fixed header/footer and internally scrolling list/editor body.

The first isolated Chromium run revealed that the existing Home Assistant card could shrink below its own two-column content, allowing the later archived-room section to overlap and intercept mapping actions without creating document overflow. The analysis was revised before the layout fix. The card now maintains a real minimum block size as a sequential item inside the existing secondary scroll region; no information architecture or page-scroll strategy changed.

## Validation

- Focused frontend: 8/8 (`ClimateMappingWorkspace` and `HomeAssistantClimateSettings`).
- Focused mapping backend: 7/7, including diagnostic preservation, priority conflict, shared heating source, provider archive dependency, restore reprioritization, persistence, and validation service behavior.
- Full frontend: 370/370 with the established 20-second timeout budget.
- Full backend: 642/642.
- Builds: `dotnet build HomeOps.sln --no-restore` and the frontend production build passed.
- PostgreSQL migration baseline: 4/4; EF migration list, pending-model check, and idempotent script generation passed.
- Generated contracts: pinned NSwag 14.7.1 ran twice; the second run was hash-identical (`openapi.json` `EBEBCAA620B18DAA1AE046EC34BCD2476D75BBA680DC288B6085A92A4E20318C`, TypeScript client `2398F87182ACE6610B992568965512186ED54DE5E9371FB84AC7FA155083F43F`).
- PostgreSQL-backed Playwright: 13/13, including create/edit/disable/archive/restore and no-document-scroll checks at 1440×900 and 1366×768.
- Independent in-app browser: create, edit/disable, archived-state presentation, restore-to-`NeedsReview`, safe source/diagnostic presentation, no free service/JSON inputs, zero error-level console messages, and zero body/document overflow at both target viewports.

The first full Playwright pass after the overlap fix had one unrelated transient Agenda dialog assertion; a clean rerun passed all 13 scenarios. The mapping lifecycle scenario passed on both runs after the layout fix.

## Scope boundary

Changes are limited to climate mapping write safety, the generated contract, Settings → Woning mapping UI/styles, focused backend/frontend/browser tests, and Phase 5 documentation. Provider credentials and provider lifecycle remain Slice 5.6; floor-plan upload remains Slice 5.5; weather remains Slice 5.7. No migration or database model change was required.

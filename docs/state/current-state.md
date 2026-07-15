- 2026-07-15: Implemented Woning Climate Floor Plans Slice 10 runtime `Klimaat in huis` as a frontend-only, read-only deep-dive reachable from Woning. The slice uses generated Household/Floor/Room climate read-model contracts directly, renders one Floor at a time, filters runtime geometry to Trusted overlays on the Active safe derivative, keeps all Rooms available through the room-list fallback, presents generated freshness and operating states in Dutch, handles missing/partial/provider/spatial fallback data explicitly, and adds focused frontend coverage plus production build validation. No heating controls, schedules, Stories, comfort scoring, recommendations, historical charts, weather, presence, Home Assistant setup, screenshots, binary assets, handwritten API workaround, or generated-client edits were added.
- 2026-07-14: Completed the Woning Climate Floor Plans Slice 8 backend/client contract follow-up by exposing existing replacement review lifecycle operations through OpenAPI, adding active-review and rollback-availability read contracts over accepted state, strengthening review/detail/Room item/readiness/compatibility DTOs, regenerating the TypeScript client with typed replacement review methods and enums, adding focused contract/generated-client verification, and validating replacement review, FloorPlanAsset, RoomOverlay, full backend, and frontend build checks. No replacement review UI, runtime climate, readings, Stories, heating controls, Home Assistant integration, screenshots, or binary assets were introduced; Slice 8 frontend implementation remains a separate rerun.
- 2026-07-14: Reviewed Woning Climate Floor Plans Slice 8 frontend replacement review workflow and stopped before UI implementation because the generated OpenAPI/TypeScript client does not expose replacement-review lifecycle endpoints, Room review items, dispositions, readiness validation, review activation, cancellation, or review-scoped rollback; documented the contract blocker under `docs/reports/2026-07-14-floor-plan-replacement-review-ui/` and avoided local lifecycle workarounds, backend changes, runtime Woning, climate readings, Stories, heating controls, image registration, Home Assistant setup, screenshots, and binary assets.
- 2026-07-12: Added the FamilyBoard-guided Home Assistant setup model report for Woning and House Brain research, correcting that Home Assistant is not installed yet; defined a Story-first semantic capability setup flow, setup route taxonomy, validation philosophy, capability packs, truth table, roadmap, and Home Assistant boundary without production code, Home Assistant configuration, screenshots, binary assets, backend architecture, persistence, APIs, migrations, or tests.
- 2026-07-12: Added the Woning Story-only validation report for FamilyBoard House Brain research, rejecting a separate Household Assessment layer for this slice; defined a Story-first Woning content model, presence-as-context boundary, current/planned capability truth table, Dutch narrative examples, deep-dive ownership, and Home Assistant versus FamilyBoard responsibility boundary with no production code, UI, screenshots, binary assets, architecture, persistence, API, migration, or test changes.
- 2026-07-12: Added the Household Assessment Layer research report for House Brain continuation, accepting prior House Brain and Household Story reports as baseline while concluding that Assessments should become the primary family-facing abstraction above Stories; defined the canonical assessment model, lifecycle, confidence, hierarchy, deep-dive ownership, Woning/Home consumption, notification strategy, vocabulary reduction, and final conceptual model with no code, UI, architecture, mockup, screenshot, or implementation changes.
- 2026-07-12: Added the canonical Household Story model report for House Brain research, reducing all user-facing House Brain communication to five story types: Steady, Attention, Opportunity, Ready, and Unknown; defined lifecycle, composition, priority, confidence, explanation, memory, expiration, silence, relationships, and validation against climate, laundry, energy, water, mobility, and readiness examples with no code, UI, architecture, mockup, screenshot, or implementation changes.
- 2026-07-11: Completed the Avatar Contacts V1 final follow-up by adopting fully Dutch Bekenden terminology across implemented Avatar Contacts surfaces, moving KnownPerson form dialog semantics to the modal wrappers, adding labelled dialog wrappers and deterministic close-button focus, updating focused localization/accessibility tests, and validating frontend/backend builds and test suites without backend/API/persistence/decorative/ranking changes.
- 2026-07-11: Completed Avatar Contacts V1 Slice 10 production readiness by localizing Avatar Contacts UI copy, replacing implementation-facing form labels, adding shared KnownPerson dialog semantics and delete confirmation, confirming shared renderer/form/picker/ranking/grouping architecture, validating OpenAPI/client stability, generating an idempotent migration script outside the repository, and passing backend/frontend builds and test suites.
- 2026-07-11: Completed the Avatar Contacts V1 Slice 9 Agenda decorative avatar follow-up by expanding validation coverage for nullable pairs and invalid references, verifying KnownPerson/FamilyMember deletion clearing preserves Agenda/provider semantics, validating recurring occurrence/split/skip/modify/restore projection, making imported events explicitly non-decoratable through Agenda APIs, inspecting the migration script, and adding backend/frontend regression coverage.
- 2026-07-11: Implemented Avatar Contacts V1 Slice 9 Agenda decorative avatars by adding nullable FamilyMember/KnownPerson decorative references to Agenda event series, reusing shared validation/picker/badge/suggestion infrastructure, projecting decorative metadata through recurring generated occurrences without occurrence-specific overrides, preserving imported provider metadata as local-only presentation state, clearing Agenda decorative references on KnownPerson/FamilyMember deletion, regenerating OpenAPI/client artifacts, and validating backend/frontend suites.
- 2026-07-11: Completed the Avatar Contacts V1 Slice 8 follow-up by persisting decorative avatar references on recurring task series, propagating them to generated occurrences, preserving existing completed-occurrence semantics, clearing recurring-series decorative references on KnownPerson/FamilyMember deletion, and extracting the shared decorative avatar picker/resolver from Shopping into avatarContacts for Shopping and Tasks reuse.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 7 smart Shopping decorative avatar suggestions by adding a reusable deterministic ranking engine with centralized relationship aliases, explicit scoring thresholds, lightweight bounded fuzzy matching, Shopping picker Suggested grouping ahead of existing manual Family Members/Shared People/Private People groups, focused ranking and picker tests, and documentation under `docs/reports/2026-07-10-avatar-contacts-v1-smart-suggestions/`; suggestions remain hints only and never attach avatars automatically.
- 2026-07-10: Completed the Avatar Contacts V1 Slice 6 Shopping decorative avatar contract follow-up by enforcing nullable-pair consistency through API validation, EF model configuration, and a PostgreSQL check-constraint migration; centralizing reusable FamilyMember/KnownPerson decorative reference validation for future Tasks/Agenda reuse; expanding backend validation coverage for invalid pairs, unknown/soft-deleted/cross-household/mismatched references, clear persistence, and field preservation; regenerating OpenAPI/client artifacts; and documenting the follow-up under `docs/reports/2026-07-10-avatar-contacts-v1-shopping-decorative-avatars-follow-up/`.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 6 Shopping decorative avatars by adding optional nullable FamilyMember/KnownPerson decorative references to Shopping list items, manual Shopping picker selection, DecorativeAvatarBadge rendering reuse, deletion-safe clearing for KnownPerson and FamilyMember soft deletes, Shopping API/OpenAPI/generated-client updates, backend/frontend regression tests, and the implementation report under `docs/reports/2026-07-10-avatar-contacts-v1-shopping-decorative-avatars/`; decorative avatars remain presentation metadata only and do not imply ownership, assignment, participation, permissions, or responsibility.
- 2026-07-10: Completed Avatar Contacts V1 Slice 5 follow-up by removing the premature DecorativeAvatarReference/resolver abstraction, preserving only pure DecorativeAvatar/DecorativeAvatarBadge rendering from already-resolved FamilyMember or KnownPerson identity data via the existing FamilyAvatar renderer, updating focused tests, and validating dotnet restore/build/test plus frontend build/focused avatar tests/full frontend tests; decorative persistence and reference contracts remain deferred to the first Shopping integration slice, with no Shopping, Tasks, Agenda, Motivation, People, member page, API, persistence, backend, picker, or suggestion changes.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 5 decorative avatar foundation by adding reusable frontend decorative avatar references, resolution, and presentation components for future FamilyMember/KnownPerson decorative rendering, reusing the existing FamilyAvatar renderer, preserving source-type separation and deletion-safe null resolution, adding focused tests, and validating dotnet restore/build/test plus frontend build/focused avatar tests/full frontend tests; no Shopping, Tasks, Agenda, Motivation, Home, member page, People management, picker, suggestion, backend API, persistence, migration, or production integration changes were made.
- 2026-07-10: Completed Avatar Contacts V1 Slice 4 KnownPerson form follow-up by extracting the duplicated People management and FamilyMember-page create/edit markup into a shared `KnownPersonForm`, keeping CRUD ownership in each wrapper, preserving editable scope controls only in People management, fixing FamilyMember-page saves to PrivateToMember/current member through form configuration, retaining KnownPersonAvatarEditor reuse, and validating frontend build/focused KnownPerson and member tests/full frontend tests plus dotnet restore/build; no backend, API, layout, copy, decorative avatar, picker, suggestions, domain integration, authentication, or permissions changes were made.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 4 FamilyMember page integration with a bounded member-scoped People section, PrivateToMember KnownPerson CRUD for the current member, Friends-first derived relationship grouping, client-side member search, KnownPersonAvatar/KnownPersonAvatarEditor reuse, loading/empty/error states, focused and full frontend validation, backend KnownPerson validation, and documentation under `docs/reports/2026-07-10-avatar-contacts-v1-member-pages/`, while leaving Shared People management changes, decorative avatars, picker integration, smart suggestions, domain integrations, authentication, and permissions deferred.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 3 People management capability with Settings-hosted KnownPerson CRUD, read-only Family Members summary, Shared and PrivateToMember sections, presentation-only relationship grouping, client-side search, loading/empty/error states, scope switching controls, KnownPersonAvatarEditor/AvatarSelectionEditor reuse, focused People tests, and full frontend/backend validation while keeping member-page integration, avatar picker, decorative avatars, suggestions, permissions, authentication, and domain integrations deferred.
- 2026-07-10: Refined Avatar Contacts V1 Slice 1 backend contracts by aligning KnownPerson field limits with the canonical design (DisplayName 160, Nickname 80, CustomRelationshipLabel 80, Initials 8), editing the unmerged KnownPeople migration/model snapshot and validation constants, tightening create/update PrivateToMember validation to use the same seed-household context as the KnownPerson operation, adding length-boundary tests, regenerating OpenAPI/NSwag artifacts, and documenting the follow-up under `docs/reports/2026-07-10-avatar-contacts-v1-backend-follow-up/`.
- 2026-07-10: Implemented Avatar Contacts V1 Slice 1 backend foundation by adding a household-scoped KnownPerson entity separate from FamilyMember, Shared/PrivateToMember scope validation, normalized relationship types, catalog-backed AvatarSelection reuse/defaulting/validation, KnownPeople EF persistence and migration, CRUD API endpoints with soft-delete filtering, OpenAPI/NSwag regenerated artifacts, focused backend tests, and the backend implementation report under `docs/reports/2026-07-10-avatar-contacts-v1-backend/`, without frontend UI/consumption, People management, decorative references, picker ranking, authentication, contact details, or changes to existing FamilyMember/task/shopping/agenda/motivation semantics.
- 2026-07-10: Implemented Avatar Head Shapes V1 by exposing the existing Round, Oval, and Wide Avatar V2 head variants as the first Face editor identity category, preserving existing renderer geometry, API contracts, persistence, saves, and random avatar generation while adding catalog/editor/backend/frontend regression coverage plus a renderer-generated SVG variety sheet under `docs/reports/2026-07-10-avatar-head-shapes-v1/`.
- 2026-07-10: Implemented Avatar Accessories V2 by expanding the existing single `accessoryStyle` slot with ten new conservative accessories (hair clip, ribbon, baseball cap, beanie, party hat, crown, sun hat, helmet, necklace, scarf), visually grouping the Accessories editor into hair accessories, headwear, and neckwear, preserving existing Bow/Flower/Tiny Crown IDs and all eyewear behavior, adding simple SVG renderer artwork through the current accessory architecture and mount points, updating backend/frontend catalog and editor tests, and adding the report plus renderer-generated SVG variety sheet under `docs/reports/2026-07-10-avatar-accessories-v2/`. Multiple simultaneous accessories, additional persistence slots, and accessory arrays were intentionally postponed.
- 2026-07-10: Implemented Avatar Eyes V1 as an identity-only catalog expansion by adding `eye.style` with Classic Round, Soft Almond, Gentle Arc, and Bright Wide, moving eye artwork into the dedicated `avatar-v2-layer-eyes` between base head and mouth while preserving Classic Round as the compatibility default, integrating Eyes into the Face editor before Mouth and Eyewear, updating backend/frontend validation and renderer/editor tests, and adding the report/SVG review artifact under `docs/reports/2026-07-10-avatar-eyes-v1/`.
- 2026-07-10: Extended Avatar Clothing V2 into Avatar Clothing V3 by adding eight catalog-driven dual-color garments (Zip Hoodie, Varsity Jacket, Rugby Shirt, Contrast Pocket Hoodie, Winter Coat, Cardigan, Sports Shirt, Apron / Smock) through the existing `ClothingAsset.colorRegions` primary/secondary renderer architecture, updating catalog metadata/tests, preserving existing clothing/defaults/Polo-Jacket-Dress behavior, and adding the standalone SVG variety sheet/report under `docs/reports/2026-07-10-avatar-clothing-v3/`.
- 2026-07-10: Implemented Avatar Clothing V2 (multi-color clothing foundation) by extending the existing renderer with a per-garment `colorRegions` declaration and a dual-swatch `render(ctx, primary, secondary)` signature, adding an optional catalog-driven `clothing.secondary-color` category (mirroring `clothing.color`) plus a new `clothingSecondaryColor` selection slot routed only through the jsonb `AvatarSelection` model (legacy `AvatarV2Config` shim frozen, no DB migration), shipping three curated dual-color garments (polo, jacket, dress) alongside the six unchanged primary-only garments (byte-identical SVG), gating the Avatar Editor's second clothing color so it appears only for garments that declare a secondary region, updating renderer/catalog/adapter/editor/backend validation tests, and validating with dotnet restore/build/test (370), frontend test (228), production frontend build, and NSwag (no generated-client diff); finalization documented that local CodeQL could not run because `codeql_checker` is unavailable in this container; report and screenshots at `docs/reports/2026-07-10-avatar-clothing-v2/avatar-clothing-v2.md`.
- 2026-07-10: Produced the Avatar Editor V4 UX exploration (design-only, no code changes) at `docs/reports/2026-07-10-avatar-editor-v4-ux/avatar-editor-v4-ux.md` with research into nine reference editors, five fundamentally different interaction concepts (Canvas/Radial, Sidebar Master–Detail, Guided Wizard, Toolbar/Filmstrip, Adaptive Studio), six high-fidelity FamilyBoard-styled desktop mockups, a nine-dimension comparative analysis, and a recommendation to adopt the Adaptive Studio (hero preview + single docked category/attribute/paged-option surface, one IA for desktop dock and touch bottom sheet) plus a staged V4.0–V4.5 evolution roadmap; treated the existing catalog/renderer/adapter/persistence/SVG system as fixed constraints and made no repository or architecture changes.
- 2026-07-10: Redesigned the FamilyBoard Avatar Editor (V3) as a frontend-only, catalog-driven two-level navigation model — a visual category rail (Huid, Haar, Gezicht, Kleding, Accessoires) with per-category attribute sub-tabs (Stijl/Kleur) exposing one internally-scrolling option grid at a time while the large live preview and rail stay permanently visible — by restructuring `editorPanels` and adding optional `icon`/`shortLabels` catalog metadata, rebuilding `AvatarCatalogControls`, adding decorative category glyphs, relocating eyewear (Bril) into a new Gezicht/Face category (grouping-only, renderer/persistence unchanged), preserving all catalog items/colors/defaults/adapter/renderer/API contracts, updating avatar editor tests, capturing seven populated 1366×900 desktop screenshots, and validating with dotnet restore/build/test (359) plus frontend test (215) and production build; discovered and reported (not fixed — outside this presentation slice's feature boundary) a pre-existing frontend/backend save-contract mismatch where `familyMembersApi.ts` sends both `avatarSelection` and `avatarV2Config` while the backend rejects both, causing in-app Save to return 400.
- 2026-07-10: Implemented Avatar Accessories V1 by establishing the scalable Accessories architecture and shipping the first Eyewear family end to end, adding an optional single-select `eyewear.style` catalog category (None plus regular, thick-frame, round, rectangular, sunglasses, star, and heart glasses) surfaced first inside the existing Accessories editor panel, reusing the renderer's glasses layer, mapping the selection through the catalog adapter, strengthening backend selection validation to reject unknown/incompatible IDs on every slot while defaulting existing avatars to no eyewear, adding backend/frontend tests, and validating with full dotnet restore/build/test (359) plus frontend test (213) and production build.
- 2026-07-09: Completed the Settings UI copy cleanup by removing Product Owner and implementation-facing Settings wording, renaming maintenance/internal labels to concise Dutch household copy, localizing remaining calendar portability fallback messages, preserving restore/import/delete safety messaging and accessibility labels, and validating with full backend/frontend restore-build-test runs plus focused Settings frontend tests.
- 2026-07-09: Completed the frontend-only Avatar Editor Visual Catalog refinement pass by expanding fantasy skin/hair/clothing palettes in the shared catalog, switching style/color choices to visual-only tiles and swatches, making option panels content-sized, enlarging the live preview, capturing six Riley desktop category screenshots, and validating the 1366x900 no-page-scroll dialog contract with runtime browser measurements.
- 2026-07-09: Completed a second frontend-only Avatar Editor polish pass by removing vertical stretch behavior from the catalog-driven dialog, enlarging the live preview, compacting category/swatches density, capturing six required Riley desktop category screenshots, and validating the 1366x900 no-page-scroll viewport contract with runtime browser measurements.
- 2026-07-09: Polished the frontend-only Avatar V2 Editor by removing redundant copy, enlarging the stable live preview, compacting the category rail and swatches, softening selected-state emphasis, refining Save/Cancel/Reset hierarchy, fixing dialog box sizing for 1366x900 viewport fit, validating with full frontend tests/build plus VisualReview browser review, and committing the required desktop editor screenshot.
- 2026-07-09: Tightened only the shopping UI surfaces by removing Home intra-store separator lines, compacting the Shopping quick-add row, dropping Shopping-only “Snel toevoegen” and “Dagelijkse gezinsplek” labels, removing repeated per-item store labels and extra same-store separators, and keeping the change frontend-only with updated Shopping and workspace-header tests plus frontend build/test validation.
- 2026-07-09: Restored the FamilyBoard marketing movie production path by updating the executable storyboard Family scene for the current catalog-driven Avatar Editor, validating storyboard metadata, running publish-mode production successfully, confirming the timestamped MP4 was generated, and removing the generated MP4 from the changeset before completion.
- 2026-07-08: Implemented the Shared Avatar Catalog Source consolidation infrastructure slice by moving the canonical avatar catalog into shared source-controlled JSON, wiring backend startup validation and frontend catalog helpers to consume that definition, and preserving AvatarSelection persistence, API contracts, renderer behavior, editor behavior, catalog IDs, localization, and accessibility metadata.
- 2026-07-08: Implemented the Avatar V2 Editor redesign as a frontend-only catalog-driven UX refresh with a bounded preview + summary rail, vertical category navigation, one active option panel, grouped color palettes, improved keyboard/focus behavior, and updated avatar editor tests while preserving AvatarSelection persistence, Avatar V2 rendering, Dutch copy, and save/cancel/reset behavior.
- 2026-07-08: Implemented the first Avatar Catalog feature-expansion frontend slice by growing skin tones, natural hair colors, and shared clothing/accessory palettes in the local catalog, extending Avatar V2 palette-token support, preserving the existing editor shell and compatibility behavior, and adding focused/frontend validation coverage.
- 2026-07-08: Implemented the first frontend Avatar Catalog read-path slice by regenerating the TypeScript client for `avatarSelection`, adding a local frontend avatar catalog plus Avatar V2 adapter helpers, refactoring the avatar editors to render generic catalog-driven categories/items/swatches, and updating family-member create/save flows and tests while preserving the existing Avatar V2 editor shell and renderer output.
- 2026-07-08: Implemented the first backend-only Avatar Catalog foundation slice by adding typed catalog domain models, a local catalog source, startup catalog validation, JSON AvatarSelection persistence/backfill, backend selection validation, legacy Avatar V2 token mapping, and focused .NET tests while preserving existing Avatar V2 API compatibility and avoiding frontend changes.
- 2026-07-07: Completed the Calendar Recurrence V2 frontend slice by regenerating the NSwag TypeScript client against the finalized backend, integrating recurring series and occurrence edit/delete/skip/restore flows into Agenda, adding compact Dutch recurrence UX plus scope dialogs and loading/error states, validating with full frontend and backend test/build runs plus automated browser review, and committing the required desktop review screenshots.
- 2026-07-07: Completed the Calendar Recurrence V2 backend readiness review by validating the backend implementation end to end, fixing confirmed iCalendar default-rule mapping and calendar portability restore/export defects, regenerating backend OpenAPI, documenting PostgreSQL migration script generation plus the unavailable live Docker migration run, and preserving the no-frontend, no-screenshot, no-binary boundary.
- 2026-07-07: Completed the Calendar Recurrence V2 export/restore slice by extending Calendar Portability to round-trip structured EventRecurrenceRule fields, OccurrenceKey identities, skipped and modified EventExceptions, provider detached metadata, supported imported recurrence metadata, and unsupported provider recurrence metadata without exporting generated occurrences, scheduler state, frontend changes, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 iCalendar mapping slice by mapping supported RRULE data into EventRecurrenceRule, preserving unsupported recurrence metadata with diagnostics and no generation, mapping EXDATE to skipped EventExceptions, mapping detached and cancelled RECURRENCE-ID instances to modified or skipped EventExceptions, integrating recurrence rules and exceptions into provider synchronization, and validating behavior without frontend, provider writeback, scheduler, backup/restore, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 series split slice by adding OccurrenceKey-targeted this-and-future edit and delete APIs, ending the original EventSeries before the selected generated occurrence, creating a clean future EventSeries for this-and-future edits, preserving past history and past exceptions, removing future exceptions instead of copying them, validating split targets and replacement recurrence rules, and validating behavior without frontend, iCalendar mapping, synchronization, backup/restore, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 occurrence operations slice by adding OccurrenceKey-targeted skip, restore, modify, and delete-as-skip APIs, validating writable recurring series and generated occurrence keys, persisting EventException rows for skipped and modified occurrences, reflecting skipped, moved, and modified occurrences in read output, and validating behavior without series splitting, iCalendar mapping, synchronization, backup/restore, frontend, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 manual event APIs slice by wiring optional RecurrenceRuleDto payloads into manual event create and whole-series update, mapping and validating recurrence through EventRecurrenceRuleValidation, persisting new manual recurring events with EventRecurrenceRule rather than legacy RecurrenceType, returning recurrence details from read APIs including legacy RecurrenceType compatibility, and validating recurrence API behavior without occurrence operations, series splitting, iCalendar mapping, synchronization, backup/restore, frontend, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 occurrence engine slice by replacing legacy enum-only occurrence generation with the provider-independent EventRecurrenceRule engine, adding daily/weekly/monthly/yearly interval and end-mode generation, candidate-based COUNT/UNTIL handling, OccurrenceKey-based deterministic recurring identity, skipped/modified exception overlay by original occurrence key, window-aware generation, multi-day overlap, DST wall-clock validation, and legacy RecurrenceType fallback without persistence, API, synchronization, backup/restore, frontend, screenshot, or binary changes.
- 2026-07-06: Completed the Calendar Recurrence V2 domain model and contracts slice by finalizing canonical recurrence vocabulary, adding frequency-aware EventRecurrenceRule validation, canonical WeeklyDays parsing/serialization, deterministic OccurrenceKey parsing/formatting/comparison, shared recurrence/exception/summary DTOs, optional recurrence fields on existing event contracts, and regenerated backend OpenAPI without activating recurrence generation, adding APIs, changing synchronization, modifying backup/restore, touching frontend files, screenshots, or binaries.
- 2026-07-06: Completed the Calendar Recurrence V2 persistence foundation slice by adding the optional owned EventRecurrenceRule model on EventSeries, introducing OccurrenceKey persistence for EventException identity, expanding skipped/modified exception storage and provider detached metadata, adding a PostgreSQL EF Core migration that backfills legacy RecurrenceType and OccurrenceDate data, and validating focused backend persistence behavior without recurrence engine, API, DTO, synchronization, backup/restore, frontend, screenshot, or binary changes.
- 2026-07-05: Completed the Calendar Sources frontend integration slice by regenerating the TypeScript client from the finalized OpenAPI, integrating backend-backed source management into Settings and Agenda Bronnen, adding Settings warning-badge attention state plus source CRUD/refresh/toggle UX, capturing desktop review screenshots, and fixing a minimal backend/frontend integration defect so newly created sources preserve NeverSynced and requested poll intervals while VisualReview fixtures keep the protected manual source invariant.
- 2026-07-05: Completed the Calendar Background Synchronization slice by adding a hosted scheduler and due-source runner that selects enabled non-manual supported iCal sources, respects EventSource poll intervals and NextSyncAfterUtc, invokes the existing refresh dispatcher, prevents concurrent synchronization of the same source in-process, logs start/stop/skip/completion/failure events, and validates scheduler behavior without changing synchronization logic, refresh APIs, importer logic, calendar queries, backup/restore, frontend UI, screenshots, or binary artifacts.
- 2026-07-05: Completed the Calendar Backup & Restore Integration slice by extending calendar portability to export provider-safe source metadata/settings/configuration, exclude imported provider-derived EventSeries and exceptions, restore manual events plus source configuration only, reset restored external sources to NeverSynced while preserving disabled state, protect the system manual source identity, update backend OpenAPI, and validate backup/restore behavior without synchronization, scheduler, polling, calendar query changes, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the Calendar Refresh APIs and Importer Orchestration slice by adding provider-aware refresh dispatch for iCal Feed and iCal File sources, `POST /api/event-sources/{sourceId}/refresh`, `POST /api/event-sources/refresh-all`, importer-result-to-snapshot mapping for success, failure, parser diagnostics, and 304/not-modified, expanded sync result contracts/OpenAPI, and API tests without scheduler, automatic polling, calendar query changes, backup/restore changes, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the Calendar Query Integration slice by filtering calendar reads through EventSource lifecycle state, keeping enabled manual and healthy imported source events visible while hiding disabled, failed, and never-synced imported events without deleting them, deriving event editability from source writability, preserving provider-independent occurrence projection, and adding synchronization transaction rollback coverage without refresh endpoints, scheduler work, backup/restore changes, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the provider-independent Calendar Sources synchronization engine slice by adding provider-neutral snapshot/input/result models, source-scoped create/update/delete logic for imported EventSeries, source health and synchronization metadata updates, 304/not-modified handling that leaves imported events untouched, failed snapshot handling that deletes nothing, transaction-scoped application, and comprehensive SQLite synchronization tests without provider retrieval, parsing, APIs, scheduler, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the iCal File Importer slice by adding a backend-only provider importer that loads iCal file configuration, reads stored ICS content through a provider-agnostic content store abstraction, invokes the shared iCalendar parser, returns normalized snapshots or structured failures with file metadata, and validates with mocked storage tests without synchronization, persistence writes, EventSeries creation, APIs, upload endpoints, background workers, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the iCal Feed Importer slice by adding a backend-only provider importer that loads iCal feed configuration, retrieves HTTP/HTTPS ICS content with conditional headers and redirect handling, invokes the shared iCalendar parser, returns provider-independent snapshots or structured failures, and validates the importer with mocked HTTP tests without synchronization, persistence writes, EventSeries creation, APIs, background workers, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the shared iCalendar parser and normalizer slice by adding a provider-independent Ical.Net-backed parser for raw RFC 5545 content, normalized iCalendar event inputs, structured diagnostics for malformed data and unsupported recurrence/timezone/property cases, parser tests, and documentation, without persistence writes, synchronization, APIs, DTO contract changes, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the Calendar Source Management API slice by adding `/api/event-sources` list/detail/create/update/delete endpoints for configured sources, restricting user creation to iCal Feed and iCal File, validating provider configuration shapes, enforcing the protected system manual source invariant, updating OpenAPI, and validating backend source CRUD without adding synchronization, refresh endpoints, calendar filtering, frontend UI, screenshots, or binary artifacts.
- 2026-07-05: Completed the Calendar Sources domain model and contracts slice by finalizing provider-neutral source/event terminology, adding source health and poll interval contracts, adding source-management/provider-configuration/sync-result contract records, explicitly representing the system manual source with an `IsSystem` domain flag and filtered unique index, regenerating OpenAPI/TypeScript client artifacts, and validating with backend and client test suites without adding source-management endpoints, refresh endpoints, synchronization logic, or UI.
- 2026-07-05: Completed the Calendar Sources persistence foundation backend slice by adding EventSource lifecycle/health/polling/sync metadata fields, EventSeries imported-event metadata, provider configuration persistence tables for iCal feed/file sources, EF Core indexes/constraints/migration defaults for existing manual calendar data, and SQLite-backed persistence tests, without synchronization logic, APIs, DTO contract changes, frontend changes, screenshots, or binary artifacts.
- 2026-07-05: Completed the Agenda weather local-day and Vooruitkijken all-day refinement by switching Agenda day-level weather matching to the browser-local calendar date convention, keeping timed event weather on timestamp interval matching, adding day-weather only for all-day items in Vooruitkijken, validating with `npm run build`, focused `npm test -- src/widgets/components/AgendaWidget.test.tsx`, full `npm test`, and browser review against `visual-marketing-agenda` with a temporary in-browser populated Agenda weather payload, and adding only the required report screenshot as a binary artifact.
- 2026-07-05: Validated the current FamilyBoard Marketing Preview V1 storyboard after the Home/Agenda/weather changes by installing missing Playwright Chromium system dependencies in the execution environment, rerunning validation mode successfully across all 9 scenes, confirming Home and Agenda weather anchors still pass, producing no published movie, and adding no binary artifacts.
- 2026-07-04: Completed the Home Layout Spacing Refinement frontend slice by tightening only the Home shopping intra-store item spacing, removing the visible Motivation card heading, localizing Home Motivation's visible copy to natural Dutch while keeping backend data unchanged, validating with `npm run build`, focused `npm test -- src/home/HomeDashboard.test.tsx`, populated browser review against `visual-marketing-home`, and adding only the required report screenshot as a binary artifact; full `npm test` still fails in the pre-existing `src/widgets/components/AgendaWidget.test.tsx` grouped-events assertion.
- 2026-07-04: Completed the Home Header Layout Motivation Refinement frontend slice by keeping the Home header in one Date/Time → Weather → Avatars row, restyling Home weather as a compact two-line icon+temperature plus short advice unit, preserving avatar size, spreading Agenda/Boodschappen/Taken evenly across the available Home row by removing the unused fourth desktop slot, simplifying Motivation to the single remaining-progress sentence, validating with `npm run build`, `npm test`, and browser review against `visual-marketing-home`, and adding only the required report screenshot as a binary artifact.
- 2026-07-04: Completed the Home Header Weather Refinement frontend slice by recomposing the Home header into one Date/Time → Weather → Avatars row, removing the Home weather pill chrome in favor of a calm icon+temperature unit with short advice text, tightening avatar spacing without reducing avatar size, removing Home shopping checkbox chip styling so only simple checkboxes remain, validating with `npm run build`, `npm test`, and browser review against the populated `visual-marketing-home` fixture, and adding only the required report screenshot as a committed binary artifact.
- 2026-07-04: Completed Agenda Weather Without Chips frontend slice by removing Agenda-only weather chip backgrounds, borders, and pill padding from the Today header, timed appointments, Vooruitkijken items, `Deze week` day headers, and the selected planning day, keeping the icon + temperature pairs right aligned and secondary to agenda content, validating with browser weather data, and adding only the required report screenshot as a committed binary artifact.
- 2026-07-04: Completed Agenda Weather Component Consolidation frontend slice 2 by extracting shared `WeatherTemperatureBadge` ownership for Agenda's objective icon+temperature weather rendering, switching the Today header, timed appointments, Vooruitkijken items, Deze week day headers, and selected planning day to the shared component, preserving existing layout behavior, and adding no new weather locations, advice text, backend changes, API regeneration, or binary artifacts.
- 2026-07-04: Completed the Agenda Weather Coverage frontend slice by extending `getAgendaWeather()` usage across the remaining Planning surfaces: timed appointments in Vandaag and Vooruitkijken keep fixed-width icon+temperature clusters on the right, Deze week now shows icon+temperature in each day header instead of event rows, the selected Planning day now shows weather when available, and the Today header weather block gained a small balance increase without adding advice text, backend changes, API regeneration, Home changes, or binary artifacts.
- 2026-07-04: Recovered the FamilyBoard Home dashboard composition by reintegrating weather into the date/time header, compressing the portrait row into a reserved horizontal strip, reducing portrait scale and hero whitespace, and restoring more vertical space to Agenda, Taken, and Boodschappen while keeping Motivation visible, page overflow hidden, the blue avatar square removed, and no movie or binary artifact produced.
- 2026-07-04: Fixed the current FamilyBoard marketing publish blocker by aligning the Agenda Filmavond recording action with the real current Agenda dialog copy (`Afspraak toevoegen`, `Wanneer is het?`, `Afspraak maken`), validating all 9 scenes in validation and publish modes, producing `docs/demo/familyboard-preview-20260704-150034.mp4` during publish validation, removing that MP4 from the committed changeset per review direction, confirming cleanup of temporary WebM/WAV artifacts, and performing no subjective movie review.
- 2026-07-04: Integrated the completed FamilyBoard weather feature into the marketing video production flow by adding deterministic VisualReview backend weather data, validating the Home weather pill and brief weather detail dialog in the executable storyboard, confirming Agenda weather context during Planning validation, and preserving the existing 9-scene narrative without frontend mocks or binary artifacts.
- 2026-07-04: Completed the final FamilyBoard weather frontend polish slice by grouping shared weather presentation/localization/client helpers under `src/weather`, keeping Home/Detail/Agenda on their own generated weather endpoints, centralizing agenda accessible-label formatting, improving Weather Detail dialog focus handling plus status announcements, and adding no new weather functionality, backend changes, provider knowledge, API regeneration, or binary artifacts.
- 2026-07-04: Implemented frontend phase 3 of the FamilyBoard weather integration by loading the generated `getAgendaWeather()` client into Agenda, adding a subtle `Vandaag` header weather context plus fixed-width timed-appointment weather clusters, hiding weather for all-day or unmatched items without placeholders or advice, reusing shared weather glyph/temperature presentation helpers, and leaving Home Weather Pill, Weather Detail Dialog, backend code, generated contracts, and binary artifacts functionally unchanged.
- 2026-07-04: Implemented frontend phase 2 of the FamilyBoard weather integration by connecting the existing Home Weather Pill to a compact Weather Detail Dialog that loads `getWeatherDetail()`, reuses the central departure-advice presentation mapping, shows advice/today summary/hourly/coming days/details in a calm FamilyBoard overlay, keeps fallback and API-error states non-technical and closable, and intentionally avoids Agenda weather UI, backend changes, API-contract regeneration, Home Assistant, mock layers, and binary artifacts.
- 2026-07-04: Implemented frontend phase 1 of the FamilyBoard weather integration by adding a compact, clickable Home-header weather pill that uses the generated `getHomeWeather()` client, shows a Dutch advice-first fallback without technical errors, preserves Home header hierarchy, and intentionally avoids backend changes, Agenda weather UI, detail dialog work, Home Assistant, mock layers, and binary artifacts.
- 2026-07-04: Implemented the focused Agenda copy cleanup by removing remaining preview/designer text from the Agenda page, keeping a single visible Agenda page title, renaming Agenda-facing create/edit and planning labels to the approved Dutch product copy, preserving existing Agenda functionality, and adding no binary or cache artifacts.
- 2026-07-03: Fixed the final FamilyBoard marketing publish blocker in the Agenda Filmavond recording by removing the artificial API fallback, measuring each real dialog step, using enabled UI clicks for dialog progression, and updating the saved-event locator for the Planning briefing; publish mode completed successfully with a temporary timestamped MP4, metadata, timing, cleanup, no committed binary artifacts, and no subjective review.
- 2026-07-03: Restored the FamilyBoard marketing preview canonical preferred storyboard duration to 84 seconds by returning the Agenda scene preferred duration and executable storyboard total to 84,000 ms, verified dependency/Vite readiness, installed Chromium system dependencies for publish validation, and documented the remaining Agenda add-event recording blocker without producing a new movie or performing subjective review.
- 2026-07-03: Reviewed and updated the FamilyBoard marketing Agenda scene for the final Planning Briefing redesign by shortening the scene, removing the Month detour from the executable recording, validating Today / Deze week / Vooruitkijken / Planning tools as the Agenda briefing structure, switching Filmavond creation to `Afspraak plannen`, and preserving application functionality with no binary media artifacts.
- 2026-07-03: Implemented the approved Agenda Planning Briefing redesign by replacing the equal-horizon Planning summaries and lists with a bounded Today / Deze week / Vooruitkijken / Planning tools briefing board, moving planning controls and source filters into a quiet utility region, reducing default metadata and action noise, preserving Month planning plus event CRUD/filtering/backend APIs, and leaving no binary or cache artifacts in the changeset.
- 2026-07-03: Implemented the first Agenda information-architecture slice by making Planning the default Agenda briefing, removing Week from the visible primary IA, moving Month behind a contextual `Maand bekijken` action, preserving existing event CRUD/source filtering/backend APIs, updating Agenda tests and storyboard selectors, and leaving no binary or cache artifacts in the changeset.
- 2026-07-03: Repaired the next FamilyBoard marketing publish Tasks completion mismatch by updating the executable storyboard to validate the implemented post-completion flow: Zwemtas klaarzetten disappears from the visible Vandaag list, then appears as an Afgerond task in the contextual completed surface; publish mode completed all 9 scenes, generated metadata/timing, cleaned temporary artifacts, and no binary media was committed.
- 2026-07-03: Repaired the next FamilyBoard marketing publish Tasks recording mismatch by updating the executable storyboard to validate the implemented Vandaag focus section, compact Planning summary, and secondary task-planning action rail instead of obsolete `Aandacht voor nu`/planning-column selectors; publish now proceeds to the next Tasks mismatch at `complete-zwemtas` without application functionality or binary artifact changes.
- 2026-07-03: Repaired the FamilyBoard marketing publish Agenda recording flow by updating the executable storyboard to use the implemented Agenda header add-event action instead of the obsolete selected-day `Gebeurtenis toevoegen` selector, preserving application functionality and binary-free source control boundaries.
- 2026-07-03: Implemented the approved Settings viewport-fit redesign by replacing the generic Settings widget stack with a bounded maintenance dashboard that answers `Is alles in orde?`, keeps backup in a compact action rail, moves restore into a bounded dialog with preserved confirmation/validation safety, and removes structural dependence on shared page-body scrolling without backend, API, schema, or binary artifact changes.
- 2026-07-03: Implemented the approved Mijn Pagina viewport-fit redesign by converting My Page into a bounded personal dashboard with a compact identity strip, a two-column today/progress main region, a compact contextual action rail, avatar-as-entry editing, and bounded overlays for goals, history, and administration while preserving existing Family Member workflows without backend, API, schema, or binary artifact changes.
- 2026-07-03: Implemented the approved Motivation viewport-fit redesign by replacing the previous four-card Motivation dashboard with a fixed three-region family story: a dominant shared family purpose region, a bounded encouragement/appreciation preview, and a compact celebration story region with contextual overlays for memories, personal goals, appreciation history, and detailed progress, while preserving Motivation workflows without backend, API, schema, or binary artifact changes.
- 2026-07-03: Implemented the approved Shopping viewport-fit redesign by converting Shopping into an execution-first bounded dashboard with an always-visible Quick Add command row, a single internally scrolling active list grouped by store, a compact footer/status strip for completed/recovery/other-list/manage access, and bounded contextual overlays that preserve existing shopping workflows without backend, API, schema, or binary artifact changes.
- 2026-07-02: Implemented the approved Tasks viewport-fit redesign by replacing the five-column scroll-reliant Tasks page with a viewport-bounded Today + Planning dashboard, compact secondary access rail, bounded planning/detail overlays, explicit list overflow ownership, and preserved task creation/editing/completion/template/weekly-reset flows without backend, API, schema, or binary artifact changes.
- 2026-07-02: Completed the Agenda viewport-fit redesign by converting Agenda into a fixed-height dashboard with a compact command/filter band, bounded Month/Week/List canvases, internal overflow ownership for selected-day, week-day, and timeline event lists, and preserved event CRUD/filtering behavior without backend, API, schema, or binary artifact changes.
- 2026-07-02: Restructured the Home dashboard into a fixed two-row FamilyBoard composition with Boodschappen, Agenda, and Taken as bounded top cards, a full-width always-visible Motivatie row, tighter family avatar spacing, and per-person today-task badges derived from existing frontend task data without backend, API, schema, or binary artifact changes.
- 2026-07-02: Implemented the global FamilyBoard viewport/layout engine by switching the client shell to a stable viewport-height boundary, preventing document-level vertical scrolling in `html`/`body`/`#root`/app shell/workspace shell, and routing primary workspace overflow through a shared internal page-body container without redesigning page-specific content.
- 2026-07-02: Updated the existing FamilyBoard executable marketing storyboard Tasks scene for the redesigned Today-first Tasks experience, adding runtime checks for the cleaner desktop dashboard, progressive add-task flow, and task-card completion while preserving the 9-scene marketing narrative, pacing, fixtures, and binary-free source-only boundary.
- 2026-07-01: Rebalanced the Tasks desktop redesign into a single weighted horizontal dashboard that keeps Vandaag dominant while showing Morgen, Deze week, Later, and Voltooid/Review as progressively more compact columns, preserving progressive disclosure and all existing task/backend/API/schema/routing/validation behavior.
- 2026-07-01: Refined the Tasks page redesign with a stricter Today/Tomorrow/This Week desktop focus row, secondary placement for later/completed groups, compact planning cards, selected-card-only action disclosure, a click-away selection reset, and a dedicated redesign report while preserving task APIs, backend behavior, schema, routing, validation, and lifecycle actions.
- 2026-07-01: Completed the Tasks page mockup-aligned redesign by shifting the desktop dashboard to a true three-column Today/Tomorrow/This Week layout, widening Vandaag as the primary focus, hiding repeated per-card actions until a task is selected, stacking selected-card actions vertically, and preserving existing task completion, reopen, Morgen, edit, routine, template, Weekly Reset, backend, API, schema, and routing behavior.
- 2026-07-01: Fixed FamilyBoard marketing storyboard action pacing by adding real Thomas Avatar Editor actions, readable Tasks add/complete beats, action result hold metadata enforcement, short validation surface inspection, and disabling default validation screenshots so Weekly Reset no longer creates a long static pre-Outro pause while validation still generates timing metadata and no final movie.
- 2026-07-01: Fixed FamilyBoard recording visual navigation by scoping Recording Session workspace detection to the active workspace title, adding rendered-surface verification and temporary validation screenshots, confirming all 9 validation scenes visibly reach their storyboard pages, generating metadata/timing, cleaning temporary artifacts, and intentionally producing no published movie.
- 2026-07-03: Updated the FamilyBoard marketing storyboard and executable recording flow for the implemented Planning-first Agenda IA, making Planning the default Agenda story beat, using `Maand bekijken` only contextually for Filmavond, validating Week/List absence in the recording flow, and preserving application functionality without binary media artifacts.
# Current State
- 2026-07-12: Added the Woning climate runtime deep-dive research report as analysis slice 3 of 3, defining Story-context entry, one-floor runtime IA, quiet floor-plan rendering, restrained room labels, state visual language, duplicate-source handling, Unknown/stale/conflict treatment, bounded heating actions, fallback hierarchy, responsive/accessibility behavior, Dutch copy, V1 scope, deferred capabilities, and consolidation inputs without production code, editor UX redesign, persistence, APIs, migrations, tests, screenshots, binary assets, or Home Assistant configuration.
- 2026-07-11: Implemented Avatar Contacts V1 Slice 8 Tasks decorative avatars by reusing the Shopping nullable FamilyMember/KnownPerson decorative avatar contract, shared validation, DecorativeAvatarBadge rendering, manual picker behavior, and deletion-safe clearing while preserving the existing task assignment model as the only ownership semantic.
- 2026-07-04: Regenerated the API contract/client for the FamilyBoard weather API after confirming the existing NSwag workflow was required; `/api/weather/home`, `/api/weather/detail`, and `/api/weather/agenda` are now present in OpenAPI and the generated TypeScript client without Open-Meteo types, Weather UI changes, binary artifacts, dependency changes, or project-file changes.
- 2026-07-04: Implemented backend phase 6 of the FamilyBoard weather integration by exposing the existing Home, Detail, and Agenda weather projections through stable backend API endpoints, adding a weather application service and DI wiring to orchestrate source, cache, advice, and projection components without controller business logic, frontend changes, Home Assistant integration, database changes, dependency changes, or generated files.
- 2026-07-04: Implemented backend phase 5 of the FamilyBoard weather integration by adding provider-neutral Home, Detail, and Agenda weather projections that map existing weather snapshots and departure advice into stable backend response models without new business logic, frontend changes, APIs, Home Assistant integration, database changes, dependency changes, or generated files.
- 2026-07-04: Implemented backend phase 4 of the FamilyBoard weather integration by adding a provider-neutral Departure Advice Engine that translates cached weather snapshots into family-facing advice categories with confidence, accounts for feels-like temperature, rain timing, wind, UV, temperature trend, freshness, provider status, and missing data, and refactors `DepartureAdvice` out of the weather facts snapshot so providers and cache remain fact-only.
- 2026-07-04: Implemented backend phase 3 of the FamilyBoard weather integration by adding an in-memory backend weather snapshot cache with one snapshot per household, freshness-based reads, stale-while-refresh behavior, controlled blocking refresh for empty cache, provider failure handling that preserves stale snapshots where possible, and no APIs, frontend changes, database storage, dependency changes, Home Assistant integration, or departure-advice engine.
- 2026-07-04: Implemented backend phase 2 of the FamilyBoard weather integration by adding a small Open-Meteo provider that builds forecast requests, parses current/hourly/daily responses, maps Open-Meteo weather codes into the provider-neutral Weather domain, returns unavailable provider status for provider failures, and avoids caching, APIs, database changes, dependency changes, frontend changes, Home Assistant integration, and departure-advice logic.
- 2026-07-04: Implemented backend phase 1 of the FamilyBoard weather integration by adding provider-neutral internal weather domain models for current weather, departure advice, hourly slots, daily summaries, freshness, provider status, and condition categories without providers, endpoints, Open-Meteo knowledge, database changes, dependency changes, or frontend changes.
- 2026-06-30: Added Marketing Production Engine Publish mode with configuration-driven `validation`/`publish` execution, one-run production timestamps, timestamped `docs/demo/familyboard-preview-YYYYMMDD-HHmmss.mp4` publish output, mode-aware metadata, and cleanup that retains published MP4s while still removing raw WebM/WAV/browser-profile artifacts.
- 2026-06-30: Completed Marketing Production Engine Phase 9 Configuration by splitting production, timing, audio, export, and cleanup settings under `tools/marketing-production/config/`, wiring stages to read tunable behavior from configuration, validating config-only production variation, and preserving Production Engine, Recording Framework, Marketing Director, Audio Framework, storyboard, production UI, and binary artifact boundaries.
- 2026-06-30: Implemented Marketing Production Engine Phase 8 Timing by instrumenting the Recording stage with monotonic execution timing, extending Metadata to write `/tmp/familyboard-marketing-timing.json` and summarize it in metadata JSON, removing the separate Timing pipeline placeholder, and preserving production UI, storyboard, Recording Framework, Marketing Director, Audio Framework, and binary artifact boundaries.
- 2026-06-30: Implemented Marketing Production Engine Phase 7 Metadata and Cleanup ownership by adding metadata JSON generation outside the repository, cleanup of temporary recording/audio/export/browser artifacts, moving export validation output to `/tmp/familyboard-marketing-export/familyboard-preview.mp4`, and removing the previously retained repository MP4 while preserving production UI, storyboard, Recording Framework, Marketing Director, and Audio Framework boundaries.
- 2026-06-30: Implemented Marketing Production Engine Phase 6 Export ownership by adding an export stage that resolves FFmpeg through the configured/imageio-ffmpeg path, combines `/tmp/familyboard-marketing-preview-v1.webm` with `/tmp/familyboard-marketing-audio/mix.wav`, writes `docs/demo/familyboard-preview.mp4`, verifies the output, and intentionally avoids metadata, timing, cleanup, subjective quality review, production UI, storyboard, Recording Framework, Marketing Director, and Audio Framework changes.
- 2026-06-30: Implemented Marketing Production Engine Phase 5 Audio ownership by adding an audio stage that creates and reuses `/tmp/familyboard-marketing-audio`, generates temporary placeholder WAV assets outside the repository, reuses the existing Audio Framework director/timeline/library/mixer/export helpers, produces `/tmp/familyboard-marketing-audio/mix.wav`, and intentionally avoids MP4 muxing, metadata, timing, cleanup, production UI, storyboard, Recording Framework, Marketing Director, Audio Framework redesign, screenshots, and committed audio binaries.
- 2026-06-30: Completed Marketing Production Engine Phase 4.1 Temporary Toolchain separation by removing Playwright from the product package, moving Playwright installation and reuse to `/tmp/familyboard-marketing-tools`, preserving recording execution through the Production Engine-owned toolchain, and keeping production UI, storyboard, Recording Framework, Marketing Director, Audio Framework, MP4 output, audio, screenshots, WAV files, and committed binaries unchanged.
- 2026-06-30: Implemented Marketing Production Engine Phase 4 Recording ownership by adding a recording stage that launches Playwright through the production engine, creates and runs the existing RecordingSession across all 9 storyboard scenes, produces the temporary raw WebM artifact at `/tmp/familyboard-marketing-preview-v1.webm`, and intentionally leaves audio, muxing, metadata, timing reports, cleanup, MP4 output, production UI, storyboard, Recording Framework, Marketing Director, and Audio Framework unchanged.
- 2026-06-30: Implemented Marketing Production Engine Phase 3 Storyboard ownership by adding a storyboard stage that loads the executable storyboard, uses the existing Marketing Director for validation and recording-plan generation, exposes structured scene/chapter/timing/recording metadata, and preserves the no-browser, no-recording, no-media production boundary.
- 2026-06-30: Implemented Marketing Production Engine Phase 2 Runtime ownership by adding the runtime stage for VisualReview API and Vite frontend startup, structured health checks, process lifetime management, and clean shutdown through the production entry point without launching browsers, recording, producing movies, generating audio, screenshots, WAV files, or binary artifacts.
- 2026-06-30: Created the FamilyBoard Marketing Production Engine Phase 1 entry point with deterministic orchestration, shared production configuration, pipeline validation, and discovery of the existing Recording Framework, Marketing Director, Audio Framework, and executable storyboard without starting browsers, recording, generating audio, producing movies, screenshots, WAV files, or binary artifacts.
- 2026-06-30: Completed the FamilyBoard marketing timing pipeline audit by tracing storyboard, Director, transition, Chapter Card, camera idle, action, and RecordingSession waits, removing the duplicated duration-derived per-scene tail pause from RecordingSession, and preserving the 84-second storyboard plan without production UI, fixture, storyboard, audio, movie, screenshot, WAV, or binary artifact changes.
- 2026-06-30: Completed the Agenda compact-controls audit by remeasuring Month, Week, List, and Add Event controls, moving the remaining Agenda day-cell and selected-day add-action padding onto shared compact/inline tokens, and preserving Agenda behavior without screenshots, movies, or binary artifacts.
- 2026-06-30: Completed the FamilyBoard header navigation design-system audit, measured primary workspace navigation against dialog/card/Weekly Reset/Shopping controls, confirmed the primary nav was visually undersized, and raised only the shared navigation/back sizing tokens to 48 px while preserving navigation behavior and avoiding screenshots or movies.
- 2026-06-30: Centralized FamilyBoard button sizing into shared CSS design tokens for navigation, admin navigation, back/icon controls, compact actions, standard actions, segmented controls, inline action pills, dialog actions, card actions, and Avatar Editor tiles, preserving the passing text-fit measurements and touch targets without marketing fixture, storyboard, recording, screenshot, movie, audio, WAV, or binary artifact changes.
- 2026-06-30: Completed the FamilyBoard button text-fit audit by measuring visible navigation pills, segmented controls, chips, card actions, form/dialog actions, Avatar Editor tiles, and quick actions across VisualReview marketing surfaces, fixing shared padding/minimum sizing rules for confirmed cramped labels, and preserving touch targets without marketing fixture, storyboard, recording, screenshot, movie, audio, WAV, or binary artifact changes.
- 2026-06-30: Completed the oversized image/icon audit by measuring HomeOpsIcon, avatar, celebration, child/helper, dialog, card, and navigation imagery across VisualReview surfaces, fixing the remaining shared broad CSS sizing defect that inflated Thomas detail, Avatar Editor backdrop, and Weekly Reset icons, and preserving intentional avatar/hero imagery without marketing fixture, storyboard, recording, screenshot, movie, audio, WAV, or binary artifact changes.
- 2026-06-30: Fixed the oversized Family Member detail back button by measuring the Thomas detail layout before and after, moving the back action into a reserved far-left workspace navigation slot, constraining the icon to 20 px inside a 44 px touch target, preserving hidden-slot spacing on top-level pages, and avoiding marketing fixture, storyboard, recording, movie, audio, screenshot, and binary artifact changes.
- 2026-06-30: Fixed manual Agenda event creation for VisualReview marketing fixtures by creating new events against the active writable household calendar source instead of the hard-coded seeded source id, restoring `Filmavond` creation in the approved marketing preview pipeline while preserving normal household event CRUD behavior.
- 2026-06-30: Fixed the Agenda event save path used by marketing recording by resolving the current writable manual calendar source instead of hardcoding the seeded source, removing the recording-only Filmavond DOM fallback, validating real no-recording event creation through Intro, Home, Family, and Agenda, and preserving production UI, marketing fixtures, storyboard narrative, screenshots, video, audio, WAV, and binary artifact boundaries.
- 2026-06-30: Fixed the FamilyBoard marketing recording Agenda scene locator robustness by adding scoped exact recording actions for Month, Week, List, Add event, Filmavond entry, Save, and return-to-overview behavior, validating a no-recording dry run through Intro, Home, Family, and Agenda without production UI, fixture, storyboard narrative, screenshot, video, audio, WAV, or binary changes.
- 2026-06-30: Completed the Shopping layout redesign by replacing narrow per-store desktop columns with a full-width vertical store stack, making active shopping rows larger and easier to scan, reducing Quick Add visual weight, improving touch targets, and preserving preferred-store grouping, quick add, completion, undo, delete, backend/API/schema behavior, storyboard source, media policy, and binary artifact policy.
- 2026-06-29: Completed the Motivation layout redesign by turning Motivatie into a calm desktop encouragement dashboard with a dominant family-goal anchor, clearer appreciation hierarchy, supporting celebration/progress surfaces, improved emotional readability, and FamilyBoard-aligned warm card styling while preserving goals, helpful moments, celebrations, memories, dialogs, navigation, backend/API/schema behavior, storyboard source, media policy, and binary artifact policy.
- 2026-06-29: Completed the Tasks layout redesign by turning Taken into a desktop task dashboard with a primary Today surface, secondary planning grid, improved task-row density, clearer metadata/action touch targets, and FamilyBoard-aligned warm card language while preserving task creation/editing/completion/reopen, templates, weekly reset entry points, backend/API/schema behavior, storyboard source, media policy, and binary artifact policy.
- 2026-06-29: Completed a FamilyBoard UX consistency pass by aligning shared workspace headers, widget/card surfaces, Settings action panels, and Tasks container treatment with the warm FamilyBoard visual language, while reviewing Home, Mijn Pagina, Agenda, Taken, Boodschappen, Motivatie, and Settings without backend/API/schema, workflow, storyboard, media, or binary artifact changes.
- 2026-06-29: Completed the Agenda composition redesign by aligning Agenda with the FamilyBoard Home and Mijn Pagina design language, expanding desktop surface usage, tightening source controls, strengthening Today/upcoming hierarchy across Month/Week/List, preserving event creation/editing/deletion/filtering/navigation/backend/API/schema behavior, and leaving no prohibited binary artifacts.
- 2026-06-29: Completed the Mijn Pagina polish slice by tightening identity/header spacing, strengthening avatar prominence, balancing child desktop cards, reducing progress-card vertical weight, adding subtle disclosure feedback, and preserving existing child content, parent settings, avatar editing, backend/API/schema behavior, and binary artifact policy.
- 2026-06-29: Completed Mijn Pagina layout redesign slice 2 by simplifying child pages around identity and Today, removing duplicated child-mode identity and parent avatar preview emphasis, moving parent settings into a quiet administrative disclosure on child pages, and preserving existing avatar editing, parent settings, tasks, motivation, Helpful Moments, navigation, backend/API/schema behavior, and binary artifact policy.
- 2026-06-29: Completed the first Mijn Pagina layout redesign slice by giving Family Member child pages a clear page header, making identity/avatar the lead section, reordering child content to identity then Today then appreciation/progress/history, and reducing parent administration dominance while preserving existing functionality, navigation, data, backend/API/schema behavior, and binary artifact policy.
- 2026-06-29: Redesigned the FamilyBoard Home dashboard composition for desktop by enlarging the family anchor, making Agenda and Boodschappen the dominant cards, keeping Taken and Motivatie supportive, adding large Home shopping check targets through the existing list toggle API, and updating source-only marketing storyboard references without backend/API/schema/database changes or binary artifacts.
- 2026-06-29: Improved marketing Audio Framework missing-asset handling so absent generated placeholder WAV files produce silence and diagnostics instead of blocking director subscription, timeline creation, or mixing, while locally generated WAVs are still used automatically when present and no audio, movie, screenshots, videos, production UI, storyboard, Marketing Director, Recording Framework, or binary artifacts were produced.
- 2026-06-29: Aligned the VisualReview marketing shopping fixture with the approved Koekjes bakken continuity by adding ordinary baking ingredients to grouped shopping and removing pre-seeded Bananen so the storyboard quick-add remains consistent, without production shopping behavior, UI redesign, Marketing Director, Recording Framework, Audio Framework, screenshots, videos, audio, or binary changes.
- 2026-06-29: Aligned the Weekly Reset VisualReview marketing fixture API test with the approved Sunday canonical anchor while preserving Tuesday anchors for the remaining marketing fixtures, restoring clean baseline validation without production code, runtime, fixture, storyboard, recording, audio, screenshot, video, or binary changes.
- 2026-06-29: Fixed the Shopping VisualReview marketing rendering mismatch by recognizing localized `Boodschappen` lists as the primary shopping list in Shopping page and Home summary data loading, restoring grouped active-list rendering after `visual-marketing-shopping` reset without production UI redesign, storyboard, fixture, recording, audio, screenshot, video, or binary changes.
- 2026-06-28: Fixed the Agenda Week VisualReview canonical-time bug by synchronizing Agenda selected-day and week-anchor state after the marketing time provider anchor loads, keeping Month, Week, and List aligned to `visual-marketing-agenda` without production UI, storyboard, fixture, recording, audio, screenshot, video, or binary changes.
- 2026-06-28: Fixed the FamilyBoard marketing recording overlay root lifecycle by making overlay root/style installation idempotent across scene transitions and page reloads, unblocking first-scene Chapter Card initialization in a no-recording dry run without production UI, storyboard, fixture, screenshot, video, audio, or WAV changes.
- 2026-06-28: Added the executable FamilyBoard marketing preview storyboard module for the canonical 9-scene Marketing Storyboard V1, including Chapter Card, emotional curve, fixture, duration, semantic action, and recording-plan validation metadata without browser recording, screenshots, audio, WAV files, production UI changes, or generated media.
- 2026-06-28: Added the reusable FamilyBoard marketing audio framework with event-bus subscription, replaceable placeholder WAV generation, optional music/timeline/mixer/export helpers, and ignored local validation mix support without committed audio binaries, production UI, screenshots, videos, or application sound effects.
- 2026-06-28: Added the FamilyBoard Marketing Director storytelling layer with storyboard configuration, richer scene metadata, reusable timing profiles, narrative validation, recording event infrastructure, and a sample internal storyboard without production UI, audio playback, screenshots, videos, Playwright tests, or binary artifacts.
- 2026-06-28: Added the reusable FamilyBoard marketing recording framework with tablet-landscape session orchestration, scene definitions, touch-first deterministic gesture helpers, temporary recording overlays, scene transitions, and a sample validation sequence without production UI, screenshots, videos, audio, or Playwright tests.
- 2026-06-28: Canonicalized the FamilyBoard marketing household to the Van Zijl family with Dad and Mom as parent display names across the marketing design document, VisualReview marketing fixtures, marketing tests, and reports without production feature, UI, recording helper, Playwright, screenshot, video, or audio changes.
- 2026-06-28: Implemented deterministic FamilyBoard marketing VisualReview fixtures for the canonical Van Zijl household by adding a shared marketing household builder, eight scene-specific reset scenarios, API coverage, and a validation report without production UI, recording helper, audio, Playwright, screenshot, or video changes.
- 2026-06-28: Completed the FamilyBoard Design Asset System foundation by adding the frontend design tree, inline React SVG icon component, shared icon size tokens, semantic icon registry, reserved illustration/decoration folders, authoring documentation, and validation report without page migrations, emoji replacement, Avatar V2 changes, backend/API/schema changes, or binary assets.
- 2026-06-28: Completed the FamilyBoard wide viewport shell polish slice by replacing the fixed 1040px app shell cap with responsive board width tokens, allowing Home to use four summary columns on wide desktops, and keeping Settings constrained to a readable panel width without backend, API, schema, workflow, navigation, runtime, fixture, or binary asset changes.
- 2026-06-28: Completed the Family Member compact layout UX cleanup by replacing the oversized Family Member back affordance with compact header navigation, removing the non-avatar decorative child-progress hero image, promoting Avatar V2 and avatar editing in a compact identity header, and moving parent/child mode controls earlier without backend, API, schema, persistence, renderer, workflow, route, or binary asset changes.
- 2026-06-28: Completed the Avatar Editor final polish slice by tightening the Family Member Avatar Editor modal, preview, spacing, and tile density so all current categories, accessory options, accessory colour controls, Save, and Cancel are immediately visible at 1920×1080 without backend/API/schema, persistence, workflow, renderer, or avatar asset model changes.
- 2026-06-28: Completed the FamilyBoard final visual polish slice by fitting the Family Member Avatar Editor inside a 1920×1080 viewport with contained scrolling, localizing remaining Avatar Editor labels to Dutch, softening Tasks primary action buttons, separating Motivation celebration title/status text, and clarifying the personal-goal add action while preserving backend behavior, API contracts, database schema, workflows, navigation, and binary assets.
- 2026-06-28: Added the supported `VisualReview` browser runtime for visual review by configuring the API with ephemeral EF Core InMemory storage, official fixture endpoints, a launch profile, and developer documentation while leaving Development/PostgreSQL and production behavior unchanged.
- 2026-06-28: Completed frontend test maintenance by updating stale assertions and fixtures to the current Dutch FamilyBoard MVP UI, polished dialog wording, progressive disclosure behavior, and Agenda date grouping; the full frontend suite now passes without production source, CSS, backend, API contract, schema, workflow, or UI layout changes.
- 2026-06-28: Completed the FamilyBoard Dialog Design System slice by applying a shared warmer dialog presentation layer, wider calmer dialog sizing, softer overlay treatment, domain accents for Agenda/Tasks/Boodschappen quick-capture dialogs, reduced repeated helper copy, and consistent calm dialog buttons while preserving workflows, backend, API contracts, and database schema.
- 2026-06-27: Completed the FamilyBoard Home final polish slice by removing the weather placeholder, adding subtle domain colour accents, softening Home card actions, improving Boodschappen scanability, and preserving backend/API/database schema, Home workflows, navigation, and dashboard composition.
- 2026-06-27: Completed the FamilyBoard Dutch localization slice by translating remaining user-facing English copy across shell, settings, onboarding, avatar, motivation, and family-member surfaces while preserving backend/API/database schema, business logic, workflows, and navigation structure.
- 2026-06-27: Completed the FamilyBoard Final MVP Polish slice by adding a warm Weekly Reset closure moment, tightening Shopping density and list action styling, improving Dutch navigation/shell/shopping copy, and preserving backend/API/database schema and existing workflows.
- 2026-06-27: Completed the first Shopping workspace redesign slice by turning Shopping into a warm operational family workspace with a decorative hero, prominent Dutch Quick Add, store-first cards based on existing preferred-store grouping, compact recently-added reassurance, and secondary other-list presentation while preserving backend/API/schema, persistence, preferred-store logic, and lifecycle behaviour.
- 2026-06-27: Completed the Weekly Reset UX ritual slice by redesigning Weekly Reset as a Dutch family check-in around readiness for next week, adding ritual summary cards, intentional confirmation/skip language, and friendly recap framing while preserving reset execution, undo availability, backend behavior, API contracts, database schema, and task logic.
- 2026-06-27: Completed the Tasks Morgen action workflow slice by turning Morgen into a real quick action for non-recurring tasks through the existing update-task API, moving normal and overdue tasks to tomorrow without page refresh, hiding Morgen for recurring and already-tomorrow tasks, and preserving backend contracts, API contracts, database schema, recurrence engine, and Weekly Reset logic.
- 2026-06-27: Completed the Tasks task card redesign slice by enriching active task cards with FamilyBoard-style visual structure, compact metadata chips, reusable placeholder icon slots, first-class action button presentation, disabled future-ready Morgen affordance, and more recognizable recurring task treatment while preserving backend, API, schema, completion, recurrence, and Weekly Reset behavior.
- 2026-06-27: Completed the Tasks time-first workspace slice by reorganizing Tasks into Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond sections, making Vandaag the primary operational focus, improving compact task cards with assignee/date/recurrence/completion context, and preserving existing completion, editing, deleting, recurring task, Weekly Reset, backend, API, and schema behavior.
- 2026-06-27: Completed the Agenda List Workspace slice by adding a non-default chronological family reference timeline with grouped upcoming events, reused event indicators and FamilyBoard event cards, warm empty state, and preserved Month as primary plus Week as operational planning without backend, API, schema, Google Calendar, persistence, editing-flow, indicator-architecture, or classifier-architecture changes.
- 2026-06-27: Completed the Agenda Week Workspace slice by adding a non-default seven-day family planning workspace with previous/current/next week navigation, reused event indicators and FamilyBoard event cards, quiet/empty week states, and preserved Month as the primary Agenda planning surface without backend, API, schema, Google Calendar, persistence, editing-flow, or classifier-architecture changes.
- 2026-06-27: Completed the Agenda event indicators slice by replacing month-cell event counts with type-aware icons and overflow pills, warming selected-day event cards with pastel visual language, and preserving existing calendar APIs, persistence, and editing behavior.
- 2026-06-27: Completed the first Agenda redesign architecture slice by replacing the switchable Week/Months Agenda experience with a month-first master-detail family planning workspace, adding a permanent selected-day panel, and moving event creation into the selected-day context while preserving existing calendar persistence and API contracts.
- 2026-06-27: Completed the Motivation Dashboard Redesign UX slice by turning Motivation into a compact FamilyBoard dashboard with one header, a primary family-goal/progress card, compact appreciation, celebration, and statistics cards, smaller intentional illustrations, and preserved goal/appreciation workflows.
- 2026-06-24: Completed the Task dialog conversation slice by redesigning Task create/edit into a guided one-question-at-a-time flow with Today/Tomorrow/Someday timing shortcuts, optional recurrence at the end, existing task create/update payloads preserved, and focused Task dialog regression coverage.
- 2026-06-24: Completed the Home dialog and layout UX consistency slice by changing Home to a balanced 2x2 Agenda/Tasks/Shopping/Motivation dashboard, applying a blurred pastel HomeOps dialog treatment, and moving Agenda event, Task, and Motivation goal creation/editing into on-demand dialogs while preserving Shopping inline entry and existing business logic.
- 2026-06-24: Captured a complete desktop beta-surface visual review package under `docs/reports/2026-06-24-beta-surface-visual-review/`, covering Home, Agenda, Tasks, Shopping, Motivation, adult and child Family Member pages, Avatar Editor default and unsaved states, Weekly Reset, and Settings without implementation changes.
- 2026-06-24: Completed a Tasks and Weekly Reset family-first UX pass by warming visible task copy, changing the beta-facing lists label to Shopping, making Weekly Reset contextual entry points read as week planning/family reset actions, and tightening narrow navigation button sizing without changing navigation destinations, task lifecycle behavior, Weekly Reset behavior, FamilyMember behavior, or Avatar V2.
- 2026-06-23: Completed beta navigation and surface cleanup by hiding House Status, Media, and Gamification from user-facing beta navigation, focusing primary navigation on Home, Agenda, Tasks, Shopping / Lists, and Motivation, keeping Weekly Reset contextual from Tasks, and preserving Settings as a compact Administration affordance while leaving Family Members contextual to Home and Avatar V2 flows unchanged.
- 2026-06-23: Completed Avatar V2 Slice 3 API/client contract cleanup by removing legacy avatar DTO/request/response fields from public Family Member API contracts and regenerated frontend client mappings, keeping create/update compatible through server-side legacy entity defaults, preserving Avatar V2 configuration and initials fallback behavior, and leaving EF/database legacy fields and migrations unchanged for Slice 4.
- 2026-06-23: Completed Avatar V2 Slice 2 renderer cleanup by removing the legacy CSS/span renderer from FamilyAvatar, requiring complete valid Avatar V2 config for SVG rendering, falling back to initials for missing/incomplete/invalid Avatar V2 config, and deleting legacy-only avatar CSS while leaving backend/API/contracts/generated client/persistence/migrations unchanged.
- 2026-06-23: Completed Avatar V2 Slice 1 frontend/product cleanup by replacing user-visible legacy avatar configuration details on Family Member parent surfaces with Avatar V2-oriented status copy, giving normal frontend creation and fallback data Avatar V2 defaults while preserving legacy compatibility payloads, and adding focused regression coverage for initials fallback and current API compatibility.
- 2026-06-23: Made Avatar V2 a FamilyMember-owned feature by adding AvatarV2Config persistence on FamilyMembers, round-tripping it through FamilyMember API contracts, connecting Family Member avatar editing to save/cancel/reset against persisted member state, and removing browser-local Avatar V2 editor storage.

- 2026-06-23: Removed remaining product-facing profile-picker assumptions from startup/navigation by hiding the isolated Avatar V2 editor from Administration, cleaning Family Member profile wording, and preserving the family-first flow from onboarding directly to Home.
- 2026-06-23: Shipped the isolated Avatar Editor MVP with persistent user-intent configuration, live SVG preview, visual asset selection, swatch-only colors, save/cancel/reset workflow, and tests while avoiding profile migration, MVP avatar replacement, child workspace integration, profile picker integration, unlockables, and gamification.
- 2026-06-23: Removed the unintended Avatar V2 base-layer center oval artifact, regenerated the SVG-only contact sheet under `docs/reports/2026-06-23-work/`, and kept the fix limited to renderer/test/report documentation without editor UI, persistence, production integration, raster assets, or avatar redesign.

- 2026-07-03: Updated the canonical FamilyBoard marketing storyboard after the product-wide viewport-first redesign so scenes reflect current Home, Agenda, Tasks, Shopping, Motivation, My Page, Avatar Editor, Weekly Reset, and Settings-reference behavior without application code changes, runtime validation, screenshots, video production, or binary artifacts.

- 2026-07-08: Revised the Avatar Catalog Technical Architecture report to remove the initial runtime catalog API, simplify versioning to SchemaVersion, recommend immediate JSON AvatarSelection persistence, omit compatibility-rule and asset-pipeline infrastructure, add Catalog Providers, and strengthen the generic catalog-driven editor principle without production code changes.

## Current Phase
Phase 2 — Durable Household Core

## Current Slice
Calendar Recurrence V2 Manual Event APIs — Completed

## Completed Slices
- 1.1 Repository Bootstrap
- 1.2 Workspace Framework
- 1.3 Widget Framework
- 1.4 Event Source Framework
- 1.5 Agenda Widget MVP
- 1.6 Layer Settings Persistence
- 1.7 Google Calendar Adapter
- 1.8 Birthdays Source
- 1.9 Shopping List MVP
- 2.1 Durable Lists Foundation
- 2.2 Widget/Layout Persistence
- 2.3 Manual Events Source
- 2.4 Backend-Backed Agenda Layer Settings
- 2.5 Event Editing UX Hardening
- 2.6 EventSeries Contract + Migration
- 2.7 Calendar Terminology, Projection, and Timezone Foundation
- 2.8 Calendar JSON Export and Full Restore Foundation
- 2.9 Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze
- 2.10 Calendar Portability UX and Pre-Restore Export
- Calendar Validation, Snapshot Storage, Restore Safety UX, and Documentation Hardening
- Calendar Recurrence, EventException, and Occurrence Generation Runtime
- Home Dashboard MVP, Family Member MVP, and Home Navigation Flows
- Phase 1 Roadmap Protection Rule
- 2.23 Home Task Summary
- Child Progress View
- Child Hero Area
- Product Experience Review Round 4
- Product Experience Review Round 5
- Product Experience Review Round 6
- HomeOps Long-Term Usage Review
- Celebration Asset Integration
- Weekly Reset Explanation Compaction
- Avatar Editor MVP
- Profile Picker Removal and Family-First Cleanup
- Avatar V2 Slice 1 Frontend/Product Cleanup
- Avatar V2 Slice 2 Renderer Cleanup
- Beta Navigation and Surface Cleanup
- Home Dialog and Layout UX Consistency
- Task Dialog Conversation






### Avatar V2 Contact Sheet Artifact — Completed 2026-06-22
- Generated a combined SVG-only contact sheet artifact for visual review at `docs/reports/2026-06-22-work/avatar-v2-contact-sheet.svg`.
- Included `showcase-01` through `showcase-06`, `golden-sample`, and `concept-b-headband-after` with plain SVG labels in a clean grid.
- Verified the contact sheet parses as SVG/XML, contains no raster `<image>` tags, contains no `href`, `src`, or URL references, regenerates deterministically, and preserves existing Avatar V2 sample/test behavior.

### Avatar V2 Concept B Headband Fit Fix — Completed 2026-06-22
- Corrected the Concept B headband geometric fit after visual review found the prior visibility fix made the accessory identifiable but still detached from the head volume.
- Replaced fixed-offset headband arcs with an anatomy-derived headband anchor curve based on `AvatarAnatomy.head.bounds`, while preserving the existing partial-occlusion rule and Concept B hairstyle.
- Regenerated before, after, and closeup SVG validation samples and verified SVG-only deterministic rendering, no raster references, no external URLs, and existing frontend build behavior.

### Avatar V2 Concept B Headband Visibility Fix — Completed 2026-06-22
- Corrected Concept B headband visibility after review found the previous validation sample technically rendered the accessory but did not make it reliably identifiable.
- Selected partial occlusion as the visual rule: the headband wraps behind foreground curls while short side arcs remain visible above the completed hair stack.
- Regenerated before, after, and closeup SVG validation samples while preserving SVG-only deterministic output, AvatarAnatomy-driven rendering, the Concept B face-strip fix, and the existing isolated Avatar V2 pipeline.

### Avatar V2 Concept B Curly Hairstyle Salvage — Completed 2026-06-22
- Rejected Concepts A and C per visual review override and kept Concept B as the only viable direction.
- Found the face strip root cause in the Concept B highlight layer: a long right-side highlight segment rendered above the face and descended through the cheek area.
- Corrected Concept B with a shorter upper-right wave highlight, regenerated four validation samples, and kept SVG-only deterministic Avatar V2 rendering intact without editor UI, persistence, production integration, new avatar systems, new head variants, clothing assets, accessories, or raster assets.

### Avatar V2 Curly Hairstyle Concept Exploration — Completed 2026-06-22
- Treated CurlyPlayful as rejected and created isolated SVG-only comparison artifacts for three fundamentally different curly hairstyle directions.
- Selected Tight Curl Clusters as the strongest editor-worthy direction, kept Loose Wavy Curls as a secondary reference, and rejected Playful Child Curls for weaker growth direction and less controlled readability.
- Preserved the existing Avatar V2 renderer and avoided editor UI, persistence, production integration, new avatar systems, new head variants, clothing assets, accessories, gamification, and unlockables.

### Avatar V2 Wide Head Anatomy Review and Fix — Completed 2026-06-22
- Reviewed round, oval, and wide Avatar V2 anatomy across head silhouette, ear placement, eye placement, glasses placement, mouth placement, and facial proportions.
- Corrected the regression as an interacting anatomy issue: ear anchors had been moved too far into the head silhouette, wide eye spread made glasses less natural, and glasses bridge/temple geometry used fixed offsets instead of fully following anatomy anchors.
- Regenerated Showcase Sample A, B, C, and D while preserving SVG-only deterministic rendering and keeping Avatar V2 isolated from editor, persistence, and production UI integration.


### Avatar V2 Engine Quality Upgrade Analysis — Completed 2026-06-22
- Added an isolated architecture analysis and implementation plan for improving Avatar V2 engine visual quality while preserving SVG-only deterministic rendering.
- Recommended an anatomy anchor system, head variants, hair depth layers, clothing assets, accessory mount points, expanded internal palette roles, and asset design standards.
- Kept editor integration, production UI integration, MVP avatar replacement, persistence changes, and non-SVG rendering out of scope.

### Weekly Reset Explanation Compaction — Completed 2026-06-22
- Applied the HomeOps review-first UX rule to Weekly Reset so the page opens with review state, counts, and actions instead of tutorial-style explanation.
- Compacted the hero and task, goal, shopping, and recap cards while preserving existing Weekly Reset behavior, candidate selection, goal review, shopping review, task review actions, and recap behavior.
- Kept Weekly Reset as a maintenance workflow and did not add new domains, features, workflow changes, notifications, rewards, or review-logic changes.


### No-Date Task Lifecycle — Completed 2026-06-21
- Added a trust-preserving no-date task lifecycle with Active, Needs Review, Someday, Completed, and Archived states.
- Older no-date tasks now participate in a parent-facing Weekly Household Reset prompt, “Still part of the plan?”, with actions to keep active, add a due date, move to Someday, complete, or archive.
- Someday is an explicit destination for long-term ideas and aspirations that should remain recoverable without contributing to daily household pressure.
- Home and Child Workspace task surfaces stay focused by avoiding Someday, archived, and review-only stale-task pressure in child-facing views.
- The slice preserves the Review, Do Not Disappear principle: no-date tasks remain valid and are never automatically deleted.


### Celebration Asset Integration — Completed 2026-06-21
- Integrated existing Celebration Wave 1 SVG assets into the Semantic Icon Layer registry.
- Replaced Celebration Unicode/emoji rendering across Motivation, Child Workspace, Home Motivation summary, and Celebration Memory surfaces with HomeOps-owned assets.
- Preserved existing Celebration, Motivation, Child Workspace, Home, Family Goal, and Celebration Memory behavior while limiting changes to visual asset integration.
- Asset-system progress now includes semantic SVG resolution with fallback symbols for consumers that do not yet have owned assets.

### Motivation Overview / Detail Separation — Completed 2026-06-22
- Motivation is now overview-first: the active Family Goal, current progress, and Celebration state remain the primary first-screen story.
- Helpful Moments now open as a compact appreciation preview with count/recent example, while appreciation creation and full browsing require explicit expansion.
- Celebration Memories now show a recent memory by default with history behind intentional detail access.
- Personal Goals now show active count and key progress summary first, with editing/management behind a deliberate manage action.
- Existing Family Goal, Helpful Moments, Celebration, Memory, and Personal Goal data models and workflows remain preserved; this was a UX-only hierarchy slice.

### HomeOps Long-Term Usage Review — Completed 2026-06-21
- Added a long-term household usage review focused on 30-day and 90-day retention, habit formation, sustainable workflows, and maintenance burden.
- Captured independent reviewer perspectives for an expert product reviewer, father, mother, six-year-old child, and ten-year-old child before combining conclusions into a final verdict.
- Concluded the family would probably still use HomeOps after 90 days because recurring household coordination, shopping preparation, child contribution visibility, and family goal rituals create durable value, while templates, stale memories, generic recognition, and over-maintained goals are likely to fade.
- Recommended a Weekly Household Reset and Recap as the single highest-retention next improvement because it consolidates maintenance and turns review, recognition, planning, and celebration into a sustainable family ritual.

### Product Experience Review Round 6 — Completed 2026-06-21
- Evaluated the current HomeOps product experience after the Family Contribution Story Foundation reframed Motivation from Goal → Progress → Celebration → Memory to Contribution → Progress → Celebration → Memory.
- Concluded that children now mostly feel “I helped make this happen,” replacing the Round 5 ownership gap with clearer child, parent, and family ownership.
- Ownership verdict is Mostly solved: contribution is now visible and emotionally meaningful across Child Workspace, Helpful Moments, Celebration, and Memory, but the product still needs a more concrete contribution-to-celebration recap using specific Helpful Moments.
- Final ratings: Home Good, Child Workspace Good, Motivation Good, Helpful Moments Excellent, Celebration Good, Memory Good, Family Story Good, and Product Identity Good.

### Product Experience Review Round 5 — Completed 2026-06-21
- Evaluated the current HomeOps product experience after Child Mode, Child Hero Area, Child Journey, Helpful Moments Upgrade, Celebration Surface, Celebration Memory, and Celebration Anticipation Moment.
- Concluded that HomeOps now creates real early emotional investment rather than primarily communicating information.
- Celebration verdict is Mostly solved: Planned, ReadyToCelebrate, Celebrated, and Memory now form a meaningful Goal → Progress → Celebration → Memory loop, but Celebration still needs more family-authored ritual, child ownership, and keepsake-quality memory to become the unmistakable emotional peak.
- Final ratings: Home Good, Child Workspace Good, Motivation Good, Helpful Moments Excellent, Celebration Good, Family Story Good, and Product Cohesion Good.


### HomeOps Long-Term Sustainability Review — Completed 2026-06-21
- Added a sustainability-focused review of current HomeOps workflows across daily friction, recurring tasks, goal hygiene, shopping lifecycle, templates, stale-data risk, maintenance burden, input friction, trust, and retention.
- Captured independent reviewer perspectives for an expert product reviewer, father, mother, six-year-old child, and ten-year-old child before combining conclusions.
- Concluded HomeOps currently mostly saves more effort than it creates because shopping, recurring task hygiene, goal focus, and child contribution reduce coordination load, while stale manually entered data remains the largest long-term risk.
- Recommended a Weekly Household Reset as the single most valuable next sustainability slice because it batches cleanup and protects trust without adding a new product domain.

### Tasks Hierarchy Compaction — Completed 2026-06-22
- Applied the Home dashboard-first UX lesson to Tasks so active urgency groups render before creation, templates, Weekly Reset maintenance, and Someday planning content.
- Replaced the persistent top task creation form with a compact on-demand Add Task panel while preserving title, owner, family member, due date, and recurrence capabilities.
- Moved Task Templates and Weekly Household Reset into secondary entry points and kept Someday after active work, preserving existing behavior without new domains, persistence changes, or workflow changes.

## Next Slice
Proceed with the next Phase 2 household-core slice only after preserving Home as summary-first, Family Members as non-authentication household entities, Motivation progress as encouragement-only, and HomeOps Calendar source-of-truth/local-only portability boundaries.

## Repository Governance
- Phase 1 is historical. Future Phase 2, Phase 3, and later-phase feature work updates the current phase roadmap instead of `docs/roadmap/phase-1.md`; Phase 1 roadmap edits are reserved for factual corrections, incorrect history fixes, or broken reference repairs.

## Key Architectural Decisions
- HomeOps is a modular monolith.
- Backend uses ASP.NET Core with C#.
- Frontend uses React, TypeScript, and Vite.
- PostgreSQL is the database, with Docker Compose for development.
- API contracts use OpenAPI and NSwag.
- Workspaces are top-level navigation units.
- Workspaces host widget instances.
- Widget instances reference widget definitions and render through a central widget renderer.
- Event sources own normalized events and declare read-only or writable capabilities.
- Normalized events remain generic and are not widget-specific.
- Agenda layer settings persist through backend APIs per generated local device key, with independent Week and Months selections.
- Event source adapters normalize provider-specific payloads before widgets consume events.
- Google Calendar is modeled as a read-only event source adapter using fake payloads only.
- Birthdays are generated as annual all-day normalized events within an 18-month horizon and are read-only in the current client experience.
- Shopping List MVP has been replaced by the generic persisted Lists domain for the Shopping example list.
- Widgets are presentation units, and shared data models must not be widget-specific.
- Calendar JSON export is canonical HomeOps portability data.
- Calendar restore is local-only and full restore only; validation and local pre-restore snapshot creation run before replacement, while selective import, merge import, remote restore, and conflict resolution are not implemented. The pre-restore snapshot path is configurable with a safe local default, and container deployments should mount the configured path to writable persistent storage when snapshots must survive container replacement.
- EventOccurrence is projection-only Agenda data and is not canonical export data.
- Google Drive is a future export destination only; Google Calendar and ICS remain out of scope. Recurrence and EventException runtime foundations are implemented for HomeOps Calendar only.
- Calendar V1 JSON contract shape is frozen; recurrence, exception, and future metadata sections are reserved without runtime behavior.

## Phase 2 Durable Lists Foundation
- EF Core persistence is configured for PostgreSQL with Supabase-compatible standard PostgreSQL behavior.
- The application uses a single seeded household ownership record for persisted Lists data; household management, users, profiles, roles, invites, authentication, and multi-household support are not implemented.
- The generic Lists domain owns Lists and ListItems; Shopping is one seeded list, not a widget-specific data model.
- Deterministic seed data creates Shopping and Vacation Packing lists with representative items.
- Lists APIs are exposed through OpenAPI and consumed by the frontend through the generated NSwag TypeScript client.
- The Shopping List Widget now loads, adds, toggles, and removes items through API-backed list persistence.
- The app is offline-tolerant only at the UI error-state level; no offline-first synchronization or conflict resolution has been introduced.

## Phase 2 Widget/Layout Persistence
- Workspace layouts are persisted as household-owned dashboard configuration.
- The widget catalog remains application-owned; persisted layout placements reference catalog widget definitions and do not allow arbitrary runtime widget types.
- Seeded default layouts preserve the validated Home, House, Media, and Settings workspace experience.
- The frontend loads workspace layouts through the generated NSwag TypeScript client and falls back to default layouts if the API layout is unavailable or unusable.
- No drag-and-drop editor, widget marketplace, authentication, multi-household management, or offline-first synchronization has been introduced.

## Phase 2 Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze
- Calendar V1 JSON export contract is frozen and remains logical rather than database-shaped.
- The contract reserves recurrence, exception, and future metadata sections without implementing recurrence or EventException runtime behavior.
- Restore is explicitly local-only and full-restore-only.
- Validation covers schema/version, household ownership, identifiers, source references, timing shape, timezone, recurrence, and exception sections before destructive actions.
- Invalid exports are rejected before modifying existing calendar data.
- Automatic pre-restore export is implemented as a local canonical JSON safety snapshot before destructive replacement, with configurable local snapshot storage and safe default behavior.
- Settings exposes a minimal local calendar export/restore UI with version, timestamp, validation feedback, friendly errors, an explicit destructive replacement warning, and a required confirmation checkbox.

## Phase 2 Calendar JSON Export and Full Restore Foundation
- Calendar export uses a versioned `homeops.calendar.export` JSON document as the canonical HomeOps Calendar portability format.
- Export includes schema/version metadata, exported timestamp, household timezone, event source metadata, EventSeries data, and reserved future recurrence/exception structure.
- EventOccurrence remains generated projection-only Agenda data and is not exported as source-of-truth data.
- Full restore validates the entire export before applying changes, rejects unsupported schema/version data and invalid timezones, replaces existing calendar source/EventSeries contents, preserves safe source and EventSeries identifiers, and updates valid household timezone metadata.
- No selective import, merge import, conflict resolution, Google Drive upload, Google Calendar import, ICS, recurrence runtime behavior, EventException runtime behavior, notifications, reminders, authentication, or timezone UI has been introduced.

## Phase 2 Calendar Terminology, Projection, and Timezone Foundation
- Event APIs now use EventSeries contract names while preserving the existing `/api/events` route shape.
- The frontend Agenda integration uses HomeOps Calendar/EventSeries terminology and keeps compatibility aliases for existing module consumers.
- EventOccurrence remains generated projection data only; it is not persisted or authoritative.
- Household timezone is persisted on Household and defaults to `Europe/Amsterdam` when no suitable local household timezone can be derived.
- EventSeries no longer stores a per-event timezone field; V1 calendar behavior uses the household timezone foundation.
- Roadmap and architecture docs now reflect HomeOps Calendar as source of truth, Google Calendar as optional integration, JSON as future canonical export, and ICS/export/import implementation as out of scope for this slice.

## Phase 2 EventSeries Contract + Migration
- HomeOps Calendar events are persisted as non-recurring EventSeries records.
- EventSeries stores source ownership, title, description, all-day state, date-only start/end dates, optional timed start/end times, persisted household timezone, initially `Europe/Amsterdam`, and audit timestamps.
- Agenda-facing events are generated dynamically as EventOccurrence projections; EventOccurrence is not persisted or authoritative.
- Existing event routes preserve create, update, delete, retrieval, and normalized Agenda rendering behavior through EventSeries API contracts and the generated NSwag client.
- All-day events use date-only semantics, and multi-day all-day events use exclusive end-date ranges.
- No recurrence, EventException, Google Calendar integration, import/export, ICS, reminders, notifications, authentication, or timezone configuration UI has been introduced.

## Phase 2 Event Editing UX Hardening
- HomeOps Calendar events can be created, edited, and deleted from the embedded Agenda experience.
- The UI validates required titles, timed event end times, and date ranges before submission.
- Backend event APIs return consistent validation problem responses for missing titles and invalid date ranges.
- All-day events use date inputs; timed events use datetime inputs.
- Week View, Months View, birthday visibility, HomeOps Calendar visibility, source filtering, and device-specific layer settings remain preserved.
- No recurring events, dedicated event management page, Google Calendar integration, OAuth, authentication, notifications, or offline-first synchronization has been introduced.

## Phase 2 Backend-Backed Agenda Layer Settings
- Agenda layer settings are device-specific and are not household-scoped or user-scoped.
- The frontend stores only a generated local device key and sends it through the `X-HomeOps-Device-Key` API header.
- Week View and Months View source selections remain independent.
- Unknown or newly added event sources default to enabled when no saved setting exists.
- No authentication, users, profiles, device registration, device management, or offline-first synchronization has been introduced.

## Phase 2 HomeOps Calendar Source
- HomeOps Calendar is the writable HomeOps-owned event source.
- The backend stores household-owned event sources and EventSeries records, then normalizes generated EventOccurrence projections into the existing normalized event model used by the Agenda.
- Deterministic seed data includes Dentist Appointment, Parent Evening, Vacation, and Put Bins Outside.
- Minimal event APIs provide event source retrieval plus EventSeries get, create, update, and delete.
- The Agenda Widget loads persisted HomeOps Calendar events through the generated NSwag client and preserves birthday source compatibility, source filtering, the Planning briefing, and contextual Month planning.
- A minimal embedded Agenda form validates event create, update, and delete; no dedicated event management page, recurring events, Google Calendar integration, OAuth, authentication, or notifications have been introduced.

## Phase 2 Calendar Recurrence Runtime
- EventSeries now stores V1 recurrence metadata using only None, Daily, Weekly, Monthly, and Yearly.
- EventException records support skipped and modified generated occurrences for future edit/delete occurrence workflows.
- Agenda still consumes generated EventOccurrence/NormalizedEvent output only; EventOccurrence is not persisted.
- Occurrence generation uses the household timezone and local wall-clock semantics, so recurring timed events keep the same local time across DST transitions.
- All-day and multi-day all-day recurrence preserve date-only and exclusive end-date semantics.
- Advanced recurrence rules, ICS, Google Calendar, reminders, notifications, authentication, per-event timezone support, timezone UI, and series splitting UI remain out of scope.

## Phase 2 Home Dashboard MVP
- Home is now the primary summary-first dashboard and glassboard-style surface.
- Home renders date, time, a minimal Family Member strip, quick capture actions, an Agenda summary card, and a Lists summary card.
- Agenda summary remains today-first with tomorrow/next preview, limited visible rows, overflow routing, and navigation to the dedicated Agenda page.
- Lists summary shows active list items only, limits visible rows, provides overflow routing, and navigates to the dedicated Lists page.
- Family Members are minimal household presentation entities with name, display color, and initials; they are not users, logins, profiles, permissions, task owners, or point accounts.
- Home quick capture routes to Agenda or Lists rather than implementing advanced Home-native forms.
- Existing Agenda, Lists, EventSeries, Calendar, and export/restore functionality remains on dedicated pages and existing widgets.
- Local development relies on the ASP.NET Core API launch profile at `http://localhost:5152`; the Vite client dev proxy targets that origin so Home summary cards load successfully during startup review.
- The API applies pending EF Core migrations on non-testing startup so local development surfaces seeded dashboard data without a separate manual migration step.

## Phase 2 Home Dashboard Visual Hardening
- Home chrome is reduced so the dashboard no longer surfaces framework-oriented copy such as workspace counts or workspace descriptions on the Home view.
- Home keeps the existing summary-first structure while making Agenda visually dominant, Lists useful with active item detail loading, and Family Members more household-contextual through lightweight avatar cards.
- Lists summary now fetches list details after the list index so active Shopping and Vacation Packing items can render on Home while preserving item limits and overflow routing to Lists.
- Tablet portrait behavior now stacks the Home summary cards at a wider breakpoint for easier touch-first reading.
- Existing Agenda, Lists, Family Member MVP, Calendar, navigation, and export/restore boundaries remain preserved; no authentication, profiles, ownership logic, reminders, notifications, Google Calendar, tasks, gamification, house status, or media functionality has been introduced.

## Phase 2 Home Hierarchy Tightening
- Home chrome is further reduced by removing the global marketing-style header copy and tightening app-shell spacing so the board content starts sooner.
- Home's top area now focuses on date, time, and a compact Home weather pill while preserving workspace navigation and quick capture routes.
- Home Agenda summary groups visible items under Today, Tomorrow, and Later / Next without repeating the group label per item; summary limits, overflow routing, and dedicated Agenda behavior remain preserved.
- Home Lists summary uses concrete list-oriented naming, prioritizing Shopping/Boodschappen when that list is present, while preserving multiple list labels, active item rendering, and overflow routing.
- Family Members remain temporary presentation placeholders with name, initials, and color only; avatar redesign, avatar models, editors, badges, ownership, profiles, persistence, points, and permissions remain deferred.
- Tablet portrait spacing is tightened to bring Agenda and Lists closer to the first viewport without reducing key touch targets.


## Phase 2 Family Member Avatar MVP
- Home now renders Family Members with frontend-only friendly configurable avatars instead of initials-only color chips.
- The local avatar model includes family member id, name, display color, initials, age group, presentation, skin tone, hair color, hair style, glasses, and shirt color.
- Avatar editing uses the compact household avatar editor with live preview and in-memory changes only; current navigation opens the dedicated Family Member page first.
- Family Members remain household presentation entities only; they are not users, authentication identities, profiles, permissions, ownership records, task owners, or point accounts.
- Avatar badges for tasks, points, warnings, or today involvement remain future scope and were not implemented.

## Phase 2 Family Member Page and Avatar Relocation
- Family Members now have a dedicated frontend page reached by selecting a Family Member from Home.
- The Family Member page shows the member avatar, name, display color, current avatar configuration, and explicitly non-functional future placeholders for Tasks and Points.
- Avatar editing has moved off Home and is owned by the Family Member page; the existing live preview and avatar controls remain frontend-only and in-memory.
- Home remains a summary-first dashboard: the Family Member strip is navigational/contextual only and no longer opens avatar editing directly.
- Family Members remain household entities only; no users, authentication identities, profiles, permissions, ownership, tasks, gamification, points, badges, notifications, or persistence were introduced.

## Phase 2 Task Page Foundation
- Tasks are now a dedicated household domain separate from Lists, Calendar, and Gamification.
- The task model supports title, optional due date, ownership state, completion state, completion timestamp, and household ownership.
- Ownership states are `Unassigned`, `FamilyMember`, and `SharedHousehold`; Family Member owners reference existing household presentation member identifiers and do not introduce users, authentication, permissions, profiles, or roles.
- The current task lifecycle is `Available` and `Completed`; completed tasks can be reopened.
- The client includes a dedicated Tasks page organized urgency-first into Overdue, Due Today, Upcoming, No Due Date, and Completed Recently groups.
- Task creation remains lightweight with title, optional ownership, and optional due date only.
- No recurrence, approval, points, gamification, categories, notifications, reminders, Calendar integration, Google Calendar integration, House Status, Media, authentication, permissions, or roles were introduced.

## Phase 2 Domain Color System and Future Domain Placeholders
- HomeOps now has a centralized frontend domain color system that assigns each major workspace a pastel color family for navigation accents, active navigation state, and subtle page background tints.
- Existing Home, Agenda, Lists, Tasks, Family Member, and Settings surfaces retain white or near-white cards for readability while the surrounding page background and navigation communicate domain identity.
- Tasks now uses the shared Tasks color family for a warmer household responsibility surface without changing task grouping, task creation fields, completion, reopening, or ownership behavior.
- House Status, Media, and Gamification now have dedicated placeholder pages reachable from navigation.
- Placeholder pages only provide title, short future-purpose copy, and a coming-later status; they do not implement sensors, device state, media integrations, points, rewards, badges, or gamification logic.

## Phase 2 Home Quick Capture
- Home now supports direct Shopping quick capture with one text field and one Add action that writes to the seeded Shopping list without requiring list selection.
- Home now supports lightweight Calendar quick capture with What and When fields; When supports Today, Tomorrow, and Pick date, while advanced event editing remains on the Agenda page.
- Shopping history suggestions are available while typing from browser-local captured item names and currently active list item names. No AI, store selection, store grouping, store icons, reminders, notifications, Google Calendar behavior, or shopping intelligence were added.
- Future store-learning remains a later direction: preferred store per item may be learned later from the history foundation without changing Home into a store-planning surface.
## Phase 2 Family Member Persistence
- Family Members are now durable household-owned records in the backend, seeded for the single household and exposed through minimal retrieval/update APIs.
- Family Members remain presentation/household entities only; they are not users, authentication identities, profiles, roles, permission principals, or login accounts.
- Avatar configuration is persisted with each Family Member, so avatar editor updates survive reloads while existing frontend fallback values remain available when API loading fails.
- Home, the Family Member page, and Tasks consume the loaded Family Member collection from the workspace shell.
- Task ownership now validates assigned Family Member references against persisted household Family Members while preserving Unassigned and Shared Household ownership states.

## Home Task Summary
Home now surfaces the three core household domains on the dashboard: Agenda, Shopping/Lists, and Tasks. The Tasks summary is bounded to overdue, due today, and upcoming active tasks with title, owner/shared household indicator, and due information only. Home remains summary-only: task creation, editing, completion, recurrence, approval, points, categories, notifications, reminders, and configuration stay off Home and remain owned by the dedicated Tasks page or future slices.

## Phase 2 Motivation Page Foundation
- Motivation is now a dedicated encouragement page separate from Tasks, Gamification, and the future Reward Economy.
- The first foundation uses lightweight seeded client data for one active family goal with title, target, current progress, optional shared reward label, and warm progress copy.
- Individual goal cards are linked to loaded Family Members and show member avatar/name plus star/checkmark progress without ranking, comparison, balances, or punitive states.
- Home includes a compact Motivation tile that shows only the active family goal title and progress and navigates to the Motivation page.
- Reward Economy, gems, shop, spend/redeem flows, avatar unlocks, leaderboards, Helpful Moments, task approval, task recurrence, authentication, permissions, and roles remain deferred.

## Phase 2 Motivation Domain Foundation
- Motivation now has a persisted read-only domain foundation for the seeded household.
- The backend stores one active family goal and active individual goals linked to persisted Family Members; progress remains seeded and is not derived from Tasks yet.
- The read-only Motivation API returns the active family goal, active individual goals, and Family Member linkage needed by the frontend, with a neutral empty response when no records exist.
- The Motivation page and Home Motivation tile now consume generated NSwag client data instead of the previous hardcoded frontend snapshot.
- Goal editing, goal creation UI, Helpful Moments, gems, tokens, coins, reward shop, spend/redeem flows, avatar unlocks, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

## Motivation Progress Foundation
Motivation progress now derives from task completion while Motivation remains a read model. Completing a Shared Household task advances the active family goal, and reopening it reverses that progress. Completing a task assigned to a Family Member advances that member's active individual goals, and reopening it reverses that progress. Progress is persisted on Motivation goal records and bounded by each goal's target count. Helpful Moments, Reward Economy, Gems, Tokens, Shop, avatar unlocks, badges, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

## Phase 2 Family Member Management Foundation
- Family Members now have a management foundation for household-maintained members without developer involvement.
- The domain stores an explicit `MemberKind` (`Adult` or `Child`) separate from avatar age group so avatar editing remains presentation-only.
- `DateOfBirth` is persisted; it is required for children and optional for adults.
- Home exposes lightweight add-member management, and the Family Member page supports editing name, member type, date of birth, display color, avatar configuration, and confirmed removal.
- Removal is soft delete only. Deleted members are filtered from normal Family Member lists and new Task assignment, while existing Task and Motivation references remain intact.
- Family Members remain household entities only; no users, authentication identities, profiles, permissions, roles, onboarding wizard, goals, rewards, or gamification management were introduced.

## Phase 2 First Run Wizard
- First Run Wizard is implemented as the second P0 onboarding slice.
- New or reset households require onboarding when the household has no active Family Members or onboarding completion has not been persisted.
- The wizard guides a household through Welcome, Add Adults, Add Children, Review Household, and Finish.
- Adult and child setup uses the existing Family Member creation path; children require date of birth.
- Completion persists the household onboarding flag and returns users to Home; configured households with active Family Members do not repeatedly see the wizard.
- Existing Family Member Management, Home, Tasks, Lists, Agenda, Motivation, and navigation remain available after onboarding.

## Completed Slice 2.28 — Empty State UX Foundation
Empty State UX Foundation completes the remaining P0 onboarding gap by making empty Home, Tasks, Lists, Motivation, and Agenda surfaces self-guiding. New households now see friendly first actions for creating a first task, adding a first shopping/list item, creating a first event, and creating a first family goal, with navigation to the owning domain page or existing creation entry. Empty states stay lightweight and do not introduce tutorials, goal editing, rewards, reward economy, gems, shop, notifications, gamification, Google Calendar, or new integrations.


## Family Goal Creation and Editing
Family Goal Creation closes the final functional P0 blocker for Motivation. Households can create their first active family goal from the Motivation empty state using title, target count, progress wording, and an optional family celebration label. The active family goal can be edited in place while preserving existing progress and capping progress if the target is lowered. Home continues to show the active family goal through the Motivation tile after the household returns to Home. Individual goal creation, Helpful Moments, Gems, Reward Economy, Shop, badges, leaderboards, negative points, goal templates, recurrence, notifications, Google Calendar, authentication, permissions, and roles remain deferred.

### Helpful Moments Foundation — Completed
- Helpful Moments now persist parent-entered recognition for positive household behavior that does not fit naturally into Tasks.
- Helpful Moments capture a Family Member, short title, optional note, simple recognition tag, and creation time.
- Motivation shows a warm recent Helpful Moments feed with lightweight creation, and Family Member pages show member-specific moments.
- Helpful Moments are recognition-only in this slice: no points, balances, reward economy linkage, leaderboards, or automatic Motivation progress changes were introduced.

### Family Goal Celebration Foundation — Completed 2026-06-20
- Family Goals now use a structured Family Celebration concept with a title, optional description, and lightweight status.
- Celebration status values are `Planned`, `ReadyToCelebrate`, and `Celebrated`.
- Completing an active family goal moves its celebration from `Planned` to `ReadyToCelebrate`; a parent can mark the celebration as `Celebrated` after it happens.
- Motivation displays celebration context without replacing progress or encouragement as the primary page focus.
- Home shows only compact celebration context in the Motivation tile when useful.
- Reward Economy remains deferred: no gems, tokens, coins, shops, purchases, avatar unlocks, badges, leaderboards, or individual rewards were introduced.


### Individual Goal Management — Completed 2026-06-20
- Parents can now create, edit, reassign, and archive individual Motivation goals from the Motivation page.
- Individual goal editing preserves progress where possible and caps progress when a lowered target would otherwise be exceeded.
- Archived individual goals are retired from active Motivation and Child Progress displays without hard deletion, preserving persisted history.
- Child Progress pages continue to consume the Motivation snapshot, so newly created active goals appear automatically and archived goals disappear.
- Reward Economy remains deferred: no gems, tokens, shops, purchases, avatar unlocks, badges, leaderboards, negative points, notifications, recurrence, or goal templates were added.

### Recurring Tasks Foundation — Completed 2026-06-20
- Tasks now support a simple recurring series foundation for routine household chores.
- Supported recurrence frequencies are Daily, Weekly, and Monthly; no custom schedules, cron rules, reminders, notifications, approval, templates, reward economy, gems, or shop behavior were added.
- Recurring task generation creates dated task occurrences from the reusable series so parents do not need to recreate routine chores manually.
- Completing one generated occurrence keeps the recurring definition intact and continues to contribute to Motivation progress using the existing Shared Household and Family Member task completion rules.
- Editing a recurring task updates the simple series fields: title, owner, due/start date, and frequency. Deleting uses explicit Delete Series behavior and removes pending occurrences while preserving already completed task history.

### Task Templates Foundation — Completed 2026-06-20
- Added persisted, household-owned Task Templates with active/archive lifecycle and ordered template task items.
- Templates support simple task definitions with title, owner, optional recurrence, and optional due timing offset.
- Parents can create, edit, archive, and apply templates from the Tasks page.
- Applying a template creates new normal tasks for non-recurring items and recurring task series plus generated occurrences for recurring items.
- Seeded starter templates include Morning Routine, Bedtime Routine, Homework Routine, Pet Care, and Kitchen Reset; households can edit or archive them later.
- Goal Templates, Reward Economy, gems, shop, notifications, sharing, marketplace, import/export, and AI-generated templates remain deferred.


### Shopping Intelligence Foundation — Completed 2026-06-20
- Shopping items now support optional preferred-store metadata while preserving existing list items and item-name-only capture.
- Store learning is deterministic: assigning a store to an item records a household preference by normalized item name, and later additions inherit that preferred store automatically.
- Users can override the store later per item, which updates the learned preference for future matching additions.
- Shopping views group items by preferred store when present and keep uncategorized items visible.
- Shopping suggestions and Home list summaries may show store context for recognition, without requiring store selection during capture.
- No mandatory store selection, AI classification, OCR, barcode scanning, notifications, shopping automation, or Reward Economy behavior was introduced.

### Child Workspace Foundation — Completed 2026-06-20
- Child Family Member pages now behave as a warm Child Workspace that prioritizes avatar identity, goal progress, family teamwork, encouragement, and recent Helpful Moments before administration.
- The workspace uses DateOfBirth for age-aware presentation: younger children get simpler star/checkmark language while school-age children get richer progress and celebration detail.
- Existing Motivation data supplies active individual goals, active family goal progress, and family celebration context without adding Reward Economy, gems, shops, balances, badges, leaderboards, or notifications.
- Existing Helpful Moments appear as positive recognition cards on the child workspace, while existing Family Member persistence, avatar editing, Motivation, Family Goals, Individual Goals, Tasks, and Home flows remain preserved.

### Child Mode — Completed 2026-06-20
- Child Family Member pages now land in dedicated Child Mode as “My Place In The Family,” with avatar identity and the “How am I doing?” emotional frame before any administration.
- Child Mode keeps the existing Child Workspace and Child Progress content dominant: family goal, personal goals, progress, Helpful Moments, and family celebration appear before Parent Mode access.
- Parent Mode remains available as a secondary administration area for editing member details, date of birth, member type, display color, avatar configuration, and removal without removing existing management functionality.
- Existing Family Member persistence, avatar editing, Child Workspace, Motivation, Goals, Helpful Moments, and Celebrations remain preserved. Reward Economy, gems, shop, purchases, notifications, Google Calendar, household settings, and dashboard customization remain out of scope.

### Child Hero Area — Completed 2026-06-21
- Child Mode now starts with a dominant hero area that combines avatar, name, current primary goal, at-a-glance progress, active family goal context, and celebration visibility before secondary progress cards.
- The hero-first hierarchy intentionally reads as identity, current goal, progress, family contribution, then celebration so children can answer “Who am I?”, “How am I doing?”, “What am I working on?”, and “How am I helping?” without scanning multiple cards.
- Family contribution visibility connects the child to the shared active family goal with together-language and no rankings, comparisons, leaderboards, gems, shops, purchases, or Reward Economy behavior.
- Existing Child Workspace, Child Mode, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, and avatar editing remain preserved.

### Child Journey — Completed 2026-06-21
- Child Mode now reads as a guided Child Journey: Hero, Today, This Week, Family Goal, Helpful Moments, then secondary Parent Mode access.
- Today shows active child-owned tasks with friendly action copy and a small count summary, without task administration controls.
- This Week shows active individual Motivation goals with visual progress and encouraging status language.
- Family Goal shows active shared family progress, belonging-oriented contribution context, and Family Celebration context when available.
- Existing Child Mode, Child Hero Area, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, Parent Mode, Tasks, and avatar editing remain preserved.
- Reward Economy, gems, shops, purchases, notifications, Google Calendar, dashboard customization, household settings, rankings, comparisons, and leaderboards remain out of scope.

### Helpful Moments Upgrade — Completed 2026-06-21
- Helpful Moments now present to children as “Things My Family Appreciates,” shifting the experience away from a recent feed and toward warm family appreciation.
- Recognition copy now uses child-facing language such as “My Family Appreciates,” “Thank you for,” and “We noticed,” while keeping existing parent-entered Helpful Moment creation and persistence intact.
- Child Mode surfaces appreciation as an emotional highlight after the Family Goal journey section, preserving Child Workspace, Child Journey, Motivation, Goals, Family Celebrations, Tasks, and avatar editing.
- Motivation now connects appreciation with encouragement, family goals, personal goals, progress, and celebrations without adding automatic progress, rewards, gems, shops, purchases, notifications, rankings, comparisons, or leaderboards.

### Celebration Surface — Completed 2026-06-21
Celebration Surface makes Family Celebrations visible as meaningful family moments instead of secondary text on a goal card. Motivation now presents a coherent Goal → Progress → Celebration story with a dedicated celebration surface for planned, ready, and celebrated states. Child Mode surfaces the celebration in the hero area and Family Goal journey section with child-facing anticipation and ready-state language. Home keeps its summary-first dashboard shape while adding a compact celebration surface that becomes difficult to miss when a family celebration is ready. Existing Family Goals, Motivation, Child Workspace, Child Journey, Helpful Moments, and Tasks remain preserved. Reward Economy, gems, shops, purchases, individual rewards, notifications, celebration history, celebration memory, goal templates, and dashboard customization remain out of scope.

### Completed Slice 2.36 — Celebration Memory
Celebration Memory makes completed Family Celebrations part of family history instead of disappearing after completion. When a celebration is marked Celebrated, HomeOps now preserves the celebration title, optional description, and celebrated date, and the Motivation snapshot exposes recent celebration memories. Motivation presents those memories as warm family history in the Goal → Progress → Celebration → Memory story, while Child Mode shows recent memories so children can see what the family already achieved and celebrated together. The slice intentionally avoids audit-log presentation, timeline engines, social feeds, comments, reactions, Reward Economy, gems, shop, purchases, individual rewards, notifications, rankings, and dashboard customization. Existing Family Goals, Family Celebrations, Celebration Surface, Motivation, Child Workspace, Child Journey, Helpful Moments, and Tasks remain preserved.

### Celebration Anticipation Moment — Completed 2026-06-21
- Planned Family Celebrations now use anticipation copy that names the upcoming fun thing and ties remaining family progress directly to getting closer to it.
- Motivation strengthens the Goal → Progress → Celebration story with progress-to-celebration language and a ReadyToCelebrate arrival moment that says “We did it” instead of only showing a status.
- Child Mode now highlights how close the family is to the celebration in the hero and Family Goal journey surfaces, including child-facing copy about how today’s help moves the family closer.
- Home’s Motivation tile summarizes planned celebrations as getting closer and ReadyToCelebrate moments as ready now, preserving the compact dashboard shape.
- Existing Family Goals, Motivation, Child Workspace, Child Journey, Helpful Moments, Celebration Surface, and Celebration Memory remain preserved. Reward Economy, gems, shops, purchases, notifications, photos, comments, reactions, social feeds, voting, and new persistence models remain out of scope.

### Family Contribution Story Foundation — Completed 2026-06-21
- Child-facing Motivation now frames the family journey as Contribution → Progress → Celebration → Memory instead of Goal → Progress → Celebration → Memory.
- Helpful Moments act as the narrative bridge showing how kindness, teamwork, initiative, responsibility, and routines helped the family get closer without changing progress mechanics.
- Child Mode strengthens ownership language around “My help mattered,” “My family noticed,” and “I helped make this happen” while avoiding comparison, rankings, points, gems, shops, balances, badges, leaderboards, and rewards.
- Celebration and memory surfaces now emphasize that celebrations are family-created and memories explain why the celebration happened using existing goal, progress, celebration, and Helpful Moment context only.

## 2026-06-21 Recurring Task Hygiene
- Recurring task occurrences now use soft expiration for older incomplete occurrences once the same series has a current or upcoming occurrence.
- Expired recurring occurrences are omitted from the active task API response, reducing stale recurring backlog without hard deletion.
- Completed recurring occurrences remain preserved so Motivation progress and completed task history stay intact.


## 2026-06-21 Update — Goal Hygiene
- Implemented goal hygiene as a Phase 2 maintenance-reduction slice.
- Family Goal creation and editing now enforce a single active Family Goal by retiring other active family goals through the existing inactive lifecycle model.
- Individual Goal creation and editing now enforce a single active Individual Goal per Family Member, retiring only that member's other active goal and leaving other members unaffected.
- Added database-level partial unique indexes and migration cleanup to prevent duplicate active goals from reappearing outside normal API flows.
- Existing progress, Motivation displays, Family Celebrations, Child Workspace, and Family Contribution Story remain preserved while reducing stale goal clutter.


## 2026-06-21 Update — Shopping Lifecycle
- Implemented shopping lifecycle management as a Phase 2 maintenance-reduction slice.
- Lists can now be renamed and can leave normal views through archive or soft-delete lifecycle states.
- Completed items remain visible for 24 hours, move after active items, support undo, and are then omitted from the active list view.
- Deleted items use a soft-delete lifecycle with visible deleted state, strikethrough presentation, 24-hour visibility, undo support, and cleanup from normal list views after the retention window.
- Shopping Intelligence preferred-store learning, item-name-only Home quick capture, existing Lists persistence, and existing Shopping workflows remain preserved.


## 2026-06-21 Update — Shopping Intelligence V2
- Shopping Intelligence now uses lightweight Purchase History instead of a single household preferred-store record.
- Store choices remain optional per list item, and selecting a store records a household item/store purchase-history count.
- Re-adding an item no longer forces or auto-selects a store; historical store associations are exposed as suggestions ordered by most common use first.
- Existing Home quick capture and Shopping quick capture remain item-name-only flows with no mandatory store, quantity, category, AI, OCR, barcode scanning, notifications, analytics, or Reward Economy behavior.
- The Shopping Intelligence V2 migration preserves existing preferred-store associations by converting them into initial purchase-history entries.

### Completed Slice 2.41 — Weekly Household Reset & Recap
Weekly Household Reset & Recap adds an optional parent-facing maintenance pass designed to take roughly 2–5 minutes. The reset batches only likely review candidates instead of reviewing everything: no-date tasks already in Needs Review, older active no-date tasks, stale Someday items, active family and child goals, and shopping lists that are archived, old, or duplicate-looking. The reset ends with a contribution recap from existing completed tasks, Helpful Moments, goal progress, celebrations, and memories so the family can answer “What went well this week?” without new data entry. Existing Tasks, No-Date Lifecycle, Goal Hygiene, Shopping Lifecycle, Child Workspace, Helpful Moments, Celebrations, and Family Contribution Story remain preserved. Reward Economy, notifications, Google Calendar, dashboard customization, household settings, project management, and new social systems remain out of scope.

### Copy Cleanup Slice 1 — Completed 2026-06-21
- Motivation now uses shorter, state-first copy for Family Goal progress, celebration status, memories, Helpful Moments, Personal Goals, and empty states.
- Child Workspace now uses simpler child-facing copy in the hero, Today, This Week, Family Goal, celebration, memory, and Helpful Moments areas.
- User-facing terminology is more consistent around Family Goal and Personal Goal, while existing behavior, workflows, data models, and visual structure remain unchanged.

### Semantic Icon Layer — Completed 2026-06-21
- Added a client-side semantic icon layer that routes family-facing visual symbols through a central HomeOps icon registry and `HomeOpsIcon` component.
- Migrated primary Child Workspace, Motivation, Celebration, Home celebration, and close/add/back control symbols from direct Unicode in feature components to semantic icon names while preserving current Unicode appearance.
- The layer intentionally keeps existing emoji/Unicode output today and defines the future SVG migration seam so owned HomeOps assets can replace registry entries without touching each family-facing component.
- Existing layouts, copy, styling, workflows, Motivation behavior, Child Workspace behavior, Celebration behavior, Helpful Moments behavior, and family member management behavior remain preserved.

### HomeOps Asset Wave 1 — Completed 2026-06-21
- Created standalone HomeOps-owned SVG assets for Helpful Moments, Celebration, Child Ownership, and core UI controls under `src/HomeOps.Client/src/assets/homeops/`.
- Documented the wave inventory, folder structure, semantic color-slot usage, risks, and follow-up recommendations in `docs/reports/2026-06-21-homeops-asset-wave-1/asset-wave-1.md`.
- This slice intentionally does not integrate the assets into product surfaces, replace Semantic Icon Layer Unicode mappings, modify runtime behavior, or alter workflows.

### Celebration Asset Integration — Completed 2026-06-21
Semantic Icon Layer now resolves Celebration semantic names to existing HomeOps-owned SVG assets for upcoming, ready, celebrated, and memory states. Motivation, Child Workspace, Home Motivation summary, and Celebration Memory surfaces render those assets through `HomeOpsIcon`, preserving fallback symbols for unmigrated semantics and preserving existing workflows, data models, copy, and layouts.

### Helpful Moments Asset Integration — Completed 2026-06-21
Semantic Icon Layer now resolves Helpful Moment recognition categories to existing HomeOps-owned SVG assets for Kindness, Teamwork, Initiative, Responsibility, and Routine. Motivation, Child Workspace/Family Member Helpful Moments, Family Contribution Story surfaces that reuse Helpful Moments, and Weekly Reset recap rows render recognition visuals through semantic icon names instead of category Unicode/glyph presentation. Safe fallbacks remain for unknown tags and unmigrated consumers, while existing Helpful Moments, Motivation, Child Workspace, Family Contribution Story, Weekly Reset, and Celebration behavior remains unchanged.

### Child Ownership Asset Integration — Completed 2026-06-21
Semantic Icon Layer now resolves Child Ownership semantic names to existing HomeOps-owned SVG assets for My Progress, My Help Mattered, Family Participation, Today, and This Week. Child Workspace and Motivation surfaces render ownership, contribution, participation, Today, and This Week visuals through semantic icon names instead of Unicode/symbol-based visuals. Ownership remains non-competitive and family-centered: assets support “I helped,” “My progress,” and “We did this together” without rankings, scores, rewards, leaderboards, or behavior changes.

## Phase 2 Visual Review Fixture Pack
- Visual review fixtures are explicitly selectable through `/api/visual-review-fixtures` and are not part of normal EF production seed data or application startup.
- Supported scenarios are `visual-full`, `visual-mixed`, `visual-empty`, `visual-child-young`, `visual-child-older`, `visual-weekly-reset`, and `visual-shopping-lifecycle`.
- Resetting a scenario clears review runtime data and reloads deterministic fixture data with stable identifiers and a fixed `2026-06-21T09:00:00Z` anchor timestamp for repeatable screenshot and Playwright review workflows.
- Fixture scenarios cover rich household, child workspace, motivation, celebration, shopping lifecycle, weekly reset, and empty-state review surfaces without adding production functionality.

### Home Quick Capture Compaction — Completed 2026-06-21
- Home now treats quick capture as a compact action group instead of persistent hero forms, making the opening screen read as a dashboard first.
- Shopping quick capture remains available through an expand-on-demand inline form and still adds item-name-only entries to the Shopping list.
- Event quick capture now opens in a Home dialog after explicit `+ Event` intent and preserves simple all-day event creation.
- The Home summary order now brings Tasks directly after Agenda so due and overdue responsibilities receive more above-the-fold emphasis before Motivation and Shopping/Lists.
- Existing Agenda, Lists, Shopping, Tasks, Motivation, Family Member navigation, and dedicated pages remain preserved; no new domains or feature capabilities were added.

## 2026-06-22 Update — Lists Hierarchy Compaction
- Implemented Lists Hierarchy Compaction as a UX-only Phase 2 slice.
- Lists now opens execution-first: active shopping/list work, quick item add, active items, and completion opportunities precede list administration.
- Rename, archive, and delete remain available in a compact List settings disclosure instead of dominating the first scan.
- Store grouping remains visible for shopping execution, while per-item store editing is compacted behind row-level Store controls so Shopping Intelligence stays available without making the page feel management-first.
- Existing Shopping Lifecycle, Shopping Intelligence, store suggestions, item creation, item completion, removal, undo, list rename, archive, and delete behavior remain preserved with no persistence or workflow changes.

## Completed Slice 2.50 — Workspace Shell and Home Hero Compaction
Workspace Shell and Home Hero Compaction applies the content-first UX rule across the global shell and primary Home surface. Navigation now uses smaller, grid-based pills to reduce awkward wrapping and keep Settings from becoming an isolated second-row item, workspace headers use compact orientation metadata instead of tall page framing, and the Home hero uses tighter date/time, family, and quick-capture treatments so dashboard content appears sooner. Existing navigation destinations, routes, Home behavior, Tasks, Lists, Motivation, Weekly Reset, Settings, and dashboard content remain preserved. No new functionality, domains, workflow changes, persistence changes, card redesign, motivation redesign, child workspace redesign, or Avatar V2 work was introduced.

## 2026-06-22 Update — Child Workspace Overview First
- Implemented Child Workspace Overview First as a UX-only Phase 2 slice.
- Child Mode now leads with Today immediately after identity, followed by a single compact progress signal, Family Goal context, and latest appreciation preview.
- Full personal progress, expanded Family Goal detail, celebration memories, and appreciation history remain available through deliberate exploration instead of occupying the primary overview.
- Parent Mode remains separate and discoverable through the existing mode switch plus a lightweight grown-up cue, without exposing parent controls in Child Mode.
- Existing Child Mode, Parent Mode, Family Goal, Helpful Moments, Celebration, Memory, task behavior, and persistence remain preserved.

### Completed Slice 2.53 — Card System Consolidation Phase 1
Card System Consolidation Phase 1 introduced shared card primitives for `Card`, `CardHeader`, `SummaryCard`, and `ReviewCard` while preserving existing visual output. Home summary cards now reuse `SummaryCard` and the shared header structure, and Weekly Reset review cards now reuse `ReviewCard` and the shared header structure while retaining the existing `home-summary-card`, `home-card-header`, `reset-card`, and `reset-card-heading` styling contracts. This slice reduced architectural duplication without redesigning pages, changing UX flows, normalizing colors or typography, migrating emotional cards, or changing workflows.


## Navigation Architecture Cleanup — 2026-06-22
Primary navigation now represents daily household work only: Home, Agenda, Tasks, Lists, and Motivation. Weekly Reset, House Status, Media, and Gamification remain reachable as secondary/occasional or future-context destinations, Settings moved to an Administration affordance, and Child Workspace remains contextual through Home family member selection. Existing routes, page behavior, and workflows were preserved.


## Color Token Cleanup — 2026-06-22
Color Token Cleanup introduced a shared design-system color vocabulary for text, brand accents, surfaces, borders, elevation, domain accents, and member tints in the client stylesheet. Workspace shells, widget cards, Home summary cards, family member detail cards, placeholder pages, dialogs, and Motivation review surfaces now route repeated surface, border, shadow, domain, and member values through explicit tokens while preserving current layouts, spacing, typography, workflows, navigation, and emotional/child-friendly visual differentiation.

## Avatar V2 Engine Exploration — 2026-06-22
- Added an isolated client-side Avatar V2 SVG rendering engine with typed configs, internal palette tokens, layered renderers, and deterministic sample output artifacts.
- Generated four standalone SVG samples under `docs/reports/2026-06-22-avatar-v2-engine/` for playful child, calm child with glasses, adult, and expressive child accessory directions.
- Current MVP avatars, Family Member UI, Child Workspace, Motivation, persistence, and avatar editor behavior remain unchanged; Avatar V2 is not integrated into product surfaces yet.

## Avatar V2 Golden Sample Quality Validation — Completed 2026-06-22
- Upgraded the isolated Avatar V2 SVG renderer with anatomy anchors, layered hair, a hoodie asset, chest accessory mounting, and one Golden Sample artifact for visual-quality validation only. Production UI integration, editor UI, persistence, Profile Picker, Child Workspace, MVP avatar replacement, raster assets, and external avatar libraries remain out of scope.

## Avatar V2 Head and Hair Quality — Completed 2026-06-22
- Expanded the isolated SVG-only Avatar V2 renderer with true round, oval, and wide head silhouettes, anatomy-tuned face anchors, and anatomy-aligned ears.
- Added exactly three high-quality hairstyles (`shortMessy`, `longSoft`, `curlyPlayful`) with BackHair, FrontHair, and HairHighlights layering for stronger personality and reduced helmet-like silhouettes.
- Generated original sample, Golden Sample, and four showcase SVG comparison artifacts under `docs/reports/2026-06-22-work/` without integrating Avatar V2 into production UI, editor UI, persistence, Profile Picker, Child Workspace, MVP avatars, gamification, unlockables, external avatar systems, or raster assets.

## Avatar V2 Ear Attachment Fix — 2026-06-22

Showcase Sample C and Showcase Sample D exposed that the wide head variant's ears had too little horizontal overlap with the head silhouette, making the ears read as visually detached. The isolated SVG-only Avatar V2 renderer now uses a wider-specific anatomy ear inset while preserving anatomy-driven placement, deterministic rendering, existing layers, and sample generation. Round and oval ear placement remains unchanged, and tests now validate round, oval, and wide ear attachment geometry.

## Avatar V2 Left/Right Anatomy Symmetry Fix — 2026-06-22
- Corrected the isolated SVG-only Avatar V2 wide head path so the silhouette mirrors around the anatomy centerline instead of leaning right.
- Removed left/right rendering offsets in face and glasses SVG output so eyes, lenses, bridge, and temples now render from mirrored anatomy coordinates.
- Added automated symmetry validation for round, oval, and wide heads covering ear anchors, eye anchors, lens geometry, and temple geometry.
- Regenerated the four Avatar V2 showcase SVG samples under `docs/reports/2026-06-22-work/` with no production UI integration, editor work, persistence work, new avatar features, raster assets, or external URLs.

## Avatar V2 Asset System V1 — 2026-06-22
- Added reusable SVG-only Avatar V2 asset definitions for hair, clothing, and accessories with editor-safe metadata while keeping `AvatarAnatomy` as the positioning source of truth.
- Expanded sample-driven clothing silhouettes to hoodie, sweater, T-shirt, and overall, and accessory assets to star, flower, headband, and bow using anatomy mount points.
- Generated six standalone showcase SVG artifacts under `docs/reports/2026-06-22-work/` and kept editor UI, persistence, production UI integration, unlockables, gamification, raster assets, external URLs, and external avatar systems out of scope.

## Avatar V2 Hair Quality Review — Completed 2026-06-22
- Reviewed all existing Avatar V2 hairstyles for silhouette, growth direction, BackHair/FrontHair consistency, highlight flow, monochrome readability, and dark-color believability.
- Improved the weak prioritized hair assets (`shortMessy`, `longSoft`, and `curlyPlayful`) without adding hairstyles, changing anatomy, building editor UI, adding persistence, or integrating Avatar V2 into production UI.
- Added practical hair SVG validation and regenerated standalone showcase SVG artifacts under `docs/reports/2026-06-22-work/`.

## Avatar V2 Rejected Asset Redesign — 2026-06-22
- Redesigned the isolated SVG-only Avatar V2 `curlyPlayful` hairstyle from a helmet-like cap into a foreground curl-cluster silhouette with clearer BackHair/FrontHair relationship and dark-plum readability.
- Redesigned `leafPin` into a clearer leaf silhouette with center and secondary veins, preserving the existing accessory id and mount behavior.
- Added the simplest headband interaction rule for `curlyPlayful`: the headband renders behind foreground curls so it reads as wrapped around the head rather than pasted over the hairstyle.
- Generated targeted CurlyPlayful V2 validation SVGs under `docs/reports/2026-06-22-work/` and regenerated the existing six showcase SVGs without adding editor UI, persistence, production integration, new systems, new head variants, new clothing assets, gamification, unlockables, raster assets, or external avatar systems.

## Avatar V2 Phase 1 Core Display Rollout — 2026-06-23
- FamilyAvatar now renders Avatar V2 SVG output when a FamilyMember has `avatarV2Config`, while preserving its public API and existing compact/large sizing classes.
- Legacy `member.avatar` rendering remains the fallback when Avatar V2 config is absent, and initials fallback remains for members without usable avatar data.
- Family Member hero, Child hero area, and Home family strip receive Avatar V2 through FamilyAvatar. API contracts, DTOs, persistence, migrations, Motivation cards, Helpful Moments, shopping/lists/weekly reset/mobile/future surfaces were not intentionally changed.

## Avatar V2 Slice 4 Final Legacy Persistence Removal — 2026-06-23
- Removed legacy avatar persistence fields from the FamilyMember entity, EF mapping, seed/default creation paths, visual review fixtures, and frontend fallback/member fixture types.
- Cleaned EF migration/model snapshot artifacts so new development databases no longer create or seed legacy avatar persistence columns.
- Avatar V2 configuration remains the sole supported avatar model, and initials fallback remains the permanent display fallback for missing or invalid Avatar V2 data.

## Home Dashboard Cleanup — 2026-06-24
- Home no longer shows a large global Quick Capture region in the hero; creation is available through compact card header icon actions instead.
- Agenda, Tasks, Motivation, and Shopping/Lists use compact header actions for add/open behavior, and Home card bodies no longer include duplicate open/view navigation buttons.
- The Home shopping summary now renders shopping/list item names directly with optional store context instead of repeating the list/container name per item.
- Home summaries remain bounded with short visible lists and existing `+N more` indicators, while spacing was tightened to move the page closer to a non-scrolling dashboard.
- Dedicated Agenda, Tasks, Lists, and Motivation pages remain the full management surfaces; Home creation dialogs are intentionally minimal.

## Motivation Layout Architecture Refactor — 2026-06-27
- Refactored the Motivation surface from a document-like stack into a wider two-by-two dashboard using the existing workspace header as the single page header.
- Compacted the Family Goal, recent appreciation, upcoming celebration, and statistics cards so all four dashboard cards validate above the fold at 1366×768 and 1920×1080 in browser measurement.
- Preserved existing Motivation API/data behavior and kept management/history flows behind existing dialogs/toggles; no binary assets or screenshots were added.

- 2026-06-27: Refined Shopping layout density after browser validation. Quick Add now renders as a compact primary interaction, store cards follow immediately, and lifecycle/other-list content remains secondary without backend/API/schema changes.

## Tasks Workspace Polish — 2026-06-27
- Reduced Tasks card action density by keeping Klaar and eligible Morgen visible while moving lower-frequency edit/recurring-series actions behind Meer.
- Added a compact Vandaag summary beneath the Tasks hero using existing loaded task data for today, overdue, and routine counts.
- Made Afgerond a collapsed-by-default history section so active time groups dominate the operational workspace while reopening remains available when expanded.
- Preserved existing completion, Morgen, recurrence, Weekly Reset, backend, API contract, and database behavior.

## Agenda Final Polish — 2026-06-27
- Refined Agenda Month, Week, and List presentation to reduce explanatory copy and repeated quiet-day narration while preserving existing Month/Week/List architecture and workflows.
- Reframed Agenda source controls as family visibility filters with labels such as School, Verjaardagen, TV-series, Vakanties, and Gezin.
- Kept backend, API contracts, database schema, calendar persistence, event editing, and navigation unchanged.


## FamilyBoard Design Asset System Phase 1 — 2026-06-28
- Migrated the highest-impact preview-movie glyphs to inline React SVG semantic assets: Agenda event types, Settings navigation, open action fallback, Shopping bag placeholder, and Weekly Reset ready/pending status badges.
- Expanded the FamilyBoard Design Asset System registry with Phase 1 `agenda.*`, `shopping.bag`, `core.open`, and `status.pending` icons using `currentColor` and existing icon sizing tokens.
- Preserved Avatar V2, backend, API contracts, database schema, business logic, workflows, and navigation behavior; this slice only changes presentation and tests/documentation.
- Browser validation used VisualReview `visual-full` and `visual-weekly-reset` at 1920×1080; the current preview movie scene order was manually replayed in-browser for Home, Agenda, Shopping, Weekly Reset, and Settings assessment without regenerating the movie.

## 2026-06-28 Marketing time provider

- Added a VisualReview marketing time provider so marketing fixture rendering derives Today and the current week from the active canonical fixture anchor instead of the machine clock.
- Weekly Reset now uses the active marketing anchor for contribution recap windows, fixing the zero-recap mismatch for `visual-marketing-weekly-reset`.
- Validation report: `docs/reports/2026-06-28-marketing-time-provider/marketing-time-provider.md`.

## Marketing Recording Navigation and Home Avatar Corrective Pass — 2026-06-30
- Recording stage timing now preserves executable storyboard scene actions instead of replacing them with wait-only callbacks.
- RecordingSession now navigates to the intended fixture surface after VisualReview fixture reset/reload using real FamilyBoard UI navigation rather than DOM fakes.
- Home Avatar V2 presentation removes the decorative colored avatar square, increases the visible drawing, and reduces Home strip name dominance while preserving touch target size and initials fallback styling.
- Validation mode was run without publishing a final movie; it proved navigation from Home to Family to Agenda before an existing Agenda save-dialog timeout stopped the full nine-scene run.

## Agenda Recording Action Reliability — 2026-07-01
- Fixed Agenda recording reliability by routing Agenda API clients through `VITE_HOMEOPS_API_BASE_URL` in the VisualReview marketing runtime instead of the static Vite proxy.
- Hardened the executable `saveFilmavond` storyboard action with request/response instrumentation and saved-event-card synchronization so it does not wait indefinitely on broad dialog text.
- Validation mode completed the executable 9-scene storyboard, generated metadata and timing, cleaned temporary media artifacts, and intentionally did not publish a final movie.

## Marketing Timing Calibration — 2026-07-01
- Calibrated the executable marketing storyboard timing after measuring completed Production Engine metadata: Agenda improved from a measured 131.4s baseline in this environment to 15.0s against the 14.0s target.
- Kept the 9-scene storyboard order intact and used validation mode only; metadata and timing were generated, cleanup succeeded, and no final movie was published.

## Final Marketing Timing Calibration — 2026-07-01
- Calibrated only the remaining measured timing outliers: Intro, Shopping, and Outro.
- Validation mode completed all 9 scenes with metadata/timing generation and cleanup; total measured runtime is now 89.0s, and no final movie was published.

## FamilyBoard Marketing Visual Polish — 2026-07-01
- Increased Home family-strip Avatar V2 visual prominence by enlarging the visible Home avatar container about 15–20%, reducing name dominance, and preserving the existing touch target and Avatar V2 renderer.
- Added shared wall-tablet operational typography tokens and applied them to key operational content across Home summaries, Agenda events, Tasks rows, Shopping rows, Motivation copy, and Weekly Reset supporting text without flattening hierarchy.
- Verified Shopping remains a grouped-shopping scene with calibrated timing and no storyboard/order change; validation mode was used intentionally without publishing a final movie.

## Home Avatar Container Removal — 2026-07-01
- Measured the VisualReview `visual-marketing-home` family strip and confirmed the decorative blue Home tile container still existed before correction, originating from the Home `.family-chip` background/border rather than `FamilyAvatar` or the Avatar V2 renderer.
- Removed the Home-only decorative tile background/border, enlarged the Home Avatar V2 portrait, reduced caption dominance, and preserved the measured four-member touch target size.
- Added the measured report at `docs/reports/2026-07-01-home-avatar-container-removal/home-avatar-container-removal.md`; no screenshots, movies, MP4, WebM, or WAV artifacts were produced.

## Marketing Recording Scene Entry Polish — 2026-07-01
- Hid VisualReview fixture reset, reload, real UI navigation, target-surface verification, and idle wait behind a persistent recording scene-entry cover so rapid Home-to-target setup is not exposed in validation recordings.
- Added scene-entry timing markers and Agenda dialog readability markers to generated timing metadata, including cover/reset/reload/navigation/verification/reveal/first-interaction timestamps.
- Validation mode completed all 9 scenes with metadata and timing generated, cleanup succeeded, and no final movie was published or retained.

## Home Portrait Identity Layout — 2026-07-01
- Replaced the Home family strip's `family-chip` member buttons with a dedicated `home-family-portrait` presentation and `home-family-portrait-caption` names while preserving button behavior, accessibility labels, and measured touch target size.
- Reused `FamilyAvatar` and increased the Home visible portrait to 144.0px high, about 83.7% of the Family page reference SVG height, without changing Avatar V2 rendering or the Family Member page.
- Added the measured report at `docs/reports/2026-07-01-home-portrait-identity-layout/home-portrait-identity-layout.md`; no screenshots, movies, MP4, WebM, or WAV artifacts were produced.

## Weather Advice Localization Refactor — 2026-07-04
- Centralized the frontend-only Dutch `DepartureAdviceCategory` header labels in `src/HomeOps.Client/src/weatherAdviceLocalization.ts` and updated the Home Weather Pill to consume that shared helper while preserving existing fallback behavior, API contracts, backend behavior, dependencies, generated files, and UI scope.
- Added the implementation report at `docs/reports/2026-07-04-weather-advice-localization-refactor/weather-advice-localization-refactor.md`; no binary artifacts were introduced.

## Calendar Sources Backend Readiness Review — 2026-07-05
- Completed a backend-only readiness review of Calendar Sources across domain, persistence, importers, synchronization, refresh APIs, scheduler, calendar queries, backup/restore, OpenAPI, performance, and tests.
- Fixed restore upsert handling for existing external EventSources with matching identifiers so provider configuration and NeverSynced state are restored without duplicate tracked source conflicts.
- Hardened filesystem iCal file content loading so relative references cannot escape the configured storage root through sibling path-prefix matches.
- Added regression coverage for the restore and file-store defects; no frontend, scheduler redesign, synchronization behavior changes, binary files, or screenshots were introduced.

- 2026-07-07: Fixed the Calendar Recurrence V2 empty Agenda edit dialog by rendering existing appointment edit fields/actions directly while preserving create and recurring save-scope flows. See docs/reports/2026-07-07-calendar-recurrence-v2-empty-edit-dialog-fix/calendar-recurrence-v2-empty-edit-dialog-fix.md.

- 2026-07-07: Resolved the follow-up frontend validation issues for the Agenda edit dialog fix by adding Vitest `--runInBand` compatibility and hardening Agenda weather/planning tests against async visual-review fixture updates.

## Avatar Editor V4 UX Redesign — 2026-07-10
- Redesigned the catalog-driven Avatar V2 Editor's editing experience (frontend only) into an Adaptive Studio: a single always-visible category bar (Huid, Haar, Gezicht, Kleding, Accessoires) plus one bounded, internally-scrolling option surface that shows all of the active category's attributes at once, removing the V3 `Stijl`/`Kleur` sub-tab hop and its `activeCategoryId` state.
- Made multi-attribute section headings visible and sticky, enlarged the permanent hero preview, and reused the existing option tiles, live mini-previews, grouped swatches, and catalog-driven sizing unchanged; renderer, SVG artwork, catalog data/structure, adapter, persistence, backend validation, and API contracts were not changed, so a saved avatar renders identically.
- Preserved save/cancel/reset/live-preview/Escape-close/focus/`aria-pressed`/arrow-key roving-focus behaviour; updated only the two editor test files to the single-surface model.
- Validated with dotnet restore/build/test (359), frontend tests (215), production frontend build, and live 1440×900 no-page-scroll desktop review; report and five populated screenshots at `docs/reports/2026-07-10-avatar-editor-v4/`.

## Avatar Mouths V1 — 2026-07-10
- Added a new catalog-driven `mouth.style` attribute with ten SVG mouth styles (neutral, smile, big smile, open smile, laughing, smirk, determined, surprised, sad, tongue out), exposed as a **Mond** section inside the existing Face editor panel alongside glasses; the editor, renderer architecture, catalog structure, persistence, backend validation, and API contracts are otherwise unchanged.
- Split the mouth out of the base face layer into a dedicated `avatar-v2-layer-mouth` renderer layer keyed by the attribute; `neutral` is byte-identical to the original mouth path and is the compatibility default, so every existing avatar renders unchanged unless a new mouth is chosen. Mouth is modelled like eyewear (`required: false`, absent from legacy `AvatarV2Config`), so previously-valid selections stay valid and normalize to neutral.
- Validated with dotnet restore/build/test (365), frontend tests (221), `npx tsc -b`, and production frontend build; report and three populated screenshots (Face category, every mouth style, and different avatars using different mouths) at `docs/reports/2026-07-10-avatar-mouths-v1/`.

## Avatar Accessories V2 Headwear Alignment Correction — 2026-07-10
- Fixed the Accessories V2 headwear renderer by adding shared anatomy-relative headwear geometry to `resolveAvatarAnatomy` and rendering Baseball Cap, Beanie, Party Hat, Crown, Sun Hat, and Helmet from the resolved head center, crown/brim baselines, and head-width-derived scale.
- Preserved existing accessory IDs, the single accessory slot, Tiny Crown compatibility, non-headwear mount behavior, eyewear, mouths, eyes, clothing, hair definitions, backend contracts, and persistence.
- Regenerated the text SVG variety sheet from renderer output and reviewed a temporary 72-combination headwear matrix across six headwear items, round/oval/wide heads, and short/long/curly/side-bob hairstyles.
- Added renderer invariant tests for anatomy-relative headwear alignment and non-headwear compatibility; implementation report updated at `docs/reports/2026-07-10-avatar-accessories-v2/avatar-accessories-v2.md`.


## Avatar Accessories V2 Headwear Model V2 — 2026-07-10
- Replaced the first shared headwear pseudo-geometry with renderer-owned anatomy-relative placement: `resolveAvatarAnatomy` now exposes semantic head top, width, height, hairline, and forehead anchors while headwear families derive their own band/brim/shell/base positions from those anchors and the protected eye line.
- Corrected Baseball Cap, Beanie, Party Hat, Crown, Sun Hat, and Helmet vertical placement across round, oval, and wide heads with short, long, curly, and side-bob hairstyles while preserving accessory IDs, the single accessory slot, mount compatibility, layer ordering, non-headwear accessories, API contracts, and persistence.
- Regenerated the text SVG variety sheet and updated renderer invariant tests/reporting for the Headwear Model V2 follow-up.

## Avatar Contacts V1 Frontend Foundation — 2026-07-10
- Refactored the FamilyMember avatar editor into a thin adapter over a reusable AvatarSelection-only editor while preserving FamilyMember labels, save behavior, renderer path, and legacy Avatar V2 config translation.
- Added frontend KnownPerson models, generated-client-backed KnownPerson API mapping, and a non-navigated KnownPerson avatar editor wrapper for future People surfaces.
- Validated backend restore/build, frontend build, focused avatar/KnownPerson tests, focused Agenda rerun after a transient full-suite failure, final full frontend tests, and NSwag generation with no generated diff.

## Synology Container Manager Deployment Workflow — 2026-07-11
- Added a no-registry deployment-tooling slice for Synology DS918+ / Container Manager that publishes the `HomeOps.Api` ASP.NET Core deployable as a linux/amd64 `familyboard-app` container archive, copies it safely to an SMB share, and optionally invokes Synology `deploy.sh` over SSH.
- Added Synology Compose, `.env.example`, and deployment documentation using PostgreSQL as a separate Compose service with bind-mounted application and database data under `/volume1/docker/familyboard`.
- Preserved application behavior, domain logic, APIs, persistence semantics, frontend behavior, migrations, and production configuration semantics except for container-publishing metadata required to create the archive.

## House Brain Research — 2026-07-12
- Added a product-definition research report for the provider-neutral FamilyBoard House Brain, challenging the prior Home Automation page reports and reframing the work around household reasoning rather than UI, Home Assistant, entities, or automation controls.
- Defined the House Brain as a household situation interpreter with reasoning domains, cross-domain intelligence, memory, uncertainty, explainability, decision levels, and a deliberate silence philosophy; no code, UI, screenshots, API, persistence, or integration changes were made.

- 2026-07-12: Implemented Woning Climate Floor Plans Slice 2A backend-only Room climate configuration foundation with a separate Room-owned climate configuration model, participation/bedtime/policy/heating-intent contracts, derived semantic source roles without provider identifiers, active Room API lifecycle, EF migration, incremental backup/restore validation and replacement semantics, OpenAPI/NSwag regeneration, and focused backend tests; no Home Assistant mappings, sensor/entity IDs, readings, Stories, heating commands, floor-plan assets, polygons, overlays, or frontend UI were implemented.
## Woning Climate Floor Plans Slice 1 — 2026-07-12
- Added backend-only FamilyBoard-owned Floor and Room foundation with household ownership, exact active-name validation, deterministic ordering, archive/restore lifecycle, safe Floor delete/archive behavior, Room move behavior, optional FamilyMember association, persistence migration, OpenAPI contracts, focused API tests, and incremental portability fields.
- Explicitly excluded floor-plan assets, polygons, overlays, climate configuration, Home Assistant/Evohome mappings, Stories, frontend usage, screenshots, and binary assets.

## Floor/Room Portability Hardening — 2026-07-12
- Hardened Woning Climate Floor Plans Slice 1 backup/restore validation for duplicate identities, ambiguous names, missing Floor references, invalid RoomType values, invalid FamilyMember references, invalid lifecycle/archive combinations, invalid ordering, rollback safety, legacy absent collections, and explicit empty collection replacement.
- Preserved backend-only scope: no assets, overlays, polygons, climate configuration, Home Assistant mappings, Stories, endpoints, runtime UI, screenshots, or binary assets were added.

### Completed Slice — Woning Climate Floor Plans Slice 3 Provider Mappings
Woning Climate Floor Plans Slice 3 adds backend-only provider-neutral climate provider and room climate source mapping foundations. Providers are household-owned, credential-free external source definitions; mappings connect canonical Rooms to semantic climate roles with deterministic priority, lifecycle state, health metadata, shared heating-zone indication, persistence, APIs, OpenAPI/generated contracts, and incremental backup/restore. Climate configuration deletion is now blocked while mappings exist, restored mappings reset health to `Unverified`, and the slice deliberately excludes live Home Assistant integration, entity discovery, actual readings, Stories, heating commands, floor-plan assets, polygons, overlays, and frontend UI.

### Completed Slice — Woning Climate Provider Mapping Hardening
Woning Climate Provider Mapping Hardening adds the explicit internal `ClimateMappingValidationService` for future provider integrations to update mapping validation state with household isolation, lifecycle checks, stable timestamp/diagnostic semantics, metadata validation, and no ability to mutate Room/Provider/source identity or priority. The manually authored provider-mapping migration was verified against generated EF output and idempotent SQL, the model snapshot was aligned, and focused service/schema regression tests were added. No live Home Assistant integration, credentials, discovery, readings, Stories, heating commands, assets, polygons, overlays, frontend UI, screenshots, or binary scope was introduced.

## Woning Climate Floor Plans Slice 3 — Floor-plan Asset Ingestion — 2026-07-13
- Added backend-only floor-plan asset ingestion and lifecycle foundation for canonical Floors with safe derivative metadata, explicit activation/replacement/rollback/archive/missing states, storage references outside database byte columns, filtered one-Active-per-Floor persistence, derivative-only runtime retrieval, and incremental backup/restore metadata. No polygons, overlays, editor canvas, runtime floor-plan UI, climate readings, Stories, Home Assistant integration, or frontend upload flow were introduced.

## Woning Climate Floor Plans Floor-plan Asset Ingestion Hardening — 2026-07-13
- Hardened the backend-only floor-plan asset ingestion foundation with derivative rehydration during backup/restore, asset graph validation, stricter SVG sanitization rules, raster truncation/oversize checks, storage reference containment safeguards, lifecycle/restore tests, and migration script verification. No polygons, overlays, frontend, runtime plan rendering, climate readings, Stories, or Home Assistant integration were introduced.

## 2026-07-14 — Woning floor/room Settings management
- Added the frontend Settings `Woning` workspace for managing FamilyBoard floors and rooms without polygon editing, asset upload, runtime climate, or Home Assistant setup UI.
- Added compact climate and floor-plan setup summaries and viewport-bounded management lists.

## Woning Climate Floor Plans Slice 5 — Room Overlay Foundation — 2026-07-14
- Added backend-only FamilyBoard-owned Room overlay and label-anchor foundation with normalized polygon geometry, lifecycle/trust states, explicit trust operation, geometry/anchor validation, Trusted overlap blocking with shared-edge allowance, Room/Asset lifecycle trust downgrades, EF migration, portability backup/restore section, and focused geometry tests.
- Preserved scope exclusions: no polygon editor frontend, canvas, floor-plan runtime rendering, room labels in runtime, climate readings, Stories, heating controls, Home Assistant discovery/synchronization, screenshots, or binary assets.

## Room Overlay Foundation Hardening — 2026-07-14
- Hardened Woning Climate Floor Plans Slice 5 with focused lifecycle API, trust transition, Room/Asset downgrade, schema, portability, and atomicity tests; fixed concrete defects so only Valid overlays can be trusted, permanent Room delete explicitly removes owned overlays, full restore clears stale overlays before replacing Floor/Room/Asset data, and Trusted backup input restores as Valid.
- No frontend UI, polygon editor, runtime rendering, climate readings, Stories, heating controls, Home Assistant integration, screenshots, or binary scope was added.

## Woning Climate Floor Plans Slice 6 — Room Overlay Editor — 2026-07-14
- Added the frontend Settings-side polygon editor for active safe floor-plan assets with Room-linked drawing, explicit modes, bounded canvas/review/list workspace, draft/valid saves, lifecycle actions, manual label anchors, local validation guidance, backend save/trust error preservation, and phone editing limitation copy.
- Preserved frontend-only slice boundaries: no asset upload/replacement review, runtime `Klimaat in huis`, climate readings, Stories, heating controls, provider mapping UI, Home Assistant setup, screenshots, or binary assets were introduced.

## Room Overlay Contract Correction — 2026-07-14
- Corrected Room Overlay endpoint OpenAPI response declarations so Floor/Room overlay lists and validation/status responses regenerate as typed contracts instead of `void`, then removed the Slice 6 frontend adapter workaround that normalized unknown runtime responses.
- Preserved existing overlay editor UX and backend overlay behavior; no asset upload/replacement, runtime climate, readings, Stories, heating controls, Home Assistant UI, screenshots, or binary scope was added.


## 2026-07-14 — Floor-plan replacement lifecycle slice 7

Implemented backend floor-plan replacement review lifecycle foundations: Floor-scoped reviews, Room dispositions, reuse candidate approval, activation validation, atomic floor-level activation, rollback, API contracts, persistence, migration, and backup/restore payload support. Frontend replacement review UI and runtime rendering remain deferred.


## 2026-07-14 — Floor-plan replacement lifecycle hardening

Hardened Slice 7 backend replacement reviews with focused API, activation/rollback, direct activation boundary, portability, and schema coverage. Fixed concrete defects around cancellation after activation, direct replacement activation bypass, replacement overlay approval state, RedrawRequired readiness, and activated restore graph validation. No frontend or runtime climate scope was added.

## 2026-07-15 — Woning Climate Floor Plans Slice 8 replacement review UI
- Implemented the Settings > Woning frontend replacement review workspace for discovering, starting, resuming, room-by-room dispositions, reuse approval, redraw via the existing Room Overlay Editor, backend-derived readiness, review-scoped activation, cancellation, and rollback. Generated replacement-review contracts are used directly; no handwritten API workaround, runtime Klimaat in huis, readings, Stories, heating controls, provider mapping, Home Assistant setup, image registration, screenshots, binary assets, or generated-client edits were added.

## 2026-07-15 — Room Climate Read Model
- Added backend normalized current Room climate observations for Woning Climate Floor Plans Slice 9.
- Added Room/Floor/Household climate state read endpoints and generated API client contracts.
- Current telemetry is treated as operational state and remains excluded from portability exports.

## 2026-07-15 — Room Climate Read Model hardening
- Added focused backend coverage for Slice 9 ingestion validation, newest-observation semantics, freshness boundaries, Room/Floor/Household read models, spatial fallback status, persistence metadata, generated contracts, and telemetry portability exclusion.
- Hardened read-model household filtering and introduced a TimeProvider-backed clock seam for deterministic freshness tests without changing product scope.

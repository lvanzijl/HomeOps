FamilyBoard Recording Visual Navigation Investigation fixed the validation/movie discrepancy by measuring rendered browser state during validation mode and correcting Recording Session workspace detection. Scene completion now waits for active workspace and fixture-specific rendered UI verification, so Home, Family, Agenda, Tasks, Shopping, Motivation, Weekly Reset, and Home Outro validation events match visible browser state without Production Engine, Recording Framework, Marketing Director, storyboard, production UI, audio, or timing redesign.
## Completed Slice — Frontend Test Maintenance
Frontend test maintenance refreshed stale test expectations and fixtures to match the current Dutch FamilyBoard MVP UI, dialog polish, Motivation/Family Member progressive disclosure, settings/calendar portability labels, onboarding labels, and current Agenda date grouping. The slice changed tests and documentation only; production source, CSS, backend behavior, API contracts, database schema, workflows, and UI layout remained unchanged.

# Phase 2 Roadmap

## Completed Slice — Tasks Horizontal Planning Dashboard
Tasks Horizontal Planning Dashboard re-evaluates the stacked secondary task layout and keeps the desktop planning horizon in one weighted row: Vandaag remains the widest active workspace, Morgen and Deze week become lighter planning columns, and Later plus Voltooid/Review become compact queues. Existing progressive disclosure, task workflows, backend behavior, APIs, schema, routing, and validation remain unchanged.

## Completed Slice — Tasks Page Redesign Refinement
Tasks Page Redesign Refinement tightens the Tasks workspace around a clearer Today/Tomorrow/This Week scan path. Today receives the widest and richest column, Tomorrow and This Week remain lighter planning columns, later/completed groups move below the primary dashboard, and selected-card-only vertical actions reduce visual noise without changing backend behavior, APIs, schema, routing, validation, or task lifecycle functionality.

## Completed Slice — Tasks Page Mockup-Aligned Redesign
Tasks Page Mockup-Aligned Redesign refines the existing Tasks workspace without changing task APIs, routing, data models, dialogs, permissions, backend behavior, or schema. The desktop layout now gives Vandaag the widest primary column while Morgen and Deze week remain narrower secondary/tertiary columns, and task cards keep metadata visible while revealing completion, Morgen, edit, and routine actions only for the selected card.

## Completed Slice — FamilyBoard Marketing Production Engine Publish Mode
FamilyBoard Marketing Production Engine Publish Mode adds configuration-driven `validation` and `publish` execution without duplicating the production pipeline. Validation remains the default and removes the temporary MP4, while publish mode exports a uniquely timestamped `docs/demo/familyboard-preview-YYYYMMDD-HHmmss.mp4`, records mode/timestamp/output/retention metadata, keeps timing JSON unchanged, and continues cleaning raw WebM, WAV, mixed soundtrack, and temporary browser-profile artifacts without production UI, storyboard, Recording Framework, Marketing Director, or Audio Framework changes.


## Completed Slice — FamilyBoard Marketing Production Engine Phase 6 Export
FamilyBoard Marketing Production Engine Phase 6 gives the Production Engine ownership of deterministic MP4 export after Runtime, Storyboard, Recording, and Audio pass. The Export stage locates the raw WebM recording and mixed WAV soundtrack from structured stage status, resolves FFmpeg through the configured executable, PATH, or imageio-ffmpeg fallback, exports `docs/demo/familyboard-preview.mp4` as H.264/AAC at 1920×1080 and approximately 30 FPS, verifies the output path, and intentionally avoids metadata generation, timing reports, cleanup implementation, subjective movie review, production UI changes, storyboard changes, Recording Framework changes, Marketing Director changes, and Audio Framework redesign.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 5 Audio
FamilyBoard Marketing Production Engine Phase 5 gives the Production Engine ownership of deterministic audio orchestration after Runtime, Storyboard, and Recording pass. The Audio stage creates or reuses `/tmp/familyboard-marketing-audio`, generates placeholder WAV assets only in that temporary workspace, reuses the existing Audio Framework director, timeline, sound library, mixer, WAV, and export helpers, and writes a temporary mixed soundtrack at `/tmp/familyboard-marketing-audio/mix.wav` without MP4 muxing, metadata generation, timing reports, cleanup implementation, production UI changes, storyboard changes, Recording Framework changes, Marketing Director changes, Audio Framework redesign, screenshots, or committed binaries.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 4.1 Temporary Toolchain
FamilyBoard Marketing Production Engine Phase 4.1 restores the intended separation between Product and Marketing Production Engine by removing the direct Playwright dependency from the client package and moving Playwright ownership into a deterministic temporary toolchain at `/tmp/familyboard-marketing-tools`. The Recording stage now creates or reuses that temporary toolchain, installs Playwright there when missing, launches Playwright from that location, and still executes the raw WebM recording path through the existing RecordingSession without production UI, storyboard, Recording Framework, Marketing Director, Audio Framework, MP4, audio, screenshots, WAV, or committed binary changes.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 4 Recording
FamilyBoard Marketing Production Engine Phase 4 Recording gives the production engine ownership of recording execution after Runtime and Storyboard pass. The Recording stage loads Playwright from the client toolchain, creates the existing `RecordingSession`, runs the complete 9-scene recording plan through the existing Recording Framework, produces a temporary raw WebM artifact at `/tmp/familyboard-marketing-preview-v1.webm`, and returns structured recording status while intentionally leaving audio, muxing, metadata generation, timing reports, cleanup, MP4 output, production UI, storyboard content, Recording Framework, Marketing Director, and Audio Framework unchanged.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 3 Storyboard
FamilyBoard Marketing Production Engine Phase 3 Storyboard gives the production engine ownership of executable storyboard loading, Marketing Director validation, and recording-plan generation. The Storyboard stage reads the shared production configuration, imports the existing storyboard and Marketing Director, creates a structured recording plan with the canonical 9 scenes, 84-second preferred duration, 90-second maximum duration, chapter cards, emotional curve, transitions, timing metadata, and recording metadata, and exposes that plan for later pipeline stages without launching browsers, recording, generating media, modifying storyboard content, or changing Recording Framework, Marketing Director, Audio Framework, or production UI code.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 2 Runtime
FamilyBoard Marketing Production Engine Phase 2 Runtime gives the production engine ownership of VisualReview runtime lifecycle startup, health validation, and shutdown. The runtime stage starts the ASP.NET Core API in the VisualReview environment, starts the Vite frontend with the configured API base URL, verifies API `/health` and frontend availability, returns structured status, and tears down owned processes before the engine exits. The slice intentionally does not launch browsers, record, generate media, modify production UI, modify storyboard content, or change the Recording Framework, Marketing Director, or Audio Framework.

## Completed Slice — FamilyBoard Marketing Production Engine Phase 1
FamilyBoard Marketing Production Engine Phase 1 adds a deterministic production orchestration entry point above the existing marketing recording stack. The slice defines shared production configuration, the ordered runtime/storyboard/recording/audio/metadata/timing/cleanup/reporting pipeline, validation-only discovery of the Recording Framework, Marketing Director, Audio Framework, and executable storyboard, plus an npm script for future production runs. It intentionally does not start browsers, record, generate audio, mux media, change production UI, modify storyboard content, or add binary artifacts.

## Completed Slice — Marketing Preview VisualReview Event Create Compatibility
Marketing Preview VisualReview Event Create Compatibility removes the hard-coded seeded calendar-source dependency from manual event creation so Agenda recordings can add `Filmavond` inside the approved marketing fixtures while preserving existing household event CRUD, schema, and API behavior.

## Completed Slice — FamilyBoard Marketing Director
Home Layout Redesign recomposes the existing Home concepts into a fuller desktop dashboard without product or backend changes: the family member area becomes a larger human anchor, Agenda and Boodschappen become dominant Home cards, Taken and Motivatie become supporting cards, and Home shopping items gain larger supermarket-friendly check targets using the existing list completion contract. The source-only marketing storyboard was updated to describe the redesigned Home scenes; no screenshots, movies, audio, binaries, new widgets, new pages, API changes, schema changes, or backend behavior were introduced.

FamilyBoard Marketing Director adds the reusable storytelling layer above the existing marketing recording framework. The Director owns storyboard sequencing, narrative validation, pacing profiles, transition selection, scene metadata, and recording event publication while the Recording Session remains execution-only. The slice includes one minimal internal sample storyboard and intentionally avoids movie generation, audio playback, screenshots, Playwright tests, production UI changes, and binary artifacts.

FamilyBoard Marketing Recording Framework adds reusable infrastructure for future marketing, release, conference, and documentation videos. It introduces a tablet-landscape recording session abstraction, configuration-driven scenes, deterministic touch-first gestures, temporary recording-only touch/chapter/transition overlays, and an internal sample sequence for framework validation. The slice intentionally does not record the final movie, create screenshots, add audio, add Playwright tests, change production UI, or add binary artifacts.

FamilyBoard Wide Viewport Layout improves the global responsive shell so the app uses large desktop displays more like a dashboard instead of a narrow centered document. The slice replaces the fixed 1040px app-shell cap with responsive board width tokens, lets Home add columns before stretching cards, and keeps Settings constrained for readable administrative content. Backend behavior, API contracts, database schema, workflows, navigation, VisualReview runtime, fixture data, screenshots, videos, and binary assets remain unchanged.

## Completed Slice — FamilyBoard Final Visual Polish
FamilyBoard Final Visual Polish resolves the actionable defects from the first authoritative populated visual UX review. The slice keeps the Avatar Editor within a 1920×1080 viewport with contained editor scrolling, completes Dutch Avatar Editor wording, reduces the visual weight of Tasks Klaar/Morgen action buttons while preserving touch targets, separates Motivation celebration title/status text, and renames the personal-goal add action to match the existing personal-goal form. Backend behavior, API contracts, database schema, workflows, navigation, screenshots, and binary assets remain unchanged.


## Completed Slice — FamilyBoard Dialog Design System
FamilyBoard Dialog Design System introduces a shared dialog presentation layer for existing dialogs without changing dialog workflows. Dialogs now use wider, calmer cards, softer blurred overlay dimming, spacious controls, rounded FamilyBoard action buttons, and subtle workspace accents for Agenda, Taken, Boodschappen, and Motivation surfaces. Redundant explanatory copy was reduced where it repeated the current question. Backend behavior, API contracts, database schema, validation, wizard logic, and form behavior remain unchanged.

## Completed Slice — Shopping Workspace Redesign
Shopping Workspace Redesign turns Shopping into an operational family workspace focused on “Wat moeten we kopen, en waar?”. The slice adds a warm decorative hero, makes Quick Add the primary interaction, promotes preferred-store grouping into primary store cards, keeps recently added items compact, and moves other household lists into a secondary support card. Backend behavior, API contracts, database schema, shopping persistence, preferred-store logic, and item lifecycle behavior remain unchanged.

## Completed Slice — Weekly Reset UX Ritual
Weekly Reset UX Ritual redesigns the dedicated Weekly Reset surface from a maintenance panel into a Dutch, family-first ritual centered on “Zijn we klaar voor volgende week?”. The slice adds readiness summary cards, clearer family guidance for what is completed, moving forward, resetting, and staying unchanged, and intentional skip/confirmation copy while preserving existing reset execution, undo availability, task actions, backend behavior, API contracts, and database schema.

## Completed Slice — Tasks Morgen Action
Tasks Morgen Action turns the previous future affordance into a real frontend workflow for non-recurring tasks by reusing the existing task update API to move normal and overdue tasks to tomorrow immediately. Morgen is hidden for recurring tasks and tasks already due tomorrow to avoid unsupported or duplicate updates, while backend contracts, API contracts, schema, recurrence engine, and Weekly Reset logic remain unchanged.

## Completed Slice — Tasks Task Card Redesign
Tasks Task Card Redesign enriches active task cards with warmer FamilyBoard visual hierarchy, compact metadata chips, reusable placeholder icon slots ready for future SVG assets, recognizable recurring treatment, and clearer complete/edit/more action buttons. The slice preserves existing task lifecycle, recurrence, Weekly Reset, backend, API contract, and database schema behavior.

## Completed Slice — Tasks Time-First Workspace
Tasks Time-First Workspace reshapes Tasks from a generic list into an operational family workspace organized by Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond. The slice makes Vandaag the strongest visual priority, keeps assignee/date/recurrence/completion context inside compact cards, preserves editing, deleting, completion, recurring task, and Weekly Reset behavior, and avoids backend, API contract, and database schema changes.



## Completed Slice — Agenda List Workspace
Agenda List Workspace adds a non-default chronological family reference timeline for upcoming events while preserving Month as the primary planning surface and Week as the operational planning workspace. List groups upcoming events into Vandaag, Morgen, Deze week, Volgende week, and Later, reuses existing event indicators and FamilyBoard event cards, preserves edit/delete behaviour, and avoids backend, API, database schema, Google Calendar, event persistence, event-type settings, indicator architecture, and classifier architecture changes.

## Completed Slice — Agenda Week Workspace
Agenda Week Workspace adds a non-default operational family planning surface for the coming week while preserving Month as the primary Agenda planning surface. Week renders Monday through Sunday as compact FamilyBoard planning cards with reused event indicators, pastel event cards, previous/current/next week navigation, quiet-day states, and an empty-week state. No backend, API contract, database schema, Google Calendar integration, event persistence, event editing flow, event-type settings, hourly timeline, or drag-and-drop scheduling was introduced.

## Completed Slice 2.66 — Motivation Dashboard Redesign
Motivation Dashboard Redesign reshapes Motivation into a compact FamilyBoard dashboard without changing APIs, routing, data models, or goal/appreciation behavior. The page now keeps one header, makes Family Goal progress the primary focal point, moves recent appreciation into a compact feed, adds compact celebration and statistics cards, uses smaller HomeOps illustrations intentionally, and keeps deeper memories and personal-goal management behind existing progressive disclosure.

## Completed Slice 2.47 — Tasks and Weekly Reset Family-First UX Pass
Tasks and Weekly Reset Family-First UX Pass warms the Tasks surface and contextual Weekly Reset entry without adding features or changing workflows. Tasks now leads with family-help language, softer ownership labels, routine-starter copy, and clearer Weekly Reset discovery from the Tasks page. The beta-facing Shopping label replaces Shopping / Lists for clearer household comprehension while the route and list functionality remain unchanged. Narrow navigation buttons are tightened to reduce wrapping. Existing task lifecycle behavior, Weekly Reset functionality, navigation structure, FamilyMember behavior, and Avatar V2 remain preserved.

| Slice | Name | Status |
| --- | --- | --- |
| 2.68 | FamilyBoard Design Asset System Phase 1 | Completed |
| 2.67 | FamilyBoard Design Asset System Foundation | Completed |
| 2.1 | Durable Lists Foundation | Completed |
| 2.2 | Widget/Layout Persistence | Completed |
| 2.3 | Manual Events Source | Completed |
| 2.4 | Backend-Backed Agenda Layer Settings | Completed |
| 2.5 | Event Editing UX Hardening | Completed |
| 2.6 | EventSeries Contract + Migration | Completed |
| 2.7 | Calendar Terminology, Projection, and Timezone Foundation | Completed |
| 2.8 | Calendar JSON Export and Full Restore Foundation | Completed |
| 2.9 | Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze | Completed |
| 2.10 | Calendar Portability UX and Pre-Restore Export | Completed |
| 2.11 | Calendar Validation, Snapshot Storage, Restore Safety UX, and Documentation Hardening | Completed |
| 2.12 | Calendar Recurrence, EventException, and Occurrence Generation Runtime | Completed |
| 2.13 | Real Google Calendar Read-Only Integration | Recommended next |
| 2.14 | Sensor Dashboard Foundation | Planned |
| 2.15 | Media/TV Source Foundation | Planned |
| 2.16 | Home Hierarchy Tightening | Completed |
| 2.23 | Home Task Summary | Completed |
| 2.30 | Child Workspace Foundation | Completed |
| 2.31 | Child Mode | Completed |
| 2.32 | Child Hero Area | Completed |
| 2.39 | Goal Hygiene | Completed |
| 2.40 | Shopping Lifecycle | Completed |
| 2.42 | Shopping Intelligence V2 | Completed |
| 2.43 | Tasks Hierarchy Compaction | Completed |
| 2.54 | Navigation Architecture Cleanup | Completed |
| 2.55 | Color Token Cleanup | Completed |
| 2.56 | Avatar V2 Wide Head Anatomy Review and Fix | Completed |
| 2.57 | Avatar V2 Hair Quality Review | Completed |
| 2.59 | Avatar V2 Concept B Headband Visibility Fix | Completed |
| 2.61 | Profile Picker Removal and Family-First Cleanup | Completed |
| 2.62 | Avatar V2 Slice 1 Frontend/Product Cleanup | Completed |
| 2.63 | Avatar V2 Slice 2 Renderer Cleanup | Completed |
| 2.65 | Beta Navigation and Surface Cleanup | Completed |
| 2.66 | Motivation Dashboard Redesign | Completed |
| 2.41 | No-Date Task Lifecycle | Completed |

Phase 2 theme: Durable Household Core.

## Completed Slice 2.68 — FamilyBoard Design Asset System Phase 1
FamilyBoard Design Asset System Phase 1 replaces the highest-impact preview-movie glyph debt with semantic inline React SVG assets. Agenda event type emoji, the shell Settings gear glyph, open action fallback, Shopping placeholder glyph, and Weekly Reset ready/pending status glyphs now render through the FamilyBoard semantic icon registry using `currentColor`. The slice preserves Avatar V2, VisualReview runtime behavior, backend, API contracts, database schema, workflows, and navigation while adding only production icon migrations, tests, state/roadmap documentation, and a report.

## Completed Slice 2.67 — FamilyBoard Design Asset System Foundation
FamilyBoard Design Asset System Foundation establishes the frontend design asset infrastructure for future semantic icons, illustrations, decorations, and status graphics. The slice adds inline React SVG icon components, shared icon sizing tokens, a typed semantic registry, reserved SVG-only illustration and decoration folders, and authoring documentation while intentionally avoiding production page migrations, emoji replacement, Agenda/Shopping icon families, Avatar V2 changes, backend/API/schema changes, and binary assets.

## Completed Slice 2.1 — Durable Lists Foundation
Durable Lists Foundation combines the persistence foundation, generic Lists domain, deterministic development seed data, generated NSwag client workflow, and Shopping List widget conversion from in-memory state to API-backed persisted list data.

## Completed Slice 2.2 — Widget/Layout Persistence
Widget/Layout Persistence adds household-owned workspace layout storage, seeded default layouts that match the validated dashboard, minimal get/save layout APIs, generated NSwag client support, and frontend layout loading with default fallback. The widget catalog remains application-owned; persisted layout records only choose catalog widgets and their placement metadata.

## Completed Slice 2.3 — Manual Events Source
Manual Events Source originally added the first writable HomeOps-owned event source with household-owned event persistence, deterministic seed data, minimal event source and event CRUD APIs, normalization into the existing Agenda event model, generated NSwag client support, and embedded Agenda validation UI for retrieval, create, update, and delete.

## Completed Slice 2.4 — Backend-Backed Agenda Layer Settings
Backend-Backed Agenda Layer Settings adds device-scoped persistence for Agenda source visibility, a generated local device key sent through API headers, independent Week and Months settings, minimal get/save APIs, generated NSwag client support, and frontend replacement of browser-only layer settings storage.

## Completed Slice 2.5 — Event Editing UX Hardening
Event Editing UX Hardening improves the embedded Agenda event form with create/edit/delete usability, all-day and timed input handling, frontend validation, backend validation problem responses, loading/error states, and regression coverage while preserving existing Agenda views and sources.

## Completed Slice 2.6 — EventSeries Contract + Migration
EventSeries Contract + Migration replaces occurrence-shaped local calendar persistence with non-recurring EventSeries as the primary HomeOps calendar entity, adds dynamic EventOccurrence projection for Agenda rendering, preserves existing event CRUD behavior and source filtering, and keeps recurrence, EventException, Google Calendar, import/export, ICS, reminders, notifications, authentication, and timezone UI out of scope.

## Completed Slice 2.7 — Calendar Terminology, Projection, and Timezone Foundation
Calendar Terminology, Projection, and Timezone Foundation aligns API contracts and UI wording around EventSeries/HomeOps Calendar terminology, hardens EventOccurrence as projection-only output, persists household timezone on Household with initial `Europe/Amsterdam` fallback behavior, and realigns roadmap documentation around HomeOps Calendar as source of truth, Google Calendar as optional integration, and JSON export as the future canonical portability format.

## Completed Slice 2.8 — Calendar JSON Export and Full Restore Foundation
Calendar JSON Export and Full Restore Foundation adds a versioned canonical `homeops.calendar.export` JSON backend contract, exports household timezone metadata, event source metadata, and EventSeries source-of-truth records, keeps EventOccurrence out of canonical export data, and adds full restore-only backend behavior that validates before replacing calendar sources and EventSeries. Google Drive remains a future export destination only. ICS, recurrence runtime behavior, EventException runtime behavior, selective import, merge import, and conflict resolution remain out of scope.

## Completed Slice 2.9 — Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze
Calendar Portability Hardening freezes the V1 canonical JSON contract, reserves recurrence, exception, and future metadata sections, strengthens schema/version/identifier/ownership/timezone/timing validation, and keeps restore local-only and full-restore-only. Restore validation occurs before destructive actions, rejected exports leave calendar data unchanged, and automatic local pre-restore export snapshots now run before calendar full restore replacement.

## Completed Slice 2.12 — Calendar Recurrence, EventException, and Occurrence Generation Runtime
Calendar Recurrence adds V1 recurrence metadata to EventSeries, supports None/Daily/Weekly/Monthly/Yearly only, persists EventException records for skipped and modified occurrences, and expands Agenda-facing EventOccurrence output at runtime with household timezone local wall-clock semantics. EventOccurrence remains projection-only and is not persisted. Advanced recurrence rules, ICS, recurrence UI, occurrence edit UI, per-event timezones, notifications, reminders, and authentication remain out of scope.






## Completed Slice 2.62 — Avatar V2 Slice 1 Frontend/Product Cleanup
Avatar V2 Slice 1 Frontend/Product Cleanup removes user-visible legacy avatar configuration details from the Family Member parent surface, gives normal frontend-created and fallback/mock members Avatar V2 defaults, and preserves current legacy avatar payload construction only for API compatibility. FamilyAvatar legacy rendering, backend contracts, DTOs, generated clients, persistence, migrations, and legacy CSS remain unchanged for later removal slices. Initials fallback remains permanent.

## Completed Slice 2.61 — Profile Picker Removal and Family-First Cleanup
Profile Picker Removal and Family-First Cleanup removes remaining product-facing profile-picker assumptions from the runnable client experience. Startup remains household-first: incomplete setup opens First Run Wizard, while completed setup opens Home directly. The temporary Avatar V2 editor administration entry was removed from navigation, Family Member copy no longer describes household members as profiles, and Family Member management remains contextual from Home. No Avatar V2 persistence, FamilyMember schema changes, authentication, identity, permissions, migration code, or profile replacement model was introduced.

## Completed Slice 2.56 — Avatar V2 Wide Head Anatomy Review and Fix
Avatar V2 Wide Head Anatomy Review and Fix corrected a visual regression introduced by symptom-focused ear overlap tuning. The fix keeps AvatarAnatomy as the source of truth, moves ears back to visibly external-but-attached silhouette anchors for round, oval, and wide heads, narrows the wide eye spread slightly for better facial balance, and makes glasses bridge/temple geometry derive from eye and ear anchors instead of fixed offsets. Showcase Sample A, B, C, and D were regenerated. No editor functionality, persistence, production UI integration, raster assets, external URLs, new head variants, new hairstyles, or new clothing assets were introduced.

## Completed Slice 2.55 — Color Token Cleanup
Color Token Cleanup adds a shared design-system color vocabulary for product surfaces, borders, elevation, domain accents, and member tints. The client now routes repeated neutral, warm, emotional, review, glass, domain, and member color decisions through explicit CSS custom properties while preserving visual hierarchy and page behavior. Existing layouts, spacing, typography, navigation, workflows, emotional Motivation surfaces, child/member surfaces, and dashboard/operational page roles remain unchanged. No dark mode, theme redesign, card redesign, Avatar V2, asset redesign, or feature behavior changes were introduced.

## Completed Slice 2.54 — Navigation Architecture Cleanup
Navigation Architecture Cleanup aligns the shell with real household usage by limiting Primary Navigation to daily work: Home, Agenda, Tasks, Lists, and Motivation. Weekly Reset, House Status, Media, and Gamification remain reachable as secondary/occasional or future-context surfaces; Child Workspace remains contextual through family member selection; and Settings moves into an Administration affordance. Existing routes, page behavior, workflows, and functionality remain preserved. No new pages, domains, route removals, child workspace redesign, home redesign, or feature behavior changes were introduced.

## Completed Slice 2.50 — Workspace Shell and Home Hero Compaction
Workspace Shell and Home Hero Compaction applies the content-first UX rule across the global shell and primary Home surface. Navigation now uses smaller, grid-based pills to reduce awkward wrapping and keep Settings from becoming an isolated second-row item, workspace headers use compact orientation metadata instead of tall page framing, and the Home hero uses tighter date/time, family, and quick-capture treatments so dashboard content appears sooner. Existing navigation destinations, routes, Home behavior, Tasks, Lists, Motivation, Weekly Reset, Settings, and dashboard content remain preserved. No new functionality, domains, workflow changes, persistence changes, card redesign, motivation redesign, child workspace redesign, or Avatar V2 work was introduced.

## Completed Slice 2.44 — Weekly Reset Explanation Compaction
Weekly Reset Explanation Compaction applies the HomeOps review-first UX rule to the Weekly Household Reset surface. The page now uses a compact hero and state-first cards with counts and actions for review candidates, family goal, children’s goals, shopping review, and weekly recap. Existing Weekly Reset behavior, task candidate selection, goal review, shopping review, task review actions, and recap behavior remain preserved. No new Weekly Reset features, review logic, workflow changes, domains, notifications, rewards, gamification, or persistence changes were introduced.

## Completed Slice 2.43 — Tasks Hierarchy Compaction
Tasks Hierarchy Compaction applies the Home dashboard-first UX lesson to Tasks. The dedicated Tasks page now leads with active urgency groups before management surfaces, uses an on-demand Add Task panel instead of a persistent top form, moves Task Templates behind a secondary entry point, compacts Weekly Household Reset access, and keeps Someday/future planning after active work. Existing task creation, ownership, due date, recurrence, template, Weekly Reset, Someday, and no-date lifecycle behavior remain preserved. No new task features, recurrence features, domains, persistence changes, approval workflows, notifications, rewards, or gamification were introduced.

## Completed Slice 2.41 — No-Date Task Lifecycle
No-Date Task Lifecycle adds a trust-preserving review state for undated tasks: Active, Needs Review, Someday, Completed, and Archived. Older no-date tasks participate in the Weekly Household Reset with parent-facing language, “Still part of the plan?”, and actions to keep active, add a due date, move to Someday, complete, or archive. Someday is an explicit recoverable destination for long-term ideas that should not create daily pressure. Home and Child Workspace remain focused by keeping Someday, archived, and review-only stale-task pressure out of child-facing surfaces. No notifications, project management, reward economy, categories, analytics, or dashboard redesign were introduced.

## Completed Slice 2.57 — Avatar V2 Curly Hairstyle Concept Exploration
Avatar V2 Curly Hairstyle Concept Exploration treats CurlyPlayful as rejected and creates three isolated SVG-only hairstyle concept samples for comparison: Tight Curl Clusters, Loose Wavy Curls, and Playful Child Curls. Tight Curl Clusters is the recommended editor-worthy direction because it reads most immediately as curly hair in dark colors and small sizes. Loose Wavy Curls is retained only as a secondary future reference, while Playful Child Curls is rejected for weaker growth direction and less controlled readability. Existing Avatar V2 renderer behavior remains preserved; no editor UI, persistence, production integration, new avatar systems, new head variants, clothing assets, accessories, gamification, or unlockables were introduced.



## Completed Slice 2.60 — Avatar V2 Concept B Headband Fit Fix
Avatar V2 Concept B Headband Fit Fix corrected the physical fit of the curly-hair headband after visual review found the prior visibility fix still looked detached. The renderer now derives the headband from an anatomy-based head-volume curve, so rear and visible segments share the same implied wrap around the head while the existing partial-occlusion rule keeps curls naturally in front of the center of the band. Concept B hair, the face-strip fix, SVG-only deterministic rendering, and the existing isolated Avatar V2 pipeline remain intact. No editor UI, persistence, production integration, new hairstyles, new accessories, new avatar systems, new head variants, raster assets, or external URLs were introduced.

## Completed Slice 2.59 — Avatar V2 Concept B Headband Visibility Fix
Avatar V2 Concept B Headband Visibility Fix corrected the curly-hair headband interaction after visual review found that the previous validation sample rendered the headband in SVG but hid it behind the hairstyle. The renderer now uses a partial-occlusion rule for curly headbands: a rear wrap remains behind foreground curls while short visible side arcs render after the hair stack so the accessory is visible, identifiable, and still reads as wrapped around the head rather than as a forehead stripe. Concept B remains the preferred curly-hair direction, and the previous face-strip fix remains intact. No editor UI, persistence, production integration, new hairstyles, new accessories, new avatar systems, new head variants, raster assets, or external URLs were introduced.

## Completed Slice 2.58 — Avatar V2 Concept B Curly Hairstyle Salvage
Avatar V2 Concept B Curly Hairstyle Salvage supersedes the earlier concept ranking according to visual review: Concept A is rejected, Concept C is rejected, and Concept B is the only usable direction. The face strip was traced to a long right-side Concept B hair-highlight segment rendered above the face, then corrected with a shorter upper-right wave highlight that remains in the hair mass. Four corrected validation samples cover dark hair, light hair, headband interaction, and leaf-pin interaction while preserving SVG-only deterministic rendering, AvatarAnatomy-driven composition, and existing layer behavior. No editor UI, persistence, production integration, new avatar systems, new head variants, clothing assets, accessories, raster assets, external URLs, or additional hairstyle concepts were introduced.

## Completed Slice 2.63 — Avatar V2 Slice 2 Renderer Cleanup
Avatar V2 Slice 2 Renderer Cleanup removes the legacy CSS/span avatar renderer from the shared FamilyAvatar component. FamilyAvatar now renders Avatar V2 only from complete valid Avatar V2 configuration and otherwise uses the permanent initials fallback for missing, incomplete, or invalid Avatar V2 data. Legacy-only avatar CSS selectors were removed, while backend/API contracts, DTOs, generated client compatibility, persistence, and migrations remain unchanged for later dedicated cleanup slices.

## Completed Slice 2.64 — Avatar V2 Slice 3 API/Client Contract Cleanup
Avatar V2 Slice 3 API/Client Contract Cleanup removes legacy avatar DTO/request/response fields from the public Family Member API contracts and regenerates OpenAPI plus the TypeScript client so frontend create/update flows no longer send legacy avatar payloads. The backend still assigns server-side defaults to legacy entity properties only to satisfy the current persistence model. Avatar V2 configuration remains supported, initials fallback remains the display fallback, and EF/database legacy fields, schema, and migrations remain unchanged for Slice 4.

## Completed Slice 2.65 — Beta Navigation and Surface Cleanup
Beta Navigation and Surface Cleanup removes House Status, Media, and Gamification from user-facing beta navigation while preserving internal workspace identifiers and placeholder routing for future development. Primary navigation is focused on Home, Agenda, Tasks, Shopping / Lists, and Motivation; Weekly Reset is demoted to contextual access from Tasks; and Settings remains available through a compact Administration affordance. Family Members remain contextual people in the Home family experience, and Avatar V2 remains reachable through Family Member flows. No new features, domains, workflows, permissions, authentication, mobile-specific behavior, or Avatar V2 changes were introduced.

## Recommended Next Slice
Proceed with Real Google Calendar Read-Only Integration only after preserving HomeOps Calendar as source of truth and local-only portability boundaries. Keep any Google Calendar work optional and integration-scoped; do not add two-way sync, authentication beyond an explicitly scoped integration requirement, sensors, media, notifications, recurring event editing, or offline-first synchronization.


## Calendar Portability UX and Pre-Restore Export Update
Automatic local pre-restore export snapshots now run before calendar full restore replacement. The snapshot directory is configurable through `CalendarPortability:PreRestoreSnapshotDirectory` and defaults safely to local API storage when unset; Docker/container deployments should mount the configured path to writable persistent storage when snapshots must survive container replacement. The Settings workspace exposes simple local export/restore controls with version, timestamp, validation feedback, friendly errors, an explicit destructive replacement warning, and a required confirmation checkbox. JSON remains the canonical export format; restore remains local-only and full restore only.

## Completed Slice 2.13 — Home Dashboard MVP, Family Member MVP, and Home Navigation Flows
Home Dashboard MVP establishes Home as the primary glassboard-style dashboard with date/time, Family Member strip, quick capture entry points, Agenda summary, and Lists summary. Family Members are minimal household presentation entities only, not users or authentication identities. Home summary content, overflow affordances, and quick capture actions route to dedicated Agenda and Lists pages so Home remains summary-first and existing domain functionality stays on the domain pages.

## Completed Slice 2.16 — Home Hierarchy Tightening
Home Hierarchy Tightening reduces Home app chrome and marketing-style copy, keeps the top area focused on date/time plus a lightweight weather placeholder, tightens portrait spacing, groups Home Agenda rows under Today/Tomorrow/Later / Next, replaces abstract Lists card naming with concrete Shopping/Boodschappen-oriented list naming when available, and compacts the Family Member strip. Family Members remain placeholder presentation entities only; avatar redesign, avatar modeling/editor/badges, Family Member persistence, ownership, tasks, gamification, notifications, authentication, and profile behavior remain out of scope.


## Completed Slice 2.17 — Family Member Avatar MVP
Family Member Avatar MVP replaces Home initials-only chips with friendly frontend-only configurable avatars and a compact Home editor with live preview. The local model covers id, name, display color, initials, age group, presentation, skin tone, hair color, hair style, glasses, and shirt color. Family Members remain non-authentication household presentation entities only; no users, profiles, permissions, ownership, tasks, gamification, points, badges, notifications, or persistence were introduced. Future badge placeholders for task count, points, warning/attention, and today involvement remain deferred.

## Completed Slice 2.18 — Family Member Page and Avatar Editor Relocation
Family Member Page adds a dedicated page per Family Member reached from the Home Family Member strip. The page displays avatar, name, display color, current avatar configuration, and clearly marked future placeholders for Tasks and Points without implementing those domains. Avatar editing moved from Home to the Family Member page while preserving the existing live preview and frontend-only avatar controls. Home remains a dashboard-only, summary-first surface with a purely navigational/contextual Family Member strip. No authentication, profiles, permissions, ownership, tasks, gamification, points, badges, notifications, reminders, House Status, Media, Google Calendar, or persistence were introduced.

## Completed Slice 2.19 — Task Page Foundation
Task Page Foundation establishes Tasks as a real household domain separate from Lists, Calendar, and Gamification. Tasks support a required title, optional due date, ownership state (`Unassigned`, assigned to one Family Member, or `SharedHousehold`), and a two-state lifecycle of available/completed with reopen support. The dedicated Tasks page is urgency-first with Overdue, Due Today, Upcoming, No Due Date, and compact Completed Recently groups; owner remains metadata rather than the primary organizing axis. Family Member task ownership references household presentation entities only and does not introduce users, authentication, permissions, roles, profiles, approval, recurrence, points, notifications, reminders, Google Calendar, House Status, or Media behavior.

## Completed Slice 2.20 — Domain Color System and Future Domain Placeholders
Domain Color System adds centralized pastel frontend color tokens for Home, Agenda, Lists, Tasks, House Status, Media, Gamification, and Settings. Navigation buttons, active navigation state, and subtle page backgrounds now share the same domain color family while cards remain white or near-white for readability. Tasks adopts the shared Tasks color family to feel less clinical without changing urgency-first grouping or adding recurrence, approval, points, categories, or Home task summaries. House Status, Media, and Gamification have navigation entries and coming-later placeholder pages only; no sensors, device state, media integration, points, rewards, badges, authentication, permissions, Google Calendar, or domain logic were introduced.

## Completed Slice 2.21 — Home Quick Capture
Home Quick Capture makes Home behave more like the household glassboard by adding direct Shopping and Calendar capture while preserving Home as a dashboard. Shopping capture uses one text field plus Add and sends items to the seeded Shopping list without list selection. Calendar capture uses What and When with Today, Tomorrow, and Pick date support; detailed editing remains on Agenda. Shopping history suggestions now have a local non-AI foundation based on captured and active list item names. Future preferred-store learning remains deferred; store selection, grouping, icons, shopping intelligence, tasks quick capture, recurrence, approval, points, gamification, Google Calendar, notifications, reminders, House Status, and Media remain out of scope.
## Completed Slice 2.22 — Family Member Persistence
Family Member Persistence promotes Family Members from temporary frontend-only presentation data to durable household-owned records. The backend stores member identity fields and avatar configuration, exposes minimal retrieval/update APIs, and seeds the existing household members. Home, the Family Member page, and Tasks now load Family Members from persistence with existing frontend fallback behavior preserved. Task ownership validates assigned Family Member references against persisted household members while keeping Unassigned and Shared Household ownership supported. Family Members remain non-user, non-profile, non-authentication, non-permission household entities; points, badges, gamification, approval, recurrence, authentication, roles, permissions, notifications, reminders, Google Calendar, House Status, and Media remain out of scope.

## Completed Slice 2.23 — Home Task Summary
Home Task Summary completes the dashboard's three core household pillars by adding a compact Tasks summary beside Agenda and Shopping/Lists. Home shows only overdue, due today, and upcoming active tasks with title, ownership/shared household indicator, and due information, and all card/header/overflow interactions navigate to the dedicated Tasks page. Home remains summary-only and does not add task creation, editing, completion, recurrence, approval, points, categories, notifications, reminders, or configuration behavior.

## Completed Slice 2.24 — Motivation Page Foundation
Motivation Page Foundation adds a dedicated family encouragement surface separate from Tasks, Gamification, and Reward Economy. The page leads with one active seeded family goal, plain progress, encouraging copy, and an optional shared reward label, then shows equal-weight individual Family Member goal cards using avatars, names, stars, checkmarks, and progress language. Home now includes a compact Motivation tile with only the active family goal title and progress that routes to Motivation. Gems, tokens, coins, shop, spend/redeem flows, avatar unlocks, Helpful Moments, leaderboards, negative points, task approval, task recurrence, authentication, permissions, and roles remain out of scope and deferred.

## Completed Slice 2.25 — Motivation Domain Foundation
Motivation Domain Foundation promotes the Motivation surface from frontend-only seeded data to a persisted read-only household read model. The backend stores an active family goal and individual goals linked to persisted Family Members, exposes a read-only snapshot API, and generates NSwag client support. The Motivation page and Home Motivation tile now load API-backed data and handle loading, empty, and error states without adding editing or reward mechanics. Goal editing, Helpful Moments, gems, tokens, coins, reward shop, spend/redeem flows, avatar unlocks, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

### Motivation Progress Foundation — Completed 2026-06-20
- Motivation now consumes completed Tasks as a downstream read model.
- Family goal progress counts completed Shared Household tasks only.
- Individual goal progress counts completed tasks assigned to the matching Family Member only.
- Reopening eligible tasks reverses previously applied progress, with progress bounded by target count.
- Motivation page and Home Motivation tile continue reading from the Motivation API; no editing screens were added.
- Helpful Moments, Reward Economy, Gems, Tokens, Shop, avatar unlocks, badges, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

## Completed Slice 2.26 — Family Member Management Foundation
Family Member Management Foundation makes persisted household Family Members manageable without developer involvement. The backend adds explicit Adult/Child member kind, nullable date of birth with child-required validation, create/update APIs, and soft delete. Home adds a lightweight add-member flow, while the Family Member page becomes the management location for name, member type, date of birth, display color, avatar editing, and confirmed removal. Deleted members disappear from normal Family Member lists and new Task assignment while existing Task and Motivation references remain preserved. First Run Wizard, Empty State UX, Goals, Rewards, Motivation editing, Gamification, permissions, authentication, roles, notifications, and Google Calendar remain out of scope.

## Completed Slice 2.27 — First Run Wizard
First Run Wizard completes the second P0 onboarding slice by adding household first-run detection, a guided initial household setup flow, household review, and persisted onboarding completion. The wizard appears when the seeded household has no active Family Members or has not completed onboarding, then guides users through Welcome, Add Adults, Add Children, Review Household, and Finish. Adults and children use the existing Family Member creation capability, children require date of birth, and all household members remain editable later through existing Family Member Management. Successful completion stores the household onboarding flag and opens Home so configured households do not repeatedly see onboarding. Empty State UX, Goals, Rewards, Motivation editing, Gamification, permissions, authentication, roles, notifications, and Google Calendar remain out of scope.

### Completed Slice 2.28 — Empty State UX Foundation
- Added guided empty states across Home, Tasks, Lists, Motivation, and Agenda.
- Empty pages now explain the value of the domain and expose a clear first action.
- This closes the P0 onboarding completion gap identified by user research after First Run Wizard.
- Kept empty states lightweight and out of tutorial, rewards, Google Calendar, notification, and gamification scope.


## Completed Slice 2.29 — Family Goal Creation and Editing
Family Goal Creation and Editing removes the final functional P0 blocker for Motivation by letting a newly onboarded household create its first active family goal without developer assistance. The Motivation empty state now explains family goals and opens a minimal create form for title, target count, progress wording, and an optional family celebration label. The active family goal can be edited in place, preserving progress and capping progress when the target is lowered. Home continues to surface the active family goal through the existing Motivation tile after navigation back to Home. Individual goal creation, Helpful Moments, Gems, Reward Economy, Shop, badges, leaderboards, negative points, templates, recurrence, notifications, Google Calendar, authentication, permissions, and roles remain out of scope.

### Child Progress View — Completed
- Family Member child pages now surface avatar, name, age-aware context, active family goal participation, and individual Motivation goals in a warm progress presentation.
- The slice remains encouragement-only: no Reward Economy, gems, shops, badges, leaderboards, negative points, notifications, recurrence, or goal templates were introduced.
- Existing Family Member persistence, avatar editing, Motivation, Tasks, Home, and navigation flows remain preserved.

### Helpful Moments Foundation — Completed 2026-06-20
- Added persisted, household-owned Helpful Moments for parent-entered recognition of kindness, initiative, teamwork, responsibility, and routines.
- Added lightweight creation and recent-feed display on Motivation, plus member-specific recognition on Family Member pages.
- Kept Helpful Moments separate from Tasks and Reward Economy: no points, gems, tokens, shop, leaderboard, negative points, or automatic goal progress linkage were added.

### Family Goal Celebration Foundation — Completed 2026-06-20
- Replaced the loose family-goal reward label with a structured Family Celebration attached to family goals.
- Added `Planned`, `ReadyToCelebrate`, and `Celebrated` celebration states with lightweight parent confirmation after goal completion.
- Motivation now communicates what the family is working toward and what happens when the goal succeeds while keeping progress and encouragement primary.
- Home Motivation tile includes compact celebration context only when it helps summarize the active family goal.
- Reward Economy remains deferred: no gems, tokens, coins, shops, purchases, avatar unlocks, badges, leaderboards, notifications, individual rewards, or goal templates were added.


### Individual Goal Management — Completed 2026-06-20
- Added parent-managed individual Motivation goals for persisted Family Members.
- Supports creating goals with Family Member, title, target count, and unit label.
- Supports editing title, target count, unit label, and assigned Family Member while preserving/capping progress.
- Supports archiving goals so retired goals disappear from active Motivation and Child Progress views while history remains persisted.
- Child Progress and Motivation displays now reflect active individual goal changes automatically through the Motivation snapshot.
- Kept Reward Economy, gems, tokens, shops, purchases, avatar unlocks, badges, leaderboards, negative points, notifications, recurrence, and templates out of scope.

### Recurring Tasks Foundation — Completed 2026-06-20
- Added the first major P2 recurring task slice so parents can configure common chores once instead of recreating them repeatedly.
- Supports Daily, Weekly, and Monthly recurrence with a human-readable model only.
- Recurring task generation creates future task occurrences while keeping the recurring series definition separate from individual completion.
- Recurring task editing covers title, owner, due/start date, and recurrence frequency for the whole simple series.
- Recurring task deletion is explicit series deletion; occurrence-only deletion, exceptions, series splitting, task templates, advanced scheduling, notifications, and calendar reminders remain deferred.
- Motivation compatibility is preserved: recurring task occurrences still advance family goals and individual goals through existing task completion behavior.

### Task Templates Foundation — Completed 2026-06-20
- Added persisted Task Templates so parents can reuse common household task collections without recreating each task manually.
- Template CRUD supports create, edit, and soft archive; archived templates disappear from the normal Tasks page selection.
- Applying a template is repeatable and creates fresh tasks each time.
- Template items with no recurrence create normal Household Tasks; template items with Daily, Weekly, or Monthly recurrence create Recurring Task Series and generated task occurrences using the existing recurring task model.
- Seeded starter templates are Morning Routine, Bedtime Routine, Homework Routine, Pet Care, and Kitchen Reset, and remain household-editable/archiveable after seeding.
- This slice intentionally does not add Goal Templates, Reward Economy, gems, shop, notifications, sharing, marketplace, import/export, or AI-generated templates.


### Shopping Intelligence Foundation — Completed 2026-06-20
Shopping Intelligence Foundation reduces shopping-list administration without adding capture friction. Shopping items now have optional preferred-store metadata, deterministic household item-name preferences, inherited stores for future matching additions, per-item store overrides, grouped Shopping presentation, and store context in suggestions/summaries. Home quick capture and Shopping capture remain item-name only. Store selection is not required, uncategorized items remain visible, and AI classification, OCR, barcode scanning, notifications, shopping automation, and Reward Economy remain out of scope.

### Completed Slice 2.30 — Child Workspace Foundation
Child Workspace Foundation evolves child Family Member pages from management-first screens into encouragement-first child workspaces. The workspace leads with avatar identity, age-aware context, active family goal progress, family celebration visibility, active individual goals, and recent Helpful Moments before secondary administration controls. Ages 3-5 receive simpler visual star/checkmark presentation with less text, while ages 6-12 receive richer progress and celebration detail in the same shared experience. Existing Family Member persistence, avatar editing, Motivation, Family Goals, Individual Goals, Helpful Moments, Tasks, and Home behavior remain preserved. Reward Economy, gems, shops, balances, purchases, avatar unlocks, badges, leaderboards, notifications, Google Calendar, and household settings remain out of scope.

### Completed Slice 2.31 — Child Mode
Child Mode transforms child Family Member pages from a management-adjacent record into “My Place In The Family.” The page now lands on child-first content that answers “How am I doing?” through avatar identity, family goal progress, personal goals, Helpful Moments, and family celebration context before any administrative controls. Parent Mode remains accessible as a secondary administration area for editing member details, date of birth, member type, display color, avatar configuration, and removal. Existing Family Member persistence, avatar editing, Child Workspace, Motivation, Goals, Helpful Moments, and Celebrations remain preserved. Reward Economy, gems, shops, purchases, notifications, Google Calendar, household settings, and dashboard customization remain out of scope.


### Completed Slice 2.32 — Child Hero Area
Child Hero Area makes Child Mode hero-first by adding a dominant top section that combines the child avatar and name, current primary individual goal when available, visual progress, active family goal context, and family celebration status. The hierarchy is identity → current goal → progress → family goal → celebration, so the first screen answers “Who am I?”, “How am I doing?”, “What am I working on?”, and “How am I helping my family?” before secondary cards or Parent Mode. Family contribution copy emphasizes belonging and shared progress without rankings, comparisons, leaderboards, Reward Economy, gems, shops, purchases, notifications, Google Calendar, dashboard customization, or household settings. Existing Child Workspace, Child Mode, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, and avatar editing remain preserved.

### Completed Slice 2.33 — Child Journey
Child Journey completes the final major Child Experience flow before Celebration and Motivation refinement. Child Mode now answers the three core child questions in order: Today answers “What should I do?” with child-owned active tasks and a compact friendly count; This Week answers “What am I working on?” with active individual goals and progress; Family Goal answers “How am I helping?” with shared family progress, contribution context, and celebration visibility. The reading order is Hero, Today, This Week, Family Goal, Helpful Moments, then Parent Mode access, keeping administration secondary while preserving existing Child Mode, Child Hero Area, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, Tasks, and avatar editing. Reward Economy, gems, shops, purchases, notifications, Google Calendar, dashboard customization, household settings, rankings, comparisons, and leaderboards remain out of scope.

### Completed Slice 2.34 — Helpful Moments Upgrade
Helpful Moments Upgrade reframes the existing parent-entered recognition surface as “Things My Family Appreciates.” Motivation and Child Mode now use warmer child-facing appreciation language, including “My Family Appreciates,” “Thank you for,” and “We noticed,” and the cards are styled as memorable appreciation notes instead of a feed, log, or audit trail. The existing Helpful Moments persistence and creation flow remain unchanged, and recognition stays separate from Reward Economy and progress mechanics. Existing Child Workspace, Child Journey, Motivation, Family Goals, Individual Goals, Family Celebrations, Tasks, and avatar editing remain preserved. Reward Economy, gems, shops, purchases, notifications, automatic rewards, automatic progress, goal editing, rankings, comparisons, and leaderboards remain out of scope.

### Completed Slice 2.35 — Celebration Surface
Celebration Surface promotes existing Family Celebrations from compact goal-card context into visible emotional product surfaces. Motivation now tells the family story as Goal → Progress → Celebration, keeping celebrations attached to family progress and recognition rather than administration. Child Mode highlights the celebration in the hero and Family Goal journey areas so children can see what is upcoming, ready, or already celebrated. Home adds a compact summary-first celebration surface, with ReadyToCelebrate styled as hard to miss without turning Home into a rewards page. Reward Economy, gems, shops, purchases, individual rewards, notifications, celebration history, celebration memory, goal templates, and dashboard customization remain out of scope.

### Celebration Memory — Completed 2026-06-21
- Celebrated Family Celebrations now remain visible as recent Celebration Memories with title, optional description, and celebrated date.
- Motivation presents memories as warm family history and extends the story from Goal → Progress → Celebration to Goal → Progress → Celebration → Memory.
- Child Mode shows recent celebration memories so children can see what the family already achieved and celebrated together.
- This stays presentation-focused and avoids Reward Economy, gems, shops, purchases, individual rewards, notifications, comments, reactions, social feeds, rankings, and dashboard customization.

### Completed Slice 2.37 — Celebration Anticipation Moment
Celebration Anticipation Moment upgrades existing Family Celebration presentation from “something is planned” to “this is the fun thing we are getting closer to.” Planned celebration copy now names the celebration and connects remaining family progress to anticipation across Motivation, Home, and Child Mode. Child Mode shows how today’s help moves the family closer in both the hero and Family Goal journey areas, while Motivation keeps the lightweight Goal → Progress → Celebration story and upgrades ReadyToCelebrate into a “We did it” family arrival moment. Existing Family Goals, Motivation, Child Workspace, Child Journey, Helpful Moments, Celebration Surface, and Celebration Memory remain preserved. Reward Economy, gems, shop, purchases, notifications, celebration planning workflows, photos, comments, reactions, social feeds, voting systems, and new persistence models remain out of scope.

### Completed Slice 2.38 — Family Contribution Story Foundation
Family Contribution Story Foundation reframes the child-facing Motivation journey from Goal → Progress → Celebration → Memory to Contribution → Progress → Celebration → Memory. Helpful Moments now bridge everyday appreciation to the shared family journey as evidence of how the family got closer, without automatically increasing progress or becoming points, rewards, rankings, leaderboards, badges, gems, balances, or streaks. Child Mode strengthens non-competitive ownership with “my help mattered” language, celebrations feel family-created instead of system-created, and memories now explain why the celebration happened using existing goal, progress, celebration, and Helpful Moment information. Existing Family Goals, Progress, Helpful Moments, Family Celebrations, Celebration Memory, Child Workspace, and Child Journey remain preserved.


### HomeOps Long-Term Usage Review — Completed 2026-06-21
- Added retention-focused long-term usage review reports under `docs/reports/2026-06-21-work/`.
- Evaluated 30-day and 90-day household usage across expert, father, mother, six-year-old child, and ten-year-old child perspectives.
- Identified recurring tasks, shopping intelligence, child contribution visibility, and family goal rituals as the strongest long-term retention anchors.
- Identified maintenance burden, stale tasks, generic recognition, stale goals, template dormancy, and unritualized memories as the primary retention risks.
- Final verdict: the family would probably still use HomeOps after 90 days, especially if a weekly household reset and recap consolidates ongoing maintenance into a sustainable ritual.

## 2026-06-21 Update — Recurring Task Hygiene
- Implemented recurring task hygiene as a Phase 2 maintenance-reduction slice.
- Older incomplete occurrences from the same recurring series expire when a current or upcoming occurrence exists, keeping task lists focused on what should be done now.
- Completed occurrences remain preserved, avoiding data loss and preserving Motivation compatibility.


### Completed Slice 2.39 — Goal Hygiene
Goal Hygiene reduces Motivation maintenance burden by making focus the default. Family Goal creation and editing now preserve the invariant that only one Family Goal can be active for the household, retiring previous active family goals through the existing inactive lifecycle model. Individual Goal creation and editing now preserve the invariant that each Family Member has at most one active Individual Goal, retiring only that member's previous active goal and leaving other Family Members unchanged. Database-level partial unique indexes protect those invariants outside normal API flows, and migration cleanup deactivates duplicate active records before the constraints are added. Existing Family Goals, Individual Goals, Motivation progress, Family Celebrations, Child Workspace, Family Contribution Story, and progress history remain preserved. Reward Economy, notifications, shopping changes, analytics, goal templates, new goal types, and dashboard changes remain out of scope.


### Completed Slice 2.40 — Shopping Lifecycle
Shopping Lifecycle reduces shopping-list maintenance burden and list clutter while preserving frictionless capture and Shopping Intelligence. Lists now support rename plus archive and soft-delete lifecycle states so old lists leave normal views without unnecessary hard deletion. Completed items move below active items, remain visible for 24 hours, and can be undone before they are omitted from the active list view. Deleted items are soft-deleted, shown with deleted state and strikethrough styling for 24 hours, and can be restored through undo before cleanup hides them from normal views. Home quick capture remains item-name only, preferred-store learning remains unchanged, and Shopping Intelligence V2, Reward Economy, notifications, analytics, OCR, barcode scanning, and AI classification remain out of scope.


## No-Date Task Lifecycle
- Completed review state, Someday lane, Weekly Household Reset participation, and trust-preserving Home/Child visibility rules.

### Completed Slice 2.41 — Weekly Household Reset & Recap
- Added a lightweight optional Weekly Reset workspace for parents.
- Batches maintenance into a short weekly pass rather than turning every domain into a dashboard.
- Uses existing lifecycle signals for review candidates: no-date Needs Review, older active no-date tasks, and stale Someday tasks.
- Adds lightweight goal confirmation for the current family goal and each child’s active goal with keep/archive affordances and replacement deferred to existing Motivation flows.
- Adds shopping review candidates for archived, older, or duplicate-looking lists without requiring weekly shopping maintenance.
- Adds a recap of completed tasks, Helpful Moments, goal progress, celebration memories, and “what went well” signals using existing data only.
- Preserves existing Tasks, Goal Hygiene, Shopping Lifecycle, Child Workspace, Helpful Moments, Celebrations, and Family Contribution Story.
- Does not add Reward Economy, notifications, Google Calendar, dashboard customization, household settings, project management, or new social systems.

### Completed Slice 2.42 — Shopping Intelligence V2
Shopping Intelligence V2 replaces the single preferred-store learning model with lightweight Purchase History. Household item/store associations now support multiple stores with counts, store suggestions are ordered by most common historical use, and users can still add any new item/store combination or no store at all. Home quick capture and Shopping quick capture remain item-name-only, store selection remains optional, and intelligence stays assistive rather than prescriptive. Existing preferred-store data migrates into initial purchase-history entries so prior store associations remain useful. AI classification, OCR, barcode scanning, notifications, Reward Economy, analytics, and dashboard changes remain out of scope.

### Completed Slice 2.43 — Copy Cleanup Slice 1
Copy Cleanup Slice 1 reduces cognitive load in Motivation and Child Workspace without redesigning layout, changing workflows, or adding functionality. Motivation now emphasizes current state, progress, and actions instead of repeating the contribution story model across multiple surfaces. Child Workspace uses shorter, concrete wording suitable for younger children, including simpler empty states and clearer Family Goal / Personal Goal terminology. Existing Family Goals, Personal Goals, Celebrations, Helpful Moments, Family Contribution Story, Motivation behavior, Child Workspace behavior, and tests remain preserved.

### Completed Slice 2.44 — Semantic Icon Layer
Semantic Icon Layer adds a stable visual abstraction between current Unicode/emoji usage and the future owned HomeOps SVG asset library. Primary family-facing surfaces now use semantic icon names through a shared `HomeOpsIcon` component and central registry for celebration, progress, completion, memory, kindness, add, close, and back/arrow-style symbols while preserving the current rendered Unicode appearance. Future SVG migration should be handled inside this icon layer rather than by editing Child Workspace, Motivation, Celebration, Home, or family-member components individually. This slice intentionally does not add SVG assets, new artwork, redesign, layout changes, color changes, typography changes, or new functionality.

### Completed Slice 2.45 — HomeOps Asset Wave 1
HomeOps Asset Wave 1 creates standalone owned SVG assets for Helpful Moments, Celebration states, Child Ownership concepts, and the core add/close/back controls under `src/HomeOps.Client/src/assets/homeops/`. The wave establishes the soft, rounded, pastel, child-safe layered-flat asset direction while remaining independent from product integration. It intentionally does not replace Semantic Icon Layer Unicode mappings, modify runtime behavior, change workflows, or redesign product surfaces.

### Completed Slice 2.46 — Celebration Asset Integration
Celebration Asset Integration wires existing Wave 1 Celebration SVG assets into the Semantic Icon Layer and replaces Celebration Unicode/emoji rendering across Motivation, Child Workspace, Home Motivation summary, and Celebration Memory surfaces. Feature components continue using semantic names instead of direct SVG imports, with safe fallback symbols preserved for unmigrated or unavailable assets. Existing Celebration, Motivation, Child Workspace, Home, Family Goal, and Celebration Memory behavior remains unchanged; this slice only advances asset-system adoption and visual ownership.

### Completed Slice 2.47 — Helpful Moments Asset Integration
Helpful Moments Asset Integration wires existing Wave 1 Helpful Moments SVG assets into the Semantic Icon Layer and replaces recognition category glyph presentation for Kindness, Teamwork, Initiative, Responsibility, and Routine. Motivation, Child Workspace/Family Member Helpful Moments, Family Contribution Story surfaces that reuse Helpful Moments, and Weekly Reset recap rows now render HomeOps-owned appreciation visuals through semantic names with safe fallbacks. Recognition remains non-competitive and appreciation-oriented; no new assets, redesigns, rewards, behavior changes, or layout changes were introduced.

### Completed Slice 2.48 — Child Ownership Asset Integration
Child Ownership Asset Integration wires existing Wave 1 Child Ownership SVG assets into the Semantic Icon Layer and replaces ownership-related symbol visuals across Child Workspace and Motivation surfaces. My Progress, My Help Mattered, Family Participation, Today, and This Week now render HomeOps-owned assets through semantic icon names with safe fallbacks preserved. The slice keeps ownership non-competitive and family-centered, supporting personal progress, contribution, and shared participation without introducing rankings, scores, rewards, layout redesigns, workflow changes, or new assets.

### Completed Slice 2.49 — Home Quick Capture Compaction
Home Quick Capture Compaction makes Home more dashboard-first by replacing always-visible Shopping and Event forms with compact labeled actions. Shopping remains fast through an expand-on-demand inline form, while Event creation moves into a Home dialog that appears only after explicit intent. The Home summary order now emphasizes Agenda followed by due/overdue Tasks before Motivation and Shopping/Lists. Existing Home event creation, Shopping item creation, Agenda, Tasks, Motivation, Lists, and Family Member navigation remain preserved. No new domains, navigation redesigns, reward economy features, or cross-page redesigns were introduced.

### Completed Slice 2.50 — Lists Hierarchy Compaction
Lists Hierarchy Compaction applies the Home and Tasks execution-first hierarchy lesson to Lists. The Lists surface now leads with the current list context, quick item add, active items, store-grouped shopping work, and completion opportunities before list administration. Rename, archive, and delete remain available through compact List settings, while row-level store editing remains available behind compact Store controls so Shopping Intelligence and store suggestions are preserved without making management dominate the page. This slice is UX-only and does not add shopping features, new intelligence, OCR, barcode scanning, notifications, rewards, persistence changes, or workflow redesigns.

### Completed Slice 2.51 — Motivation Overview / Detail Separation
Motivation now follows the HomeOps overview-first UX rule. The page opens around the active Family Goal, progress, and Celebration state so families can answer “what are we working toward?” and “how are we doing?” before entering secondary workflows. Helpful Moments, Celebration Memories, and Personal Goals now default to compact previews with counts/recent examples/key progress, while creation, browsing, history, editing, and full management require deliberate expansion or detail access. Existing Family Goal, Helpful Moments, Celebration, Memory, Personal Goal, persistence, and workflow behavior remain preserved. No new domains, reward systems, gamification, notifications, or data model changes were introduced.

### Completed Slice 2.52 — Child Workspace Overview First
Child Workspace Overview First applies the overview-first/detail-on-demand rule to Child Mode. The child surface now opens with Today immediately after identity, then shows one primary progress summary, compact Family Goal context, and a latest appreciation preview so a child can answer “what should I do today?”, “how am I doing?”, and “what are we working toward together?” within the opening screen. Full personal progress, expanded Family Goal detail, celebration memories, and Helpful Moments history remain available through deliberate exploration, while Parent Mode stays separate and more discoverable without exposing parent controls in Child Mode. Existing Child Mode, Parent Mode, Family Goal, Helpful Moments, Celebration, Memory, task behavior, workflows, and persistence remain preserved; no new domains, rewards, gamification, notifications, or Avatar V2 work was introduced.

### Slice 2.53 — Card System Consolidation Phase 1 — Completed
- Introduced shared card taxonomy: `Card`, `CardHeader`, `SummaryCard`, and `ReviewCard`.
- Migrated Home summary cards onto `SummaryCard` while preserving existing Home visual contracts.
- Migrated Weekly Reset review cards onto `ReviewCard` while preserving existing reset-card visual contracts and workflows.
- Deferred broader Tasks, Motivation, Child Workspace, color, typography, avatar, and asset normalization to future explicit slices.


### Avatar V2 Engine Exploration — Completed 2026-06-22
Avatar V2 Engine Exploration adds an isolated SVG-only client renderer for future avatar direction work. The engine uses typed configs, internal palette tokens, independent Shirt/Base/Hair/Glasses/Accessory layers, and four deterministic sample SVG artifacts. Current MVP avatars, Family Member management, Child Workspace, Motivation, persistence, editor UI, uploads/photos, raster assets, and AI-generated avatars remain unchanged and out of scope.


### Avatar V2 Engine Quality Upgrade Analysis — Completed 2026-06-22
Avatar V2 Engine Quality Upgrade Analysis defines the engine-only architecture needed to move the isolated SVG avatar renderer toward the HomeOps visual identity: warm, family-friendly, child-friendly, personal, pastel, and softly rounded. The plan recommends anatomy anchors, explicit head variants, BackHair/FrontHair/HairHighlights depth, recognizable clothing assets, accessory mount points, expanded internal palette roles, and SVG asset design rules. Editor integration, production UI integration, MVP avatar replacement, persistence changes, uploads/photos, raster assets, and AI-generated avatars remain out of scope.

### Avatar V2 Golden Sample Quality Validation — Completed 2026-06-22
Avatar V2 Golden Sample Quality Validation proves a higher-quality SVG-only direction through engine improvements only. The isolated renderer now supports anatomy anchors, anatomy-driven ears, BackHair/FrontHair/HairHighlights layering, one hoodie clothing asset, a `chestCenter` mount, and exactly one Golden Sample. Editor integration, production UI integration, persistence, Profile Picker, Child Workspace, MVP avatar replacement, raster assets, external avatar libraries, AI-generated avatars, gamification, and unlockables remain out of scope.

### Avatar V2 Head and Hair Quality — Completed 2026-06-22
Avatar V2 Head and Hair Quality improves the isolated SVG renderer with distinct round, oval, and wide head silhouettes, anatomy-tuned facial proportions, ear alignment, and exactly three higher-quality hairstyles: shortMessy, longSoft, and curlyPlayful. Four showcase SVG samples now validate silhouette diversity alongside the original sample set and Golden Sample. The slice remains sample-driven and deterministic, and it does not add editor UI, persistence, production UI integration, Profile Picker integration, Child Workspace integration, MVP avatar replacement, gamification, unlockables, external avatar systems, or raster assets.

### Avatar V2 Ear Attachment Fix — Completed 2026-06-22
Avatar V2 Ear Attachment Fix corrects the isolated renderer's wide-head ear anchors so Showcase Sample C and Showcase Sample D no longer read as detached from the head silhouette. The fix remains anatomy-driven and SVG-only, adds geometry validation for round, oval, and wide variants, and regenerates the four showcase samples. No editor functionality, persistence, production UI integration, new avatar features, new head variants, hairstyles, clothing assets, raster assets, or external URLs were introduced.

## Avatar V2 Left/Right Anatomy Symmetry Fix — Completed 2026-06-22
- Corrected isolated Avatar V2 anatomy/rendering symmetry for round, oval, and wide heads.
- Wide head geometry now mirrors around the anatomy centerline, and face/glasses rendering no longer applies side-specific vertical offsets.
- Added validation for mirrored ear anchors, eye anchors, lens geometry, and temple geometry.
- Scope remained limited to Avatar V2 geometry and regenerated standalone showcase SVG samples; no production UI, editor, persistence, or feature expansion was introduced.

### Avatar V2 Asset System V1 — Completed 2026-06-22
Avatar V2 Asset System V1 introduces reusable SVG-only HairAsset, ClothingAsset, and AccessoryAsset definitions with editor-safe metadata for future editor consumption without building editor UI. Clothing now includes hoodie, sweater, T-shirt, and overall silhouettes; accessories now include star, flower, headband, and bow using anatomy mount points. Six standalone showcase avatars validate asset diversity and deterministic rendering while keeping Avatar V2 isolated from production UI, persistence, profile picker integration, unlockables, gamification, raster assets, external URLs, and external avatar systems.

### Avatar V2 Hair Quality Review — Completed 2026-06-22
Avatar V2 Hair Quality Review improved the isolated SVG-only renderer's weak prioritized hairstyles (`shortMessy`, `longSoft`, and `curlyPlayful`) after illustrator-style review found that dark hair colors exposed shape seams and weak growth direction. The slice added practical hair-specific validation for deterministic SVG output, required layer relationships, style identity, and flow-highlight tagging, then regenerated standalone showcase samples. AvatarAnatomy remains the source of truth, and no editor UI, persistence, production UI integration, new hairstyles, new head variants, clothing, accessories, gamification, unlockables, raster assets, or external avatar systems were introduced.

### Avatar V2 Rejected Asset Redesign — Completed 2026-06-22
Avatar V2 Rejected Asset Redesign addressed the visual rejection findings for `curlyPlayful`, `leafPin`, and the `curlyPlayful` + `headband` combination. The isolated SVG renderer now uses a rebuilt curl-cluster silhouette for `curlyPlayful`, a clearer veined `leafPin`, and an asset-specific rule that renders headbands behind foreground curls for curly hair. Targeted validation SVGs were generated alongside refreshed showcase samples. The slice remained asset-level only: no editor UI, persistence, production integration, new avatar systems, new head variants, new clothing assets, gamification, unlockables, raster assets, or external avatar systems were added.

Avatar V2 Contact Sheet Artifact Fix removes an unintended broad translucent base-layer oval from the isolated SVG renderer after contact-sheet visual review. The correction is limited to the renderer, regression coverage, and regenerated SVG-only review artifacts; hairstyles, clothing, accessories, anatomy, editor UI, persistence, production integration, raster assets, and external avatar systems remain unchanged.

### Avatar Editor MVP — Completed 2026-06-23
- Added an isolated Avatar V2 editor page for limited user testing before production profile migration.
- Persisted Avatar V2 user intent for head variant, hair, clothing, accessories, and swatch choices without exposing renderer internals.
- Preserved AvatarAnatomy-driven SVG-only deterministic rendering and avoided replacing existing MVP avatars or integrating with child/profile/family overview surfaces.

## Avatar V2 FamilyMember Persistence — Completed 2026-06-23
- Added `AvatarV2Config` as a FamilyMember-owned value object for user intent only: head variant, hair style/color, clothing style/color, accessory, and accessory color.
- Persisted Avatar V2 choices as owned FamilyMember columns rather than SVG, anatomy, renderer internals, profiles, users, or identity records.
- Updated FamilyMember create/update/read contracts and client mapping so Avatar V2 config round-trips with FamilyMember data.
- Replaced browser-local Avatar V2 editor storage with Family Member save/load integration, including local preview, save, cancel, and reset-to-default workflows.
- Broader Avatar V2 rollout into Home, Family Overview, Child Workspace, dashboards, profiles, authentication, or permissions remains out of scope.

### Avatar V2 Phase 1 Core Display Rollout — Completed 2026-06-23
FamilyAvatar now uses persisted FamilyMember Avatar V2 configuration for core display surfaces while keeping the FamilyAvatar public API and existing call sites intact. Family Member hero, Child hero area, and Home family strip render Avatar V2 through FamilyAvatar when `avatarV2Config` is present. Legacy avatar rendering remains as fallback when Avatar V2 config is absent, and initials remain as the no-avatar fallback. This display-only slice did not change API contracts, DTOs, persistence, migrations, Helpful Moments, shopping/lists/weekly reset/mobile/future surfaces, or intentionally redesign Motivation cards; Motivation cards may inherit Avatar V2 indirectly anywhere they already render FamilyAvatar.

## Completed Slice 2.65 — Avatar V2 Slice 4 Final Legacy Persistence Removal
Avatar V2 Slice 4 Final Legacy Persistence Removal removes the remaining legacy avatar persistence model from FamilyMember. The backend entity, EF mapping, creation/update defaults, deterministic seeds, visual review fixtures, migration snapshots, and frontend fallback fixture/type definitions no longer carry the old age group, presentation, skin tone, hair color, hair style, glasses, or shirt color fields. Avatar V2 configuration remains the sole avatar model, initials fallback remains permanent, and no legacy avatar DTOs, rendering, or runtime persistence dependency remains.

### Home Dashboard Cleanup — Completed 2026-06-24
Home Dashboard Cleanup removes the large global Home Quick Capture surface and moves creation/navigation into compact card header icon buttons. Agenda, Tasks, Motivation, and Shopping/Lists bodies now stay summary-only without duplicate open/view controls, while Shopping/List rows show item names directly with optional store context instead of repeating list/container labels. Existing dedicated domain pages remain the full management surfaces, and Home keeps only minimal creation dialogs for supported quick adds.


### Completed Slice 2.55 — Home Dialog and Layout UX Consistency
Home Dialog and Layout UX Consistency changes Home from a weighted dashboard to a balanced 2x2 summary grid ordered Agenda, Tasks, Shopping, and Motivation. Creation and editing flows that consumed permanent management-page space now open in existing per-surface components presented as HomeOps-styled dialogs with full-screen blurred/tinted backdrops, rounded pastel cards, soft shadows, Escape handling, outside-click dismissal, and initial focus. Agenda event creation/editing, Task creation/editing, Family Goal creation/editing, and Personal Goal creation/editing moved into dialogs, while Shopping item entry remains inline for rapid repeated entry. Existing API contracts, persistence behavior, domain models, Shopping page workflow, Family Member management, onboarding, and business logic remain preserved; no generic dialog framework was introduced.


### Completed Slice 2.56 — Task Dialog Conversation
Task Dialog Conversation redesigns the Task create/edit dialog into the first HomeOps conversational creation reference. The dialog now asks one primary question at a time: what needs to be done, who should do it, when it should happen, and whether anything optional such as recurrence is needed. New tasks default to today, provide Today/Tomorrow/Someday shortcuts, keep recurrence under “Anything else?”, and reuse the existing Task create/update payload path. Agenda, Motivation, Shopping, APIs, persistence, task templates, Weekly Reset, and backend behavior remain unchanged, and no generic dialog framework was introduced.

### Motivation Layout Architecture Refactor — Completed 2026-06-27
Motivation Layout Architecture Refactor corrected the prior dashboard redesign's excessive vertical growth by removing the Motivation-level duplicate header, widening the Motivation workspace on desktop, constraining icon/card sizing, and turning Family Goal, Recent Appreciation, Upcoming Celebrations, and Statistics into a measured two-by-two dashboard. Browser validation with a temporary local mock API measured no vertical scrollbar at 1366×768 or 1920×1080, with all four key cards above the fold. Backend behavior, API contracts, routing, database schema, and stored data behavior remained unchanged.

Agenda Month Master-Detail establishes Agenda as a family planning workspace rather than a dashboard by making the month grid the primary navigation surface and the selected-day panel the integrated day view. Event creation now starts from the selected day and defaults to that date while preserving existing HomeOps Calendar APIs, persistence, source filtering, edit/delete behavior, and local refresh mechanics. Week workspace, List workspace, event indicators, event-type configuration, Google Calendar integration, backend changes, and database changes remain deferred.

Agenda Event Indicators replaces month-cell count text with frontend-derived type icons, soft type colours, and `+N` overflow while improving selected-day event cards with warmer FamilyBoard presentation. The slice derives visual type from existing source metadata and title keywords only, preserving calendar persistence, Google Calendar integration, backend APIs, database schema, and event editing flows. Week workspace, List workspace, event-type editor/settings, persisted event type metadata, and backend changes remain deferred.

### Completed Slice — Shopping Layout Density (2026-06-27)
- Reduced Shopping workspace vertical density after browser measurements showed Quick Add and secondary sections were too tall.
- Kept Shopping behaviour, preferred-store grouping, lifecycle flows, backend, API contracts, and schema unchanged.
- Added browser validation/reporting for the compact layout at 1366×768 and 1920×1080.

### Completed Slice — Tasks Workspace Polish (2026-06-27)
- Reduced visual action density in Tasks by promoting Klaar and Morgen as primary visible actions and placing lower-frequency card actions behind Meer.
- Added a compact Vandaag orientation summary from existing frontend task data.
- Reduced Afgerond visual weight with a collapsed history presentation while preserving reopen behavior.
- Kept task completion, Morgen, recurrence, Weekly Reset, backend, API contracts, and database schema unchanged.


### FamilyBoard Final MVP Polish — Completed 2026-06-27
- Added a subtle Weekly Reset closure moment, Shopping density polish, Dutch shell/copy consistency, and action styling alignment without backend, API, schema, workflow, or navigation-architecture changes.
- Browser validation covered Home, Motivation, Agenda, Tasks, Shopping, and Weekly Reset at 1366×768 and 1920×1080.

### Avatar Editor Final Polish — Completed 2026-06-28
Avatar Editor Final Polish resolves the remaining Friends & Family visual blocker from the authoritative round-2 review by reducing the Family Member Avatar Editor's desktop vertical footprint. The current categories, accessory options, accessory colour controls, Save, and Cancel now fit in the initial 1920×1080 dialog view without introducing new avatar features, new controls, scrolling behavior, renderer changes, persistence changes, backend/API/schema changes, workflow changes, or binary artifacts.


### Family Member Compact Layout — Completed 2026-06-28
Family Member Compact Layout resolves a Friends & Family blocker found in the preview video by making Family Member detail pages feel like part of FamilyBoard instead of profile landing pages. The slice replaces the dominant back action with compact header navigation, removes the large non-avatar decorative progress image from the child member hero, promotes Avatar V2 and Avatar editing in the compact identity header, and surfaces parent/child mode controls before the child content. Backend behavior, API contracts, database schema, Avatar V2 renderer and persistence, family-member persistence, workflows, navigation routes, and binary assets remain unchanged.


### FamilyBoard Marketing Audio Framework — Completed 2026-06-28
FamilyBoard Marketing Audio Framework adds a reusable marketing-only audio layer under `tools/marketing-recording/audio/` with an event-subscribing audio director, replaceable on-demand placeholder WAV generation, optional background music configuration, timeline scheduling, mixing, normalization, and WAV export helpers. The slice intentionally excludes generated audio binaries from the PR; validation mixes are local ignored artifacts, and it avoided production UI changes, application sound effects, screenshots, and movies.


### Executable FamilyBoard Marketing Storyboard — Completed 2026-06-28
Executable FamilyBoard Marketing Storyboard converts the canonical 9-scene Marketing Storyboard V1 into a source-only Marketing Director storyboard module under `tools/marketing-recording/storyboards/`. The module preserves fixture names, chapter card direction, emotional curve metadata, durations, semantic touch-first actions, camera pacing, audio event references, expected final states, and director notes while allowing source-only validation and recording-plan creation. The slice intentionally produced no movie, screenshots, audio, WAV files, browser session, production UI changes, or generated media.

### Completed Slice 2.68 — Mijn Pagina Layout Redesign Slice 1
Mijn Pagina Layout Redesign Slice 1 establishes child Family Member pages as a clear personal page rather than a mixed administration surface. The page now opens with a normal header and compact back action, leads with identity/avatar, follows with Today, keeps existing appreciation, motivation/progress, family-goal, and history content available, and visually separates parent administration as secondary. Existing Family Member persistence, avatar editing, Motivation, Helpful Moments, Tasks, navigation, backend behavior, API contracts, database schema, and workflows remain preserved. No new functionality, widgets, data, persistence, or binary assets were introduced.

### Completed Slice 2.69 — Mijn Pagina Layout Redesign Slice 2
Mijn Pagina Layout Redesign Slice 2 simplifies child Family Member pages by keeping identity anchored in the page header, making Today the first child-facing content block, reducing repeated identity/progress competition, and moving parent settings into a quiet administrative disclosure below the child experience. Parent Administration remains on Mijn Pagina, but it is clearly secondary and no longer competes with child-facing content. Existing Family Member persistence, avatar editing, Motivation, Helpful Moments, Tasks, navigation, backend behavior, API contracts, database schema, and workflows remain preserved. No new functionality, widgets, data, persistence, or binary assets were introduced.

### Completed Slice 2.70 — Mijn Pagina Polish
Mijn Pagina Polish makes the child Family Member page feel like a first-class FamilyBoard surface by tightening page rhythm, increasing avatar prominence in the identity header, balancing the child desktop grid, compacting the supporting progress card, improving disclosure hover/open feedback, and keeping parent settings visually quiet. Existing Family Member persistence, avatar editing, Motivation, Helpful Moments, Tasks, navigation, backend behavior, API contracts, database schema, and workflows remain preserved. No new functionality, data, persistence, widgets, media, or binary assets were introduced.

### Completed Slice 2.71 — Agenda Layout Redesign
Agenda Layout Redesign brings the existing Agenda page into the current FamilyBoard composition language established by Home and Mijn Pagina. The slice expands Agenda into a fuller desktop planning surface, tightens the page gap and filter row, enlarges Month planning cells, stretches Week/List workspaces, and strengthens Today/upcoming hierarchy while preserving Month, Week, List, source filtering, event creation, editing, deletion, navigation, dialogs, backend behavior, API contracts, database schema, and persistence. No new event types, workflows, data models, generated media, or binary assets were introduced.


### Completed Slice 2.72 — FamilyBoard UX Consistency Pass
FamilyBoard UX Consistency Pass aligns shared application framing after the Home, Mijn Pagina, and Agenda redesigns. Shared workspace page headers now use a warm domain-aware surface, widget hosts use a tighter rhythm, widget cards share a softer FamilyBoard card language, Settings action panels inherit the same rounded/tinted treatment, and the Tasks container is softened to match the broader product shell. Home, Mijn Pagina, Agenda, Taken, Boodschappen, Motivatie, and Settings were reviewed without introducing new features, workflows, backend behavior, API contracts, schema changes, generated media, or binary assets. Taken, Boodschappen, Motivatie, and Settings remain candidates for future dedicated redesign or polish slices.


### Completed Slice 2.73 — Tasks Layout Redesign
Tasks Layout Redesign brings Taken into the current FamilyBoard design language established by Home, Mijn Pagina, and Agenda. The page now uses a full-height task dashboard with Today as the primary work surface, upcoming planning as a secondary desktop grid, completed work as supporting context, tighter task-row density, clearer metadata chips, larger touch-friendly row actions, and warm domain-aware cards. Existing task creation, editing, completion, reopen/undo, recurring tasks, templates, weekly reset entry points, sorting/grouping, dialogs, backend behavior, API contracts, database schema, and persistence remain unchanged. No new features, workflows, generated media, or binary assets were introduced.


### Completed Slice 2.74 — Motivation Layout Redesign
Motivation Layout Redesign brings Motivatie into the current FamilyBoard design language established by Home, Mijn Pagina, Agenda, and Tasks. The page now uses a full-height warm dashboard surface, the family goal as the dominant emotional anchor, recent appreciation as the second priority, and celebrations/progress/memories as supporting context. Existing motivation models, family goals, personal goals, helpful moments, celebrations, memories, dialogs, navigation, backend behavior, API contracts, database schema, and persistence remain unchanged. No new rewards, achievements, gamification mechanics, workflows, generated media, or binary assets were introduced.

### Completed Slice 2.75 — Shopping Layout Redesign
Shopping Layout Redesign brings Boodschappen into the current FamilyBoard design language established by Home, Mijn Pagina, Agenda, Tasks, and Motivation. The page now behaves like a supermarket workspace with a compact Quick Add, full-width vertical store groups, readable active shopping rows, larger touch targets, quieter secondary actions, and calmer lifecycle/supporting panels. Existing shopping models, preferred-store grouping, quick add, completion, undo, delete, dialogs, backend behavior, API contracts, database schema, and persistence remain unchanged. No new shopping features, workflows, generated media, or binary assets were introduced.
Family Member Back Button Measured Layout Fix moves the detail-page back action into a reserved far-left workspace navigation slot after measuring the oversized Thomas detail control in VisualReview. The fix keeps a 44 px touch target, constrains the visible icon to 20 px, reserves equivalent non-interactive space on top-level pages, and avoids unrelated navigation redesign, backend/API/schema changes, marketing fixture/storyboard/recording changes, screenshots, movies, audio, WAV files, and binary artifacts.
Oversized Image/Icon Audit restores shared HomeOpsIcon containment after VisualReview measurements found the broad image-fill selector still inflated Family Member child/helper icons and Weekly Reset icons. The fix constrains HomeOpsIcon image and SVG assets to their owning 1em host, keeps explicit celebration/child/avatar component containers intentional, and avoids page-specific hacks, UI redesign, backend/API/schema changes, marketing fixture/storyboard/recording changes, screenshots, movies, audio, WAV files, and binary artifacts.
Button Text-Fit Audit improves shared FamilyBoard control sizing after VisualReview measurements found cramped labels in navigation pills, Agenda segmented/event actions, Family Member form actions, Shopping management actions, Motivation card actions, and Avatar Editor tiles. The fix raises shared padding/minimum sizing rules, preserves touch targets and existing layouts, and avoids copy changes, page-specific hacks, UI redesign, backend/API/schema changes, marketing fixture/storyboard/recording changes, screenshots, movies, audio, WAV files, and binary artifacts.
Button Design System centralizes the recently measured FamilyBoard button sizing values into shared CSS tokens for workspace navigation, admin navigation, reserved back/icon controls, compact actions, standard actions, segmented controls, inline action pills, dialog actions, card actions, and Avatar Editor tiles. Existing page selectors now consume the shared sizing system while preserving the passing text-fit measurements, touch targets, and visual language without copy changes, page redesign, backend/API/schema changes, marketing fixture/storyboard/recording changes, screenshots, movies, audio, WAV files, or binary artifacts.
Header Navigation Design-System Audit measures the workspace primary navigation against dialog, card, Weekly Reset, and Shopping actions, confirms the nav was visually undersized, and tunes only shared navigation/back sizing tokens to strengthen hierarchy while preserving navigation behavior, marketing assets, screenshots, movies, audio, WAV files, and binary artifact boundaries.
Agenda Compact Controls Audit resolves the remaining measured Agenda compact-control spacing risks by moving calendar day cells and selected-day add actions onto shared compact/inline design tokens while preserving Agenda behavior, marketing assets, screenshots, movies, audio, WAV files, and binary artifact boundaries.
### Marketing Production Engine Phase 7 — Metadata and Cleanup — Completed 2026-06-30
The Production Engine now generates structured metadata JSON in `/tmp/familyboard-marketing-metadata.json`, runs an explicit cleanup stage for temporary recording/audio/export/browser artifacts, exports validation MP4 output only to a temporary path, and removes the previous repository MP4 artifact so the implementation slice remains binary-free. The slice avoided production UI, storyboard, Recording Framework, Marketing Director, and Audio Framework changes.
### Marketing Production Engine Phase 8 — Timing Metadata — Completed 2026-06-30
Timing now belongs to Metadata: the Recording stage captures monotonic scene, transition, Chapter Card, and action timings during execution, the Metadata stage writes `/tmp/familyboard-marketing-timing.json` and references a summary from metadata JSON, and the production pipeline avoids a separate Timing stage while preserving source/UI/storyboard/framework boundaries and binary-free repository validation.
### Marketing Production Engine Phase 9 — Configuration — Completed 2026-06-30
Production behavior is now configuration-driven through separate production, timing, audio, export, and cleanup config modules. Runtime/storyboard identity, recording timing, audio orchestration, FFmpeg export, metadata paths, and cleanup policy can be tuned through configuration without storyboard, production UI, Recording Framework, Marketing Director, or Audio Framework changes.

### Completed Slice 2.76 — FamilyBoard Marketing Visual Polish
FamilyBoard Marketing Visual Polish completes a measured product-only visual pass for the marketing experience. Home family-strip avatars are more prominent without changing touch targets or Avatar V2 rendering, shared operational typography tokens improve wall-mounted tablet readability across Home, Agenda, Tasks, Shopping, Motivation, and Weekly Reset, and Shopping was verified as an already-correct grouped-shopping scene with calibrated timing. The slice preserved Production Engine, Recording Framework, Marketing Director, Audio Framework, storyboard order/timings, screenshots, movies, WebM, and WAV boundaries.

### Completed Slice 2.77 — Home Avatar Container Removal
Home Avatar Container Removal measured the VisualReview `visual-marketing-home` family strip, confirmed the decorative blue Home tile still came from Home family-chip styling, and removed that Home-only container treatment while enlarging the Avatar V2 portrait and preserving the measured four-member touch target. Family Member page Avatar V2, Avatar Editor, Avatar V2 renderer, storyboard, recording framework, production engine, screenshots, movies, MP4, WebM, and WAV artifacts remained unchanged.

### Completed Slice 2.78 — Marketing Recording Scene Entry Polish
Marketing Recording Scene Entry Polish hides fixture reset, reload, and real UI target navigation under a persistent scene-entry cover so validation recordings reveal each scene only after the target surface is verified and settled. Timing metadata now includes cover/reset/reload/navigation/verification/reveal/first-interaction markers plus Agenda dialog readability markers. The slice preserved Production Engine architecture, Recording Framework architecture, Marketing Director architecture, production UI, fixtures, storyboard order, screenshots, published movies, MP4/WebM/WAV artifacts, and unrelated product behavior.

### Completed Slice 2.79 — Home Portrait Identity Layout
Home Portrait Identity Layout replaces the Home family strip's chip-based member abstraction with a dedicated portrait presentation. The Home strip now renders `home-family-portrait` buttons with caption names, uses the available vertical space for a larger shared `FamilyAvatar`, preserves the measured touch target, and keeps four members fitting across the Home hero. Avatar V2 rendering, Family Member page presentation, production UI outside the Home family strip, storyboard, Production Engine, Recording Framework, Marketing Director, Audio Framework, screenshots, movies, MP4/WebM/WAV artifacts, and unrelated behavior remained unchanged.


### Completed Slice 2.80 — Marketing Video Tasks Storyboard Update
Marketing Video Tasks Storyboard Update revises the existing FamilyBoard executable marketing preview storyboard so the Tasks chapter showcases the redesigned Today-first task dashboard instead of the prior task-list flow. The slice preserves the canonical 9-scene narrative, fixtures, pacing totals, Marketing Director structure, and downstream Shopping/Motivation/Weekly Reset continuity while updating Tasks scene direction and recording actions for progressive task creation, visible desktop columns, cleaner scanning, and completed-task state validation. No new standalone Tasks video, product functionality, screenshots, movies, audio, or binary artifacts were introduced.

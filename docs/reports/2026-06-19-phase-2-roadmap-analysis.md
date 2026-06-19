# Phase 2 Roadmap Analysis

## Summary
Phase 2 should move HomeOps from validated demo and in-memory behavior into durable household data while preserving the accepted Workspace → Widget → Data Source architecture.

Recommended Phase 2 theme: **Durable Household Core**.

Recommended priority order:
1. Backend persistence foundation.
2. Shopping List persistence.
3. Widget/layout persistence.
4. Manual Events source.
5. Event creation/editing.
6. Backend-backed agenda layer settings and basic multi-device preference sync.
7. Household concepts.
8. Real Google Calendar read-only integration.
9. Sensor dashboard foundation.
10. Media/TV source foundation.

The first domains that should become persistent are Shopping List, widget/layout configuration, Manual Events, agenda layer preferences, and then Household ownership. Shopping List should be first because it is simple, high-value, and currently in-memory only.

## Current Architecture Assessment
The current architecture is ready for Phase 2 persistence work. Workspaces own widget instances, widget instances reference widget definitions, and data sources remain shared domain data rather than widget-specific models. This should remain the governing pattern for all Phase 2 slices.

Strengths:
- Workspace, widget instance, widget definition, and data source boundaries are clear.
- Widgets are presentation units, not domain data owners.
- The event source framework already supports read-only and writable sources.
- Normalized events are generic enough for manual events, birthdays, Google Calendar events, and future event-like sources.
- Agenda source filtering and layer settings already have a storage abstraction that can migrate from localStorage to backend persistence.
- The Google Calendar adapter pattern keeps provider-specific payloads behind normalization boundaries.
- Shopping List MVP has a small model and state-helper boundary suitable for replacement with API-backed persistence.

Current limitations:
- Backend domain APIs are not yet implemented.
- Shopping List state is in-memory and resets on reload.
- Workspace/widget layout is static client-side configuration.
- Agenda layer settings are browser-local only.
- Google Calendar is fake-provider-only and has no OAuth, token storage, API calls, sync, or error handling.
- Birthdays are generated from sample data and are not persisted.

Technical debt to address before adding many more features:
- Add a persistence foundation before implementing additional feature widgets.
- Decide and standardize the backend data access and migration pattern.
- Make NSwag/client generation part of the backend API workflow once real domain APIs are added.
- Replace demo runtime data with seed, fixture, or adapter-test data as domains become persistent.
- Avoid relying on client-generated timestamp IDs for persisted Shopping List records.

## Recommended Phase 2 Slices

### Slice 2.1 — Persistence Foundation
**Goal:** Establish the backend persistence baseline for PostgreSQL/Supabase-compatible storage.

**Why now:** Nearly every meaningful Phase 2 feature depends on durable storage.

**Dependencies:** ASP.NET Core API, Docker Compose PostgreSQL, PostgreSQL/Supabase decision, NSwag/OpenAPI foundation.

**Risks:** Data-access choices may become too broad; migration conventions need to stay simple; Supabase compatibility should use standard PostgreSQL behavior unless a later slice explicitly adopts Supabase-specific services.

**Recommended model:** GPT-5.4.

### Slice 2.2 — Shopping List Persistence
**Goal:** Persist Shopping List items through backend APIs and PostgreSQL while keeping the widget contract stable.

**Why now:** Shopping List is simple, user-visible, already validated, and currently loses data on reload.

**Dependencies:** Slice 2.1 Persistence Foundation; existing shopping list model and widget behavior.

**Risks:** Avoid widget-specific backend modeling; defer offline sync and conflict handling; use a clear temporary ownership strategy if Household is not introduced yet.

**Recommended model:** GPT-5.4.

### Slice 2.3 — Widget/Layout Persistence
**Goal:** Persist workspace widget instances, order/layout, and instance settings.

**Why now:** Layout is widget-driven by architecture, but current workspace configuration is static client data.

**Dependencies:** Slice 2.1 Persistence Foundation; preferably Slice 2.2 to prove the API/data-access pattern first.

**Risks:** Persisting too much catalog data too early could make widget definitions harder to evolve; drag/drop editing should remain a separate future slice.

**Recommended model:** GPT-5.4.

### Slice 2.4 — Manual Events Source
**Goal:** Add a writable HomeOps-owned event source backed by persistence and normalized event APIs.

**Why now:** Manual Events unlock real agenda utility without OAuth complexity.

**Dependencies:** Slice 2.1 Persistence Foundation; Event Source Framework; Agenda Widget MVP.

**Risks:** Do not make agenda-specific event models; test all-day and timed semantics carefully; keep source capability and editable behavior consistent.

**Recommended model:** GPT-5.4.

### Slice 2.5 — Event Creation/Editing
**Goal:** Add UI and API flows for creating, editing, and deleting writable Manual Events.

**Why now:** Editing should target a persisted writable source after Manual Events exist.

**Dependencies:** Slice 2.4 Manual Events Source; generated or manually wired API contracts; event validation rules.

**Risks:** Recurring event editing should remain out of scope; read-only sources must not become editable; keep UI MVP-sized.

**Recommended model:** GPT-5.4.

### Slice 2.6 — Backend-Backed Agenda Layer Settings / Multi-Device Preference Sync
**Goal:** Move agenda layer preferences from localStorage to backend preference persistence while preserving the existing hook-shaped consumer boundary.

**Why now:** The local storage abstraction already exists, and backend preferences are needed for basic multi-device consistency.

**Dependencies:** Slice 2.1 Persistence Foundation; backend event source identifiers; preferably Slice 2.4 Manual Events Source.

**Risks:** Settings schema migrations need explicit handling; keep real-time sync and offline support out of scope; ownership may need a temporary default household/profile until Household concepts are added.

**Recommended model:** GPT-5.4.

### Slice 2.7 — Household Concepts
**Goal:** Introduce the minimal Household ownership boundary for shared data, preferences, layouts, and future users.

**Why now:** Household ownership is needed before serious sharing, multi-device behavior, and external account integrations become complex.

**Dependencies:** Slice 2.1 Persistence Foundation; at least one persisted domain; decision on whether Supabase auth is in or out of scope.

**Risks:** This can expand into auth, invites, roles, permissions, and profiles. Keep it to ownership boundaries unless explicitly scoped.

**Recommended model:** GPT-5.4, or GPT-5.5 if it includes Supabase auth or cross-domain ownership migration.

### Slice 2.8 — Real Google Calendar Read-Only Integration
**Goal:** Replace the fake Google Calendar provider with a real read-only integration behind the existing adapter/provider boundary.

**Why now:** It becomes valuable after HomeOps has persistence, ownership, and normalized event consumption stabilized.

**Dependencies:** Persistence Foundation; household/user/account ownership; secure token storage decision; existing Google Calendar adapter boundary.

**Risks:** OAuth and token storage are security-sensitive; Google API rate limits and incremental sync require robust handling; editing Google events should remain out of scope.

**Recommended model:** GPT-5.5.

### Slice 2.9 — Sensor Dashboard Foundation
**Goal:** Introduce generic sensor source/readout contracts and a simple House workspace dashboard widget.

**Why now:** The House workspace exists and sensor display naturally fits the shared data-source/widget presentation model.

**Dependencies:** Workspace Framework; Widget Framework; persisted layout if configurable placement is included.

**Risks:** Real-time telemetry, history, and Home Assistant integration are significantly larger than a display foundation; keep the first slice demo/provider-backed unless explicitly scoped otherwise.

**Recommended model:** GPT-5.4 for demo/current readings; GPT-5.5 for real Home Assistant, historical telemetry, or live updates.

### Slice 2.10 — Media/TV Source Foundation
**Goal:** Introduce a media/TV source model and simple Media workspace widget.

**Why now:** The Media workspace exists but remains placeholder-only, and display-only media or TV data can fit the current architecture.

**Dependencies:** Workspace Framework; Widget Framework; Event Source Framework if TV schedule entries are modeled as normalized events.

**Risks:** Media integrations vary widely; playback control and provider integrations are much larger than display-only data; TV schedule APIs may require licensing/provider decisions.

**Recommended model:** GPT-5.4 for demo/display foundation; GPT-5.5 for external provider integration or playback control.

## Risks
Cross-slice risks:
- Persistence ownership ambiguity: Shopping, layout, events, preferences, and integrations need a clear ownership boundary.
- Demo-to-real transition risk: deterministic demo data should become seed data, fixtures, or adapter tests as runtime domains become persistent.
- Contract drift: frontend model mirrors should be reconciled with NSwag-generated or API-backed contracts once domain APIs exist.
- Scope expansion: Household, Google Calendar, sensors, and media can each grow into authentication, sync, external integrations, and device control.
- Date/time complexity: Manual events, birthdays, Google Calendar, and TV schedules all require consistent all-day/timed semantics.
- Multi-device synchronization: API-backed persistence provides basic consistency, but real-time sync, offline support, and conflict resolution should remain later slices.

Demo dataset evolution:
- Shopping demo data should become local development seed data or test fixtures.
- Agenda demo data should remain deterministic validation scaffolding until backend event APIs are active, then move toward fixtures and adapter tests.
- Birthday sample data should remain until birthday management and persistence are explicitly added.
- Google fake payloads should remain as deterministic adapter tests after real integration is introduced.
- Sensor and media demos should be added only with their respective source foundations.

Features that naturally fit the current architecture:
- Shopping List persistence.
- Manual Events.
- Event creation/editing for writable sources.
- Birthday management.
- Backend-backed layer settings.
- Widget/layout persistence.
- Sensor dashboard widgets.
- TV schedule display as event-like source data.
- Media status widgets.
- Multiple agenda widgets with different instance settings.

Features requiring significant architectural work:
- Real Google Calendar OAuth/token lifecycle and sync.
- Multi-household/user authentication, membership, roles, and invites.
- Real-time multi-device synchronization.
- Offline-first conflict resolution.
- Home Assistant live integration with history or streaming.
- Media playback control, device discovery, or provider-specific command APIs.
- Cross-provider event editing.
- Complex recurring event editing.

## Suggested Model Per Slice
| Slice | Name | Recommended model |
| --- | --- | --- |
| 2.1 | Persistence Foundation | GPT-5.4 |
| 2.2 | Shopping List Persistence | GPT-5.4 |
| 2.3 | Widget/Layout Persistence | GPT-5.4 |
| 2.4 | Manual Events Source | GPT-5.4 |
| 2.5 | Event Creation/Editing | GPT-5.4 |
| 2.6 | Backend-Backed Agenda Layer Settings / Multi-Device Preference Sync | GPT-5.4 |
| 2.7 | Household Concepts | GPT-5.4, or GPT-5.5 if Supabase auth/cross-domain ownership migration is included |
| 2.8 | Real Google Calendar Read-Only Integration | GPT-5.5 |
| 2.9 | Sensor Dashboard Foundation | GPT-5.4, or GPT-5.5 for real Home Assistant/history/live updates |
| 2.10 | Media/TV Source Foundation | GPT-5.4, or GPT-5.5 for external provider integration/playback control |

## Next Prompt Context
Use this prompt for the next implementation run:

> Proceed with Phase 2 Slice 2.1 — Persistence Foundation only.
>
> Constraints:
> - Follow AGENTS.md, CLAUDE.md, `.github/copilot-instructions.md`, `docs/architecture.md`, `docs/roadmap/phase-1.md`, `docs/state/current-state.md`, and the Phase 1 validation report.
> - Preserve the accepted architecture: ASP.NET Core, React + TypeScript + Vite, PostgreSQL/Supabase-compatible PostgreSQL, Docker Compose, NSwag, modular monolith, Workspace → Widget → Data Source.
> - Implement only the persistence foundation.
> - Do not implement Shopping List persistence, widget/layout persistence, manual events, Google Calendar integration, authentication, sensors, or media features in this slice.
> - Add minimal backend persistence configuration, migration infrastructure, and validation/tests needed to support later domain slices.
> - Update `docs/roadmap/phase-1.md` and `docs/state/current-state.md` only if implementation work is performed, following repository guidance.
>
> Recommended model: GPT-5.4.

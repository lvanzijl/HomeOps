# Current State

## Current Phase
Phase 2 — Durable Household Core

## Current Slice
Slice 2.10 Calendar Portability UX and Pre-Restore Export — Completed

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

## Next Slice
Proceed with Real Google Calendar Read-Only Integration only after preserving HomeOps Calendar source-of-truth and local-only portability boundaries.

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
- Calendar restore is local-only and full restore only; validation and local pre-restore snapshot creation run before replacement, while selective import, merge import, remote restore, and conflict resolution are not implemented.
- EventOccurrence is projection-only Agenda data and is not canonical export data.
- Google Drive is a future export destination only; Google Calendar, ICS, recurrence, and EventException runtime behavior remain out of scope.
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
- Automatic pre-restore export is implemented as a local canonical JSON safety snapshot before destructive replacement.
- Settings exposes a minimal local calendar export/restore UI with version, timestamp, validation feedback, friendly errors, and an explicit replacement warning.

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
- The Agenda Widget loads persisted HomeOps Calendar events through the generated NSwag client and preserves birthday source compatibility, source filtering, week view, and months view.
- A minimal embedded Agenda form validates event create, update, and delete; no dedicated event management page, recurring events, Google Calendar integration, OAuth, authentication, or notifications have been introduced.

# Current State

## Current Phase
Phase 2 — Durable Household Core

## Current Slice
Slice 2.5 Event Editing UX Hardening — Completed

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

## Next Slice
Proceed with Slice 2.6 Real Google Calendar Read-Only Integration.

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

## Phase 2 Event Editing UX Hardening
- Manual Events can be created, edited, and deleted from the embedded Agenda experience.
- The UI validates required titles, timed event end times, and date ranges before submission.
- Backend Manual Event APIs return consistent validation problem responses for missing titles and invalid date ranges.
- All-day events use date inputs; timed events use datetime inputs.
- Week View, Months View, birthday visibility, manual event visibility, source filtering, and device-specific layer settings remain preserved.
- No recurring events, dedicated event management page, Google Calendar integration, OAuth, authentication, notifications, or offline-first synchronization has been introduced.

## Phase 2 Backend-Backed Agenda Layer Settings
- Agenda layer settings are device-specific and are not household-scoped or user-scoped.
- The frontend stores only a generated local device key and sends it through the `X-HomeOps-Device-Key` API header.
- Week View and Months View source selections remain independent.
- Unknown or newly added event sources default to enabled when no saved setting exists.
- No authentication, users, profiles, device registration, device management, or offline-first synchronization has been introduced.

## Phase 2 Manual Events Source
- Manual Events are the first persisted writable HomeOps-owned event source.
- The backend stores household-owned event sources and manual events, then normalizes Manual Events into the existing normalized event model used by the Agenda.
- Deterministic seed data includes Dentist Appointment, Parent Evening, Vacation, and Put Bins Outside.
- Minimal event APIs provide event source retrieval plus manual event get, create, update, and delete.
- The Agenda Widget loads persisted Manual Events through the generated NSwag client and preserves birthday source compatibility, source filtering, week view, and months view.
- A minimal embedded Agenda form validates event create, update, and delete; no dedicated event management page, recurring events, Google Calendar integration, OAuth, authentication, or notifications have been introduced.

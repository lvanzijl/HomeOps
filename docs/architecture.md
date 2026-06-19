# HomeOps Architecture

## Project Vision
HomeOps is a household information hub organized around workspaces, widget instances, widget definitions, and data sources. The product will present shared household information without binding data models to individual widgets.

## Workspace → Widget → Data Source Architecture
- **Workspace**: A user-facing surface that owns layout and contains widget instances.
- **Widget Instance**: A placement of a widget definition in a workspace, including layout and instance configuration.
- **Widget Definition**: A reusable presentation definition that describes how a widget is rendered.
- **Data Source**: A shared source of domain data that future widgets can consume.

Widgets are presentation units. Data models must remain shared and not widget-specific. Layout is widget-driven, and future widgets may consume shared data models.

## Workspace Framework
The initial workspace framework defines Home, House, Media, and Settings as top-level navigation units in the client. The active workspace is tracked in the workspace shell. The shell keeps navigation controls, workspace definitions, and widget hosting separate so future swipe navigation can be added without changing the workspace model.

## Widget Framework
- **Widget Definition**: A reusable presentation registration with an id, type, title, and default settings.
- **Widget Instance**: A workspace-owned placement reference with an id, widget definition reference, title, and instance settings.
- **Widget Renderer**: A central client mechanism that resolves widget definition types to widget components so future widget types can be added without changing workspace rendering logic.

Workspaces host widget instances. Widget instances are rendered through the widget renderer, and placeholder widgets currently provide architectural validation only.


## Persistence Foundation
HomeOps uses EF Core as the application persistence boundary and PostgreSQL as the database. The local development database is provided by Docker Compose, while hosted deployment targets Supabase-compatible PostgreSQL by staying on standard PostgreSQL tables, keys, indexes, and relational constraints. Migrations are maintained in the API project so schema changes remain part of the modular monolith.

Persistence is household-owned. Phase 2 introduces a single seeded household record as the ownership boundary for durable data, without adding household management, users, profiles, roles, invites, authentication, or multi-household support.

OpenAPI remains the API contract source. NSwag generates the frontend TypeScript client from the ASP.NET Core OpenAPI document, and frontend API consumption should use that generated client rather than hand-written endpoint clients when NSwag generation is available.

HomeOps is offline-tolerant, not offline-first. Widgets may show loading and error states when API calls fail, but this slice does not add local mutation queues, conflict resolution, background sync, or offline-first storage.


## Workspace Layout Persistence
Workspace layout persistence stores household-owned dashboard configuration separately from the application-owned widget catalog. The widget catalog defines which widget definitions are available and how each widget type renders. Persisted workspace layouts only determine which catalog widgets appear in a workspace, their order, placement metadata, size metadata, and simple JSON instance configuration.

Default workspace layouts are seeded for Home, House, Media, and Settings to match the validated dashboard experience. The frontend loads layouts through the generated NSwag client and falls back to the default layout if the API does not return a usable layout, preserving offline-tolerant behavior without adding offline-first synchronization. Runtime creation of arbitrary widget types is not supported; placements that do not match the application-owned catalog are ignored by the client.

## Event Source Framework
Event sources are framework-level ownership records for future normalized events. An event source has a stable source id, source name, source type, enabled flag, read-only or writable capability, visibility metadata, color metadata, and optional external source identifier.

Normalized events are generic records owned by an event source. They include source ownership, optional external event identifiers, timing fields, title, optional descriptive metadata, and an editable flag. The model is intentionally not tied to agenda, birthday, TV, or other widget-specific data shapes. Read-only sources represent data HomeOps can display but not modify; writable sources represent data HomeOps may edit in a future slice.


## Manual Events Source
Manual Events are the first persisted writable event source owned by HomeOps. The backend stores household-owned `EventSource` records and `ManualEvent` records in PostgreSQL through EF Core, then normalizes Manual Events into the existing `NormalizedEvent` contract before the Agenda consumes them.

Manual Events use the existing single seeded household boundary and do not add household management, users, roles, invites, authentication, or multi-household behavior. The Manual Events API exposes minimal event source retrieval plus event get, create, update, and delete operations for the writable HomeOps-owned source.

Writable and read-only event sources remain distinct. Manual Events are writable; Birthday, school holiday, media, and Google Calendar-style sources remain read-only display inputs in this slice. The Agenda combines persisted Manual Events with the existing read-only birthday/demo sources, preserving source filtering, week view, and months view behavior.

Recurring events are intentionally out of scope. Manual Events persist concrete single event occurrences only, which keeps the storage model and normalization path simple until recurring rule semantics are explicitly designed.

## Agenda Widget MVP
The Agenda Widget is the first widget-framework consumer. It renders through the central widget renderer and now loads persisted Manual Events through the generated NSwag client while retaining read-only birthday/demo sources as validation scaffolding. The remaining demo dataset is centrally defined, reusable, and covers read-only sources, colors, all-day and timed events, current-week events, next-month events, and forward-looking events multiple months ahead.

Agenda source filtering remains local browser state scoped to the widget. Multiple sources can be enabled or disabled, and the same filtered event set drives both views. Week View groups upcoming events by day from the deterministic demo anchor date. Months View groups events chronologically by month to validate the intended forward-looking glass board concept.


## Event Editing Workflow
Manual Event editing remains embedded in the Agenda experience. The widget supports creating, editing, and deleting events for the writable Manual Events source only, while read-only sources such as Birthdays remain display-only.

Manual Event validation is shared between the UI and API. Titles are required, timed events require an end time in the UI, and submitted end values must be on or after the start value. Backend validation returns consistent validation problem responses for missing titles and invalid date ranges.

All-day events are edited with date inputs and are submitted as midnight UTC-local date values for concrete single occurrences. Timed events are edited with datetime inputs. Recurring events, dedicated event management screens, and complex form frameworks remain out of scope. Errors are shown inline in the Agenda widget and failed mutations leave the current event list intact.

## Layer Settings Persistence
Agenda layer settings are device-specific preferences persisted by the backend. Week View and Months View maintain independent enabled event source selections so changing one view does not modify the other. The settings model stores one row per device key, view type, and event source id, and it is intentionally not household-scoped or user-scoped.

The frontend creates the smallest possible device identity by generating a local device key and storing only that identifier in browser storage. The device key is sent to the Agenda Layer Settings APIs through the `X-HomeOps-Device-Key` header. This does not introduce login, accounts, profiles, device registration, enrollment, or device management.

Unknown or newly added event sources default to enabled when no saved setting exists for the current device/view. Existing saved source preferences remain valid as sources are added or removed. The layer settings abstraction remains replaceable: UI components consume a hook and API mapping functions rather than directly owning storage, persistence, or device identity details.

## Event Source Adapter Pattern
Event source adapters translate provider-specific data into HomeOps contracts before widgets receive it. `IEventSourceAdapter` exposes normalized `EventSource` metadata and normalized events, while provider-specific payloads stay inside adapter implementations.

The Google Calendar Adapter foundation uses fake Google Calendar payloads and does not call Google services, require credentials, implement OAuth, or persist data. Its role is to demonstrate source ownership, Google Calendar source metadata, read-only behavior, all-day and timed event normalization, and the normalization pipeline from Google-specific payloads into `EventSource` and `NormalizedEvent`. Agenda widgets continue to consume normalized events rather than Google Calendar models.

## Birthday Source
Birthdays are modeled as an event source and normalized into all-day `NormalizedEvent` records before any widget consumes them. The Birthday Source foundation uses sample birthday records, a source adapter, and an 18-month generation horizon from the configured anchor date so the generated dataset includes upcoming birthdays, later-year birthdays, and next-year occurrences without introducing persistence or management screens.

Annual recurrence is generated by creating one all-day occurrence per birthday per year within the horizon. Feb 29 birthdays are observed on Feb 28 in non-leap years. Birthday events are not editable in this slice and the client treats the Birthday Source as read-only display data until a future birthday management slice explicitly changes that behavior. Agenda filtering treats birthdays as a separate event source like any other normalized source.

## Lists Domain
Lists are the first production-grade persistent domain. The generic Lists domain models durable household-owned lists and list items independently of any widget. A List has a stable id, name, created/updated timestamps, and household ownership. A ListItem has a stable id, parent list id, text, completion state, and created/updated timestamps.

Shopping is now one seeded example list in the generic Lists domain rather than a widget-specific data model. Development seed data creates Shopping and Vacation Packing lists with representative items. The Shopping List Widget may retain its current presentation name, but it consumes the persisted Lists APIs through the generated NSwag client and no longer owns in-memory runtime data.

The Lists APIs are intentionally minimal: get lists, get list by id, create list, add item, toggle item completion, and remove item. Additional list management, sharing, offline-first synchronization, and multi-household behavior are intentionally out of scope for this slice.

## Technology Stack
- Backend: ASP.NET Core with C#.
- Frontend: React, TypeScript, and Vite.
- Database: PostgreSQL.
- Development database: Docker Compose PostgreSQL.
- API contract generation: OpenAPI and NSwag.
- Architecture style: Modular monolith.

## Deployment Approach
The initial repository targets local development with a single ASP.NET Core API, a Vite client, and PostgreSQL through Docker Compose. Deployment remains intentionally simple and does not introduce Kubernetes, microservices, or distributed architecture.

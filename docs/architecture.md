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

## Event Source Framework
Event sources are framework-level ownership records for future normalized events. An event source has a stable source id, source name, source type, enabled flag, read-only or writable capability, visibility metadata, color metadata, and optional external source identifier.

Normalized events are generic records owned by an event source. They include source ownership, optional external event identifiers, timing fields, title, optional descriptive metadata, and an editable flag. The model is intentionally not tied to agenda, birthday, TV, or other widget-specific data shapes. Read-only sources represent data HomeOps can display but not modify; writable sources represent data HomeOps may edit in a future slice.

## Agenda Widget MVP
The Agenda Widget is the first widget-framework consumer. It renders through the central widget renderer and uses deterministic demo agenda data rather than persistence or integrations. The demo dataset is centrally defined, reusable, and covers multiple sources, colors, writable and read-only sources, all-day and timed events, same-day events, current-week events, next-month events, and forward-looking events multiple months ahead.

Agenda source filtering is temporary in-memory state scoped to the widget. Multiple sources can be enabled or disabled, and the same filtered event set drives both views. Week View groups upcoming events by day from the deterministic demo anchor date. Months View groups events chronologically by month to validate the intended forward-looking glass board concept.

## Layer Settings Persistence
Agenda layer settings are local user preferences scoped to the browser. Week View and Months View each maintain independent enabled event source selections so changing one view does not modify the other. A small persistence abstraction owns serialization, deserialization, corrupt data recovery, and defaulting for newly added event sources; UI components consume the hook rather than accessing localStorage directly.

The current implementation persists only to browser localStorage and does not create server, shared, household, PostgreSQL, or database persistence. The abstraction keeps a future backend migration path open by isolating storage access behind load/save functions and a hook-shaped consumer API.

## Event Source Adapter Pattern
Event source adapters translate provider-specific data into HomeOps contracts before widgets receive it. `IEventSourceAdapter` exposes normalized `EventSource` metadata and normalized events, while provider-specific payloads stay inside adapter implementations.

The Google Calendar Adapter foundation uses fake Google Calendar payloads and does not call Google services, require credentials, implement OAuth, or persist data. Its role is to demonstrate source ownership, Google Calendar source metadata, read-only behavior, all-day and timed event normalization, and the normalization pipeline from Google-specific payloads into `EventSource` and `NormalizedEvent`. Agenda widgets continue to consume normalized events rather than Google Calendar models.

## Birthday Source
Birthdays are modeled as an event source and normalized into all-day `NormalizedEvent` records before any widget consumes them. The Birthday Source foundation uses sample birthday records, a source adapter, and an 18-month generation horizon from the configured anchor date so the generated dataset includes upcoming birthdays, later-year birthdays, and next-year occurrences without introducing persistence or management screens.

Annual recurrence is generated by creating one all-day occurrence per birthday per year within the horizon. Feb 29 birthdays are observed on Feb 28 in non-leap years. Birthday events are not editable in this slice even though the source is marked conceptually writable for future birthday management. Agenda filtering treats birthdays as a separate event source like any other normalized source.

## Shopping List MVP
The Shopping List Widget validates widget architecture, user interaction, in-memory state management, and future extensibility without introducing backend APIs or persistence. Shopping list data is represented by simple item models with id, label, and completion state. Demo items are centrally defined and include active and completed items.

The widget renders through the central widget renderer and supports add, complete/incomplete toggle, and remove operations using client in-memory state only. Future persistence can be introduced by replacing the state helper boundary with a persistence-backed service while keeping the widget contract and model shape stable.

## Technology Stack
- Backend: ASP.NET Core with C#.
- Frontend: React, TypeScript, and Vite.
- Database: PostgreSQL.
- Development database: Docker Compose PostgreSQL.
- API contract generation: OpenAPI and NSwag.
- Architecture style: Modular monolith.

## Deployment Approach
The initial repository targets local development with a single ASP.NET Core API, a Vite client, and PostgreSQL through Docker Compose. Deployment remains intentionally simple and does not introduce Kubernetes, microservices, or distributed architecture.

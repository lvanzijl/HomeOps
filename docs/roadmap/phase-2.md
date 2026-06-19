# Phase 2 Roadmap

| Slice | Name | Status |
| --- | --- | --- |
| 2.1 | Durable Lists Foundation | Completed |
| 2.2 | Widget/Layout Persistence | Completed |
| 2.3 | Manual Events Source | Completed |
| 2.4 | Backend-Backed Agenda Layer Settings | Completed |
| 2.5 | Event Editing UX Hardening | Completed |
| 2.6 | Real Google Calendar Read-Only Integration | Recommended next |
| 2.7 | Sensor Dashboard Foundation | Planned |
| 2.8 | Media/TV Source Foundation | Planned |

Phase 2 theme: Durable Household Core.

## Completed Slice 2.1 — Durable Lists Foundation
Durable Lists Foundation combines the persistence foundation, generic Lists domain, deterministic development seed data, generated NSwag client workflow, and Shopping List widget conversion from in-memory state to API-backed persisted list data.

## Completed Slice 2.2 — Widget/Layout Persistence
Widget/Layout Persistence adds household-owned workspace layout storage, seeded default layouts that match the validated dashboard, minimal get/save layout APIs, generated NSwag client support, and frontend layout loading with default fallback. The widget catalog remains application-owned; persisted layout records only choose catalog widgets and their placement metadata.

## Completed Slice 2.3 — Manual Events Source
Manual Events Source adds the first writable HomeOps-owned event source with household-owned event persistence, deterministic seed data, minimal event source and event CRUD APIs, normalization into the existing Agenda event model, generated NSwag client support, and embedded Agenda validation UI for retrieval, create, update, and delete.

## Completed Slice 2.4 — Backend-Backed Agenda Layer Settings
Backend-Backed Agenda Layer Settings adds device-scoped persistence for Agenda source visibility, a generated local device key sent through API headers, independent Week and Months settings, minimal get/save APIs, generated NSwag client support, and frontend replacement of browser-only layer settings storage.

## Completed Slice 2.5 — Event Editing UX Hardening
Event Editing UX Hardening improves the embedded Agenda Manual Events form with create/edit/delete usability, all-day and timed input handling, frontend validation, backend validation problem responses, loading/error states, and regression coverage while preserving existing Agenda views and sources.

## Recommended Next Slice
Proceed with Real Google Calendar Read-Only Integration only. Keep the slice focused on read-only calendar import through the existing adapter foundation without OAuth expansion beyond what the slice explicitly requires, authentication, sensors, media, notifications, recurring event editing, or offline-first synchronization.

# Architecture Realignment Analysis

## Summary
This is an analysis-only report. No implementation, code changes, tests, migrations, or database changes were performed. Preflight `dotnet --version` returned `10.0.301`.

HomeOps has moved from a demo-oriented widget architecture into a durable household core. The original architectural assumption was that HomeOps would present and classify household information from shared data sources, with calendars and shopping lists likely remaining external while HomeOps persisted only app-owned household domains such as chores and gamification. The current implementation has already made PostgreSQL the primary durable store for generic Lists, workspace layouts, Agenda layer settings, and Manual Events.

The implemented direction still aligns with the modular-monolith, widget-as-presentation, shared-data-source architecture, but it changes the storage posture. PostgreSQL is no longer only a future chores/gamification store; it is now the HomeOps-owned household state store. That appears appropriate for layouts, settings, app-specific classifications, and generic household lists, but it creates explicit decision points for calendars and shopping lists: should HomeOps own the data, or should it remain a presentation/classification layer over external systems?

The strongest emerging long-term architecture appears to be:

- PostgreSQL remains the canonical HomeOps state store for HomeOps-owned domains: layouts, settings, local preferences, app-specific metadata, classifications, and any lists/chores/gamification that are intentionally HomeOps-owned.
- External systems can remain canonical for domains where portability, multi-user mobile UX, or ecosystem integration matters more than HomeOps-native editing.
- Google Calendar, if chosen as source of truth, should be treated as an external read-only or limited-write event provider behind the existing adapter/normalization boundary, while HomeOps stores only source configuration, prefix/layer mapping, sync cursors/cache if needed, and user preferences.
- All persisted HomeOps-owned domains now need import/export capability as a first-class architecture requirement.
- Google Drive should be viewed primarily as a backup/export destination, not as the transactional storage engine or synchronization mechanism.
- Supabase does not currently appear architecturally essential beyond being a PostgreSQL-compatible hosting option. PostgreSQL alone is sufficient for the implemented architecture, and Supabase-specific services should remain optional unless a future explicit decision adopts them.

## Original Assumptions

### Confirmed from repository guidance and historical reports
- HomeOps was intended as a household information hub organized around workspaces, widget instances, widget definitions, and shared data sources.
- Widgets were assumed to be presentation units rather than owners of widget-specific data models.
- The technical stack was fixed around ASP.NET Core, React + TypeScript + Vite, PostgreSQL, Docker Compose for development, OpenAPI, NSwag, and a modular monolith.
- External integrations such as Google Calendar were originally deferred, with the Google Calendar adapter implemented only against fake payloads and without OAuth, credentials, real API calls, token storage, or persistence.
- Earlier roadmap analysis treated persistence as needed for durable household data, but also called out Google Calendar OAuth/token lifecycle and sync as a larger future architectural concern.
- Supabase was treated as a PostgreSQL-compatible hosted deployment target, not as a required application platform.

### User-provided assumptions for this analysis
- Original direction: calendars in external systems.
- Original direction: shopping lists in external systems.
- Original direction: chores and gamification in PostgreSQL.
- New requirement: all persisted HomeOps domains should support import and export.
- Current preferred security direction: LAN-first, self-hosted, no authentication initially, no custom authentication, and external access solved later through proven solutions.

### New assumptions introduced by this analysis
- If Google Calendar becomes canonical, HomeOps can infer event type from human-readable title prefixes such as `Birthday: Oma`, `Holiday: France`, and `School: School Trip`.
- Prefix mappings would drive icons, colors, and layers, while HomeOps would not store per-event type metadata.
- Google Drive is being considered as storage, backup/export destination, or synchronization mechanism, but no implementation currently confirms any of those roles.

## Current Implementation State

### Confirmed implemented behavior
- PostgreSQL/EF Core is the application persistence boundary, with migrations maintained in the API project.
- A single seeded household record is the ownership boundary for durable data; household management, users, profiles, roles, invites, authentication, and multi-household support are not implemented.
- Generic Lists are persisted in PostgreSQL. Shopping is a seeded example list in that generic Lists domain rather than a widget-specific model.
- Workspace layouts are persisted in PostgreSQL as household-owned dashboard configuration, while the widget catalog remains application-owned.
- Manual Events are persisted in PostgreSQL as the first writable HomeOps-owned event source, then normalized into the Agenda event model.
- Agenda layer settings are persisted in PostgreSQL per generated local device key and view type, not per user or household.
- Google Calendar currently exists only as a fake-provider adapter foundation. It is read-only, does not call Google services, and does not implement OAuth or token storage.
- Birthdays are currently sample/generated read-only events, not persisted birthday management data.
- The Agenda combines persisted Manual Events with read-only birthday/demo sources.
- Manual Event editing exists inside the Agenda widget and supports create, update, delete, all-day/timed inputs, and validation for concrete single event occurrences.

### User decisions already made or strongly reflected in docs
- Modular monolith remains the architecture.
- PostgreSQL remains the database.
- Widgets remain presentation units.
- Data models must not be widget-specific.
- Layout is widget-driven.
- Workspaces contain widget instances, and widget instances reference widget definitions.
- API consumption should use generated NSwag clients when available.
- HomeOps is offline-tolerant, not offline-first.
- Authentication, multi-household behavior, device registration, real-time sync, and offline conflict resolution remain out of scope for current implementation.

### Open questions
- Is HomeOps intended to own calendar data long-term, or only present/classify external calendar data?
- Are shopping lists intended to remain HomeOps-owned after the durable Lists foundation, or should a later external list provider become canonical?
- Should Manual Events remain a permanent HomeOps-owned event source, or should they become transitional/redundant after real Google Calendar integration?
- What import/export formats, schedules, and restore guarantees are expected for each persisted domain?

## Calendar Strategy Analysis

### Option A — HomeOps Agenda is source of truth

#### What it means
HomeOps owns calendar events in PostgreSQL. Manual Events evolve from the current concrete single-occurrence model into the canonical household calendar model. External calendars, if added, are imports, display-only overlays, backup targets, or optional sync partners rather than the authority.

#### Alignment with current implementation
This option aligns strongly with current Manual Events implementation. HomeOps already persists event sources and manual events, marks Manual Events as writable, normalizes them into Agenda events, and exposes CRUD APIs. The current embedded editing workflow is a small first version of a HomeOps-owned agenda.

#### Complexity
- Lower short-term complexity because the app already has persistence, CRUD, validation, and normalized Agenda consumption.
- Higher medium-term complexity if HomeOps must support recurrence rules, reminders, attendee semantics, calendar sharing, mobile notifications, invitations, time-zone edge cases, conflict resolution, and export/import compatibility.
- HomeOps would need to recreate many calendar-product behaviors that Google Calendar already provides.

#### User experience
- Strong integrated HomeOps UX: edits happen directly where the events are viewed.
- Works without external credentials and fits LAN-first self-hosting.
- Risks becoming a weaker standalone calendar than users already have on phones, watches, desktop calendars, and family sharing tools.

#### Data ownership
- Clear HomeOps ownership. PostgreSQL backups and future import/export define the authoritative data lifecycle.
- The household is responsible for backup/restore and portability.

#### Portability
- Requires explicit export formats. iCalendar export/import would likely be necessary for calendar portability, even if PostgreSQL remains canonical.
- Recurrence and timezone fidelity become important portability constraints.

#### Future maintenance
- Maintenance burden grows quickly as calendar semantics expand.
- Requires long-term schema evolution and data migration planning.

#### Interaction with existing Manual Events
- Manual Events are permanent and should be renamed/conceptually promoted from “Manual Events” to an app-owned calendar/event source only if this direction is chosen.
- Existing Manual Events would be early canonical data and need migration paths for recurrence, calendar grouping, richer metadata, and import/export.

### Option B — Google Calendar is source of truth; HomeOps is presentation/classification layer

#### What it means
Google Calendar owns event data. HomeOps reads events, normalizes them into the existing Agenda contract, and classifies them through title prefixes. Google Calendar event titles remain human-readable, for example `Birthday: Oma`, `Holiday: France`, or `School: School Trip`. HomeOps maps prefixes to icons, colors, and layers. HomeOps does not store per-event type metadata.

#### Alignment with current implementation
This option aligns with the existing event adapter and normalized event design, but conflicts with the current trajectory of Manual Events as a writable HomeOps-owned source. The Google Calendar adapter already keeps provider payloads behind an adapter boundary, and the Agenda already consumes normalized events rather than provider-specific models. However, the current Manual Events CRUD implementation becomes either a separate local event source or a transitional editing facility rather than the canonical calendar path.

#### Complexity
- Lower product complexity for full calendar semantics because Google Calendar owns recurrence, mobile editing, notifications, sharing, and cross-device UX.
- Higher integration complexity because real Google Calendar needs OAuth or an alternative credential approach, token storage, API failure handling, rate-limit handling, incremental sync/caching decisions, and provider-specific edge-case handling.
- Prefix-based classification is simpler than storing per-event metadata, but requires clear prefix conventions and collision handling.
- If HomeOps remains read-only, complexity stays bounded. If HomeOps edits Google events, complexity rises significantly.

#### User experience
- Strong daily-life UX because users can continue using Google Calendar and mobile-native calendar apps.
- Titles remain understandable outside HomeOps.
- Prefixes are transparent but can become noisy or brittle if users do not consistently name events.
- HomeOps-specific icons/colors/layers can be adjusted centrally without modifying each event if mappings are stored as settings.

#### Data ownership
- Google Calendar owns event data. HomeOps owns only adapter configuration, prefix mappings, Agenda layer settings, layout preferences, and any local cache/sync metadata if introduced.
- This is clear and portable from a user behavior standpoint, but depends on Google account availability and API policy.

#### Portability
- Calendar data portability is delegated to Google Calendar export mechanisms, but HomeOps-specific prefix mappings and layer settings still require HomeOps export.
- If title prefixes are human-readable, events remain useful outside HomeOps and survive provider migration better than hidden HomeOps metadata would.

#### Future maintenance
- Ongoing maintenance shifts from calendar semantics to integration reliability, OAuth/token lifecycle, Google API changes, and prefix classification rules.
- The normalized adapter boundary limits impact on widgets.

#### Interaction with existing Manual Events implementation
Manual Events could become:

1. **Permanent local overlay**: Useful for HomeOps-only events that should not live in Google Calendar. This preserves current implementation but introduces two event-authoring places.
2. **Transitional source**: Used until Google Calendar integration is real, then migrated/exported into Google Calendar or left read-only for historical display.
3. **Redundant feature**: Removed or hidden once Google Calendar becomes the only event source of truth. This would require data export/migration planning for existing Manual Events.

Option B is likely the better long-term calendar strategy if the priority is household usability, mobile editing, recurrence, notifications, and avoiding reimplementing a calendar product. It is less aligned with the current writable Manual Events path but still fits the adapter/normalization architecture.

## Lists Strategy Analysis

### Option A — HomeOps Lists remain primary storage

#### Alignment with current implementation
This option aligns strongly with the current durable Lists foundation. HomeOps already persists generic household-owned Lists and ListItems in PostgreSQL. Shopping and Vacation Packing are seeded examples, and the Shopping List Widget consumes persisted Lists APIs through the generated client.

#### Strengths
- Generic Lists can support shopping lists, packing lists, checklists, and simple household task lists without tying data to a widget.
- PostgreSQL ownership enables consistent import/export, backup, and future local-first LAN behavior.
- Avoids reliance on an external list provider and provider-specific APIs.
- Future chores/gamification could build from or relate to generic list/checklist/task concepts if carefully modeled.

#### Weaknesses
- HomeOps must provide all editing UX, mobile convenience, sharing semantics, and possibly offline behavior users expect from list apps.
- Shopping lists often benefit from phone-native usage outside the home; LAN-first/no-auth may limit usefulness unless external access or mobile UX is solved later.
- If chores/gamification are built on top of Lists too aggressively, the generic list model may become overloaded.

### Option B — External list provider

#### What it means
Shopping lists, packing lists, or checklists are stored in a third-party provider. HomeOps displays, filters, classifies, or augments them.

#### Strengths
- Provider may already solve mobile editing, sharing, notifications, and offline sync.
- Reduces HomeOps responsibility for list-product UX.
- Similar to the Google Calendar source-of-truth approach.

#### Weaknesses
- Adds integration complexity, provider lock-in, authentication/token storage, and API maintenance.
- Lists are less standardized than calendars; choosing a provider may be harder than choosing Google Calendar.
- Chores/gamification are likely HomeOps-specific and may not map cleanly to external list providers.

### Domain-specific evaluation
- **Shopping lists**: External provider may be attractive if mobile shopping UX is paramount. Current HomeOps storage is acceptable if shopping is primarily displayed/managed in the household hub.
- **Packing lists**: HomeOps-owned storage fits well because packing/checklists are household-contextual and less dependent on real-time store usage.
- **Checklists**: HomeOps-owned storage fits well for reusable household workflows, but current list model may need templates, ordering, sections, or recurrence in future slices.
- **Future chores**: Should likely be HomeOps-owned because assignment, schedules, rewards, and household logic are app-specific.
- **Future gamification**: Should be HomeOps-owned because points, achievements, streaks, and reward rules are HomeOps-specific.

### Likely direction
The current implementation aligns with long-term goals if Lists are reinterpreted broadly as HomeOps-owned household checklists rather than only shopping lists. If shopping specifically should remain external, the generic Lists domain can still remain useful for packing lists, checklists, chores support data, and gamification support data.

## Data Portability Analysis

### Architectural impact
The new import/export requirement changes persistence from an internal implementation detail into a user-facing contract. Every persisted HomeOps domain needs stable external representations, versioning, validation, and restore semantics.

The import/export architecture should distinguish:

- **Canonical HomeOps-owned data**: Lists, layouts, settings, Manual Events if retained, future chores, future gamification.
- **Provider-owned data**: Google Calendar events if Option B is chosen, external list provider items if Lists Option B is chosen.
- **Derived/cache data**: Any future Google sync cache, normalized event projections, generated birthday occurrences, or adapter test/demo data.

Only canonical HomeOps-owned data should be fully imported/exported as HomeOps data. Provider-owned data should export HomeOps configuration and mappings, not pretend to own the provider’s records unless explicitly cached as user-owned backups.

### Domain impact
- **Lists**: Need export/import for lists, list items, completion state, ordering if later added, timestamps, and possibly stable IDs or ID remapping.
- **Events**: If Manual Events remain, need event export/import. If Google Calendar is canonical, HomeOps exports source configuration, prefix mappings, layer settings, and perhaps cached read models only as non-authoritative data. iCalendar import/export may be required if HomeOps owns events.
- **Layouts**: Need export/import for workspace layouts, widget placements, order, size metadata, placement configuration, and compatibility with evolving widget catalogs.
- **Settings**: Need to distinguish household settings, device settings, and user settings if users are later introduced. Current Agenda layer settings are device-specific and may not restore cleanly across devices without an explicit policy.
- **Future chores**: Need export/import for chore definitions, assignments, schedules, completion history, and any recurrence rules.
- **Future gamification**: Need export/import for point balances, reward rules, audit/history, achievements, and relationship to chores.

### Backup strategy impact
- PostgreSQL backup remains necessary but insufficient as the only portability mechanism because it is implementation-coupled.
- A logical HomeOps export format should exist for user-controlled backups, provider migration, and disaster recovery across schema versions.
- Google Drive can be a destination for export files, but should not replace PostgreSQL backups.
- Import should be designed to handle duplicate data, ID remapping, missing providers, incompatible widget definitions, and partial restore.

## Google Drive Analysis

### As storage
Google Drive is not a good fit as the primary transactional storage engine for HomeOps. It would push core domain writes into a file synchronization model, complicate concurrency, conflict resolution, LAN-first behavior, and relational queries. This would conflict with the implemented PostgreSQL/EF Core persistence boundary.

### As backup/export destination
Google Drive is a strong candidate for backup/export destination. HomeOps can produce versioned export archives and optionally place them in Google Drive. This keeps Google Drive outside the transactional path and fits the portability requirement.

### As synchronization mechanism
Google Drive should not be the primary synchronization mechanism for app state. File sync conflicts, partial writes, offline edits, and multi-device concurrency would create a custom distributed system. If cross-device sync is needed, PostgreSQL/API-backed storage or a proven external provider should remain the sync path.

### Likely role
Google Drive should be treated as optional export/backup destination, not storage and not sync.

## Security Analysis

### Confirmed current direction
The current implementation has no authentication, no users, no profiles, no roles, no invites, no device registration, and no multi-household support. Agenda layer settings use a generated local device key, but this is not authentication.

### Preferred direction evaluated
LAN-first, self-hosted, no authentication initially, no custom authentication, and external access solved later through proven solutions is coherent with the existing architecture.

### Architectural implications
- Keep all APIs designed as household-local APIs until an explicit auth boundary is introduced.
- Avoid baking user identity assumptions into current tables prematurely.
- Keep the single seeded household as a temporary ownership boundary, not a security boundary.
- Avoid custom auth. If future external access is needed, use reverse proxies, VPN, identity-aware proxies, OAuth/OIDC providers, Tailscale-like access, or another proven solution rather than a bespoke auth stack.
- Secrets for real integrations, especially Google Calendar, need a future explicit secret-management/token-storage decision even if HomeOps itself has no user login.

### Future migration concerns
- LAN-first/no-auth is simple now but can make later remote access and provider OAuth design more complicated if API endpoints assume unconditional trust.
- Device-specific settings may need migration if future users/profiles are introduced.
- Import/export could expose sensitive household data and should have explicit handling before remote access or cloud backup destinations are added.

## Supabase Analysis

### Confirmed references
Supabase appears in architecture and reports as a Supabase-compatible PostgreSQL deployment target. The implementation intentionally uses standard PostgreSQL tables, keys, indexes, and relational constraints.

### Architectural importance
Supabase does not currently appear architecturally important beyond hosting PostgreSQL. No current report confirms use of Supabase Auth, Realtime, Storage, Edge Functions, or Row Level Security as application requirements.

### PostgreSQL sufficiency
PostgreSQL alone is sufficient for the current implementation:

- EF Core is the persistence boundary.
- Migrations live in the API project.
- Durable domains use standard relational tables.
- The modular monolith API owns business behavior.

### Optional Supabase posture
Supabase should become optional unless explicitly selected for future auth, storage, backup, or realtime capabilities. Keeping the app standard-PostgreSQL-compatible preserves portability to Docker Compose PostgreSQL, self-hosted PostgreSQL, Supabase Postgres, or another managed PostgreSQL host.

## Manual Events Analysis

### Confirmed implemented behavior
Manual Events are a writable HomeOps-owned event source. They are household-owned, persisted in PostgreSQL, normalized into the Agenda event model, and editable from the embedded Agenda UI. They support concrete single event occurrences only; recurrence is out of scope.

### Fit with preferred architecture
Manual Events fit the current implemented architecture because they use shared event-source models and normalized events rather than widget-specific data. They also validate the writable-source concept.

Their fit with the preferred future architecture depends on the calendar source-of-truth decision:

- If HomeOps Agenda is source of truth, Manual Events remain useful and likely become the foundation for the canonical HomeOps calendar.
- If Google Calendar is source of truth, Manual Events become less central and need a deliberate role.

### If Google Calendar becomes source of truth
Manual Events can still be useful in limited cases:

- Temporary local events before Google integration is complete.
- HomeOps-only events that should not appear in Google Calendar.
- Testing/development seed data for writable event flows.
- A fallback source when Google is unavailable.

But they also create risks:

- Users may not know whether to create events in Google Calendar or HomeOps.
- Two event stores can diverge.
- Manual Events lack recurrence, mobile notifications, Google sharing, and provider portability.
- Import/export or migration into Google Calendar would be needed if they are phased out.

### Permanent, transitional, or redundant
- **Permanent** if HomeOps owns some local-only event domain or if HomeOps Agenda becomes canonical.
- **Transitional** if Manual Events are used only until real Google Calendar read-only integration is complete or until a migration/export into Google Calendar is available.
- **Redundant** if the explicit decision is that all household agenda events belong in Google Calendar and HomeOps is strictly presentation/classification.

The current implementation should not be considered wrong, but its long-term meaning is now open and should be decided before expanding recurrence, event management screens, or cross-provider editing.

## Risks

- PostgreSQL has become the storage location for more domains than originally assumed, which may conflict with a future external-source strategy.
- Calendar direction is the largest unresolved architectural fork. Continuing Manual Event enhancements before deciding source of truth may create migration debt.
- Prefix-based Google Calendar classification is simple and portable, but brittle if event titles are inconsistent.
- Current Agenda layer settings are device-specific and may not map cleanly to future user/household profile settings.
- Import/export requirements can affect every domain schema and API contract if not addressed early.
- Google Calendar integration introduces OAuth, token storage, provider API reliability, and secrets management concerns that do not exist in the LAN-only core.
- Supabase-specific adoption could reduce deployment portability if introduced without an explicit decision.
- Google Drive as sync/storage would conflict with current PostgreSQL architecture and add distributed-state complexity.

## Open Decisions

- Is Google Calendar the long-term source of truth for household agenda events?
- If Google Calendar is canonical, should HomeOps ever write events back to Google Calendar, or stay read-only?
- What is the long-term role of Manual Events: permanent overlay, transitional bridge, or redundant feature?
- Should shopping lists remain in HomeOps Lists, move to an external provider, or split by list type?
- Which list types are HomeOps-owned: shopping, packing, checklists, chores, gamification support lists?
- What import/export format and granularity is required for each persisted domain?
- Should exports be manual downloads only, scheduled local files, Google Drive uploads, or multiple destinations?
- Should Supabase remain only a PostgreSQL hosting option, or should any Supabase-specific services be adopted?
- How should future external access be handled: VPN, reverse proxy with auth, identity-aware proxy, hosted platform, or something else?
- How should device-specific settings migrate if users/profiles are introduced later?

## Recommended Decision Areas Requiring Explicit User Choice

1. **Calendar ownership**: Choose HomeOps-owned Agenda or Google Calendar-owned Agenda before adding recurrence, richer event screens, or Google write-back.
2. **Manual Events role**: Decide permanent, transitional, or redundant before expanding Manual Events beyond concrete single occurrences.
3. **List ownership by use case**: Decide whether Shopping is HomeOps-owned or external, while preserving HomeOps-owned packing/checklist/chores/gamification needs.
4. **Import/export baseline**: Decide minimum required export/import coverage for Lists, Events, Layouts, Settings, future chores, and future gamification.
5. **Google Drive role**: Decide whether it is an optional backup/export target only.
6. **Supabase posture**: Decide standard PostgreSQL portability first, Supabase optional, unless a future explicit decision adopts Supabase Auth/Storage/Realtime.
7. **External access/security**: Decide whether LAN-first remains a firm boundary through the next phase and which proven access solution family is preferred later.

## Next Prompt Context

Use this context for the next decision or implementation prompt:

- This report is analysis-only and introduced no code, test, migration, or database changes.
- Current implemented durable domains are Lists, workspace layouts, Manual Events, and Agenda layer settings in PostgreSQL.
- Google Calendar is currently fake-provider/read-only-adapter foundation only; no real Google API, OAuth, token storage, or persistence exists.
- The key architectural fork is calendar ownership:
  - Option A: HomeOps Agenda owns events.
  - Option B: Google Calendar owns events; HomeOps classifies/presents by title prefixes and stores only mappings/settings/cache as needed.
- Manual Events should not be expanded until their long-term role is explicitly chosen.
- Import/export is now a cross-cutting requirement for all HomeOps-owned persisted domains.
- Google Drive should be considered as an optional export/backup target unless explicitly decided otherwise.
- Supabase should be treated as optional PostgreSQL-compatible hosting unless explicitly adopting Supabase-specific services.
- Security direction remains LAN-first, self-hosted, no initial authentication, no custom auth, and external access deferred to proven solutions.

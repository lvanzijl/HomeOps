# Calendar Data Model and Portability Analysis

## Summary

### Facts
- HomeOps currently uses PostgreSQL-backed persistence for durable household data.
- The Agenda already consumes normalized concrete events from multiple sources rather than provider-specific or widget-specific models.
- Manual Events are the current writable HomeOps-owned calendar-like source, but they represent concrete single occurrences only.
- Birthdays are currently a dedicated generated source that produces all-day normalized occurrences for Agenda rendering.
- Google Calendar currently exists as an adapter-pattern foundation and is not the HomeOps source of truth.

### Accepted decisions
- HomeOps Calendar is the preferred source of truth.
- PostgreSQL is the primary persistence technology.
- Google Calendar is an optional integration.
- Google Drive is a backup/export destination only.
- Import/export is a first-class requirement.
- Manual Events are not the final calendar model.
- Recurrence will exist in the future.
- Agenda renders concrete occurrences.
- Event management should operate on logical entities.
- Birthdays remain a dedicated generated source for now.
- People/Contacts is out of scope.
- Notifications and reminders are future considerations and are not part of this analysis.

### Analysis conclusion
HomeOps should conceptually move from Manual Events as concrete persisted occurrences toward a HomeOps Calendar domain centered on logical calendar entities. The most resilient conceptual shape is:

- **EventSeries** as the managed logical event entity.
- **RecurrenceRule** as an optional component of a series.
- **EventException** as the mechanism for modified, skipped, or split occurrences.
- **EventOccurrence** as a generated/read-model concept for Agenda and exports that need concrete dates.
- **Event** as either a user-facing umbrella term or a compatibility label, not the primary internal concept if it ambiguously mixes series and occurrences.

JSON should be the canonical HomeOps logical export format because it can preserve HomeOps-owned semantics, versioning, source ownership, stable identifiers, recurrence, exceptions, and future metadata. ICS should be supported for calendar interoperability, but it should not be canonical because it cannot reliably preserve all HomeOps-specific semantics. Complete restore should mean restoring both operational data and logical HomeOps-owned export data, with PostgreSQL backups for operational recovery and versioned logical exports for portability.

## Accepted Decisions

### Facts
The requested analysis explicitly fixes several strategic decisions before model evaluation. This report treats those decisions as constraints rather than open choices.

### Accepted decisions
- HomeOps owns its calendar data as the preferred source of truth.
- PostgreSQL remains the primary persistence layer.
- Google Calendar remains optional and integration-scoped.
- Google Drive is a destination for exports/backups, not runtime calendar storage.
- Import/export must be designed as a first-class capability.
- Current Manual Events are transitional and should not constrain the final model.
- Recurrence is expected in a future slice.
- Agenda should continue rendering concrete occurrences.
- Event management should operate on logical calendar entities rather than rendered occurrences.
- Birthdays remain a dedicated generated source for now.
- People/Contacts and reminders/notifications are outside this analysis.

### Assumptions
- HomeOps wants durable household portability across installations, not just operational disaster recovery.
- HomeOps should avoid becoming dependent on Google APIs for core calendar continuity.
- Future calendar features should use the existing source/adapter/normalization architecture rather than bypassing it.

## Calendar Domain Model Analysis

### Facts
- The existing Agenda contract is occurrence-oriented: it displays concrete all-day or timed events from normalized sources.
- Current Manual Events store single concrete events and deliberately exclude recurrence.
- Previous recurrence analysis concluded that logical management and concrete rendering should be separated.
- Birthdays already demonstrate generated occurrences from a non-Agenda domain source.

### Fundamental concepts

#### EventSeries
**Analysis conclusion:** EventSeries appears fundamental.

An EventSeries should represent the logical calendar item a household manages. A one-time appointment, a weekly practice, and a yearly household tradition can all be represented as a series. A one-time event is simply a series without recurrence.

Why it is fundamental:
- It gives event management a stable logical target.
- It avoids bolting recurrence fields onto concrete Manual Events.
- It supports future edits such as “edit this event,” “edit this occurrence,” and “edit this and future occurrences.”
- It provides a durable home for title, description, ownership, category/color, all-day status, default duration, location-like metadata if later needed, and stable identifiers.

Recommended visibility:
- Visible to event management workflows.
- Hidden from Agenda rendering except through generated occurrences.

#### RecurrenceRule
**Analysis conclusion:** RecurrenceRule appears fundamental once recurrence exists, but optional per series.

A RecurrenceRule should describe how an EventSeries expands over time. The concept should be present in the domain model even before every recurrence pattern is supported, because export/import and migration decisions need somewhere to preserve recurrence intent.

Why it is fundamental:
- It preserves recurrence semantics independently from generated occurrences.
- It aligns with ICS recurrence concepts without making ICS the internal model.
- It supports future recurring household use cases without redesigning one-time events.

Recommended visibility:
- Visible to event management and import/export.
- Hidden from Agenda rendering; Agenda should receive expanded occurrences.

#### EventOccurrence
**Analysis conclusion:** EventOccurrence appears fundamental as a generated/read-model concept, not necessarily as a primary managed entity.

An EventOccurrence should represent a concrete instance of an EventSeries on a specific date/time. Agenda, month views, week views, and interoperability exports need occurrences. However, users should generally manage the logical series unless they explicitly edit or skip a single occurrence.

Why it is fundamental:
- Agenda renders concrete occurrences by accepted decision.
- Import/export to interoperability formats often needs concrete and recurring representations.
- Exception handling needs a way to refer to the affected occurrence.

Recommended visibility:
- Visible to Agenda rendering and occurrence-specific editing UX.
- Hidden as a primary storage/management concept for standard event management.

#### EventException
**Analysis conclusion:** EventException appears fundamental for recurrence, and optional before recurrence.

An EventException should represent a change to one occurrence of a series, such as a modified time/title/details or a skipped occurrence. It should not be modeled as an unrelated standalone event because that loses logical series membership.

Why it is fundamental:
- Recurrence without exceptions cannot support real household schedules.
- ICS and provider calendars commonly need exception semantics.
- Exceptions preserve user intent and reduce data duplication.

Recommended visibility:
- Visible to event management when editing/deleting individual occurrences.
- Hidden from Agenda rendering; Agenda should see the resolved occurrence set.

#### Event
**Analysis conclusion:** Event is useful as a user-facing umbrella term but risky as the main internal concept.

“Event” is ambiguous because it can mean a logical series or a concrete occurrence. If used, the concept should be carefully scoped. For example:
- User-facing language may say “event.”
- Domain analysis may use “EventSeries” for logical management.
- Agenda contracts may use “EventOccurrence” or “NormalizedEvent” for rendered instances.

### Optional concepts

#### Calendar
A Calendar concept may become useful for grouping HomeOps-owned series, applying shared colors, or supporting multiple household calendars. It is not required for the immediate conceptual model if EventSource already provides ownership/source boundaries. Adding Calendar too early risks duplicating EventSource unless its role is clearly separate.

#### Category or color label
Categories/colors are important for portability and UX, but they can begin as metadata on source or series. A fully managed category taxonomy is optional until HomeOps needs category management, filters beyond sources, or imported classification mapping.

#### ExternalIdentity
External identity mapping is important for import/export and optional integrations. Conceptually it should exist as metadata, but it should remain integration-scoped and should not make external systems authoritative.

#### TimeZonePolicy
Timezone behavior is fundamental to correct recurrence, but it may be modeled as a policy or metadata rather than a top-level user-facing concept. It should not be deferred indefinitely because all-day events and recurring timed events are portability risk areas.

### Concepts that should remain hidden from Agenda rendering
Agenda should not directly reason about:
- EventSeries storage semantics.
- RecurrenceRule expansion rules.
- EventException resolution rules.
- Series split lineage.
- Import/export provenance details.

Agenda should receive a resolved list of concrete occurrences with source metadata, timing, title, description, all-day status, editability, color, and stable references needed to launch management actions.

## Portability Analysis

### Facts
- PostgreSQL backups preserve operational state but are not sufficient as a user-facing portable contract.
- Import/export is accepted as first-class.
- Google Drive is accepted only as an export/backup destination.
- ICS can represent many calendar concepts but not arbitrary HomeOps application state.

### Minimum portable contract
The minimum contract should preserve enough information to reconstruct HomeOps-owned calendar behavior without relying on current database tables.

Minimum fields/concepts:
- Export format name and version.
- Export creation timestamp.
- Stable HomeOps identifiers for sources and event series.
- Source ownership and source type.
- Event title.
- Optional description.
- All-day status.
- Start date/time or start date.
- End date/time, end date, duration, or explicit end semantics.
- Time zone or floating/all-day date semantics.
- One-time versus recurring classification.
- Recurrence rule when present.
- Exception records for skipped or modified occurrences when present.
- Created/updated timestamps if used for migration/conflict diagnostics.

### Recommended portable contract
The recommended contract should preserve both current behavior and future metadata without requiring format redesign.

Recommended additions:
- Export bundle version and application version/build metadata.
- Household identifier or household export identity, with privacy-safe restore behavior.
- Stable source identifiers plus source display name, color, visibility defaults, read/write capability, and external source identifiers where applicable.
- Stable series identifiers and optional human-readable slugs.
- Series status such as active/cancelled/archived if later introduced.
- Event categories, colors, icons, and classification tags.
- Original imported identifiers and import provenance.
- Last known external identifiers for Google/ICS imports or exports.
- Recurrence metadata expressive enough to round-trip supported rules.
- Exceptions with explicit exception type: modified, cancelled/skipped, or detached/split.
- Series split lineage for “this and future” edits.
- Future metadata extension bag with namespaced keys, while keeping core fields first-class.
- Validation metadata for unsupported imported recurrence features if HomeOps preserves but cannot edit them fully.

### Analysis conclusion
The portable contract should be logical rather than database-shaped. It should describe HomeOps calendar concepts and source ownership. It should not expose EF entity details, table names, or migration history. A portable export must be able to recreate the same logical series, recurrence rules, exceptions, source metadata, and generated Agenda output after import.

## JSON Analysis

### Advantages
- JSON can represent the full HomeOps logical calendar model, including source metadata, logical series, recurrence rules, exceptions, generated-source configuration, and future extension metadata.
- JSON can be versioned explicitly and migrated across application versions.
- JSON can include HomeOps-specific semantics that ICS cannot represent cleanly.
- JSON is human-inspectable enough for household backup confidence while remaining structured for automated import.
- JSON can bundle multiple domains later, such as calendar, lists, layouts, widget settings, and source settings.
- JSON can be written to Google Drive without making Google Drive a runtime store.

### Disadvantages
- JSON is HomeOps-specific and not broadly accepted by calendar apps.
- HomeOps must own schema versioning, validation, migrations, and backward compatibility.
- Poorly designed extension bags can become unvalidated dumping grounds.
- If JSON mirrors database tables too closely, exports become brittle across migrations.
- If JSON is too abstract, imports may be hard to validate and users may lose fidelity.

### Versioning concerns
JSON exports need an explicit version strategy:
- A top-level export schema version.
- Domain-level versions if calendar, lists, layouts, and settings evolve at different rates.
- Forward-compatible handling for unknown optional fields.
- Clear failure behavior for unsupported future major versions.
- Migration code that transforms older logical export versions into the current import model.

### Migration concerns
JSON import must handle:
- Older Manual Events-only exports.
- Future EventSeries exports with or without recurrence.
- Unsupported recurrence features from old or external imports.
- Identifier collision during restore into an existing installation.
- Duplicate imports versus full replacement restores.
- Partial restore failures with clear validation reporting.

### Analysis conclusion
JSON should be the canonical HomeOps export format. It should be a logical HomeOps export, not a database dump. It should preserve more than Agenda can display and should be treated as the source for portable restore workflows.

## ICS Analysis

### Advantages
- ICS is the standard calendar interchange format and is widely supported by calendar applications.
- ICS has mature concepts for events, all-day events, recurrence rules, recurrence exceptions, cancelled instances, time zones, and stable UIDs.
- ICS enables users to import HomeOps calendar data into Google Calendar, Apple Calendar, Outlook, and other tools.
- ICS gives HomeOps a practical interoperability story without making Google Calendar authoritative.

### Disadvantages
- ICS cannot preserve all HomeOps-specific semantics, such as widget settings, source visibility, internal category models, generated-source provenance, HomeOps-specific IDs, or future household metadata.
- Different consumers interpret recurrence, time zones, all-day end dates, and exceptions differently.
- ICS import can introduce duplicate identity problems if UIDs are absent, changed, or provider-generated.
- ICS can represent data HomeOps may not support editing, creating preservation and UX questions.
- Round-tripping HomeOps JSON to ICS and back may lose metadata.

### Interoperability value
ICS should be supported because it is the most useful user-facing calendar interchange format. It supports the accepted requirement that Google Calendar be optional: HomeOps can export or publish ICS for other calendars without making those calendars canonical.

### Recurrence support
ICS recurrence support is valuable but should not dictate the internal model. HomeOps should map its supported RecurrenceRule concepts to ICS RRULE/EXDATE/RECURRENCE-ID equivalents where possible. Unsupported ICS recurrence features should either be rejected with clear errors or preserved as read-only/import metadata until HomeOps can safely edit them.

### Information loss risk
Information loss risk is high if ICS is treated as canonical. Likely losses include:
- HomeOps source ownership and capabilities.
- HomeOps category/color semantics.
- Widget/layout/filter state.
- Import provenance and external identity mappings.
- Future metadata not expressible in ICS.
- Some recurrence edge cases depending on consumer behavior.

### Analysis conclusion
ICS should be supported for interoperability. It should not be canonical. It should remain an import/export format for calendar exchange, while JSON remains the canonical HomeOps logical export.

## Backup and Restore Analysis

### Facts
- PostgreSQL is the primary persistence technology.
- Google Drive is accepted as a destination for exports/backups only.
- Logical export/import is a first-class requirement.

### Database backups
Database backups are necessary for operational recovery. They preserve the exact application state at a point in time, including tables that may not yet have logical export coverage. They are best for restoring the same deployment or recovering from infrastructure failure.

Limitations:
- They are tied to database schema and migration state.
- They are not friendly for cross-version portability.
- They do not provide selective import UX.
- They are difficult for non-technical household users to inspect or validate.

### Logical exports
Logical exports are necessary for portability. A logical export should capture HomeOps-owned domain state in versioned contracts that can be imported by a future version of HomeOps.

For calendar, logical export should preserve:
- Sources.
- Series.
- Recurrence rules.
- Exceptions.
- Stable identifiers.
- Colors/categories.
- Ownership/provenance.
- Future metadata where supported.

### Restore workflows
HomeOps should distinguish restore modes conceptually:
- **Full restore:** rebuild a HomeOps household from a trusted export or database backup.
- **Selective import:** import calendar data into an existing household without replacing all state.
- **Interoperability import:** import ICS data as external or HomeOps-owned calendar events depending on user choice.
- **Operational restore:** restore PostgreSQL backup for the same deployment/version context.

### Google Drive export workflows
Google Drive should store exported artifacts such as:
- Versioned HomeOps JSON export bundles.
- Optional ICS calendar export files.
- Optional encrypted archives if sensitive household data requires protection.
- Manifest files with export timestamp, HomeOps version, and included domains.

Google Drive should not become:
- A synchronization database.
- A conflict-resolution layer.
- The source of truth for live calendar edits.

### Complete HomeOps restore
A complete HomeOps restore should mean the household can recover:
- HomeOps-owned calendar logical data, including recurrence and exceptions.
- Source metadata and ownership boundaries.
- Layout and widget configuration if included in full app export.
- Lists and other durable domains if included in full app export.
- Device-specific settings only if the export mode intentionally includes them.
- Enough identifiers to preserve links between sources, series, exceptions, and rendered occurrences.

### Analysis conclusion
Use both backup layers. PostgreSQL backups are the operational safety net. Versioned JSON logical exports are the portability and user-facing restore contract. ICS exports are supplemental calendar interoperability artifacts.

## Manual Events Migration Analysis

### Facts
- Manual Events currently represent HomeOps-owned writable single occurrences.
- Manual Events currently normalize into Agenda-compatible concrete events.
- Manual Events are explicitly not the final calendar model.
- Recurrence is not currently implemented.

### Likely migration path
The least disruptive conceptual migration is to promote each existing Manual Event into a non-recurring EventSeries:
- The Manual Event title becomes the series title.
- The Manual Event description becomes the series description.
- The Manual Event all-day flag and start/end values become the series base timing.
- The Manual Event source remains the HomeOps-owned calendar source or maps to the future HomeOps Calendar source.
- Each migrated series has no RecurrenceRule.
- No EventException records are needed for migrated one-time events.
- Agenda output remains equivalent because each non-recurring series expands to one occurrence.

### Likely complexity
Migration complexity appears moderate if performed before recurrence and import/export harden:
- Conceptual mapping is straightforward.
- The main challenge is preserving stable identifiers and avoiding duplicate Agenda output during transition.
- API compatibility and generated client changes are implementation concerns for a future prompt, not this analysis.

Migration complexity increases significantly if:
- Many users accumulate Manual Events before migration.
- External imports are added before the logical model exists.
- Recurrence fields are bolted onto Manual Events first.
- JSON exports are created around Manual Events as if they were final.

### Risks
- Identifier risk: existing Manual Event IDs may need to map to future EventSeries IDs or occurrence IDs.
- UX risk: users may expect event editing behavior to remain unchanged while the underlying model changes.
- Export risk: early exports could encode Manual Events in a way that later requires compatibility shims.
- Source risk: the future HomeOps Calendar source must not accidentally conflict with the existing Manual Events source identity.

### Timing concerns
The migration should happen before implementing recurrence, canonical calendar JSON exports, or richer import flows. Waiting until after recurrence or ICS import makes migration more difficult because HomeOps would need to migrate both user-authored events and imported/provider-shaped events.

### Analysis conclusion
Manual Events are a manageable bridge if treated as one-time EventSeries during the next calendar-domain evolution. They become redesign risk if extended directly with recurrence, import/export, or provider sync semantics.

## Future Growth Analysis

### Recurring events
The proposed model naturally supports recurring events because recurrence is attached to logical EventSeries and Agenda receives generated EventOccurrence values. Exceptions and series splitting allow common household changes without redesign.

### Birthdays
Birthdays can remain a dedicated generated source. The same occurrence pipeline can continue to render birthday occurrences. If a future People/Contacts domain appears, birthdays can become projections from people records into EventOccurrence values without forcing the HomeOps Calendar model to own contacts.

### Chores deadlines
Chores can project deadlines into the same normalized occurrence pipeline. A chore deadline does not need to be stored as a calendar EventSeries unless the product chooses to allow calendar-level editing. This keeps domain ownership clear while still enabling Agenda display.

### Vacation planning
Vacation planning can be represented as all-day or multi-day EventSeries for core calendar periods, while packing lists and itinerary details remain in their own domains. The calendar model supports dates and visibility without absorbing every vacation-planning concept.

### School schedules
School schedules fit as imported or HomeOps-owned EventSeries depending on source. Recurrence and exceptions are important for school calendars, holidays, early-release days, and term schedules. ICS interoperability is especially useful here.

### Household planning
Household planning benefits from a stable logical model because different domains can project important dates into Agenda without becoming widget-specific. The model supports a future where Agenda renders a combined view of HomeOps-owned calendar series, generated birthdays, list deadlines, chores, and optional external calendar overlays.

### Analysis conclusion
The proposed model supports future growth without redesign as long as HomeOps preserves the separation between domain ownership, logical event management, occurrence generation, and Agenda presentation.

## Risks

### Portability risks
- A database-shaped export would couple portability to EF/database migrations.
- ICS-only export would lose HomeOps-specific metadata.
- JSON without strict versioning would become hard to migrate.
- External identifiers from Google or ICS could be mistaken for HomeOps authoritative IDs.
- Google Drive backups could be misunderstood as live synchronization.

### Recurrence risks
- Recurrence rules, exceptions, time zones, all-day dates, and series splitting are inherently complex.
- Agenda correctness depends on deterministic occurrence expansion.
- Unsupported imported recurrence patterns can create read/edit mismatches.
- Treating one-time events and recurring events as separate unrelated concepts would create future duplication.

### Migration risks
- Manual Event IDs may not map cleanly to future series and occurrence identifiers unless planned.
- Existing APIs and frontend assumptions may treat events as concrete editable objects.
- Migration after external imports would increase deduplication and source ownership complexity.
- Exporting Manual Events as canonical before migration would create long-lived compatibility debt.

### Future redesign risks
- Modeling tables or EF entities before settling domain concepts could lock in the wrong abstraction.
- Letting Agenda consume recurrence internals would make future UI and export changes harder.
- Making Google Calendar or ICS semantics canonical would undermine HomeOps-owned portability.
- Adding categories, contacts, reminders, or sync too early could expand scope beyond the current calendar model decision.

## Open Questions

### Domain questions
- Should the user-facing term be “Calendar Event” while the internal conceptual term remains EventSeries?
- Should HomeOps introduce a distinct Calendar grouping concept, or continue using EventSource as the ownership/source boundary?
- How should HomeOps represent series split lineage for “this and future” edits?
- What timezone policy should apply to all-day events and recurring timed events?

### Portability questions
- Should JSON exports support full replacement restore, selective import, or both in the first version?
- Should exported identifiers be restored exactly, remapped, or configurable depending on restore mode?
- Should unsupported imported ICS recurrence be preserved as read-only metadata or rejected?
- Should full HomeOps exports include device-specific layer settings by default?

### Integration questions
- Should Google Calendar support begin with import, export, subscription-style ICS publishing, or read-only overlay?
- Should external calendar imports create HomeOps-owned copies or remain external-source overlays?
- How should duplicate detection work across JSON restore, ICS import, and optional Google integration?

## Recommended Direction

### Analysis conclusions
- Adopt a logical HomeOps Calendar model centered on EventSeries.
- Treat one-time events as non-recurring EventSeries.
- Treat RecurrenceRule as optional per series but fundamental to the future model.
- Treat EventException as required for mature recurrence support.
- Treat EventOccurrence as generated/resolved output for Agenda and interoperability.
- Keep recurrence expansion, exception resolution, and series split details hidden from Agenda rendering.
- Make versioned JSON the canonical HomeOps export/import format.
- Support ICS for calendar interoperability only.
- Use PostgreSQL backups for operational restore and JSON exports for portable restore.
- Use Google Drive only to store export artifacts.
- Migrate Manual Events before adding recurrence or canonical calendar export.

### Recommended next slice, when implementation is allowed
Design the HomeOps Calendar domain contract before touching persistence. The next implementation prompt should explicitly authorize implementation and should focus on migrating Manual Events into a logical one-time EventSeries model while preserving Agenda output. It should not add recurrence behavior yet unless recurrence requirements and timezone policy are decided.

## Next Prompt Context

Use this context for the next planning or implementation prompt:

> HomeOps has accepted that HomeOps Calendar is the source of truth, PostgreSQL is primary persistence, Google Calendar is optional, Google Drive is export-only, import/export is first-class, Manual Events are transitional, recurrence will exist later, Agenda renders concrete occurrences, and event management should operate on logical entities. The recommended conceptual model is EventSeries as the managed logical entity, optional RecurrenceRule per series, EventException for skipped/modified/split occurrences, and generated EventOccurrence values for Agenda rendering. One-time Manual Events should migrate to non-recurring EventSeries before recurrence or canonical calendar exports are implemented. JSON should be the canonical versioned HomeOps export format. ICS should be supported only for interoperability. PostgreSQL backups remain operational recovery, while logical JSON exports are the portability and restore contract.

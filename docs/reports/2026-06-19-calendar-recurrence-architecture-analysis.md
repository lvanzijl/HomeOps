# Calendar Recurrence Architecture Analysis

## Summary
This is an analysis-only report. No implementation, tests, migrations, API changes, schema changes, or code changes were performed.

Analysis conclusion: the current Manual Events model is a useful first step for persisted, writable, concrete calendar occurrences, but it should not be treated as the final recurrence-capable domain model. It can evolve safely only if HomeOps clearly separates logical event management from concrete agenda rendering before recurring events are implemented.

Recommended direction: introduce a conceptual distinction between logical event definitions and rendered occurrences in a future recurrence slice. Agenda should continue to consume concrete normalized occurrences, while event management should operate on logical one-time or recurring event entities. Existing Manual Events can likely be migrated into one-time logical event entities, but the current persisted records should be considered occurrence-shaped and incomplete for recurring series semantics.

## Current State Assessment

### Current implementation facts
- Manual Events are the first persisted writable HomeOps-owned event source.
- Manual Events are stored in PostgreSQL through EF Core and normalized into the Agenda event contract before the Agenda consumes them.
- Manual Events currently represent concrete single occurrences only.
- Manual Events support CRUD through backend APIs and the embedded Agenda editing workflow.
- Manual Events support all-day and timed events with validation for required titles and date ranges.
- Recurring events are explicitly out of scope in the current implementation.
- Birthdays currently exist as a read-only generated source, not persisted birthday management data.
- Agenda rendering already expects concrete normalized events from multiple sources.

### Assessment
The current implementation has a good presentation boundary: Agenda consumes normalized concrete events rather than provider-specific or widget-specific data. That boundary is reusable for recurrence because recurring series can be expanded into concrete occurrences before Agenda rendering.

The weak point is the current writable Manual Events domain shape. It models editable concrete occurrences, not logical event series. That is appropriate for the current slice, but it does not directly support user expectations such as editing one occurrence, this-and-future occurrences, or an entire recurring series.

### Reusable parts
- Event source ownership and capabilities.
- Normalized event contract consumed by Agenda.
- All-day versus timed event concepts.
- Source filtering and layer settings.
- Manual Event CRUD patterns as a precedent for writable event APIs.
- Validation concepts for title and date range.
- Household ownership and PostgreSQL persistence boundary.

### Likely temporary parts
- The idea that a writable calendar item is always one persisted concrete event.
- Embedded Agenda-only management as the only event editing surface.
- Manual Events naming if HomeOps-owned calendar data becomes broader than manually entered single events.
- Treating generated birthday/demo events as a substitute for managed domain data.

### Parts likely requiring migration
- Persisted Manual Events if they need to become one-time logical entities in a recurrence-capable calendar model.
- API contracts if create/update/delete operations shift from occurrence-shaped resources to logical event resources plus occurrence exception operations.
- Frontend editing flows if they need to ask whether an edit applies to one occurrence, future occurrences, or the entire series.
- Import/export formats if events become canonical HomeOps-owned calendar data.

## User Requirements Assessment

### User requirements
Future HomeOps users must be able to create recurring events and manage them as logical items while Agenda displays separate concrete occurrences. Required recurrence categories include yearly birthdays, weekly sports events, daily/weekly/monthly/yearly general events, and single one-off events.

Future edit and delete operations must support:
- this occurrence only;
- this occurrence and future occurrences;
- entire series.

### Assessment
These requirements imply two different user-facing concepts:
1. **Management concept:** a logical event or series that users create, edit, and delete.
2. **Rendering concept:** concrete occurrences visible on the agenda.

A model that stores only concrete occurrences can render an agenda easily, but it struggles to preserve a single logical item for a birthday, training schedule, lesson series, or monthly maintenance task. A model that stores only recurrence rules can manage logical items cleanly, but it needs expansion and exception handling before Agenda rendering.

Therefore, HomeOps should not extend the current Manual Events model by simply adding recurrence fields to each concrete event record without first defining series and exception semantics conceptually.

## Conceptual Domain Model Analysis

### Option 1: Event as a single occurrence only
A single `Event` concept represents one concrete agenda item.

#### Complexity
Low initially. It matches the current Manual Events model and is easy to render.

#### Flexibility
Poor for recurrence. A yearly birthday or weekly training schedule becomes many separate records unless recurrence is bolted on later.

#### Maintainability
Good only while all events are single occurrences. Long-term maintainability declines when edit/delete semantics need to preserve series identity.

#### User expectations
Does not meet the requirement that recurring items are managed as one logical item.

### Option 2: EventSeries plus generated EventOccurrence
A logical `EventSeries` represents both one-time and recurring event definitions. `EventOccurrence` is the concrete rendered instance, generated from the series and recurrence rules.

#### Complexity
Moderate. It introduces a clear conceptual split but requires recurrence expansion, exceptions, and editing policies.

#### Flexibility
High. One-time events can be represented as non-recurring series, while birthdays, sports, garbage collection, and maintenance can use recurrence rules.

#### Maintainability
Strong if kept conceptually simple. The Agenda can remain occurrence-based, and management can remain series-based.

#### User expectations
Best match for the required behavior. Users can manage one logical item while seeing separate agenda entries.

### Option 3: EventSeries, EventOccurrence, EventException, and RecurrenceRule
A richer model separates logical event identity, recurrence schedule, generated occurrences, and occurrence-level changes.

#### Complexity
Highest of the listed conceptual options.

#### Flexibility
Highest. It supports skipped occurrences, moved occurrences, edited occurrence titles/times, this-and-future splits, and whole-series updates.

#### Maintainability
Strong if recurrence logic is encapsulated and the rest of HomeOps consumes only stable concepts. Risky if every widget or API must understand recurrence internals.

#### User expectations
Best long-term fit for full recurring calendar behavior.

### Conceptual guidance
HomeOps should conceptually plan around:
- a logical event entity for management;
- recurrence rules for repeated schedules;
- concrete occurrences for agenda rendering;
- exceptions or overrides for changed/deleted individual occurrences;
- series splitting for this-and-future edits.

This does not require designing database tables now. It only means future recurrence work should not treat concrete Manual Events as the final domain abstraction.

## Birthdays Analysis

### Option A: Birthdays as recurring events
Birthdays could be modeled as yearly all-day recurring events.

#### Advantages
- Reuses the same recurrence machinery as other yearly events.
- Agenda rendering becomes consistent because birthdays are just yearly occurrences.
- Editing, deleting, import/export, and visibility can share event infrastructure.
- Users understand birthdays as calendar-like events.

#### Disadvantages
- Birthdays often have person-specific semantics that normal calendar events do not, such as date of birth, age display, relationship labels, and leap-day observation preferences.
- A birthday may be better managed from a contacts/person list than from a generic event form.
- If age or person metadata is needed later, generic recurring events may become overloaded.

### Option B: Birthdays as a dedicated source that generates recurring occurrences
Birthdays could remain a dedicated data source containing birthday/person records and generating annual all-day occurrences.

#### Advantages
- Matches the current architecture where birthdays are already a separate read-only source that generates occurrences.
- Keeps person-specific birthday metadata out of the generic calendar model.
- Allows birthday-specific rules such as Feb 29 handling, age display, and optional contact/person integration.
- Keeps the Agenda source/layer model clean because birthdays remain a separate source.

#### Disadvantages
- Requires separate management UX and import/export semantics for birthdays.
- Users may expect birthdays to be editable like other calendar items.
- Duplicate recurrence concepts may emerge if birthday generation and calendar recurrence evolve independently.

### Option C: Birthdays as person records with calendar projection
A future People or Household Contacts domain could own birthday dates. The calendar system would project birthdays as generated yearly occurrences.

#### Advantages
- Best long-term semantic fit if HomeOps eventually tracks household people, family members, contacts, or profiles.
- Avoids treating a person’s birthday as merely an event title.
- Still renders naturally as agenda occurrences.

#### Disadvantages
- Requires a People/Contacts concept that does not currently exist and may be out of scope.
- Could be premature if the only needed birthday behavior is agenda display.

### Birthday recommendation
For now, birthdays should be treated as a dedicated source that generates recurring occurrences, not as ordinary Manual Events. Long term, the best direction is likely Option C if HomeOps introduces person/contact concepts. Birthday occurrence generation should reuse the same conceptual recurrence engine or recurrence policy where practical, but birthday management should remain semantically separate from generic calendar event management.

## Recurrence Strategy Analysis

### Strategy 1: Add recurrence fields to Manual Events
This would extend current Manual Events with recurrence details.

#### Advantages
- Appears incremental.
- Reuses current CRUD and storage concepts.

#### Disadvantages
- Risks mixing logical series and concrete occurrence concerns in one concept.
- Makes edit/delete semantics difficult when an item is both a series definition and a rendered occurrence.
- Encourages accidental widget-specific or implementation-specific behavior.

### Strategy 2: Promote Manual Events into logical one-time/recurring event entities
Current Manual Events become the starting point for a broader HomeOps-owned calendar model where one-time events are logical event entities with no recurrence rule.

#### Advantages
- Preserves existing user data conceptually.
- Supports recurring and non-recurring events with one management model.
- Aligns management with logical entities and rendering with occurrences.

#### Disadvantages
- Requires migration from occurrence-shaped records to logical event records.
- Requires new user-facing semantics for edits and deletes.
- May require renaming or reclassifying Manual Events.

### Strategy 3: Keep Manual Events as one-off local overlay and add separate recurring series
Manual Events remain single occurrences, and recurring events use a separate logical model.

#### Advantages
- Avoids immediate migration pressure.
- Keeps existing one-off CRUD simple.

#### Disadvantages
- Creates two authoring models for calendar events.
- Users may not understand why one event can recur and another cannot.
- Future import/export and editing UX become fragmented.

### Recurrence recommendation
HomeOps should not add recurrence directly to occurrence-shaped Manual Events. The safer conceptual direction is to promote or migrate Manual Events into a logical event model where one-time events are simply non-recurring event series. This keeps the management surface consistent while preserving Agenda’s concrete occurrence rendering model.

## Rendering Strategy Analysis

### Dynamic occurrence generation
Occurrences are generated from logical series and recurrence rules when the Agenda requests a date range.

#### Advantages
- Avoids storing large numbers of future rows.
- Series edits immediately affect future rendered occurrences.
- Reduces migration and cleanup burden for far-future generated data.
- Fits Agenda views that request bounded ranges such as week or months.

#### Disadvantages
- Requires reliable recurrence expansion logic.
- Querying, sorting, and filtering may become more complex.
- Performance must be managed for broad date ranges or many recurring series.
- Exceptions must be applied consistently during generation.

### Stored occurrences
Concrete occurrences are materialized and stored ahead of time.

#### Advantages
- Agenda queries are simple and fast.
- Occurrences can be independently indexed, searched, and audited.
- Individual occurrence edits may be straightforward.

#### Disadvantages
- Requires horizon management and background/materialization policies.
- Series edits require updating or regenerating many occurrence rows.
- This-and-future edits and deletion semantics can become data-heavy.
- Storing unbounded recurrence is impossible, so a cutoff must exist.

### Hybrid approach
Store logical series and exceptions as canonical data, and optionally cache/materialize occurrences for bounded windows.

#### Advantages
- Keeps canonical truth in logical series and exceptions.
- Allows Agenda to use concrete occurrence projections.
- Supports performance optimization without making cached occurrences authoritative.
- Fits the current normalized event pipeline because generated or cached occurrences can still become normalized events.

#### Disadvantages
- More moving parts than pure dynamic generation.
- Requires clear cache invalidation rules if materialized occurrences are introduced.
- Must avoid treating cached occurrences as user-owned canonical records.

### Rendering recommendation
Use logical series plus dynamic occurrence generation as the conceptual baseline. Consider bounded materialized/cached occurrences only as a performance optimization later. Agenda should continue to render concrete normalized occurrences and should not need to understand recurrence internals.

## Manual Events Migration Analysis

### Can current Manual Events survive unchanged?
They can survive unchanged only if HomeOps permanently treats them as one-off local events and introduces recurring events separately. That is the lowest migration path but produces a split model that may confuse users and future maintainers.

### Can current Manual Events become one-time EventSeries?
Yes. Conceptually, each current Manual Event can become a one-time logical event with a single occurrence. This is the cleanest long-term path if HomeOps owns calendar data. It preserves titles, all-day/timed semantics, start/end values, source ownership, and editability while allowing the same management model to later support recurrence.

### Would migration be required?
Likely yes. If recurrence is introduced with logical event entities, existing occurrence-shaped Manual Events would need to be migrated or mapped into one-time logical events. The migration may be simple if current Manual Events contain all fields required for one-time events, but it is still a domain migration because the meaning of the record changes from concrete occurrence to logical event definition.

### Migration caution
Migration should happen before many Manual Event records accumulate or before import/export depends on the current shape. Delaying too long increases the cost of preserving user data, API compatibility, and expected edit behavior.

## Risks

### Risks if recurring support is delayed too long
- More user data accumulates in an occurrence-shaped Manual Events model, increasing migration risk.
- API contracts and UI workflows may solidify around concrete event CRUD.
- Users may create repeated single events manually, producing duplicates that are difficult to consolidate into series later.
- Import/export may encode the temporary Manual Events shape as a stable external contract.
- Agenda editing expectations may become harder to change once users rely on current behavior.

### Risks if recurring support is introduced too early
- Recurrence semantics can expand quickly into time zones, exceptions, imports, iCalendar compatibility, reminders, notifications, attendee handling, and sync.
- Premature schema or API design may lock HomeOps into an incomplete recurrence model.
- Complex recurrence UI may distract from the current Phase 2 durable household core.
- Implementing recurrence before deciding whether HomeOps or Google Calendar is the calendar source of truth could create throwaway work.

### Specific domain risks
- Birthdays may be incorrectly forced into generic recurring events, losing person-specific semantics.
- Stored occurrence materialization may accidentally become the canonical data model.
- This-and-future edits require series splitting; without that concept, data may become inconsistent.
- All-day event date handling and timed event timezone handling may become more important under recurrence than they are for single Manual Events.

## Open Decisions
- Is HomeOps intended to be the long-term source of truth for household calendar data, or will Google Calendar remain canonical?
- Should recurring support be implemented before or after real Google Calendar read-only integration?
- Should Manual Events be renamed or promoted to a broader HomeOps Calendar domain?
- What recurrence rule scope is required for the first recurrence slice: daily, weekly, monthly, yearly only, or richer iCalendar-style rules?
- How should Feb 29 birthdays be observed, and should this be configurable?
- Should birthdays remain a dedicated source, become person/contact projections, or be ordinary recurring events?
- What import/export format is expected for HomeOps-owned calendar data?
- Are reminders, notifications, attendees, locations, and calendar categories in scope for HomeOps-owned events, or intentionally out of scope?
- What date/time and timezone policy should recurring timed events use?

## Recommended Architectural Direction

### Recommendation
Adopt a conceptual model where HomeOps distinguishes logical event management from concrete occurrence rendering.

Recommended future conceptual direction:
- Logical event entities represent one-time or recurring managed calendar items.
- One-time events are modeled as logical events without recurrence, not as a separate permanent concept.
- Recurrence rules describe daily, weekly, monthly, or yearly repetition.
- Occurrences are generated for bounded agenda ranges.
- Exceptions represent skipped, edited, or moved occurrences.
- This-and-future edits are modeled as a split in logical series rather than mutation of already-rendered occurrences.
- Agenda continues consuming concrete normalized events and remains unaware of recurrence internals.
- Birthdays remain a dedicated generated source for now and may later become projections from a person/contact domain.

### Near-term guidance
Do not implement recurrence by simply adding recurrence fields to current Manual Events. Before recurrence implementation, decide whether HomeOps owns calendar data long term. If HomeOps does own calendar data, plan a migration path where existing Manual Events become one-time logical event entities.

### What should stay stable
- Agenda renders concrete normalized events.
- Widgets remain presentation units.
- Event source adapters normalize provider-specific data before widgets consume it.
- Read-only and writable source capabilities remain distinct.

### What should be allowed to change
- Manual Events may be renamed, promoted, or migrated.
- Event management APIs may move from concrete occurrence CRUD to logical event operations plus occurrence exception operations.
- Birthday management may remain outside generic event management.

## Next Prompt Context
This report performed analysis only and created no implementation, tests, migrations, API changes, schema changes, or code changes.

Recommended next prompt if proceeding with recurrence design:
- First decide calendar source of truth: HomeOps-owned calendar versus Google Calendar canonical.
- If HomeOps-owned calendar is chosen, request a recurrence domain design slice that remains conceptual and defines only terminology, user flows, and migration strategy.
- Do not implement recurrence until the logical event versus concrete occurrence boundary is accepted.
- Preserve Agenda rendering as concrete normalized events.
- Preserve birthdays as a dedicated generated source unless a future People/Contacts domain is explicitly introduced.

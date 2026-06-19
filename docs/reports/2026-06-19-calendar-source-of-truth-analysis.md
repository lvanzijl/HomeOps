# Calendar Source-of-Truth Analysis

## Summary

This is an analysis-only report. No implementation, tests, migrations, database changes, or documentation updates outside this report were performed. Preflight `dotnet --version` returned `10.0.301`.

**Analysis conclusion:** Option A, where HomeOps Calendar is the source of truth, is stronger for HomeOps given the current implementation state, accepted self-hosting decisions, PostgreSQL-first architecture, import/export requirement, and recurrence requirements. Option B, where Google Calendar is the source of truth, has a compelling user-experience argument because Google already solves mobile calendar usage, recurrence, reminders, sharing, and multi-device access. However, it conflicts with self-hosted-first ownership, makes Google Calendar architecturally central, and turns the current writable Manual Events implementation into either a local overlay or future migration debt.

The recommended direction is to keep HomeOps Calendar as the canonical household calendar for HomeOps-owned events, evolve Manual Events toward logical event series plus generated occurrences, and treat Google Calendar as an optional integration for import, export, read-only overlay, or deliberately scoped sync. Google Drive should be treated as a backup/export destination, not runtime storage.

## Current State

### Facts

- HomeOps is a modular monolith using ASP.NET Core, React + TypeScript + Vite, PostgreSQL, OpenAPI, and NSwag.
- PostgreSQL is already the application persistence boundary.
- HomeOps currently stores Manual Events, generic Lists, workspace layouts, and settings.
- Manual Events are the first persisted writable HomeOps-owned event source.
- Manual Events currently persist concrete single event occurrences only.
- Agenda consumes normalized events and should remain unaware of provider-specific payloads.
- Google Calendar currently has only a fake-provider adapter foundation.
- Google Calendar currently has no OAuth, token storage, real API calls, sync, import, export, or storage responsibilities.
- Birthdays currently behave as a generated read-only source, not a persisted calendar-management feature.
- HomeOps is offline-tolerant, not offline-first.

### Analysis conclusion

The implementation has already crossed from a pure presentation shell into a durable household core. Calendar ownership is therefore no longer an abstract future question: persisted writable Manual Events now exist, and future recurrence/import/export choices will either reinforce that direction or create deliberate migration work.

## Accepted Decisions

### Accepted decisions supplied for this analysis

- Self-hosted first.
- PostgreSQL is the primary persistence technology.
- Supabase is optional and not architecturally required.
- Google Drive is a backup/export destination, not runtime storage.
- Import/export is a first-class requirement.
- No custom authentication should be built.
- Authentication and external access will be evaluated separately later.
- Widget layouts remain HomeOps-owned.
- Lists remain HomeOps-owned unless strong evidence suggests otherwise.
- Human-readable data is preferred.
- Hidden metadata should be avoided where practical.

### Assumptions

- Calendar source-of-truth means the system users trust to create, edit, preserve, restore, and migrate calendar events.
- Optional Google Calendar integration can exist under either option, but it must not silently redefine ownership without an explicit future decision.
- Import/export portability should be understandable to a household operator and should not require direct PostgreSQL schema knowledge.

## Option A Analysis

Option A makes HomeOps Calendar the source of truth. Events are stored in HomeOps, recurrence is handled by HomeOps, import/export is supported by HomeOps, and Google Calendar becomes an optional integration.

### Complexity

Short-term complexity is lower than Option B because HomeOps already stores writable Manual Events in PostgreSQL and exposes create, update, and delete behavior. The existing normalized-event pipeline also supports Agenda rendering without introducing a provider dependency.

Medium- and long-term complexity is substantial. HomeOps must own recurrence rules, series editing, occurrence exceptions, all-day/timed date semantics, import/export fidelity, backup/restore, and possibly reminders or notifications if later required. However, this complexity is domain complexity that directly supports the accepted self-hosted and portability goals.

### User experience

Option A gives a coherent HomeOps-native experience: users create and edit household events where they view household information. It avoids requiring Google credentials before the calendar is useful. The weakness is that HomeOps must eventually provide enough event-management UX to avoid feeling inferior to phone-native calendar apps.

### Offline/self-hosted suitability

Option A is the strongest fit for self-hosted-first operation. The calendar remains usable on a LAN with PostgreSQL and without Google availability, OAuth, external access, or provider API uptime. It remains offline-tolerant rather than offline-first unless a later slice adds local mutation queues or sync.

### Data ownership

Option A has the clearest ownership story. HomeOps-owned calendar data lives in PostgreSQL, is backed up with the rest of the household state, and can be exported through HomeOps-owned formats.

### Data portability

Option A aligns best with first-class import/export. HomeOps can define a versioned JSON export for canonical HomeOps data and ICS import/export for calendar interoperability. The risk is that HomeOps must implement these formats carefully enough to preserve recurrence, exceptions, all-day dates, time zones, stable IDs, and source metadata.

### Recurrence support

Option A gives HomeOps full control over recurrence semantics. It can adopt the recurrence-analysis recommendation: logical event entities for management, generated concrete occurrences for Agenda rendering, exceptions for occurrence edits/deletions, and series splitting for this-and-future edits.

### Import/export support

Option A makes import/export a direct product responsibility. That is work, but it is consistent with the accepted requirement. HomeOps can export canonical calendar data to JSON, export interoperable calendars to ICS, import ICS as user-owned events, and write export bundles to Google Drive.

### Future maintenance

Maintenance is predictable but non-trivial. HomeOps maintains its own calendar domain rather than chasing every Google Calendar sync edge case as a core requirement. Calendar semantics must be deliberately scoped to household needs to avoid accidentally rebuilding a full enterprise calendar product.

### Family use cases

Option A fits household-specific events, routines, holidays, chores-related dates, packing deadlines, and local family planning. It is weaker for family members who already rely heavily on phone-native Google Calendar editing outside the home unless external access, mobile UX, or optional sync is later added.

### Multi-device use

Within the HomeOps app, multi-device consistency is straightforward because all devices use the same PostgreSQL-backed source. Outside the HomeOps app, multi-device calendar use requires export, subscription, or sync to external calendar clients.

### Integration flexibility

Option A keeps integrations optional. Google Calendar, ICS files, Google Drive backups, birthday/person projections, chores, and future providers can all be adapters around HomeOps-owned canonical data or overlays into the normalized event pipeline.

### Long-term architectural consistency

Option A is more consistent with HomeOps as a durable household core. It reinforces PostgreSQL as the canonical store for HomeOps-owned domains and keeps widgets as presentation units over shared calendar data.

## Option B Analysis

Option B makes Google Calendar the source of truth. Events are stored in Google Calendar, HomeOps acts as presentation/classification layer, and event categories are derived from human-readable title prefixes such as `Birthday: Oma`, `Holiday: France`, and `School: School Trip`.

### Complexity

Option B lowers calendar-domain complexity because Google already supports recurrence, reminders, mobile editing, sharing, and multi-device access. It raises integration complexity: HomeOps must handle OAuth or another credential strategy, secure token storage, refresh failures, API quotas, incremental sync, deleted events, provider outages, consent revocation, and user expectation mismatches.

Prefix-based classification is intentionally simple and human-readable, but it is brittle. Misspelled prefixes, translated names, inconsistent family conventions, events that naturally contain colons, and bulk edits can all affect classification.

### User experience

Option B has the strongest day-to-day calendar UX for families already using Google Calendar. Events are available in native mobile apps and shared calendars. Human-readable prefixes preserve meaning outside HomeOps. The weakness is that HomeOps-specific presentation depends on naming discipline, and HomeOps may feel broken when Google auth, network, or API access fails.

### Offline/self-hosted suitability

Option B is weaker for self-hosted-first operation. HomeOps can cache data later, but Google remains authoritative. Without Google availability or valid credentials, HomeOps cannot reliably create, update, or fully refresh calendar data.

### Data ownership

Google owns the calendar data. HomeOps owns prefix mappings, layout, settings, source configuration, and any cache. This is clear if deliberately chosen, but it contradicts the stronger self-hosted ownership posture for calendar events.

### Data portability

Calendar portability is delegated mainly to Google export and ICS ecosystem behavior. HomeOps still needs to export its prefix mappings, colors, icons, layer settings, and integration configuration. Human-readable prefixes help portability because events remain understandable without hidden metadata.

### Recurrence support

Option B delegates recurrence support to Google Calendar. This is powerful for normal calendar usage, but it means HomeOps recurrence behavior must conform to provider behavior. Series editing, occurrence editing, and this-and-future changes become integration and sync problems rather than HomeOps-owned domain behavior.

### Import/export support

Option B supports import/export indirectly through Google Calendar and ICS. HomeOps should not pretend to export Google-owned events as canonical HomeOps data unless it is explicitly making a backup copy. HomeOps exports its own configuration and mappings.

### Future maintenance

Maintenance shifts from calendar semantics to provider integration reliability. Google API changes, auth policy changes, consent/security requirements, and sync edge cases become ongoing concerns.

### Family use cases

Option B is excellent for families already coordinating through Google Calendar across phones and accounts. It is less suitable for households that want a self-hosted hub independent from Google or that want local control over all household data.

### Multi-device use

Option B is very strong for multi-device calendar access outside HomeOps because Google Calendar already provides it. It is also the easiest route to native mobile reminders and existing calendar widgets.

### Integration flexibility

Option B makes Google Calendar central. Other integrations can still exist, but calendar ownership semantics become provider-shaped. HomeOps-specific future features that want to attach domain behavior to events must either encode meaning in titles, store sidecar metadata, or accept limited classification.

### Long-term architectural consistency

Option B fits the adapter/normalization pattern but weakens the PostgreSQL-owned durable household core for calendar data. It is architecturally consistent only if the project explicitly decides calendar is provider-owned while HomeOps owns presentation, mapping, and backup configuration.

## Google Calendar Integration Analysis

### Integration modes under Option A

#### Import only

- **Complexity:** Moderate. HomeOps imports Google or ICS events into HomeOps-owned calendar data.
- **Failure modes:** Duplicate imports, changed source events after import, recurring series mismatch, timezone/all-day conversion errors.
- **User expectations:** Users may expect imported events to keep syncing. The UI must label this as a snapshot import unless refresh behavior exists.

#### Export only

- **Complexity:** Low to moderate. HomeOps exports HomeOps-owned events as ICS or pushes them to Google if credentials exist.
- **Failure modes:** Exported copies diverge, duplicate events in Google, recurrence loss if export is incomplete.
- **User expectations:** Users may expect Google edits to come back to HomeOps. Clear one-way language is required.

#### One-way sync

- **Complexity:** Moderate to high. HomeOps remains canonical and pushes or publishes changes outward.
- **Failure modes:** Failed pushes, partial sync, deleted external copies, rate limits, credentials revoked.
- **User expectations:** Users expect Google to mirror HomeOps after a short delay, not become editable authority.

#### Two-way sync

- **Complexity:** Very high. Conflicts, recurrence exceptions, deletes, simultaneous edits, identity mapping, and provider-specific behavior must be handled.
- **Failure modes:** Data loss, duplicate series, conflict overwrite, broken recurrence, partial sync loops.
- **User expectations:** Users expect edits anywhere to work. This is the riskiest mode and should not be the first integration slice.

### Integration modes under Option B

#### Import only

- **Complexity:** Low if treated as read-only fetch from Google into Agenda display, higher if cached.
- **Failure modes:** Auth failure, API outage, stale cache, missing calendars, rate limits.
- **User expectations:** Users expect HomeOps to show Google Calendar accurately. They may not expect HomeOps editing.

#### Export only

- **Complexity:** Conceptually odd because Google is canonical. Export from HomeOps would mostly mean exporting mappings/settings or cached snapshots.
- **Failure modes:** Users may mistake a cache export for authoritative backup.
- **User expectations:** Users expect Google export to be the event backup, and HomeOps export to preserve HomeOps configuration.

#### One-way sync

- **Complexity:** Moderate. Google-to-HomeOps sync can populate a read model/cache while Google remains authoritative.
- **Failure modes:** Stale cache, deleted events lingering, changed recurrence projections, token expiry, calendar permission changes.
- **User expectations:** Users expect HomeOps to reflect Google reasonably quickly and not lose classification mappings.

#### Two-way sync

- **Complexity:** High. If Google is source of truth, two-way sync effectively means HomeOps edits Google events.
- **Failure modes:** Failed writes, conflicts with Google edits, recurrence edit mismatch, insufficient permissions, duplicate hidden state if HomeOps stores sidecars.
- **User expectations:** Users expect HomeOps to behave like a Google Calendar client. That includes error handling and possibly account/calendar selection UX.

### Analysis conclusion

For both options, two-way sync is the highest-risk integration mode and should not be treated as the default. Under Option A, export or one-way publish is safest. Under Option B, read-only import/one-way Google-to-HomeOps sync is safest. The existing adapter foundation best supports read-only import first.

## Data Portability Analysis

### JSON export/import

JSON is the best primary HomeOps logical export format for HomeOps-owned data. It can preserve Lists, layouts, settings, Manual Events or future EventSeries, recurrence rules, exceptions, source mappings, stable IDs, timestamps, and schema version information. It should be versioned and human-readable where practical.

### ICS export/import

ICS is the best interoperability format for calendar data. It is essential if HomeOps owns calendar events under Option A. ICS should be treated as calendar interchange, not the full HomeOps backup format, because it will not preserve all HomeOps-specific layout, list, setting, or mapping semantics.

Under Option B, ICS is mainly a Google Calendar ecosystem concern. HomeOps may still import/export ICS snapshots, but Google remains authoritative.

### Backup/restore

PostgreSQL backups are necessary for operational recovery, but they are not sufficient for user-facing portability. HomeOps needs logical backup/restore so a household can move between installations or recover data across schema changes without manual database work.

### Google Drive backup workflows

Google Drive is suitable as a destination for exported JSON bundles, ICS files, and possibly encrypted archives. It should not become runtime storage because that would conflict with PostgreSQL-first persistence and introduce file-sync concurrency problems.

### Best alignment

Option A best aligns with accepted portability requirements because HomeOps can define and own the canonical export/import contract for calendar data. Option B aligns only if the project accepts that calendar event portability is primarily delegated to Google, while HomeOps portability covers configuration and mappings.

## Recurrence Analysis

### Facts from recurrence analysis

- Current Manual Events are concrete single occurrences.
- Recurring event support should distinguish logical event management from concrete occurrence rendering.
- One-time events should become non-recurring logical events rather than remain a permanently separate occurrence-only concept.
- Agenda should continue to render concrete normalized occurrences.
- Recurrence should support series editing, occurrence editing, occurrence deletion, and this-and-future edits through exceptions and series splitting.
- Birthdays should remain a dedicated generated source for now and may later become person/contact projections.

### Option A recurrence fit

Option A better supports HomeOps-owned recurring events because HomeOps can design the domain around logical EventSeries, recurrence rules, generated occurrences, exceptions, and this-and-future series splits. It can keep Agenda rendering unchanged while evolving the management model.

### Option B recurrence fit

Option B supports recurrence by delegating it to Google Calendar. This is excellent for common user behavior, but HomeOps loses control over recurrence semantics and must map Google recurrence behavior into normalized events. Series editing and occurrence editing become provider-client problems. If HomeOps avoids writing to Google, it cannot provide native recurrence management at all.

### Analysis conclusion

Option A is stronger for meeting HomeOps-specific recurrence architecture requirements. Option B is stronger only if the project chooses not to own recurrence and accepts Google Calendar behavior as the product behavior.

## Manual Events Analysis

### Alignment with Option A

Manual Events align naturally with Option A. They are already writable, PostgreSQL-backed, HomeOps-owned, and normalized into Agenda. Under Option A, current Manual Events are the seed of a broader HomeOps Calendar model.

### Alignment with Option B

Manual Events do not align naturally with Option B as the sole calendar strategy. They either become a HomeOps-only overlay, a temporary bridge until Google integration exists, or technical debt that must be exported/migrated into Google Calendar.

### Technical debt assessment

- Under Option A, Manual Events become technical debt only if their current concrete-occurrence shape is treated as final. The debt is manageable if they are promoted or migrated into logical one-time EventSeries before recurrence/import/export contracts harden.
- Under Option B, Manual Events are more serious strategic debt because they represent HomeOps-owned calendar state in a Google-owned calendar architecture. The project would need an explicit policy for local-only events, migration to Google, or deprecation.

## Risks

### Strongest risks of Option A

- HomeOps may accidentally rebuild too much of a calendar product.
- Recurrence, exceptions, all-day dates, time zones, and ICS compatibility are hard to implement correctly.
- Native mobile calendar UX, notifications, and family sharing will lag behind Google Calendar unless external access or sync is added later.
- Import/export becomes a product contract that must be maintained across schema changes.
- Existing Manual Events need conceptual migration from concrete occurrences to logical event definitions before many users depend on them.

### Strongest risks of Option B

- Google Calendar becomes architecturally required despite self-hosted-first goals.
- HomeOps calendar functionality depends on OAuth, token storage, provider availability, API quotas, and Google policy changes.
- Current Manual Events become awkward as an overlay, migration source, or redundant local calendar.
- Prefix classification is human-readable but brittle and can be misapplied by normal user edits.
- HomeOps-specific future behavior may require sidecar metadata, undermining the accepted preference to avoid hidden metadata.
- Two-way editing would be complex and failure-prone.

## Decision Assessment

### Strongest arguments for Option A

- It matches the current PostgreSQL-backed Manual Events implementation.
- It best supports self-hosted-first operation.
- It gives HomeOps full data ownership and backup/restore responsibility.
- It aligns with first-class import/export requirements.
- It lets recurrence be designed according to HomeOps architecture rather than provider constraints.
- It keeps Google Calendar optional instead of required.
- It is consistent with layouts, settings, and lists already being HomeOps-owned.

### Strongest arguments for Option B

- Google Calendar already solves recurrence, reminders, mobile access, sharing, and multi-device editing.
- Families may already use Google Calendar as their real calendar.
- Human-readable prefixes avoid hidden metadata and remain understandable outside HomeOps.
- HomeOps can stay focused on display, classification, widgets, and household dashboard experience.
- The existing adapter/normalization boundary can support Google as a read-only provider.

### Analysis conclusion

Do not remain neutral: Option A appears stronger for HomeOps given the accepted decisions and current implementation. Option B is attractive as a usability shortcut, but it makes an external provider the calendar authority and weakens the self-hosted, PostgreSQL-owned, import/export-first direction. If Option B were chosen, it should be an explicit strategic reversal for calendars, not an incremental continuation of the current Manual Events path.

## Recommended Direction

### Recommendation

Adopt Option A: HomeOps Calendar is the source of truth for HomeOps-owned household calendar events.

### Recommended near-term shape

- Keep Google Calendar optional and integration-scoped.
- Do not implement two-way Google sync as the next calendar step.
- Treat the existing Google Calendar adapter as a read-only integration boundary until a future prompt explicitly expands it.
- Promote the Manual Events concept toward a HomeOps Calendar domain before adding recurrence.
- Model one-time events as non-recurring logical event series.
- Generate concrete occurrences for Agenda views.
- Add recurrence exceptions and series splitting when recurrence is implemented.
- Define JSON export/import as the canonical HomeOps backup format.
- Define ICS export/import as calendar interoperability.
- Use Google Drive only as an export/backup destination.

### Open questions

- What is the first supported recurrence scope: daily, weekly, monthly, yearly, or a subset?
- Should HomeOps Calendar support reminders/notifications, or leave those to optional external calendar export/sync?
- What timezone policy should apply to all-day and timed recurring events?
- Should current Manual Events be renamed before recurrence work begins?
- Should Google Calendar integration remain read-only after Option A is accepted, or should one-way export be prioritized?
- Should birthdays remain a dedicated source indefinitely, or later become projections from a People/Contacts domain?

## Next Prompt Context

Use this context for the next planning or implementation prompt:

> HomeOps has selected Option A as the recommended direction: HomeOps Calendar should be the source of truth for HomeOps-owned household calendar events. Google Calendar should remain optional integration, initially read-only import/overlay or export-oriented, not two-way sync. Manual Events should not be extended by bolting recurrence fields onto concrete occurrences. Before recurrence implementation, design or implement a HomeOps Calendar model that treats one-time events as non-recurring logical event series, generates concrete occurrences for Agenda rendering, and leaves room for recurrence rules, occurrence exceptions, and this-and-future series splitting. JSON export/import should be the canonical HomeOps backup format; ICS should be the calendar interoperability format; Google Drive should be an export destination only.

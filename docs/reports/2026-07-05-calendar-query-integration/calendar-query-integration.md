# Summary

Implemented Calendar Query Integration for the persisted calendar read path. Calendar reads now use EventSource lifecycle state before occurrence generation, so visible events are limited to enabled manual sources and enabled healthy imported sources. Hidden source events remain persisted.

# Calendar Query Changes

- Updated `GET /api/events` to include the owning `EventSource` during the efficient database query.
- Added source-level filtering before materializing event series and before occurrence generation.
- Preserved the existing occurrence generation, normalization, sorting, and provider-independent projection flow.

# Visibility Rules

Calendar output now includes events only when the owning source is enabled and either writable/manual-style or healthy:

- Manual writable source events remain visible.
- Healthy imported source events are visible.
- Failed imported source events are hidden.
- Disabled source events are hidden.
- NeverSynced imported source events are hidden.

Hidden events are not deleted; they remain stored with their source and can become visible again if source lifecycle state changes.

# Read-only Projection

Imported event editability now derives from `EventSource.IsWritable` during occurrence projection. Writable manual source events remain editable, and non-writable imported source events project as read-only. Provider event id and location metadata continue to flow through the existing normalized event projection.

# Synchronization Transaction Review

Reviewed the synchronization engine and kept synchronization work transaction-scoped per source. Added an explicit regression test proving a persistence failure during imported `EventSeries` application rolls back both imported event changes and successful `EventSource` metadata updates.

No refresh endpoints, scheduler behavior, provider import orchestration, or backup/restore behavior were changed.

# Performance

Calendar filtering is applied in the EF query before `ToListAsync`, so hidden source events are not loaded and discarded in memory when source lifecycle predicates can be evaluated by the database. Existing ordering and occurrence generation behavior are preserved.

# Tests

Added integration coverage for:

- manual source visibility;
- healthy imported source visibility;
- failed, disabled, and never-synced imported source hiding;
- manual editable projection;
- imported read-only projection;
- mixed manual/imported sources;
- multiple healthy sources;
- multiple hidden sources;
- hidden events remaining persisted;
- synchronization atomic rollback of imported events and source metadata.

# Risks

- Existing one-off projection helpers still default to editable when an `EventSeries` is projected without its owning source loaded, preserving historical helper behavior. The API read path now includes the source and derives editability from `EventSource.IsWritable`.
- Manual visibility is represented through the existing writable source boundary, matching current manual event mutation behavior.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceSynchronizationEngineTests.cs`
- `docs/reports/2026-07-05-calendar-query-integration/calendar-query-integration.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

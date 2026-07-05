# Summary

Reviewed the Calendar Sources backend implementation across persistence, domain modeling, provider configuration, iCal parsing/importing, synchronization, refresh APIs, background scheduling, backup/restore, calendar query integration, OpenAPI, and automated tests. The backend is feature-complete for frontend integration after the defects below were corrected.

# Overall Assessment

The implementation follows the approved provider-neutral backend architecture. Calendar Sources own lifecycle, health, provider configuration, poll interval, and writable/read-only state; EventSeries remains the persisted event model; importers produce normalized provider snapshots; refresh and background scheduling coordinate existing components without embedding synchronization logic.

# Technical Design Compliance

The review found the implementation aligned with the canonical technical design: provider-specific behavior is isolated to importer/configuration boundaries, the synchronization engine remains provider-independent, imported events are treated as synchronized cache, and manual events remain the only writable calendar events.

# End-to-End Workflow Validation

The reviewed implementation supports the requested lifecycle:

1. Create an iCal Feed source through source management.
2. Refresh the source through the refresh API.
3. Persisted imported events become visible once the source is healthy.
4. Later provider snapshots update matching imported events by source/provider identifier.
5. Removed provider events are deleted by synchronization for successful snapshots.
6. Disabling a source hides its events without deleting them.
7. Re-enabling and refreshing restores healthy imported visibility.
8. The scheduler evaluates due enabled supported sources and invokes the refresh dispatcher.
9. Backup exports source configuration and manual events while excluding imported events.
10. Restore recreates external source configuration as NeverSynced.
11. A later refresh repopulates imported events.

# Domain Review

EventSource carries source identity, lifecycle, writability, health, poll interval, synchronization timestamps, and provider configuration ownership. EventSeries carries event content and provider identifiers. The system manual source invariant is enforced by validation and restore logic. Poll intervals remain domain enum values rather than exposed duration fields.

# Persistence Review

Indexes and constraints support source-scoped event queries, provider-event uniqueness, synchronization matching, and configuration ownership. Provider configuration uses the shared EventSourceConfiguration abstraction with concrete iCal feed/file records. The review identified and fixed a restore upsert defect where restoring over an existing external source with the same identifier could conflict with an already-tracked EventSource.

# Importer Review

The iCal feed and file importers preserve provider-specific retrieval/configuration at the importer boundary and emit provider-neutral snapshots and diagnostics. The review identified and fixed a filesystem file-store path validation defect where sibling directories sharing the configured root prefix could be accepted.

# Synchronization Review

The synchronization engine remains provider-independent. It applies create/update/delete behavior from normalized provider snapshots, handles failure paths without deleting existing events, treats Not Modified as unchanged, updates source metadata, and is covered by transaction rollback tests.

# Scheduler Review

The scheduler is implemented as an ASP.NET Core hosted service that delegates work to a scoped runner. The runner selects enabled, non-manual, supported, due sources, guards against concurrent refresh of the same source in-process, logs expected lifecycle events, catches per-source and iteration failures, and does not implement retry queues or synchronization logic.

# Calendar Query Review

Calendar reads filter source lifecycle before occurrence generation. Enabled manual events remain visible and editable through EventSource.IsWritable; enabled healthy imported events are visible and read-only; disabled, failed, and NeverSynced imported sources are hidden without deleting persisted events.

# Backup & Restore Review

Backup includes EventSource metadata/lifecycle/settings/provider configuration and manual event data only. Imported events and synchronization metadata are excluded. Restore preserves provider configuration, keeps disabled sources disabled, resets enabled external sources to NeverSynced, protects the system manual source, and does not trigger synchronization.

# API Review

Refresh Source and Refresh All endpoints expose structured synchronization results without exposing credentials, raw provider configuration secrets, or parser internals. OpenAPI includes the source-management and refresh contracts required by backend consumers. Frontend client generation remains intentionally out of scope.

# Performance Review

Calendar query filtering occurs in the database before occurrence generation. Scheduler source selection loads the bounded set of enabled non-manual sources and applies due/provider checks before dispatch. Synchronization uses source-scoped provider identifiers and timestamp/fingerprint metadata. No confirmed N+1 or excessive-load defects were found during review.

# Test Coverage Review

Existing tests cover source management, iCal parsing/importing, refresh dispatch/API behavior, synchronization atomicity, calendar visibility/editability, backup/restore, OpenAPI operation presence, and scheduler selection/concurrency/failure behavior. This review added targeted regressions for restore upsert behavior and file-store path escape validation.

# Issues Found

- Restore could remove an existing non-system EventSource and then add a restored EventSource with the same identifier in one context, risking duplicate tracked entities and restore failure when applying a backup over an environment with a matching external source.
- Filesystem iCal file loading used a prefix check for storage-root containment, which could accept sibling paths whose absolute path started with the same character prefix as the configured root.

# Fixes Applied

- Restore now upserts existing EventSources by identifier, removes only obsolete non-system sources, and upserts/removes provider configuration through the shared configuration abstraction.
- Filesystem iCal file loading now validates containment using `Path.GetRelativePath` and rejects parent-directory/rooted escapes.
- Regression coverage was added for restoring over an existing external source with the same identifier and for rejecting sibling-directory file references.

# Remaining Risks

- Background synchronization concurrency protection is in-process only; this matches the current monolith deployment assumptions but would need revisiting for multi-instance hosting.
- File-source upload APIs are still intentionally out of scope, so file-provider configuration can be restored but file content availability depends on the configured storage implementation and later upload/import work.

# Production Readiness

The Calendar Sources backend is ready for frontend implementation. The review did not add new product functionality, schedulers beyond the existing background synchronization slice, providers, frontend code, binary artifacts, or screenshots.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/FileSystemICalFileContentStore.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFileImporterTests.cs`
- `docs/reports/2026-07-05-calendar-backend-readiness-review/calendar-backend-readiness-review.md`
- `docs/state/current-state.md`

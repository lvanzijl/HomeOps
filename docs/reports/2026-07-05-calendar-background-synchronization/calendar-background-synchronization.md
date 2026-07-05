# Summary

Implemented automatic Calendar Sources background synchronization. The hosted workflow coordinates existing components only: it finds due configured sources, invokes the refresh dispatcher, and lets the existing provider importers and provider-independent synchronization engine perform the refresh.

# Hosted Service

Added an ASP.NET Core `BackgroundService` that starts with the application outside Testing and VisualReview environments. It runs one startup synchronization pass, then repeats on a simple scheduler period. The hosted service contains no synchronization, importer, or diff logic.

# Scheduling

Scheduling uses the canonical `EventSourcePollInterval` values:

- `EveryHour` maps internally to one hour.
- `Every8Hours` maps internally to eight hours.
- `EveryDay` maps internally to one day.

The scheduler treats `NextSyncAfterUtc` as the preferred due hint. If that hint is missing, it falls back to the last sync attempt/success/failure timestamp plus the source poll interval.

# Source Selection

The scheduler considers enabled non-manual sources for the seeded household. It skips disabled sources, manual sources, unsupported provider types, and sources that are not due. Supported provider types remain limited to iCal Feed and iCal File, matching the refresh dispatcher slice.

# Concurrency

A per-process in-flight source guard prevents two background synchronizations of the same `EventSource` from running concurrently. Different due sources are processed independently in the scheduler iteration.

# Failure Handling

Scheduler iteration failures are logged and swallowed so the hosted service can continue. Per-source refresh failures and unexpected per-source exceptions are logged without stopping remaining sources. Synchronization failures remain handled by the existing synchronization engine and result path.

# Logging

Structured logging was added for service start/stop, source synchronization start/completion, skipped unsupported/not-due/in-flight sources, per-source unexpected failures, and failed scheduler iterations.

# Tests

Added scheduler coverage for:

- EveryHour, Every8Hours, and EveryDay due calculations;
- disabled/manual/unsupported/not-due source skipping;
- due source processing;
- preventing concurrent synchronization of the same source;
- processing multiple sources independently;
- continuing after dispatcher failures;
- surviving scheduler iteration failures;
- hosted service startup and shutdown.

# Risks

- The in-flight guard is process-local, which is appropriate for the current modular monolith deployment. If HomeOps later runs multiple API instances, cross-process synchronization exclusion would need a database/advisory lock slice.
- The scheduler is intentionally simple: no exponential retry, retry queue, push notifications, or frontend updates were added.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/Synchronization/ICalendarSourceRefreshDispatcher.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceRefreshDispatcher.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarBackgroundSynchronizationRunner.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarBackgroundSynchronizationHostedService.cs`
- `src/HomeOps.Api/CalendarEvents/EventSourceManagementEndpoints.cs`
- `src/HomeOps.Api/Program.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarBackgroundSynchronizationTests.cs`
- `docs/reports/2026-07-05-calendar-background-synchronization/calendar-background-synchronization.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

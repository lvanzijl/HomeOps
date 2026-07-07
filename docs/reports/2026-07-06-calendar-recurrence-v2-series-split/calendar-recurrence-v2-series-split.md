# Summary

Implemented the Calendar Recurrence V2 series split slice for backend APIs. "Deze en volgende afspraken" now uses the frozen split model: the current `EventSeries` ends before the selected original occurrence and a new `EventSeries` begins at that occurrence.

# Implemented

- Added an API operation for this-and-future series edits.
- Added an API operation for this-and-future delete.
- Added a split request contract with optional future-template and recurrence-rule changes.
- Regenerated backend OpenAPI for the new backend contract surface.

# Series Split

The split operation targets a recurring writable series by `EventSeriesId` plus `OccurrenceKey`. The old series receives an `OnDate` recurrence end immediately before the selected occurrence, future exceptions are removed from the old series, and a new series is created with copied source ownership, template, recurrence metadata, and a copied or replacement recurrence rule. Future exceptions are not copied to the new series.

# Future Delete

Delete-this-and-future ends the existing recurrence before the selected occurrence. It does not create a new series, does not delete past history, and does not create skipped exceptions for future occurrences.

# Transaction Behavior

Series split and future delete run inside a database transaction when the EF provider supports relational transactions. Validation occurs before persistence changes so invalid split payloads leave the original series unchanged.

# Compatibility

Existing whole-series updates and one-occurrence operations remain unchanged. Legacy `RecurrenceType` recurring series can be split through the existing compatibility recurrence mapping, while newly written split state uses `EventRecurrenceRule`.

# Tests

Added API/integration tests for daily, weekly, monthly, and yearly split behavior; copied source/rule data; future occurrence movement; past exception preservation; future exception removal; future delete; and failed split validation leaving the original series unchanged.

# Risks

- Provider recurrence writeback, synchronization effects, frontend edit-scope UI, and iCalendar mapping remain out of scope.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2SeriesSplitApiTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-series-split/calendar-recurrence-v2-series-split.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

# Calendar Terminology Cleanup

## Summary
Aligned current calendar contracts and UI wording around HomeOps Calendar and EventSeries terminology while keeping compatibility aliases where existing module consumers still expect prior names.

## Implemented
- Replaced backend request/response contract names with `EventSeriesDto`, `CreateEventSeriesRequest`, and `UpdateEventSeriesRequest`.
- Regenerated OpenAPI and the TypeScript API client so generated contracts use EventSeries naming.
- Renamed the writable event source display name from `HomeOps Manual Events` to `HomeOps Calendar` through seed data and migration update data.
- Updated Agenda UI labels, validation messages, and tests from Manual Event wording to calendar event wording.
- Kept small frontend compatibility aliases for existing imports from the prior Agenda API module.

## Verified
- Event create, update, delete, source loading, Agenda rendering, and source filtering tests still pass.
- Generated API client compiles with the renamed EventSeries contracts.

## Risks
- Historical migration names, historical report text, and the existing event source type value `manual` remain for compatibility/history.
- Compatibility aliases should be removed only when no internal consumers rely on the previous module names.

## Modified Files
- Backend EventSeries DTOs/endpoints.
- Generated OpenAPI and TypeScript API client.
- Agenda client API mapping, widget UI, and tests.
- Event source seed/migration data.

## Next Prompt Context
HomeOps Calendar/EventSeries terminology is now the active contract terminology. Existing `/api/events` routes remain stable. Do not reintroduce Manual Event contract names except as deliberate compatibility aliases.

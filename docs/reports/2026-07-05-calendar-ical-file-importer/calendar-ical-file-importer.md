# Summary

Implemented the backend-only iCal File Importer slice. The importer loads an iCal File source configuration, retrieves stored ICS content through a provider-agnostic content store abstraction, invokes the shared iCalendar parser, and returns a provider-independent normalized snapshot or structured failure result. It does not synchronize, persist `EventSeries`, update source state, expose APIs, add upload endpoints, add background workers, or touch frontend UI.

# Importer Responsibilities

- Accept an `EventSource` and verify it is an iCal File source.
- Load the associated `ICalFileSourceConfiguration` read-only from the existing database context.
- Validate configuration presence, file reference, original filename, and content hash shape.
- Load stored ICS content through `ICalFileContentStore`.
- Preserve provider and file metadata for future synchronization slices.
- Invoke the shared iCalendar parser and preserve parser diagnostics.
- Return a provider-independent result model containing normalized events or a structured failure.

# File Loading

- Uses `ICalFileContentStore` so the importer does not know whether content comes from disk, database, blob storage, or another provider.
- The content store returns content plus optional content length and last-modified metadata.
- The slice adds the abstraction and mocked tests only; it intentionally does not add concrete file-system/blob/database storage or upload workflows.

# Result Model

- `ICalFileImportResult` represents success or failure.
- Success contains normalized iCalendar events, parser diagnostics, provider metadata, and file metadata.
- Failure contains a failure category, sanitized message, diagnostics, and any provider/file metadata available.
- `ICalFileProviderMetadata` includes source id, source type, and optional provider source id.
- `ICalFileMetadata` includes file reference, original filename, content hash, uploaded timestamp, optional content length, and optional last-modified timestamp.

# Failure Handling

Implemented failure categories:

- `MissingConfiguration`.
- `MissingFile`.
- `InvalidReference`.
- `InvalidContent`.
- `ParseFailure`.
- `StorageFailure`.
- `AccessDenied`.
- `Unknown`.

Normal configuration and storage problems return structured results instead of being thrown to callers. Parser diagnostics are preserved on parse failures and on successful imports that contain recoverable parser warnings.

# Tests

- Added mocked storage importer tests for valid configuration, missing configuration, missing file reference, invalid file reference, missing filename, invalid content hash, successful content load, missing file, storage failure, access denied, invalid storage reference, empty content, malformed ICS, preserved parser diagnostics, file metadata, provider metadata, and unexpected storage exceptions.
- No live files outside controlled test data are used.
- Ran the focused iCal File importer test suite and the full backend test suite.

# Risks

- The importer exposes file metadata but intentionally does not persist new metadata or update source state; future synchronization slices must decide how metadata affects sync decisions.
- `ICalFileContentStore` is intentionally a narrow importer-facing abstraction because no concrete repository storage abstraction exists yet for uploaded iCal content.
- Content hash validation is limited to a non-empty, whitespace-free bounded string to remain compatible with the existing persisted configuration contract while still catching malformed configuration.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileContentStore.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileImportFailureCategory.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileImportResult.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileImporter.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFileImporterTests.cs`
- `docs/reports/2026-07-05-calendar-ical-file-importer/calendar-ical-file-importer.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

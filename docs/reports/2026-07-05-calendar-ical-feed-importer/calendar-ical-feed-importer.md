# Summary

Implemented the backend-only iCal Feed Importer slice. The importer loads an iCal Feed source configuration, retrieves raw ICS content with `HttpClient`, invokes the shared iCalendar parser, and returns a provider-independent normalized snapshot or structured failure result. It does not synchronize, persist events, create `EventSeries`, update source status, expose APIs, add background workers, or touch frontend UI.

# Importer Responsibilities

- Accept an `EventSource` and verify it is an iCal Feed source.
- Load the associated `ICalFeedSourceConfiguration` read-only from the existing database context.
- Validate feed URL shape and supported schemes.
- Retrieve feed content over HTTP or HTTPS.
- Preserve provider/retrieval metadata for future synchronization slices.
- Invoke the shared iCalendar parser and preserve parser diagnostics.
- Return a provider-independent result model containing normalized events or a structured failure.

# HTTP Retrieval

- Uses `HttpClient`.
- Supports `http` and `https` feed URLs.
- Rejects unsupported schemes before any HTTP call.
- Sends conditional request headers from configuration when available: `If-None-Match` and `If-Modified-Since`.
- Follows redirects with a bounded redirect limit and rejects redirect targets that switch to unsupported schemes.
- Exposes response metadata including status code, final URI, ETag, Last-Modified, content type, content length, and 304 Not Modified state.

# Result Model

- `ICalFeedImportResult` represents success or failure.
- Success contains normalized iCalendar events, parser diagnostics, provider metadata, and retrieval metadata.
- Failure contains a failure category, sanitized message, optional HTTP status, diagnostics, and any provider/retrieval metadata available.
- `ICalFeedProviderMetadata` includes source id, source type, optional provider source id, and the feed URI.
- `ICalFeedRetrievalMetadata` includes HTTP and cache metadata for future slices to decide whether and when to persist.

# Failure Handling

Implemented failure categories:

- `InvalidConfiguration`.
- `InvalidUrl`.
- `UnsupportedScheme`.
- `NetworkFailure`.
- `Timeout`.
- `Unauthorized`.
- `Forbidden`.
- `NotFound`.
- `ServerError`.
- `InvalidContent`.
- `ParseFailure`.
- `Unknown`.

Normal provider failures return structured results instead of being thrown to callers. Parser diagnostics are preserved on parse failures and on successful imports that contain recoverable parser warnings.

# Tests

- Added mocked HTTP importer tests for successful HTTP retrieval, HTTPS retrieval, redirect handling, invalid URL, unsupported scheme, 401, 403, 404, 500, timeout, network failure, malformed ICS, preserved parser diagnostics, ETag/Last-Modified/content-type metadata, 304 Not Modified, and missing configuration.
- No live internet resources are used.
- Ran the focused iCal Feed importer test suite and the full backend test suite.

# Risks

- The importer exposes HTTP cache metadata but intentionally does not persist updated ETag or Last-Modified values; a future synchronization slice must decide when to store them.
- 304 Not Modified returns a successful empty snapshot with retrieval metadata because this slice has no persisted previous snapshot to reuse.
- Redirect handling is intentionally bounded and provider-local; retries, scheduler behavior, source health updates, and refresh APIs remain out of scope.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFeedImportFailureCategory.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFeedImportResult.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFeedImporter.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFeedImporterTests.cs`
- `docs/reports/2026-07-05-calendar-ical-feed-importer/calendar-ical-feed-importer.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

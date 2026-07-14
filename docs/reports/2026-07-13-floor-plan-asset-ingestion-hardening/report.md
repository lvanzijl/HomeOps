# Floor-plan asset ingestion hardening

## Summary
Hardened the accepted backend-only floor-plan asset ingestion foundation without expanding product scope.

## Risks addressed
- Backup/restore now validates asset graphs and derivative payloads before destructive mutation.
- Restored Active assets require valid safe derivative content.
- SVG sanitization has explicit supported-safety rules and focused tests.
- Raster validation rejects truncated and oversized content.
- Storage references remain server-owned relative references under the configured root.

## Backup/restore rehydration
- Backups include asset identity, Floor reference, media type, filename, lifecycle state, source hash metadata, derivative hash, coordinate-basis dimensions, replacement relationship, timestamps, availability state, and safe derivative payload when available.
- Restore validates IDs, Floor references, replacement relationships, cycles, one-Active-per-Floor, media type, hash, and dimensions before replacement.
- SVG derivatives are sanitized again during restore instead of being trusted as backed-up bytes.
- Restored files are written to new server-owned internal references; physical paths are not exported.

## Atomicity and compensation
- Restore stages derivative validation before pre-restore snapshot and database mutation.
- Database replacement remains inside the existing restore transaction where the provider supports transactions.
- Runtime files are written only after derivative validation succeeds and before metadata is persisted.
- If validation fails, existing metadata and active files remain unchanged.
- Filesystem/database atomicity cannot be perfect across all filesystems; compensation avoids persisting metadata for failed writes and keeps generated references server-owned.

## SVG sanitizer rules
- The sanitizer rejects XML entity/doctype usage, unsupported stylesheets, excessive element counts, excessive nesting, oversized attributes, malformed XML, and missing dimensions.
- It removes scripts, event handlers, foreignObject, active embedded content, animation elements, external URLs, unsafe href/xlink references, data/javascript URLs, and remote url() references.
- It preserves ordinary static exported floor-plan shapes and text when the derivative remains renderable.

## Raster validation
- PNG and JPEG validation checks signatures, required structural markers, end markers, dimensions, configured maximum dimensions, and extension/content consistency.
- Orientation-aware raster transcoding and resizing remain deferred and are not claimed as implemented.

## Storage safety
- Generated references are server-owned and relative.
- Absolute paths, traversal segments, empty path segments, and separator manipulation are rejected during reference resolution.
- Atomic writes use temporary files and clean temporary leftovers.
- Failed validation does not write runtime files; failed storage writes remove partially created source/derivative files where possible.
- Archive does not purge files; no purge endpoint was added.

## Lifecycle verification
- Tests cover upload-to-Validated, activation, replacement draft behavior, replacement activation, rollback, unsafe/missing derivatives, and derivative-only runtime retrieval.
- Active missing derivative backups are rejected and cannot restore as Active.
- Replacement relationships are validated for self-reference and cycles.

## Migration verification
- Verified the migration and snapshot still build.
- Generated an idempotent migration script with EF tooling to validate schema script generation.
- The schema retains restrictive Household/Floor/replacement FKs, string enum columns, content-reference lengths, timestamps, indexes, and the filtered one-Active-per-Floor unique index.

## Tests
- Focused FloorPlanAsset tests passed.
- FloorPlans backend subset passed.
- Full backend suite passed.
- EF idempotent migration script generation passed.

## Remaining limitations
- Orientation-aware raster transcoding remains deferred.
- Raster resizing remains deferred.
- Visual comparison of sanitized SVG appearance remains deferred.
- Overlay compatibility/review remains deferred.
- Storage retention and destructive purge policy remain deferred beyond safe archive behavior.

## Modified files
- Backend floor-plan asset service, portability contract/service, startup configuration, hardening tests, and this report.

## Explicitly out of scope
- No polygons or overlays.
- No frontend.
- No runtime plan rendering.
- No climate readings or Stories.
- No Home Assistant integration.

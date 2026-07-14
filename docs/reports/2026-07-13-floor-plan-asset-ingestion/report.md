# Floor-plan asset ingestion foundation

## Summary
Implemented the backend-only FamilyBoard floor-plan asset ingestion and lifecycle foundation for canonical Floors.

## Implemented
- Floor-owned floor-plan asset metadata with lifecycle states: Draft, Validated, Active, Replaced, Archived, Invalid, and Missing.
- Backend upload, validation, derivative creation, activation, replacement activation, rollback, archive, missing marking, active lookup, listing, metadata lookup, and safe derivative retrieval endpoints.
- Persistence migration and model snapshot updates.
- Incremental backup export/restore fields for asset metadata and derivative payloads.

## Domain decisions
- A Floor may have no Active asset.
- Exactly one Active asset per Floor is enforced by a filtered unique database index.
- Upload creates a Validated asset after synchronous validation and safe derivative creation; activation is explicit.
- Replacement uploads reference the current Active asset and do not replace it until explicit activation.

## Storage model
- Asset metadata is stored in PostgreSQL through EF Core.
- File bytes are stored outside database columns under a provider-neutral content-reference abstraction rooted at configurable `FloorPlanAssets:StorageRoot`.
- Source and derivative references are relative internal references, not exposed physical paths.

## Upload and validation
- Supported V1 formats are SVG, PNG, JPG, and JPEG.
- Content signatures are inspected and filename extensions must match detected content.
- Upload size and raster dimensions are governed by configurable conservative defaults.
- Filenames are normalized to basename-only safe names.

## SVG safety
- Raw SVG is retained only as protected source content.
- Runtime retrieval serves the safe derivative endpoint only.
- Sanitization removes scripts, event handlers, external references, foreignObject, embedded active content, and animation elements.
- SVG coordinate basis comes from a non-empty viewBox or deterministic dimensions.

## Raster normalization
- PNG and JPEG dimensions are parsed from file content.
- The validated raster content is retained as the deterministic safe derivative for this backend foundation.
- Orientation-aware transcoding and optional resizing are deferred behind configuration and future imaging-library choice.

## Lifecycle
- Validated assets can become Active explicitly.
- Activating a replacement marks the previous Active asset Replaced atomically.
- Rollback reactivates the most recent retained Replaced asset when derivative content exists.
- Missing and Invalid assets cannot activate.
- Archive preserves metadata and content references.

## API/contracts
- Added backend APIs for list, metadata lookup, upload, active lookup, activation, rollback, archive, missing marking, and derivative retrieval.
- Raw source content is not exposed by normal household-runtime APIs.

## Persistence/migration
- Added `FloorPlanAssets` table with household/floor FKs, string enum persistence, dimensions, coordinate basis, content hashes, internal references, replacement relationship, timestamps, indexes, and one-active-per-Floor filtered unique index.

## Backup/restore
- Backup exports asset identity, Floor reference, filename, media type, hash, lifecycle state, dimensions, coordinate basis, replacement relationships, timestamps, availability state, and derivative content when available.
- Restore preserves missing metadata and marks active assets without derivative content as Missing.
- Legacy absent sections remain compatible.

## Tests
- Build validation completed successfully.
- Focused automated behavioral tests for every requested edge are not yet exhaustive in this implementation report.

## Risks/limitations
- Raster derivative normalization currently validates and preserves original PNG/JPEG bytes rather than transcoding.
- Backup restore writes metadata but derivative byte rehydration is intentionally conservative and requires further hardening before production restore of content bytes.
- SVG sanitizer is deliberately restrictive but should be reviewed before broad untrusted SVG use.

## Deferred scope
- No polygons or overlays.
- No canvas/editor frontend.
- No runtime floor-plan UI.
- No climate readings or Stories.
- No Home Assistant work.

## Modified files
- Backend asset domain, DTO, service, endpoints, DI, EF model, migration/model snapshot, portability DTO/service, current state, phase roadmap, and this report.

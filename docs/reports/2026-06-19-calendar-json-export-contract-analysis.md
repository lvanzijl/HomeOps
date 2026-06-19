# Calendar JSON Export Contract Analysis

## Summary

This is an analysis-only report. No implementation, tests, migrations, database changes, or documentation updates outside this report were performed. Preflight `dotnet --version` returned `10.0.301`.

Recommended direction: HomeOps should define a versioned, logical JSON export contract centered on HomeOps-owned `EventSeries` records, event source metadata, household timezone metadata, categories, and future recurrence/exception slots. `EventOccurrence` should not be canonical export data because it is derived projection output. A future export may include occurrence snapshots only as optional diagnostics or preview data, explicitly marked non-authoritative.

The highest-risk areas are identifier collision on import, recurrence migration compatibility, incomplete timezone semantics, and accidentally exporting database-shaped data rather than a stable logical contract.

## Export Scope Analysis

| Concept | Classification | Rationale |
| --- | --- | --- |
| `EventSeries` | **Required** | It is the persisted logical calendar entity and the source-of-truth unit needed to restore HomeOps Calendar. One-time events are non-recurring series. |
| `EventOccurrence` | **Should not be exported as canonical data** | Occurrences are projection-only and must be regenerated from series, recurrence, exceptions, and household timezone. Optional preview/diagnostic occurrence snapshots may exist later, but imports must ignore them for source-of-truth restoration. |
| `EventException` | **Recommended now as reserved schema; required once recurrence exists** | Recurrence without skipped/modified occurrences is not future-proof. Even before implementation, the export contract should reserve a first-class collection for exceptions so recurrence can be added without redesign. |
| `RecurrenceRule` | **Recommended now as nullable/reserved schema; required once recurrence exists** | Current data is non-recurring, but the schema must reserve a logical recurrence field on `EventSeries` so old non-recurring exports remain valid when recurrence is introduced. |
| Event Sources | **Required** | Source identity, source type, capability, display name, color, and enabled/default visibility metadata are needed to restore source ownership and avoid mixing HomeOps-owned data with read-only integrations. |
| Categories | **Recommended** | Future categories will likely be user-visible classification data and should survive upgrade/migration. They should be exported even if only a minimal category model exists initially. |
| Colors | **Recommended** | Colors are presentation metadata with user meaning. They belong in source/category/series metadata, not widget-specific settings. |
| Icons | **Optional** | Icons are useful UI metadata but risk coupling exports to a frontend icon library. Export stable semantic icon keys only if HomeOps defines them; do not export generated assets or library-specific component names as canonical data. |
| Metadata | **Recommended with constraints** | Core metadata such as created/updated timestamps, import provenance, schema/domain version, and external identities helps migrations and deduplication. Free-form metadata should be namespaced and non-authoritative. |
| Ownership | **Required** | Household ownership and HomeOps-owned versus external/read-only source semantics are necessary for restore behavior and future multi-household migration. V1 can export a single household identity and timezone without adding multi-household behavior. |

Canonical export should include HomeOps-owned calendar data. Read-only generated sources such as sample birthdays or external Google Calendar overlays should not be exported as if they are HomeOps-owned source-of-truth data unless a future source explicitly becomes HomeOps-managed. External source configuration may be exported separately from imported event content.

## Export Philosophy Analysis

### Option A — Logical export only

A logical export contains series, recurrence definitions, exceptions, sources, categories, ownership, timezone, identifiers, and migration metadata. It excludes generated occurrence lists as source-of-truth data.

Benefits:
- Preserves the HomeOps calendar model rather than a display projection.
- Avoids drift between stored occurrences and regenerated occurrences.
- Supports future recurrence, exception, and timezone migrations.
- Keeps exports compact and less horizon-dependent.

Risks:
- Restores require correct occurrence-generation code.
- Debugging migration regressions may be harder without a reference occurrence snapshot.
- Users cannot inspect every future rendered date directly in the canonical file.

### Option B — Logical export plus derived occurrence data

A combined export includes both source-of-truth series and a generated occurrence window.

Benefits:
- Useful for human audit and migration verification.
- Can help compare pre-upgrade and post-upgrade projection behavior.
- May support emergency recovery if recurrence expansion code changes unexpectedly.

Risks:
- Derived data may be mistaken for authoritative data.
- Exports become range-window dependent and incomplete by design.
- Occurrence snapshots can become stale after timezone database updates or recurrence engine fixes.
- Import behavior becomes more complex if logical data and derived data disagree.

### Canonical approach

HomeOps should adopt **Option A as canonical**: logical export only. If future tooling needs derived occurrence data, it should be placed in a clearly non-authoritative `diagnostics` or `previewOccurrences` section with an export window, generation timestamp, and rule that import never restores those occurrences as source-of-truth records.

## Versioning Strategy Analysis

Recommended versioning strategy:

- Use a top-level `format` identifier, for example `homeops.calendar.export`.
- Use a top-level `schemaVersion` with semantic major/minor meaning.
- Use a `calendarVersion` or domain version inside the calendar payload so future whole-home exports can evolve domains independently.
- Include `exportedAt`, `homeOpsVersion` when available, and `timezoneDatabaseVersion` when available.
- Treat unknown optional fields as preserved-or-ignored metadata, not import failures.
- Reject unsupported future major versions by default unless an explicit compatibility mode exists.
- Permit older minor versions to import through migration adapters.
- Avoid encoding EF migration names or table names in the canonical schema.

Unknown field policy should be conservative:
- Unknown top-level future major fields: ignore only if the schema version is supported.
- Unknown namespaced metadata fields: preserve if round-tripping is possible, otherwise warn.
- Unknown required core fields: fail validation.
- Unknown recurrence features in a supported schema: reject, preserve read-only, or import as unsupported only if the future recurrence policy explicitly allows it.

Migration support should be explicit. Import should first validate the export version, transform it into the current logical import model, then apply restore/merge behavior. This avoids tying old export support to current database entities.

## Identifier Strategy Analysis

### Stable identifiers

Canonical exports should include stable logical identifiers for:
- household export identity;
- event sources;
- categories;
- event series;
- future recurrence rules if modeled separately;
- future event exceptions;
- external/import provenance identities.

Identifiers should be stable across export/import for full restore. They should not be assumed globally safe when importing into an existing installation.

### Import behavior

HomeOps should support configurable identifier behavior eventually:

1. **Preserve IDs**
   - Best for full restore into an empty or replacement installation.
   - Minimizes link breakage between series, sources, categories, future exceptions, and future settings.
   - Risk: collisions when importing into an existing installation.

2. **Regenerate IDs**
   - Best for selective import or importing another household's file.
   - Requires a complete ID mapping table during import.
   - Risk: external references and future audit/provenance links can be weakened if not mapped clearly.

3. **Auto/map IDs**
   - Best long-term default for merge import.
   - Preserves IDs where safe, regenerates on collision, and records import mappings.
   - Risk: complexity and duplicate detection errors.

### Restore behavior

For the first implementation, full restore should prefer preserving IDs when restoring into an empty database or replacing the calendar domain. Selective or merge import should use generated IDs or mapped IDs to avoid overwriting unrelated data.

Exports should also carry `sourceStableId` or equivalent human-stable keys for known built-in sources, but import must not rely only on display names because names may be translated or edited.

## Restore Strategy Analysis

### Full restore

Full restore replaces the HomeOps Calendar domain with the export contents. It should exist first because the primary requirement is preventing data loss during upgrades and migrations.

Requirements:
- validate the entire export before applying changes;
- create a pre-restore backup or require an operator confirmation in future UI;
- preserve IDs when safe;
- restore sources, categories, series, and future exceptions atomically;
- reject partial success unless explicit recovery tooling exists.

### Selective import

Selective import imports chosen series/categories/sources from a file.

Value:
- useful for recovering accidentally deleted events;
- useful for moving events between installations;
- avoids replacing the household calendar.

Risks:
- source/category dependencies must be imported or mapped;
- recurrence exceptions may be orphaned if users select partial series data;
- duplicate detection is hard.

Selective import should exist eventually, but not first.

### Merge import

Merge import combines an export with an existing calendar and attempts to deduplicate or update matching records.

Value:
- useful for migration and multi-install consolidation.

Risks:
- highest data-loss and duplicate-creation risk;
- requires conflict resolution UX;
- requires stable IDs, import provenance, timestamps, and possibly content hashes;
- recurrence conflicts can be destructive if merged incorrectly.

Merge import should be designed later, after full restore proves the schema and validation path.

### Recommended sequencing

First mode: **full calendar restore** from canonical JSON, preferably into an empty/replacement calendar domain with validated preserve-ID behavior.

Later modes: selective import, then merge import only after conflict reporting and dry-run validation are available.

## Category/Metadata Analysis

Future categories should be exported as first-class logical records rather than embedded strings only. Recommended category fields:

- stable category ID;
- display name;
- optional description;
- color token or hex color;
- optional semantic icon key;
- sort/order metadata if user-managed;
- archived/active state if introduced later;
- created/updated timestamps if categories are user-managed.

Series should reference categories by ID. A denormalized category name may be included only as a human-readable fallback, not the authoritative link.

Color export should use stable, portable values. If HomeOps uses design tokens, export both the token and resolved color only if the token is stable. If arbitrary colors are allowed, export normalized hex values. Avoid exporting CSS class names as canonical data.

Metadata should be split into:
- **core fields** needed for restore and migration;
- **provenance** such as imported-from format, external UID, previous HomeOps ID, and import timestamp;
- **namespaced extensions** for future optional data.

Ownership metadata should include the single V1 household identity and timezone. It should not imply multi-household features, users, roles, or authentication.

## Recurrence Readiness Analysis

The export format must reserve space for recurrence without implementing recurrence now.

Recommended reserved shape:
- `recurrence` nullable on each `EventSeries`;
- `exceptions` collection, empty in current exports;
- recurrence timezone semantics using household timezone in V1;
- date-only versus timed event kind as a required field;
- all-day start date and exclusive end date;
- timed local start/end date-time or date plus time fields;
- recurrence rule version/type, even if null today;
- future unsupported recurrence preservation policy.

Fields that must not be omitted from the future-proof contract:
- event kind (`allDay`/date-only versus timed);
- local date/time values;
- household timezone, defaulting to `Europe/Amsterdam` in V1;
- exclusive end-date semantics for multi-day all-day events;
- stable series IDs for exception targeting;
- future exception identifiers that can refer to an original occurrence key without relying on stored `EventOccurrence` rows.

Open recurrence risk: if HomeOps later adopts per-series timezones, V1 household-timezone exports must migrate cleanly by assigning the household timezone to imported timed series. The schema should therefore make timezone placement explicit even if V1 only supports one household timezone.

## Google Drive Backup Analysis

Google Drive should be an export destination only. It should not be runtime storage, sync coordination, or the source of truth.

Recommended package layout for a future Drive backup:

```text
HomeOps-backup-YYYYMMDD-HHMMSSZ/
  manifest.json
  calendar.json
  checksums.json
  README.txt
  optional/
    calendar-preview-occurrences.json
    calendar.ics
```

For a calendar-only export, a single JSON file can be acceptable initially, but a package layout is safer once checksums, manifests, optional ICS, or multiple domains are added.

Recommended naming:
- `homeops-calendar-export-YYYYMMDD-HHMMSSZ-schema-v1.json` for a single calendar export;
- `homeops-backup-YYYYMMDD-HHMMSSZ.zip` for a multi-file backup package;
- include household/export ID in the manifest, not necessarily in the filename, to avoid leaking too much context.

Recommended manifest fields:
- export format and schema version;
- created timestamp in UTC;
- included domains;
- household timezone;
- HomeOps app version/build when available;
- checksums for each file;
- whether optional files are authoritative or diagnostic.

Risks:
- Drive folder sync can create multiple conflicting backup files; naming must be timestamped and immutable.
- Users may edit JSON manually; imports need strict validation and clear error reporting.
- Backups may contain private household data; encryption/password protection is a future open question.

## Risks

- **Data loss risk:** importing a partial or invalid export over existing calendar data could delete valid records unless validation and atomic restore are enforced.
- **Identifier collision risk:** preserving IDs during merge/selective import can overwrite unrelated records.
- **Duplicate risk:** regenerating IDs without duplicate detection can create repeated events after repeated imports.
- **Versioning risk:** a schema without major/minor semantics can make future imports ambiguous.
- **Database-shape risk:** exporting EF/table-shaped records would make future schema migrations harder and expose implementation details.
- **Occurrence authority risk:** exporting derived `EventOccurrence` as canonical data would undermine the EventSeries source-of-truth decision.
- **Recurrence risk:** failing to reserve recurrence and exception structures now could force a breaking export redesign later.
- **Timezone risk:** omitting household timezone or date-only semantics can shift events after restore, especially all-day and future recurring events.
- **External source risk:** exporting read-only Google or birthday projection data as HomeOps-owned events could create false ownership and duplicates.
- **Privacy risk:** Google Drive backups can expose household schedules if stored unencrypted.

## Open Questions

- Should first restore require an empty calendar domain, or can it replace existing calendar data after confirmation?
- Should canonical exports include only HomeOps-owned event sources, or also non-authoritative external source configuration?
- What exact ID format should canonical exports use: existing database GUIDs, separate public stable IDs, or both?
- Should import preserve created/updated timestamps exactly, or record restore timestamps separately?
- Should category colors use design tokens, hex values, or both?
- What fields belong in allowed namespaced metadata, and which metadata must be promoted to first-class schema fields?
- Should future unsupported recurrence rules be rejected, preserved read-only, or simplified?
- Should future Google Drive backups be encrypted by default?
- Should `calendar.json` be standalone, or should all future exports use a manifest/package from the first implementation?
- How much dry-run validation/reporting is required before any destructive full restore is allowed?

## Recommended Direction

- Define canonical JSON as a **logical HomeOps Calendar export**, not a database dump and not an occurrence projection.
- Make `EventSeries`, event sources, household timezone, ownership, categories, and metadata/provenance the core exported concepts.
- Reserve first-class nullable/empty structures for `RecurrenceRule` and `EventException` now, while keeping runtime recurrence unimplemented.
- Exclude `EventOccurrence` from canonical restore data. Permit optional diagnostic occurrence previews only if clearly marked non-authoritative.
- Implement full calendar restore first in a future implementation slice, with preserve-ID behavior only when replacing/restoring into a safe target.
- Defer selective and merge imports until dry-run validation, conflict reporting, and ID mapping are designed.
- Treat Google Drive as immutable export package storage only.
- Keep PostgreSQL backups for operational recovery and JSON exports for logical portability/migration safety.

## Next Prompt Context

HomeOps Calendar is the source of truth. `EventSeries` is the persisted logical entity; `EventOccurrence` is projection-only and must not become canonical export data. The future JSON export/import contract should be logical, versioned, and migration-oriented. It should export event sources, ownership, household timezone, categories, metadata/provenance, and event series. It should reserve nullable/empty recurrence and exception structures without implementing recurrence. First implementation should focus on validated full calendar export/restore, not selective or merge import. Google Drive should be a destination for immutable timestamped JSON/package backups only, not runtime storage. Do not implement recurrence, ICS, Google sync, migrations, database changes, or occurrence persistence as part of the export contract design.

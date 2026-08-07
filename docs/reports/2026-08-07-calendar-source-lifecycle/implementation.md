# Slice 3.5 calendar source lifecycle

## Outcome

Slice 3.5 is complete. Calendar sources now support real managed file upload and a truthful, recoverable lifecycle without exposing server storage references.

The API now accepts real multipart `.ics` uploads and replacements up to 5 MiB. Uploads are decoded, parsed, duplicate-checked, and normalized in the household zone before a managed file or database row changes. Managed content uses opaque generated references, SHA-256, original filename, byte length, and server upload time. Replacement retains the previous file until the prepared snapshot commits successfully.

Calendar-source DTOs expose only safe file metadata. The legacy file-reference request contract is removed from OpenAPI. HTTPS feeds retain normal creation and use preflighted reconnect updates. Archive preserves configuration/content while hiding imported events; restore refreshes before exposure; confirmed permanent removal deletes imported series, configuration, source, and managed file.

Settings keeps the approved dashboard composition unchanged. Upload, replacement, archive consequences, reconnect, restore, and permanent removal use bounded dialogs; source-card growth remains inside the existing internally scrolling source list. The viewport authority is [viewport-analysis.md](./viewport-analysis.md).

## Validation

- Backend full suite: 615/615 passed after final contract hardening.
- Frontend full suite: 336/336 passed with the documented 15-second timeout.
- Backend and frontend production builds passed.
- EF pending-model check reported no drift; the idempotent migration script generated successfully.
- Pinned NSwag 14.7.1 ran twice after the public request-contract change; OpenAPI and generated-client hashes were identical on the second pass.
- Required PostgreSQL migration validation passed 3/3 through the running Rancher Desktop Docker engine.
- The Playwright suite passed 6/6, including zero document-level scrolling at 1440×900 and 1366×768.

The final changeset audit found no repository-local caches, browser artifacts, build outputs, screenshots, videos, binary assets, or unrelated feature changes.

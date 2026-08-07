# Slice 3.6 stable per-device settings identity

## Outcome

Slice 3.6 is complete. Agenda layer visibility now belongs to a versioned browser/device identity with an explicit server lifecycle rather than an untracked local key.

The client stores schema-versioned JSON under `homeops.deviceIdentity.v1`. Existing `homeops.deviceKey.v1` values migrate in place, preserving their device ID and existing server preferences. Agenda reads, writes, and reset calls send both `X-HomeOps-Device-Key` and `X-HomeOps-Device-Version: 1`; missing, malformed, and unsupported headers are rejected. This identity is preference correlation only and has no authentication or authorization meaning.

The database now owns `DeviceSettingsIdentities` with schema version, creation time, and last-seen time. Existing preference rows are backfilled into identities during migration and depend on them through cascade cleanup. Agenda reads and writes upsert/touch last-seen. A daily cleanup removes identities inactive for more than 180 days, after which a returning browser receives ordinary defaults.

Agenda exposes a compact `Dit apparaat` action in the existing calendar-source selector. Its bounded dialog explains the scope, requires explicit confirmation, deletes the current server preference identity, creates a fresh local identity, and reloads defaults while retaining actionable failure feedback. Settings remains structurally unchanged under the approved [viewport analysis](./viewport-analysis.md).

## Validation

- Backend full suite: 622/622 passed.
- Frontend full suite: 339/339 passed with the documented 20-second timeout budget.
- Backend and frontend production builds passed.
- Focused frontend device/Agenda regressions: 33/33 passed.
- Required PostgreSQL migration validation: 3/3 passed through Rancher Desktop, including legacy preference backfill.
- EF pending-model check reported no drift; the idempotent migration script generated successfully.
- Pinned NSwag 14.7.1 ran twice; OpenAPI and generated-client SHA-256 hashes were unchanged on the second run.
- Playwright smoke suite: 6/6 passed, including Agenda, its device-settings dialog, and Settings without document-level scrolling at 1440x900 and 1366x768.

The final changeset audit found no repository-local caches, generated browser artifacts, screenshots, videos, binary assets, or unrelated feature changes.

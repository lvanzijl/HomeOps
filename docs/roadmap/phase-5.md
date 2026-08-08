# Phase 5 — House, climate, and household settings

Phase 5 completes the Woning setup-to-runtime chain: reliable schema upgrades, reachable climate runtime, editable room climate configuration and mappings, floor-plan onboarding, provider lifecycle, and household weather configuration.

**Phase status:** In progress.

| Slice | Status | Outcome |
| --- | --- | --- |
| 5.1 Repair and prove the Home Assistant migration | Completed 2026-08-08 | Restored EF discovery for the existing resume-strategy migration, proved clean and active-database upgrades, added safe migration health detail, and verified the live provider endpoint after upgrade. |
| 5.2 House navigation and viewport analysis | Not started | Make the Woning runtime reachable through an approved viewport-safe composition. |
| 5.3 Room climate configuration UI | Not started | Provide durable room-level climate policy editing with honest state and validation. |
| 5.4 Provider/source mapping management | Not started | Provide the complete climate mapping lifecycle and health workspace. |
| 5.5 Floor-plan upload and replacement entry | Not started | Let a normal user establish and replace the first floor plan. |
| 5.6 Provider credential and lifecycle management | Not started | Make provider configuration and lifecycle safe, explicit, and operationally honest. |
| 5.7 Household weather location | Not started | Make weather location household-configurable with visible refresh health. |

## Slice 5.1 implementation boundary

Migration `20260717124500_AddHomeAssistantResumeStrategyConfiguration` remains the single historical schema operation. Its restored designer metadata composes the exact preceding target model with the five resume-strategy properties, making the migration discoverable in its original position without a second competing migration or snapshot change.

The PostgreSQL regression gate now requires a clean schema to contain every resume-strategy column. A second fixture migrates to `20260715205518_AddRoomHeatingCommands`, inserts a representative enabled Home Assistant provider using the legacy diagnostic format, applies the repaired migration, verifies the safe backfill, upgrades to latest, and calls `GET /api/climate-providers/` through the real Npgsql-backed API host.

Normal startup records pending migration count before applying migrations and records healthy, pending, or failed state afterward. `/health` returns HTTP 503 when migrations are pending or failed and exposes only status, count, check time, and the fixed `MigrationApplyFailed` code. The underlying exception remains server-log-only; connection data and exception text are not returned.

Validation: focused migration/health tests 7/7; full backend 640/640; full frontend 354/354 with the documented 20-second timeout budget; solution and frontend builds; required PostgreSQL migration tests 4/4; `dotnet ef migrations list`; no EF model drift; idempotent migration script generation; and two hash-identical pinned NSwag 14.7.1 generations. The implementation report is `docs/reports/2026-08-08-home-assistant-migration-repair/implementation.md`.

## Fixed boundaries

- Work remains one numeric slice and one commit per run.
- Slice 5.1 repairs migration discovery and diagnostics only; it does not redesign Settings or Woning.
- Primary-page layout work starts only after the required Slice 5.2 viewport analysis is approved.
- Provider credentials and lifecycle remain Slice 5.6.
- Weather location remains Slice 5.7.

## Phase exit criteria

- [x] Provider endpoint and DB upgrades are healthy.
- [ ] House runtime is reachable through an approved viewport-safe composition.
- [ ] Climate configuration and mapping lifecycle work end to end.
- [ ] A normal user can upload the first floor plan.
- [ ] Provider credentials remain secret and lifecycle is manageable.
- [ ] Weather location is household-configurable.

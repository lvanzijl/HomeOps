# Household Timezone Foundation

## Summary
Added persisted household timezone configuration as the V1 timezone foundation without adding UI, per-event timezone support, recurrence, or timezone-specific recurrence policies.

## Implemented
- Added `TimeZoneId` to `Household` persistence with `Europe/Amsterdam` as the fallback/default value.
- Added initial timezone derivation helper that uses a supported non-UTC IANA local timezone when available and otherwise falls back to `Europe/Amsterdam`.
- Added EF migration to persist household timezone and remove the previous per-EventSeries timezone column.
- Added tests for timezone default/fallback behavior and persisted seeded household timezone.

## Verified
- Household timezone defaults to `Europe/Amsterdam` in tests.
- Seeded household persists timezone configuration.
- Generated idempotent migration script includes the household timezone migration.

## Risks
- Runtime household timezone editing is not implemented.
- Existing EventSeries values are interpreted with the household timezone; no per-event timezone behavior exists in V1.
- DST ambiguity/nonexistent-time policies remain future recurrence work.

## Modified Files
- Household model, seed, and timezone helper.
- EF migrations and model snapshot.
- EventSeries model/projection tests.
- Household timezone tests.

## Next Prompt Context
Household timezone is now persisted on Household and defaults/falls back to `Europe/Amsterdam`. Do not add timezone UI, per-event timezone, or recurrence timezone behavior unless explicitly requested.

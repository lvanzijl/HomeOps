# Frontend local-calendar test stability

**Remediation phase:** Phase 0 — Safety baseline and regression harness  
**Slice:** 0.2A — Frontend local-calendar test stability  
**Status:** Completed  
**Date:** 2026-07-27

## Outcome

Removed the seven date-sensitive frontend gate failures that blocked Slice 0.2.

The Agenda day-addition helper previously:

1. parsed a date-only value at local midnight;
2. changed it with local calendar methods;
3. serialized it as UTC.

In positive UTC offsets, that serialization could return the previous date. “Tomorrow” remained today, week boundaries ended a day early, and upcoming events moved into the wrong planning group.

The helper now performs date-only arithmetic with UTC calendar fields and returns the resulting ISO date. This is independent of the machine's time zone and does not change event timestamps or API contracts.

The Home weather test previously assumed a UTC clock label. The component intentionally formats forecast instants in browser-local time, so the assertion now derives the expected local label with the same locale contract.

## Files

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- remediation tracker, Phase 2 roadmap, and current-state updates

## Validation

- affected Agenda and Home files: 44/44 passed;
- full frontend suite: 310/310 passed;
- frontend TypeScript and production build passed;
- full backend suite: 579/579 passed.

Warnings:

- existing frontend production chunk-size warning;
- existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11;
- existing Node `DEP0190` warning from the Vitest launcher.

No layout, API contract, migration, generated client, or avatar behavior changed.

# Home Assistant Resume Strategy Test Stability

## Summary
Resolved frontend full-suite instability after the Home Assistant resume-strategy contract follow-up. The full frontend suite is now green across three consecutive normal runs and one single-worker run.

## Initial failures
The first full frontend run failed in `src/WoningClimatePage.test.tsx` because the test asserted heating capability details immediately after the static `Verwarming` heading appeared. The same run also exposed an order-sensitive `AgendaWidget` weather assertion that queried the weather badge before asynchronous agenda/weather state settled. A later full-suite run exposed the same async-pattern issue in `src/home/FamilyMemberPage.test.tsx`, where the child dashboard test asserted task text immediately after a static `Vandaag` heading appeared.

## Reproduction matrix
| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | Failed before fixes | `WoningClimatePage.test.tsx` missing `18.0°C tot 22.0°C`; `AgendaWidget.test.tsx` missing `Vandaag, 20°, Helder`. |
| `npm test -- --run src/WoningClimatePage.test.tsx` | Failed before fixes | The heating capability assertion reproduced without other files. |
| `npm test -- --run src/widgets/components/AgendaWidget.test.tsx` | Passed before fixes | The agenda failure was order/timing sensitive in the full suite. |
| `npm test -- --run src/home/FamilyMemberPage.test.tsx` | Passed before fixes | The family-member failure was order/timing sensitive in the full suite. |
| `npm test` after fixes | Passed three consecutive runs | 48 files / 306 tests passed each time. |
| `npm test -- --maxWorkers=1 --no-file-parallelism` after fixes | Passed | 48 files / 306 tests passed in single-worker order. |

## Root cause
The failures were not caused by Home Assistant production behavior. They were asynchronous test-isolation defects: tests used static UI landmarks (`Verwarming`, `Vandaag`, and `Vandaag briefing`) as proxies for later API-driven state. Under full-suite timing and worker scheduling, those landmarks could render before the mocked API results were committed.

## Production defects found
No production defects were found. The affected components already render loading and later data-driven state separately; tests needed to wait for the data-driven assertions they actually verify.

## Test-isolation defects found
- `WoningClimatePage.test.tsx` did not wait for room-heating capability data before asserting the target range.
- `WoningClimatePage.test.tsx` did not wait for the room list before selecting `Hal` in the no-active-plan case.
- `AgendaWidget.test.tsx` did not wait for the async day-weather badge after the briefing landmark appeared.
- `FamilyMemberPage.test.tsx` did not wait for async task data after the static `Vandaag` heading appeared.

## Fixes
- Replaced immediate assertions with `findBy*` or `waitFor` around the specific async content under test.
- Preserved existing assertions and coverage; no tests were skipped, weakened, or given arbitrary sleeps/timeouts.
- Did not change production Home Assistant settings, resume strategy, generated client, or backend code.

## Full-suite verification
The frontend suite is green. It passed three consecutive normal runs and one single-worker/no-file-parallelism run.

## Baseline comparison
A destructive baseline checkout was not used because the prompt prohibited reset, clean, stash, pull, and discard operations. Equivalent evidence was collected non-destructively: the initially failing Woning test reproduced when run alone, while the Agenda and FamilyMember files passed individually and then failed only in the full-suite timing context before targeted async waits were added. After the fixes, normal and single-worker full-suite runs passed.

## Remaining unrelated failures
None remain in the frontend verification performed for this task.

## Tests performed
- `npm test -- --run src/WoningClimatePage.test.tsx`
- `npm test -- --run src/widgets/components/AgendaWidget.test.tsx`
- `npm test -- --run src/settings/HomeAssistantClimateSettings.test.tsx src/settings/WoningManagement.test.tsx`
- `npm test -- --run src/home/FamilyMemberPage.test.tsx`
- `npm test` (three consecutive successful full-suite runs)
- `npm test -- --maxWorkers=1 --no-file-parallelism`
- `npm run build`
- `git diff --check`

## Modified files
- `src/HomeOps.Client/src/WoningClimatePage.test.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `docs/reports/2026-07-17-home-assistant-resume-strategy-test-stability/README.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

# Agenda Weather Local Day Fix Analysis

## Summary

Agenda weather local-day matching should be fixed in the Agenda frontend first, specifically in `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx` around the day/event date helpers and weather resolvers. The immediate defect is not the backend weather projection shape: the generated Agenda weather contract already provides absolute hourly slot boundaries as `startsAtUtc` and `endsAtUtc`, and the frontend already has enough `Date` objects to derive a browser-local calendar day.

The current Agenda implementation uses three different date approaches:

- Agenda event grouping mostly uses string date keys from `event.startsAt.slice(0, 10)` through `getDateKey`.
- Agenda Dutch day labels use browser-local `Intl.DateTimeFormat` by constructing dates like `new Date(`${date}T12:00:00`)` without an explicit `timeZone`.
- Agenda day-level weather matching uses UTC slot dates from `slot.startsAtUtc.toISOString().slice(0, 10)`.

That means `resolveAgendaDayWeather` is the main local-day bug location: it compares a UI Agenda date such as `2026-06-16` against the UTC date of a weather slot, not against the calendar day that the rest of the current browser-local Agenda UI is trying to display.

Household timezone exists in the backend domain and persistence model, but I did not find it in Agenda frontend state, Agenda weather API output, event source output, event output, or any shared frontend configuration consumed by `AgendaWidget`. Because the frontend currently operates on browser-local date assumptions for `todayIsoDate`, `toIsoDate`, `addDaysIso`, `startOfWeek`, `buildMonthDays`, and Dutch date formatters, the smallest correct later fix should use one centralized frontend local-date helper for Agenda weather matching. A true household-timezone fix would require exposing household timezone to the frontend/API and then applying it consistently across Agenda, not only weather.

Recommended later implementation sequence:

1. Add or extract a small Agenda-local date helper that derives an ISO calendar date from a `Date` in the same local-date convention used by `toIsoDate`.
2. Change `getWeatherSlotDate` / `resolveAgendaDayWeather` to compare weather slot starts by that local date instead of `toISOString().slice(0, 10)`.
3. Add a separate all-day-aware path for `Vooruitkijken` rows so all-day outlook events can display day-level weather without making all all-day rows everywhere behave differently by accident.
4. Add focused Agenda widget tests for local-day weather matching near UTC date boundaries and for all-day `Vooruitkijken` day-weather display.
5. Do not change backend projection or regenerate the API contract for the first browser-local fix.

## Current Date Handling

### Agenda event loading and normalized event dates

Agenda events are loaded through `loadCalendarAgendaData` in `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`. The generated client maps backend `NormalizedEvent.startsAt` and `endsAt` into JavaScript `Date` instances. The wrapper then converts those dates back to strings with `requireDate(...).toISOString()`. Consequently, `AgendaWidget` receives `NormalizedEvent.startsAt` as an ISO string in UTC form such as `2026-06-16T15:00:00.000Z`.

The backend creates those timestamps from the persisted household timezone. `EventSeriesEndpoints` reads the seeded household, passes `household.TimeZoneId` into `EventOccurrenceGenerator.Generate`, and returns normalized events. `EventOccurrenceGenerator.ToLocalOffset` constructs `DateTimeOffset` values using the household timezone offset for the event date/time. Therefore, the backend event projection is already household-timezone-aware before the frontend receives absolute timestamps.

### Agenda currently grouping events by day

There are two Agenda grouping paths:

- `src/HomeOps.Client/src/agenda/agendaUtils.ts` has reusable `groupEventsByDay` and `groupEventsByMonth`. `groupEventsByDay` filters and groups with a private `getDateKey(event.startsAt)` that returns `dateTime.slice(0, 10)`. Its labels use `Intl.DateTimeFormat` with `timeZone: 'UTC'`.
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx` has its own local grouping functions. The current planning/month UI uses the local `getDateKey(dateTime)` function, also implemented as `dateTime.slice(0, 10)`, plus local `groupEventsByDate(events)` for maps keyed by that value.

The weather work should focus on the `AgendaWidget.tsx` path because that is where the current weather display and planning/month workspaces live.

Specific current grouping locations in `AgendaWidget.tsx`:

- `MonthWorkspace` filters selected-day events with `events.filter((event) => getDateKey(event.startsAt) === selectedDate)`.
- `MonthGrid` calls `groupEventsByDate(events)` for month cell event counts and indicators.
- `buildPlanningBriefing` filters upcoming events with `getDateKey(event.startsAt) >= today`.
- `buildPlanningBriefing` builds `todayEvents`, `weekEvents`, `weekDayGroups`, and `outlookEvents` using `getDateKey(event.startsAt)` comparisons.
- `buildTodayBriefing` formats the next future event summary using `formatDutchWeekday(getDateKey(nextFutureEvent.startsAt))` and `formatDutchShortDate(getDateKey(nextFutureEvent.startsAt))`.
- `isCurrentPlanningEvent` treats all-day events as current when `getDateKey(event.startsAt) === nowIso.slice(0, 10)`.

These groupings are string-key-based rather than timezone-object-based. Because `toAgendaEvent` converts backend dates to UTC ISO strings, `getDateKey` is currently an ISO/UTC string date key in practice for API-backed events. However, the visual date helpers around selected dates and month grids use browser-local `Date` construction, so the UI has mixed assumptions.

### Agenda currently formatting Dutch/local days

The primary Agenda planning/month formatter functions are local to `AgendaWidget.tsx`:

- `formatDutchWeekday(date)` formats `new Date(`${date}T12:00:00`)` with `Intl.DateTimeFormat('nl-NL', { weekday: 'long' })` and no explicit `timeZone`.
- `formatDutchShortDate(date)` formats `new Date(`${date}T12:00:00`)` with no explicit `timeZone`.
- `formatDutchMonth(date)` formats `new Date(`${date}T12:00:00`)` with no explicit `timeZone`.
- `formatDutchDay(date)` formats `new Date(`${date}T12:00:00`)` with no explicit `timeZone`.

With no explicit `timeZone`, these use the browser/runtime local timezone. Noon is used, which reduces accidental date shifts compared with midnight, but it does not make the formatter household-timezone-aware.

Other `AgendaWidget.tsx` date helpers also use browser-local date behavior:

- `todayIsoDate()` calls `toIsoDate(new Date())`.
- `toIsoDate(date)` reads `getFullYear()`, `getMonth()`, and `getDate()` from a `Date`, which are browser-local accessors.
- `buildMonthDays(anchorDate)` creates dates with `new Date(year, month - 1, 1)`, mutates via `setDate`, and uses `toIsoDate(current)`.
- `startOfWeek(date)` constructs `new Date(`${date}T12:00:00`)`, uses `getDay()`, mutates with `setDate`, and returns `toIsoDate`.
- `addDaysIso(date, days)` constructs `new Date(`${date}T00:00:00`)`, mutates with `setDate`, then returns `next.toISOString().slice(0, 10)`. This mixes local construction/mutation with UTC serialization.

The older shared `agendaUtils.ts` formatters are different: they specify `timeZone: 'UTC'`. Those helpers should not be blindly reused for the current planning weather fix because the current planning UI does not otherwise use that UTC labeling convention.

## Current Weather Matching

### Agenda weather API wrapper and contract

`src/HomeOps.Client/src/agenda/agendaWeatherApi.ts` only wraps the generated `HomeOpsApiClient.getAgendaWeather()` method. The generated client calls `GET /api/weather/agenda` and converts each `AgendaWeatherSlotProjection.startsAtUtc` and `endsAtUtc` into JavaScript `Date` objects.

The generated `AgendaWeatherProjection` shape contains `slots`, `freshness`, `status`, and `statusMessage`. `AgendaWeatherSlotProjection` contains `startsAtUtc`, `endsAtUtc`, `temperatureCelsius`, `condition`, `summary`, and `freshness`. There is no local date field, no household timezone field, and no all-day/day-summary field in the Agenda weather contract.

The backend projection in `WeatherProjectionBuilder.ToAgenda` maps the weather snapshot's hourly slots directly to `AgendaWeatherSlotProjection`. It does not perform Agenda-specific day grouping and does not include daily summaries in the Agenda weather response.

### Where Agenda compares weather slot dates to Agenda dates

The direct day comparison is in `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`:

- `resolveAgendaDayWeather(date, nowIso, slots, contextLabel)` filters valid slots with `getWeatherSlotDate(slot) === date`.
- `getWeatherSlotDate(slot)` returns `slot.startsAtUtc?.toISOString().slice(0, 10) ?? ''`.

This is the exact UTC date-boundary issue. `startsAtUtc` is already a JavaScript `Date`; calling `toISOString()` serializes it in UTC, so a slot that belongs to the local evening of one day but UTC midnight/next day will compare against the UTC calendar date, not the product's expected local calendar date.

`resolveAgendaDayWeather` is used for:

- Today header weather in `PlanningWorkspace` through `todayWeather`.
- `Deze week` day-header weather in `PlanningWeekCard`.
- Selected planning day weather in `PlanningToolsCard`.

### Event-level weather matching

`resolveAgendaEventWeather(event, slots)` is separate. It currently:

1. Returns `null` immediately for all-day events.
2. Parses `event.startsAt` with `new Date(event.startsAt)`.
3. Finds the first valid weather slot where `startsAtUtc <= eventStart < endsAtUtc`.
4. Builds a compact weather display with the event title as context.

This absolute timestamp interval matching is appropriate for timed event weather and should not be replaced with day matching for timed events. It does not solve all-day event expectations because it intentionally returns `null` for `event.allDay`.

### Current all-day behavior in Vooruitkijken

`PlanningOutlookCard` renders each visible outlook event with `PlanningEventRow` and does not pass `showWeather={false}`. `PlanningEventRow` defaults `showWeather = true`, but it calls `resolveAgendaEventWeather`. Because `resolveAgendaEventWeather` immediately returns `null` for all-day events, all-day events in `Vooruitkijken` currently show no weather.

The future all-day `Vooruitkijken` implementation should happen at the `PlanningOutlookCard` / `PlanningEventRow` boundary rather than inside the global event-level resolver alone. That allows the product to add day weather for all-day outlook rows without unexpectedly adding all-day row weather in Today lead/support rows or Month selected-day rows.

## Household Timezone Availability

Household timezone is available in backend persistence and backend calendar projection:

- `Household.TimeZoneId` exists on the backend model.
- `HouseholdTimeZone.DefaultTimeZoneId` is `Europe/Amsterdam`.
- `SeedHousehold.TimeZoneId` is derived from environment/local time and falls back to `Europe/Amsterdam`.
- `EventSeriesEndpoints` reads the household and passes `household.TimeZoneId` into `EventOccurrenceGenerator.Generate`.
- Calendar export/restore includes household timezone metadata.

I did not find household timezone available to `AgendaWidget` in frontend state/config/API:

- `CalendarAgendaData` contains only `sources` and `events`.
- `NormalizedEvent` contains event timestamps, all-day, editable, title, description, location, and source IDs, but no timezone.
- `AgendaWeatherProjection` contains hourly slots and status/freshness metadata, but no timezone.
- `AgendaWeatherSlotProjection` contains UTC slot boundaries, temperature, condition, summary, and freshness, but no local date/timezone.
- `AgendaWidget` props are only `WidgetRenderProps`; the component does not receive a household configuration object.
- `VITE_HOMEOPS_API_BASE_URL` is the only frontend environment value found in the Agenda API wrappers relevant to this path.

There are tests that include exported calendar household metadata with `timeZoneId`, but that is Settings/export data, not a globally available Agenda runtime setting. Therefore, a household-timezone-correct fix cannot be frontend-only unless the frontend first receives the household timezone from an API or app state source.

Current local-date assumption elsewhere in the Agenda frontend is browser local time, not household time. This is visible in `toIsoDate`, `todayIsoDate`, `buildMonthDays`, `startOfWeek`, the Dutch formatter functions in `AgendaWidget.tsx`, and `new Date(...)` parsing/formatting without explicit `timeZone`.

## Recommended Fix Location

### Recommended first fix: frontend-only local-date alignment

The first future fix should be frontend-only in `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`, because the bug is an inconsistency inside frontend matching:

- UI selected dates and labels are represented as `YYYY-MM-DD` Agenda dates.
- Weather slots are available as absolute `Date` objects.
- `getWeatherSlotDate` currently converts slot dates through UTC serialization.
- The current Agenda UI otherwise uses browser-local date helpers for today, month building, week building, and Dutch labels.

The minimal later change should replace `getWeatherSlotDate(slot)` with a local-date derivation that matches `toIsoDate(date)` semantics. For example, a future helper could use `toIsoDate(slot.startsAtUtc)` after confirming that `slot.startsAtUtc` is a `Date`. That would compare weather slots to Agenda dates using the same browser-local `getFullYear`/`getMonth`/`getDate` basis used elsewhere in the current component.

This should be centralized rather than inlined so tests can target the rule and so later household-timezone work has one function to replace.

### Backend should not change for the first fix

The backend should not change for the first local-day matching fix because:

- `GET /api/weather/agenda` already returns absolute hourly slot boundaries.
- `AgendaWeatherSlotProjection` accurately exposes `startsAtUtc` and `endsAtUtc` as `DateTimeOffset` values.
- Timed event matching needs absolute intervals and already has them.
- A backend-only change cannot fix frontend comparisons that explicitly call `toISOString().slice(0, 10)`.
- Adding local date fields or timezone to the API would require API contract regeneration, which is outside the requested implementation scope and is unnecessary for the minimal browser-local alignment.

### Split/household-timezone fix later

If the product requirement becomes strict household timezone matching independent of browser/device timezone, then the fix should be split:

1. Backend/API exposes the effective household timezone or precomputed local slot date metadata.
2. Frontend stores/consumes that household timezone in Agenda runtime state.
3. Agenda date grouping, labels, selected dates, today/week/month calculations, weather day matching, and all-day current-event logic are updated consistently.
4. Tests run with non-UTC/browser timezone scenarios and at DST boundaries.

That larger split should not be limited to weather, because making only weather household-timezone-aware while the rest of Agenda remains browser-local/string-key-based would produce mismatches between weather badges and event grouping.

## Required Future Changes

### Files/functions that need to change later

Primary file:

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`

Functions/components to update for the first frontend-only local-day fix:

- `getWeatherSlotDate(slot)` — replace UTC `toISOString().slice(0, 10)` with a browser-local Agenda date key helper.
- `resolveAgendaDayWeather(date, nowIso, slots, contextLabel)` — keep the same active/next/first slot selection, but consume the fixed slot date helper.
- Possibly add `getLocalDateKey(date: Date): string` or `getAgendaLocalDateKey(date: Date): string` near `toIsoDate` and use it from `getWeatherSlotDate`.

Functions/components to consider for all-day `Vooruitkijken` weather later:

- `PlanningOutlookCard` — this is the safest place to opt outlook rows into all-day day weather.
- `PlanningEventRow` — may need an optional `weatherOverride` or `dayWeather` prop so the row can render day-level weather for all-day outlook events without changing every call site.
- `resolveAgendaEventWeather` — should probably remain timed-event interval matching. If changed, it should accept an explicit mode/options object so all-day behavior is not accidentally global.
- `resolveAgendaDayWeather` — reuse this for all-day outlook rows using `getDateKey(event.startsAt)` and a context label based on `event.title` or the formatted day, depending on desired accessible copy.

Files/functions that likely should not change for the first fix:

- `src/HomeOps.Api/Weather/Projections/WeatherProjectionBuilder.cs` — already exposes hourly slot boundaries.
- `src/HomeOps.Api/Weather/Projections/AgendaWeatherProjection.cs` and `AgendaWeatherSlotProjection.cs` — no contract change needed for browser-local alignment.
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts` — no regeneration needed for the first fix.
- `src/HomeOps.Client/src/agenda/agendaWeatherApi.ts` — wrapper is already pass-through.

### Recommended implementation sequence

1. Add focused tests that fail under current UTC slot-date matching. Prefer tests in `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx` because existing Agenda weather tests already mock `AgendaWeatherProjection` and render Today, Week, Outlook, Planning, and Month UI.
2. Add a local helper in `AgendaWidget.tsx` that derives the Agenda local date key from a `Date` using the same local accessor pattern as `toIsoDate`.
3. Update `getWeatherSlotDate` to use that helper.
4. Run the focused Agenda widget tests.
5. Add separate tests for all-day `Vooruitkijken` weather expectations before implementing that behavior.
6. Implement all-day `Vooruitkijken` weather through an explicit row override/prop from `PlanningOutlookCard`, not by globally turning on all-day event weather everywhere.
7. Only after the browser-local fix is stable, decide whether a future household-timezone slice is needed. If yes, expose household timezone through an API/state path and refactor all Agenda date handling together.

## Test Plan

Future tests should be added/updated in `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`.

Recommended test cases:

1. **Day-level weather uses browser-local date instead of UTC date.** Mock a weather slot whose UTC date differs from the intended browser-local date in the test timezone, then assert the Today/selected-day/day-header badge appears for the local Agenda date. This may require setting the test process timezone or choosing a deterministic approach supported by Vitest/JSDOM.
2. **`resolveAgendaDayWeather` local boundary behavior.** If the helper remains private inside `AgendaWidget.tsx`, cover through rendered UI. If extracted to a testable helper, add direct unit tests around UTC-to-local conversion.
3. **Existing weather behavior still works.** Keep/update the existing test that verifies weather across Today header, Today row, `Deze week` day header, `Vooruitkijken` timed row, and selected planning day.
4. **`Deze week` event rows stay weather-free.** Keep the existing assertion that the day header shows weather while the individual week event row does not.
5. **All-day events remain weather-free where not explicitly changed.** Preserve or update the existing month selected-day all-day test so month all-day rows do not unexpectedly gain row weather unless product requirements change for month too.
6. **All-day `Vooruitkijken` gets day weather later.** Add a new outlook-specific all-day event test with a matching day-level weather slot and assert the all-day outlook row shows the day weather badge.
7. **No matching local-day slot means no badge.** Add or keep a no-slot assertion to prevent nearest-day leakage across midnight.
8. **No advice remains in Agenda.** Keep the existing assertion that advice labels such as `Regenjas mee` and `Geen jas nodig` are absent from Agenda.

Backend tests do not need to change for the first frontend-only local-day fix. If a later household-timezone API field is added, add backend API/projection tests for that field and regenerate generated client tests accordingly.

## Risks

- **UTC vs browser local mismatch:** The current weather day resolver uses UTC dates. Replacing it with browser-local dates aligns with current UI helpers but may differ from backend household timezone if the browser is not in the household timezone.
- **Household timezone mismatch:** The backend stores and uses household timezone for event occurrence projection, but the frontend does not receive that timezone. A browser-local fix is not a complete household-timezone solution for remote users/devices.
- **Mixed Agenda conventions:** `AgendaWidget.tsx` uses browser-local helpers while `agendaUtils.ts` uses UTC formatters. Reusing the wrong helper could perpetuate mismatch.
- **DST boundaries:** Browser-local `Date` construction/mutation with `setDate` handles DST in the runtime timezone, but adding days and serializing with `toISOString().slice(0, 10)` can shift dates around DST or non-UTC offsets. `addDaysIso` already mixes local mutation and UTC serialization, which should be reviewed in a broader date-handling cleanup.
- **All-day event semantics:** Backend all-day events are date-only in the domain, but the frontend receives absolute timestamps serialized through generated client conversion. Using event start instants for all-day row weather can be misleading; all-day outlook weather should use the event's Agenda date key, not a point-in-time interval match.
- **Over-broad all-day weather changes:** Changing `resolveAgendaEventWeather` globally to return day weather for all all-day events would affect Today lead/support rows and Month selected-day rows, not only `Vooruitkijken`. The product request specifically calls out `Vooruitkijken`, so the later implementation should opt in there first.
- **Testing environment timezone:** Vitest/JSDOM may run in UTC by default. Tests for browser-local conversion need a controlled timezone or an extracted helper that can be tested deterministically.
- **API contract temptation:** Adding local date fields to `AgendaWeatherSlotProjection` would make matching easy but introduces contract regeneration and still requires choosing a timezone. That is larger than the first fix and should be deferred unless household timezone is exposed intentionally.

## Open Questions

- Should the product define “local day” as browser/device local day for FamilyBoard screens, or strictly as persisted household timezone day?
- Should Agenda receive household timezone through a general household settings endpoint, through calendar event data, or through weather projections if a strict household-timezone fix is required?
- Should all-day weather be added only to `Vooruitkijken`, or also to Today support/lead rows and Month selected-day rows in a later product slice?
- Should day-level weather use the first slot of the local day, the active/next/first strategy currently implemented, or a specific representative daytime slot?
- Should the older `agendaUtils.ts` UTC date helpers be reconciled with the newer `AgendaWidget.tsx` browser-local helpers in a separate date-consistency slice?

## Modified Files

- `docs/reports/2026-07-05-agenda-weather-local-day-fix-analysis/agenda-weather-local-day-fix-analysis.md`

# Agenda Weather Display Analysis

## Summary

Agenda weather is implemented as objective temperature-and-condition context only. The Agenda frontend loads `/api/weather/agenda` once when `AgendaWidget` mounts, stores the returned hourly slots, and then opportunistically renders compact weather badges where the page has a matching day or timed event slot.

Weather is shown in these Agenda areas:

- Today card header (`Vandaag briefing`) as day-level weather for today.
- Timed Today lead item (`Nu bezig`, `Eerstvolgend`, or the fallback lead label) when the event start falls inside a weather slot.
- Timed `Verder vandaag` items when the event start falls inside a weather slot.
- Timed `Vooruitkijken` items when the event start falls inside a weather slot.
- `Deze week` day headers, one badge per grouped future day when that day has at least one weather slot.
- `Plannen` selected-day summary in planning mode when the selected date has at least one weather slot.
- Month mode selected-day event list for timed events when the event start falls inside a weather slot.

Weather is deliberately not shown in these Agenda areas:

- Month grid day cells.
- `Deze week` individual event rows, because those rows explicitly disable event-row weather and rely on the day header badge.
- All-day events, even if a weather slot exists on that date.
- Any event whose start time cannot be parsed into a valid JavaScript `Date`.
- Any day or timed event with no matching valid weather slot.
- Any advice copy such as rain-coat, jacket, extra-travel-time, indoor, or outdoor guidance.

## Data Flow

1. `AgendaWidget` imports `loadAgendaWeather` and keeps `agendaWeatherSlots` in local React state.
2. On mount, `AgendaWidget` calls `loadAgendaWeather()` in a dedicated effect.
3. If the request succeeds, `data?.slots ?? []` becomes the Agenda weather slot array.
4. If the request fails, Agenda silently falls back to an empty slot array.
5. The same slot array is passed into planning mode and month mode.

The frontend wrapper is thin:

- `loadAgendaWeather()` creates a weather API client through `createAgendaWeatherApiClient()`.
- `createAgendaWeatherApiClient()` delegates to the shared `createWeatherApiClient()`.
- `createWeatherApiClient()` constructs `HomeOpsApiClient` using `VITE_HOMEOPS_API_BASE_URL` or an empty base URL.
- The generated client calls `GET /api/weather/agenda` and maps the response into `AgendaWeatherProjection` and `AgendaWeatherSlotProjection` objects.

The backend endpoint is `GET /api/weather/agenda`. It is mapped in `WeatherEndpoints`, calls `WeatherApplicationService.GetAgendaWeatherAsync`, fetches the cached household weather snapshot, and projects it through `WeatherProjectionBuilder.ToAgenda`.

The production source is Open-Meteo through `OpenMeteoWeatherProvider`, selected through `OpenMeteoWeatherSnapshotSource` outside the `VisualReview` environment. `OpenMeteoWeatherProvider.BuildForecastUri` requests UTC forecasts with `forecast_days=7`, `forecast_hours=24`, current weather, hourly temperature/condition/precipitation/wind fields, and daily fields. Agenda consumes only the hourly slot projection, not the daily summaries.

In the `VisualReview` environment, `Program.cs` registers `VisualReviewMarketingWeatherSnapshotSource` instead of the Open-Meteo source, so storyboard/marketing runs can use deterministic weather data.

The Agenda weather API shape contains:

- Projection-level `slots`, `freshness`, `status`, and `statusMessage`.
- Slot-level `startsAtUtc`, `endsAtUtc`, `temperatureCelsius`, `condition`, `summary`, and `freshness`.

It does not contain departure advice, rain-protection booleans, indoor flags, or outdoor flags.

## Display Locations

### Today header behavior

The Today card header receives `dayWeather` from `resolveAgendaDayWeather(today, nowIso, agendaWeatherSlots)`. If that returns a display object, the header renders a prominent `WeatherTemperatureBadge` beside the Today tone badge. If it returns `null`, no weather UI is rendered in the Today header.

Day-level weather for today is selected from valid weather slots whose slot start date matches `today` using `slot.startsAtUtc.toISOString().slice(0, 10)`. If a valid slot covers `nowIso`, the active slot is used. Otherwise the next future slot for that same UTC date is used. Otherwise the first valid slot for that same UTC date is used.

### Nu bezig item behavior

The `Nu bezig` item is the Today lead row when `buildTodayBriefing` finds a current event. Current all-day events count as current for lead selection, but `PlanningEventRow` only shows row weather when `resolveAgendaEventWeather` returns a display object.

For a timed `Nu bezig` event, the row shows a compact weather badge if the event start timestamp falls inside a valid weather slot (`slot.startsAtUtc <= eventStart < slot.endsAtUtc`). For an all-day `Nu bezig` event, no row weather is shown because all-day events return `null` before slot matching.

### Verder vandaag item behavior

`Verder vandaag` renders `PlanningEventRow` for each visible Today support event. These rows use the default `showWeather = true`, so each timed support item can show compact weather when its start timestamp falls inside a valid slot. All-day support items and unmatched timed support items show no weather badge.

### Vooruitkijken item behavior

`Vooruitkijken` renders up to four future outlook events after the current week. Its `PlanningEventRow` calls do not disable weather, so each timed outlook item can show compact weather when its event start falls inside a valid hourly slot. All-day outlook items and timed outlook items outside the returned slot horizon show no weather.

### Deze week day-header behavior

`Deze week` groups future events after today through the end of the current week. For each grouped date, the day section computes `resolveAgendaDayWeather(dayGroup.date, nowIso, agendaWeatherSlots, formatDutchDay(dayGroup.date))`. If a display object is returned, the day header renders a medium `WeatherTemperatureBadge` next to the count of appointments.

Individual event rows inside `Deze week` explicitly pass `showWeather={false}` to `PlanningEventRow`. Therefore, even timed events with a matching hourly slot do not show per-row weather in this section. The section-level day header is the only weather location in `Deze week`.

### Selected planning day behavior

The `Plannen` card receives `selectedDayWeather` from `resolveAgendaDayWeather(selectedDate, nowIso, agendaWeatherSlots, formatDutchDay(selectedDate))`. If the selected date has a valid matching day slot, the card renders a medium `WeatherTemperatureBadge` next to the selected day label. If the selected date has no valid slot, the selected day displays without weather.

### Month selected-day behavior

Month mode passes `agendaWeatherSlots` into `SelectedDayPanel`, and then into `AgendaEventList`. `AgendaEventList` calculates `resolveAgendaEventWeather(event, agendaWeatherSlots)` for every selected-day event. Timed selected-day events show a compact weather badge when their start timestamp falls inside a valid slot. All-day selected-day events do not show weather. The month grid itself does not receive or render weather slots.

## Matching Rules

Agenda uses two different matching paths.

### Day-level matching

`resolveAgendaDayWeather(date, nowIso, slots, contextLabel)`:

1. Filters to slots that pass `hasAgendaWeatherData`.
2. Filters again to slots whose UTC slot-start date equals the requested ISO date.
3. Sorts the matching slots by `startsAtUtc`.
4. Returns `null` if no valid same-date slots exist.
5. Looks for an active slot where `startsAtUtc <= nowIso < endsAtUtc`.
6. Looks for the next slot where `startsAtUtc >= nowIso`.
7. Builds a display from the active slot, otherwise next slot, otherwise first same-date slot.

This is used for the Today header, `Deze week` day headers, and selected planning day.

Important detail: the date comparison is based on `slot.startsAtUtc.toISOString().slice(0, 10)`, so it is a UTC date comparison. Agenda event grouping also uses `event.startsAt.slice(0, 10)`. There is no household-time-zone conversion in the frontend matching code.

### Event-level matching

`resolveAgendaEventWeather(event, slots)`:

1. Immediately returns `null` for all-day events.
2. Parses `event.startsAt` into a JavaScript `Date`.
3. Returns `null` if the parsed start is invalid.
4. Finds the first valid slot where `startsAtUtc <= eventStart < endsAtUtc`.
5. Builds a display from that slot using the event title as the accessible-label context.
6. Returns `null` if no slot contains the event start timestamp.

This is used for Today lead rows, `Verder vandaag` rows, `Vooruitkijken` rows, and Month selected-day event rows. It is also available to `Deze week` rows, but those rows pass `showWeather={false}` and therefore skip event weather.

### Valid slot requirements

`hasAgendaWeatherData` requires:

- `startsAtUtc` is a `Date` instance.
- `endsAtUtc` is a `Date` instance.
- `temperatureCelsius` is a JavaScript number.
- `condition` is not `undefined`.

The generated NSwag client is relevant because it converts `startsAtUtc` and `endsAtUtc` response values into JavaScript `Date` objects. Without those `Date` instances, Agenda treats slots as invalid.

### Weather display construction

`buildAgendaWeatherDisplay` returns a `WeatherTemperatureDisplay` with:

- `temperatureLabel` from shared `formatTemperatureLabel`.
- `iconKey` from shared `toWeatherIconKey(slot.condition)`.
- `accessibleLabel` from shared `formatWeatherAccessibleLabel(contextLabel, temperatureCelsius, summary)`.

The rendered badge is `WeatherTemperatureBadge`, which uses `role="img"`, `title`, an accessible label, the shared `WeatherGlyph`, and the temperature text.

## Where Weather Is Not Shown

Weather is not shown in the Month grid cells. Month cells only show date numbers, the Today badge, event indicators, and overflow counts.

Weather is not shown on individual `Deze week` event rows. Those rows explicitly set `showWeather={false}` even though `PlanningEventRow` defaults to showing weather.

Weather is not shown for all-day events anywhere event-level weather is used. The event-level resolver exits immediately when `event.allDay` is true. This applies to Today lead/support rows, outlook rows, and month selected-day rows.

Weather is not shown for malformed/no-time events that do not parse to a valid `Date`. There is no separate no-time event model in this component; event weather relies on `event.startsAt`. If `new Date(event.startsAt)` is invalid, weather is omitted.

Weather is not shown when the weather request fails, because the catch handler sets `agendaWeatherSlots` to an empty array and the component renders no error state for Agenda weather.

Weather is not shown when the API returns `null`, omits `slots`, or returns no valid slots, because the state becomes `[]` or the resolvers return `null`.

Weather is not shown as advice. Agenda does not render `DepartureAdviceProjection`, advice category labels, rain-protection guidance, extra travel time guidance, or indoor/outdoor labels.

## Fallback Behaviour

When no matching weather slot exists, the relevant resolver returns `null`. The React markup uses conditional rendering and simply omits the `WeatherTemperatureBadge`. There is no placeholder, no loading state, no inline error, and no fallback copy inside Agenda weather locations.

For day-level weather, a date with at least one valid same-date slot receives a fallback within that day: active slot first, next future slot second, first same-date slot last. A date with no valid same-date slots receives no weather.

For event-level weather, there is no nearest-slot fallback. The event start must be inside a slot interval. If the event starts before the first slot, after the last slot, between gaps, or exactly at a slot end without being inside the next slot, no weather is shown unless another slot contains that timestamp.

All-day event behavior is intentionally stricter than day-level behavior: an all-day event does not reuse that day’s header weather. It receives no per-event weather.

Events without time or with invalid start values receive no per-event weather because the start cannot be matched to an hourly interval.

## Storyboard Implications

The current marketing/storyboard documentation describes Agenda as part of the visual-marketing flow but does not establish detailed weather display rules. The implemented behavior means any storyboard that expects Agenda weather must ensure that the weather source contains deterministic hourly slots for the exact UTC dates/times being shown.

For VisualReview runs, the backend uses `VisualReviewMarketingWeatherSnapshotSource`, so weather can be deterministic. The existing Agenda widget test confirms deterministic weather across the Today header, Today row, `Deze week` day header, `Vooruitkijken` row, and selected planning day. That same test also confirms that Agenda does not show advice labels such as `Regenjas mee` or `Geen jas nodig`.

Storyboard assumptions should not expect:

- Weather on Month grid cells.
- Weather on individual `Deze week` event rows.
- Weather on all-day events.
- Weather advice or indoor/outdoor interpretation in Agenda.
- Weather for events outside the available hourly forecast horizon.

## Risks and Confusing Cases

- Day matching uses the slot start UTC date. In a household timezone that differs from UTC, late-night local events and local-day labels may not align with the day-level weather badge users expect.
- Event grouping uses `event.startsAt.slice(0, 10)` while event matching parses `event.startsAt` as an absolute `Date`. These are different operations and can be confusing if event strings include timezone offsets.
- Day-level weather can show a same-day fallback even after all slots for that UTC date are in the past, because it falls back to the first same-date slot when no active or future slot exists.
- `Deze week` can show weather in the day header while individual event rows in the same day show no weather by design. This may look inconsistent unless the design intent is understood.
- All-day events can appear as the `Nu bezig` lead item, but still show no row weather. The Today header may still show day-level weather for the same date.
- Agenda ignores projection `status` and `statusMessage`. If the backend returns stale or unavailable status but also returns slots, the current frontend logic only considers slot validity.
- The Agenda API currently projects hourly slots only. Daily summaries from Open-Meteo are not used by Agenda for day headers.

## Open Questions

- Should day-level matching use household/local dates rather than UTC slot-start dates?
- Should all-day events ever display day-level weather, or should they remain weather-free as currently implemented?
- Should `Deze week` continue to use only day-header weather, or should timed event rows also show compact weather like Today and Outlook rows?
- Should Agenda surface stale/unavailable weather status anywhere, or is silent omission/slot-only rendering the desired product behavior?
- Should event-level matching have a nearest-slot fallback for events that do not start exactly inside an hourly forecast interval?

## Modified Files

- `docs/reports/2026-07-05-agenda-weather-display-analysis/agenda-weather-display-analysis.md`

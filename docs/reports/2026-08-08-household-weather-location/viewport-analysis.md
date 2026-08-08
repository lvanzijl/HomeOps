# Phase 5 Slice 5.7 — Household weather location viewport analysis

**Status:** Approved for implementation on 2026-08-08.

## Current Settings composition

Settings is a fixed-height primary FamilyBoard page. Its dashboard reserves three vertical regions: a compact status header, a `minmax(0, 1fr)` two-column main area, and the quick-action rail. The calendar-source list and the two secondary status cards own their internal overflow. The quick-action rail currently contains backup, restore, details, Woning, known-people, family, calendar-repair, time-zone, and optional extra-settings entry points.

Browser inspection at 1366×768 measured a 663 px dashboard with a 124 px header, a 417 px main region, and a 104 px action rail. `document` and `body` both had zero vertical overflow. The same fixed composition is covered at 1440×900 by the existing viewport guard.

## Why weather configuration must not be inline

The required weather surface needs a display label, latitude, longitude, units preference, configured/unconfigured state, provider status, last refresh time, retained validation errors, save progress, and explicit refresh/retry. Adding those controls to the main Settings grid would compete with the calendar source list and backup/activity cards, change the reserved row heights, and make provider failure text a variable-height page input. Adding the complete form to the quick-action rail would also enlarge its reserved height and reduce the main dashboard region.

The rail can accept one more compact entry because its button group already wraps within its fixed card. The form and operational status must live outside the primary composition in a bounded dialog.

## Primary and secondary information

Primary information is the household location label, coordinates, unit system, configured state, provider availability, last successful refresh, and save/refresh actions. Validation errors and provider failure recovery must remain visible without losing the entered values.

Secondary information is coordinate-range guidance, the explanation that HomeOps does not geocode or transmit a typed address, the Open-Meteo provider label, and the effect on Home and Agenda. This guidance may scroll inside the dialog body.

## Approved composition

1. Add one `Weerlocatie` button to the existing Settings quick-action rail. Do not add another dashboard card or alter the header/main information architecture.
2. Open one `Weerlocatie` dialog using the established Settings backdrop and fixed header. The dialog is viewport-bounded and does not stack another modal.
3. The dialog body uses a two-region internal composition:
   - an internally scrolling content region containing current status, display label, latitude, longitude, units, validation/errors, and concise privacy/provider guidance;
   - a fixed action row containing cancel, save, and `Weer vernieuwen`/retry.
4. The display label is user-supplied context only. No address lookup, browser geolocation, map, location permission, or third-party geocoding is introduced because no provider/privacy decision exists.
5. Saving validates and persists the complete household location atomically, invalidates the household weather cache, preserves the form on failure, and reports that Home and Agenda will use the new location on their next load. Refresh is explicit and disabled until a valid location is persisted.
6. Provider health is normalized to configured/not-yet-refreshed, available, stale, or unavailable. The UI shows the last refresh time and a retry action, but never raw network exceptions or provider response bodies.
7. Unit selection is operational: weather values remain canonical metric facts on the server, while generated projections identify the household unit system so Home, Weather detail, and Agenda format Celsius/km/h or Fahrenheit/mph consistently.

## Viewport-fit justification

The primary Settings dashboard retains its existing `auto minmax(0, 1fr) auto` rows and sole internal overflow owners. One short rail button does not add a new page region. The dialog uses `max-height: 100%`, a fixed header, `minmax(0, 1fr)` internal content, and a fixed action row. Variable provider text and validation lists scroll only within the dialog content region.

At 1440×900 and 1366×768, the page therefore remains fixed, the action rail remains visible, and all weather actions remain reachable without document scrolling. Automated and independent browser validation must verify `document.body` and `document.documentElement` overflow, dialog bounds, internal overflow ownership, and action-row visibility at both sizes.

## Risks, trade-offs, and alternatives

- Coordinate entry is less friendly than address search, but avoids introducing an unapproved geocoding provider, privacy policy, or location permission. The label keeps the setting understandable to the household.
- Explicit refresh is one extra action after saving, but makes provider contact and failure visible while still invalidating Home/Agenda cache immediately.
- Adding unit-system metadata to projections touches all weather consumers, but keeps canonical server facts and departure-advice thresholds stable. Returning Fahrenheit in fields named `TemperatureCelsius` was rejected as misleading.
- An inline weather card was rejected because provider status and failures have variable height and would compete with the calendar and backup regions.
- A separate top-level weather-settings page was rejected because this is one bounded household setting, not a new primary workspace.

Implementation must follow this composition. A material change to the Settings information architecture, overflow owner, geocoding/privacy boundary, or unit semantics requires revising this analysis before continuing.

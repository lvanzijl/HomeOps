# Weather Detail Dialog Frontend

## Summary

Implemented frontend phase 2 of the FamilyBoard weather integration by opening a compact Weather Detail Dialog from the existing Home Weather Pill. The slice stays frontend-only, uses only the generated `getWeatherDetail()` client for the new dialog work, preserves the existing Home header, and adds no backend changes, no Agenda weather UI, and no binary artifacts.

## Implemented Dialog

- The existing Home Weather Pill in `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/HomeDashboard.tsx` now opens the Weather Detail Dialog on click.
- The dialog renders as a compact FamilyBoard overlay with this order:
  1. vertrekadvies met icoon, temperatuur, subtiele confidence en maximaal één korte verklarende zin;
  2. compacte samenvatting vandaag;
  3. compacte uurverwachting;
  4. compacte lijst met komende dagen;
  5. optionele detailgroep alleen wanneer backenddata beschikbaar is.
- The dialog closes through the existing dialog pattern: close button, Escape, and backdrop click.
- Focus returns to the existing Weather Pill after closing the dialog.

## Data Integration

- Added `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/weatherDetailApi.ts` to load dialog data through the generated `getWeatherDetail()` method.
- The dialog does not call `getAgendaWeather()` and does not build Agenda weather UI.
- The existing departure-advice presentation mapping is reused through `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/weatherPresentation.tsx`, which keeps the shared Dutch advice headline logic consistent between the Home Weather Pill and the dialog.
- The dialog uses only backend-provided weather projection data for advice, summary, hourly, daily, and detail content.

## Interaction

- Opening happens from the existing Home Weather Pill button.
- Closing works through the existing dialog overlay pattern and remains available during loading, empty, and error states.
- Escape/backdrop support is active through the Home dialog interaction model.
- Focus restoration returns the user to the Weather Pill after the dialog closes.

## Fallback Behaviour

- When detail data is unavailable, the dialog shows a compact calm empty state and stays fully closable.
- When the detail API request fails, the dialog shows a neat non-technical error state without exposing provider or exception text.
- The Home Weather Pill remains usable and unchanged even when the detail request fails.

## Validation

- Pre-change: `npm ci`
- Pre-change: `npm run build`
- Pre-change: `npm test` *(existing unrelated failure remains in `src/widgets/components/AgendaWidget.test.tsx`: `synchronizes planning and month to the VisualReview marketing anchor`)*
- Focused post-change: `npm test -- src/home/HomeDashboard.test.tsx`
- Post-change: `npm run build`

## Modified Files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/home/WeatherDetailDialog.tsx`
- `src/HomeOps.Client/src/home/weatherDetailApi.ts`
- `src/HomeOps.Client/src/home/weatherPresentation.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-04-weather-detail-dialog-frontend/weather-detail-dialog-frontend.md`

Explicit confirmations:

- The dialog is opened from the existing Home Weather Pill.
- The dialog uses the generated `getWeatherDetail()` API client method.
- The existing departure-advice presentation helper is reused for the dialog headline mapping.
- Agenda weather UI was not built.
- No backend files were changed.
- No binary artifacts were added.

# Weather Advice Localization Refactor

## Summary

The Home Weather Pill previously owned the Dutch user-facing mapping from `DepartureAdviceCategory` values to short header text locally inside `HomeDashboard.tsx`. This refactor moves that presentation-only copy to a single frontend helper so the same labels can be reused by the Home Weather Pill, a future Weather Detail Dialog, and future weather notifications.

## Centralized Mapping

The centralized mapping now lives in `src/HomeOps.Client/src/weatherAdviceLocalization.ts`.

It exposes `getDepartureAdviceHeaderText(category)`, which maps `DepartureAdviceCategory` to the existing short Dutch header labels:

- `NoJacketNeeded` → `Geen jas nodig`
- `LightJacket` → `Dunne jas aanbevolen`
- `WarmJacket` → `Warme jas aan`
- `RainProtection` → `Regenjas mee`
- `SunProtection` → `Zonnebrand mee`
- `FillDrinkBottle` → `Drinkfles vullen`
- `Windy` → `Veel wind`
- `Slippery` → `Voorzichtig op pad`
- `ExtraTravelTime` → `Vertrek iets eerder`

`HomeDashboard.tsx` now consumes this helper when resolving the Home Weather Pill advice text.

## Design Decisions

- The helper is intentionally presentation-only and only handles `DepartureAdviceCategory` to short Dutch header text.
- The helper does not own icons, colors, temperature formatting, weather conditions, fallback summary handling, or advice business logic.
- Existing Home Weather Pill fallback behavior remains in `HomeDashboard.tsx`, including summary fallback, neutral advice handling, capitalization, and truncation.
- The public API contract and generated client were not changed.
- The mapping is ready to be imported by a future Weather Detail Dialog or weather notification presentation layer without duplicating Dutch advice labels.

## Validation

- Frontend build completed successfully.
- Existing frontend tests completed successfully.
- The existing Home Weather Pill test that expects `Geen jas nodig` from `DepartureAdviceCategory.NoJacketNeeded` still passes, confirming the visible behavior remains unchanged for the covered mapped category.
- No backend, API contract, dependency, project file, generated file, or binary artifact changes were made.

## Modified Files

- `src/HomeOps.Client/src/weatherAdviceLocalization.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `docs/reports/2026-07-04-weather-advice-localization-refactor/weather-advice-localization-refactor.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

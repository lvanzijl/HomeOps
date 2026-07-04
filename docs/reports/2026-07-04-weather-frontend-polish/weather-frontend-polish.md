# Weather Frontend Polish

## Summary

Deze slice rondt de FamilyBoard weerfrontend af met kleine structuur- en accessibility-verbeteringen zonder nieuwe functionaliteit toe te voegen. Home blijft alleen `getHomeWeather()` gebruiken, Detail alleen `getWeatherDetail()`, Agenda alleen `getAgendaWeather()`, en de frontend blijft provider-neutraal.

## Structure Review

- `homeWeatherApi.ts`, `weatherDetailApi.ts` en `agendaWeatherApi.ts` zijn bewust gescheiden gebleven zodat elke surface expliciet zijn eigen endpointgrens houdt.
- De gedeelde client-aanmaak stond wel drie keer gedupliceerd. Die duplicatie is verwijderd via `src/HomeOps.Client/src/weather/weatherApiClient.ts`.
- `weatherPresentation.tsx` en `weatherAdviceLocalization.ts` zijn niet samengevoegd, maar wel bewust samen onder `src/HomeOps.Client/src/weather/` geplaatst:
  - `weatherPresentation.tsx` blijft verantwoordelijk voor formattering, icon mapping en display-opbouw.
  - `weatherAdviceLocalization.ts` blijft verantwoordelijk voor category-to-copy mapping.
- De API-bestandsstructuur is logisch gebleven en is voorbereid op uitbreiding zolang surface-specifieke API's apart blijven en gedeelde presentatielogica in `src/weather/` blijft wonen.

## Presentation Review

- DepartureAdvice-presentatie staat nog steeds op één plek via de gedeelde advice/localization helpers.
- Icon mapping staat centraal in `weatherPresentation.tsx`.
- Temperatuurformattering staat centraal in `weatherPresentation.tsx`.
- Weather formatting duplicatie is verder verminderd door gedeelde accessible-label formattering ook door Agenda te laten gebruiken.
- Home, Detail en Agenda gebruiken nu dezelfde gedeelde presentatielaag vanuit `src/weather/`.

## UI Consistency

- Spacing, typografie, icongroottes en visuele hiërarchie zijn beoordeeld en zijn stabiel genoeg gebleven; er was geen cosmetische CSS-refactor nodig.
- De bestaande Home pill, dialog en Agenda-clusters gebruiken al consistente temperatuurweergave en gedeelde iconen.
- Geen redesign uitgevoerd.

## Accessibility

- Weather Detail Dialog verplaatst focus nu direct naar de sluitknop bij openen.
- Focus keert terug naar de Home Weather Pill bij sluiten via Escape én via de sluitknop.
- De loading state in de dialog kondigt zich nu semantisch aan met `role=\"status\"` en `aria-live=\"polite\"`.
- Agenda weather clusters hebben nu een expliciete `role=\"img\"` zodat hun toegankelijke label semantisch bruikbaar is.
- Iconen blijven decoratief waar dat hoort via `aria-hidden`.

## Refactors Performed

- Verplaatst:
  - `src/HomeOps.Client/src/home/weatherPresentation.tsx` → `src/HomeOps.Client/src/weather/weatherPresentation.tsx`
  - `src/HomeOps.Client/src/weatherAdviceLocalization.ts` → `src/HomeOps.Client/src/weather/weatherAdviceLocalization.ts`
- Toegevoegd:
  - `src/HomeOps.Client/src/weather/weatherApiClient.ts`
- Bijgewerkt:
  - gedeelde weer-imports in Home, Detail en Agenda
  - centrale accessible-label formattering voor Agenda weather
  - dialog focus handling en status announcements
  - frontend tests voor close-button focus restoration en agenda weather semantics

## Validation

- `npm run build` ✅
- `npm test` ✅
- Extra lint stap niet uitgevoerd: er is geen aparte lint script aanwezig in `src/HomeOps.Client/package.json`.

Expliciete eindcontrole:

- Home gebruikt uitsluitend Home API ✅
- Detail gebruikt uitsluitend Detail API ✅
- Agenda gebruikt uitsluitend Agenda API ✅
- Agenda bevat geen DepartureAdvice ✅
- Home bevat geen Agenda data ✅
- Geen Open-Meteo termen zichtbaar in frontend ✅
- Geen businesslogica buiten backend toegevoegd ✅
- Geen providerkennis in frontend zichtbaar ✅
- Geen nieuwe functionaliteit toegevoegd ✅
- Geen binary artifacts toegevoegd ✅

## Remaining Future Improvements

- Als de weerfrontend later verder groeit, kan een kleine dedicated testfile voor gedeelde weather presentation helpers zinvol zijn.
- Pas bij extra weather surfaces is een verdere module-opsplitsing nodig; voor nu is stabiliteit belangrijker dan extra herstructurering.

## Modified Files

- `src/HomeOps.Client/src/agenda/agendaWeatherApi.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/WeatherDetailDialog.tsx`
- `src/HomeOps.Client/src/home/homeWeatherApi.ts`
- `src/HomeOps.Client/src/home/weatherDetailApi.ts`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/weather/weatherAdviceLocalization.ts`
- `src/HomeOps.Client/src/weather/weatherApiClient.ts`
- `src/HomeOps.Client/src/weather/weatherPresentation.tsx`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `docs/reports/2026-07-04-weather-frontend-polish/weather-frontend-polish.md`

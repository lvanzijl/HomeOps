# Weather Backend Research

## Summary

De aanbevolen backend-richting is een kleine FamilyBoard-weather module die direct Open-Meteo gebruikt voor MVP, maar intern alleen FamilyBoard-weather concepten teruggeeft. De backend mag Open-Meteo-data ophalen en vertalen, maar de frontend mag nooit Open-Meteo-parameters, weather codes, veldnamen of providersemantiek hoeven begrijpen.

De module moet drie productvragen bedienen: Home heeft snel een vertrekadvies nodig, Agenda heeft objectieve context per tijdslot nodig, en de detaildialoog heeft uitleg nodig. Dat vraagt om een compact intern domein: current weather, vertrekadvies, hourly slots, daily summaries, freshness en provider status. Meer abstraction dan dat is over-engineering.

Open-Meteo past goed als MVP-bron omdat de forecast API current, hourly en daily data kan leveren en geen API-key vereist voor de open/non-commercial route.[^openmeteo-docs] Tegelijk moet de backend niet rond Open-Meteo response-shapes worden ontworpen. Home Assistant kan later als provider worden toegevoegd via weather entities en `weather.get_forecasts`, maar de backend moet HA-complexiteit niet in het eerste MVP-pad trekken.[^ha-weather][^ha-rest]

## Recommended Backend Direction

Bouw conceptueel één weather application boundary binnen de bestaande modulaire monoliet. Die boundary levert FamilyBoard-weather responses aan de rest van de applicatie en gebruikt daarachter een provider-adapter. Voor MVP is er één adapter: direct Open-Meteo. De boundary bevat ook caching, freshness-regels, missing-data interpretatie en vertrekadvieslogica op hoofdlijnen.

De belangrijkste ontwerpregel: providerdata komt de module binnen, maar verlaat de module niet. Open-Meteo types mogen niet doorlekken naar Home, Agenda of de detaildialoog. Dit beschermt de latere Home Assistant provider en voorkomt dat frontendcomponenten providerkennis krijgen.

De MVP moet bewust klein blijven:

- één primaire household location;
- één weather snapshot voor Home/detail/Agenda;
- cache-first responses;
- geen automatische provider fallback;
- geen database-first weerhistorie;
- geen generieke pluginarchitectuur.

De backend moet snel reageren, vooral voor Home. Home mag niet wachten op een live provider-call. Als de cache bruikbaar is, retourneert de backend die direct. Als de cache ontbreekt of verlopen is, moet de backend een gecontroleerde fallback of stale status kunnen teruggeven in plaats van de Home-header te blokkeren.

## FamilyBoard Weather Domain

Het interne domein moet vanuit FamilyBoard worden benoemd, niet vanuit Open-Meteo. Een logische representatie bestaat uit deze concepten:

- Current weather: huidige of meest relevante startconditie voor de dag.
- Departure advice: korte adviescategorie en tekst voor de Home-header.
- Hourly slots: compacte tijdslots met condition, temperatuur en relevante signalen.
- Daily summaries: compacte dagregels voor de detaildialoog.
- Freshness: wanneer data is opgehaald en tot wanneer zij bruikbaar is.
- Provider status: beschikbaar, vertraagd, gedeeltelijk, verlopen of unavailable.

Home heeft slechts een kleine afgeleide nodig: icoon/condition, temperatuur, advieszin, adviesniveau en freshness/status. De detaildialoog heeft dezelfde topinformatie plus uitleg, hourly slots, daily summaries en details zoals wind, neerslag, gevoelstemperatuur en UV wanneer beschikbaar. Agenda heeft alleen hourly condition en temperatuur voor getimede afspraken.

De backend moet onderscheid maken tussen ruwe providerwaarde en productwaarde. Een provider kan bijvoorbeeld temperatuur, precipitation probability en wind speed leveren; FamilyBoard vertaalt dat naar een vertrekadvies en naar compacte context. Die vertaling hoort backend-side, zodat alle surfaces consistent blijven.

De representatie moet ook partial data aankunnen. Als daily data ontbreekt, kan Home misschien nog werken. Als hourly data ontbreekt, kan Agenda itemweer niet betrouwbaar zijn. Als neerslag of gevoelstemperatuur ontbreekt, kan het vertrekadvies minder stellig moeten worden.

## Provider Architecture

De provider-architectuur moet licht zijn. Er is één provider interface op productniveau nodig: haal een weather snapshot op voor household location, gewenste tijdzone en horizon. Die snapshot wordt meteen genormaliseerd naar FamilyBoard weather concepts.

Voor MVP bevat de Open-Meteo adapter alleen provider-specifieke mapping:

- coördinaten en tijdzone naar providerrequest;
- Open-Meteo current/hourly/daily response naar FamilyBoard current/hourly/daily;
- provider weather codes naar FamilyBoard condition/icon categories;
- ontbrekende velden naar expliciete partial-status.

De departure advice hoort niet in de Open-Meteo adapter. Die regel is belangrijk. Advies is FamilyBoard-productlogica en moet later hetzelfde werken wanneer de bron Home Assistant wordt.

Een latere Home Assistant provider moet dezelfde FamilyBoard snapshot kunnen leveren. HA brengt andere concerns mee: basis-URL, bearer token, selected weather entity, REST/service call gedrag en forecast type. Home Assistant documenteert weather forecast retrieval via `weather.get_forecasts`, terwijl REST API calls bearer-token authenticatie gebruiken.[^ha-weather][^ha-rest]

Voorkom over-engineering door geen multi-provider orchestration, priority engine of automatic fallback in MVP te bouwen. Alleen de seams moeten op de juiste plek zitten: provider mapping apart van advice, caching apart van provider, API shape apart van provider responses.

## Caching Strategy

Caching hoort in de backend-weather boundary, niet in losse frontendcomponenten. De Home-header, detaildialoog en Agenda moeten dezelfde snapshot kunnen gebruiken, anders ontstaan inconsistenties binnen één sessie.

De aanbevolen strategie is cache-first met freshness metadata. De backend retourneert direct een bruikbare cache en triggert eventueel later een refresh. Home mag niet wachten op een live API-call, omdat de Home-header bij openen van FamilyBoard direct waarde moet hebben.

Cacheduur moet verschillen per doel:

- current/Home advies: kort genoeg om ochtendbeslissingen niet te misleiden;
- hourly slots: bruikbaar voor de komende uren, maar refreshbaar bij nieuw bezoek;
- daily summaries: langer houdbaar dan current conditions;
- provider failure: stale data mag alleen met duidelijke status worden gebruikt.

Een praktische MVP-richting is één snapshot-cache per household location met opgehaalde tijd, geldigheidsvenster en providerstatus. Intern kan later onderscheid worden gemaakt tussen current/hourly/daily freshness, maar dat hoeft niet meteen als losse caches te starten.

Startup behavior is kritisch. Als FamilyBoard opstart zonder cache en de provider is traag of unavailable, moet de backend niet hangen. De response moet kunnen zeggen dat er geen weather advice beschikbaar is. Als er stale cache is, kan de backend die alleen teruggeven wanneer de API-shape expliciet maakt dat de data oud is en dat adviezen niet te stellig mogen zijn.

Background refresh is wenselijk, maar moet eenvoudig blijven. Bij openen van Home kan de backend stale-while-refresh gedrag gebruiken: geef cache terug, refresh op de achtergrond, en laat de UI later bijwerken als de applicatie dat ondersteunt. Zonder realtime update blijft de volgende request actueel genoeg.

## Household Location

Voor MVP hoort er één primaire household location te zijn. De weerfunctie is gezinsgericht, niet persoon- of afspraaklocatiegericht. Coördinaten zijn betrouwbaarder dan plaatsnamen en sluiten aan bij Open-Meteo, dat forecast requests op latitude/longitude baseert.[^openmeteo-docs]

De locatieconfiguratie moet minimaal bestaan uit coördinaten en tijdzone. Tijdzone is nodig voor hourly slots, daggrenzen, Agenda-afspraken en het vertrekadvies. De bestaande household timezone richting in HomeOps past bij dit model, maar dit onderzoek implementeert niets.

De backend moet later uitbreiding mogelijk houden:

- Home Assistant Home zone als locatiebron;
- handmatige huishoudlocatie;
- meerdere locaties voor vakanties of tweede huis;
- provider-specifieke locatiekeuze.

Die uitbreidingen moeten niet in MVP worden gebouwd. Een enkele primaire locatie is voldoende voor Home-header, detaildialoog en Agenda. Het grootste risico is privacy en configuratie: gebruikers moeten begrijpen waarom FamilyBoard een locatie nodig heeft en hoe precies die locatie is.

## Departure Advice Strategy

Het vertrekadvies is productlogica, geen providerfeature. De backend moet factoren wegen die relevant zijn voor vertrek en de komende dagdelen, zonder een exact algoritme in de API te lekken.

Invloedrijke factoren:

- luchttemperatuur;
- gevoelstemperatuur;
- neerslagkans of neerslaghoeveelheid;
- timing van regen;
- windsterkte;
- UV-index;
- sterke temperatuurverandering gedurende de dag;
- data freshness en onzekerheid.

Verplichte factoren voor een betrouwbaar basisadvies zijn condition/weather category, temperatuur en relevante tijdcontext. Voor regenjasadvies is neerslaginformatie verplicht. Voor “Zonnebrand mee” is UV of zonsterkte nodig. Voor “Veel wind” is winddata nodig.

Optionele factoren mogen het advies versterken, maar niet onzichtbaar de betrouwbaarheid ondermijnen. Als gevoelstemperatuur ontbreekt, kan de backend nog een temperatuuradvies geven, maar moet het voorzichtiger zijn bij grenswaarden. Als hourly data ontbreekt, mag het advies niet beweren dat het “later droog” of “later nat” wordt.

Missing data moet leiden tot expliciete advice confidence. Bij gedeeltelijke data kan de backend een neutrale of voorzichtige categorie kiezen. Bij onvoldoende data moet de Home-header “Geen weeradvies” kunnen tonen in plaats van een schijnzeker advies.

De backend moet ook zorgen dat Home en detaildialoog dezelfde adviesbasis gebruiken. Als Home “Regenjas mee” toont, moet de detaildialoog kunnen uitleggen waarom. Agenda mag dit advies niet herhalen; Agenda krijgt alleen objectieve weather slots.

## Backend API Shape

De backend responses moeten frontendgericht zijn, maar niet widget-specifiek in het datamodel. Drie responsevormen zijn logisch, allemaal gevuld uit dezelfde cached snapshot.

Home-header response: compact en snel. Bevat condition/icon category, temperatuur, advieszin, severity/tone, freshness en status. Geen hourly arrays, geen providernaam als primaire UI-data, geen Open-Meteo field names.

Detaildialoog response: bevat hetzelfde adviesanker plus vandaag-samenvatting, hourly slots, daily summaries en details. De response mag rijker zijn, maar blijft FamilyBoard-vocabulary gebruiken. Als UV of wind ontbreekt, moet dat als ontbrekend detail kunnen worden weergegeven zonder de hele response te laten falen.

Agenda weather response: bevat per gevraagd tijdslot of per tijdvenster objectieve weather slots met condition/icon category, temperatuur, timestamp, freshness en status. Geen adviestekst. Geen binnen/buiten-afleiding. Voor all-day of tijdloze events hoeft de frontend niets op te vragen of kan de backend lege context teruggeven.

Een alternatief is één brede weather summary endpoint waar de frontend alles uit haalt. Dat is eenvoudiger in MVP, maar riskeert dat Home te veel data ontvangt en dat frontendselecties gaan afwijken. Beter is één interne snapshot met meerdere API-projecties, zodat responses precies passen bij Home, detail en Agenda zonder providerkennis.

API-stabiliteit is belangrijker dan provider-volledigheid. Nieuwe providerdata moet later kunnen worden toegevoegd zonder bestaande Home/Agenda contracten te breken.

## Failure Behaviour

De backend moet failure states normaliseren. De frontend moet geen onderscheid hoeven maken tussen Open-Meteo timeout, DNS failure, HA offline of provider partial data, behalve via productstatussen.

Relevante backendstatussen:

- fresh: actuele data bruikbaar;
- stale: oude data aanwezig, beperkt bruikbaar;
- partial: data mist onderdelen;
- unavailable: geen bruikbare data;
- provider_error: provider faalde, maar productresponse blijft gecontroleerd.

Provider unavailable of internet unavailable: geef cached data als die binnen freshness-regels valt. Zo niet, geef unavailable met lege of neutrale weather payload. Home toont dan “Geen weeradvies”; detaildialoog toont uitleg; Agenda toont geen itemweer.

Cache verlopen: gebruik stale alleen als de response expliciet aangeeft dat de data oud is. Voor vertrekadvies moet de backend strenger zijn dan voor daily summaries. Oud regenadvies is gevaarlijker dan oude weekverwachting.

Gedeeltelijke data: retourneer wat betrouwbaar is en markeer ontbrekende onderdelen. Agenda mag geen itemweer tonen zonder passend hourly slot. Detaildialoog mag details overslaan. Home mag alleen advies tonen als de benodigde factoren voor die adviescategorie aanwezig zijn.

Oude data: de backend moet voorkomen dat oude data eruitziet als actueel advies. Dat betekent freshness is geen decoratief veld maar onderdeel van de productbeslissing.

## Future Extensibility

Home Assistant provider toevoegen is relatief eenvoudig als de MVP Open-Meteo adapter niet doorlekt. De HA-provider hoeft dan alleen dezelfde FamilyBoard snapshot te vullen. Complexiteit blijft beperkt tot configuratie, auth en mapping van HA conditions/forecasts.

Meerdere providers kunnen later via dezelfde provider seam, maar een priority/fallback engine moet pas worden gebouwd wanneer er echte noodzaak is. Provider-neutraliteit betekent niet dat MVP multi-provider moet zijn.

Energieadvies, zonnepanelen, accu en huisstatus horen waarschijnlijk niet in dezelfde weather module, maar wel in een verwante “house context” laag. Weather kan één contextprovider zijn naast energie en sensoren. De weather domain moet daarom schoon genoeg zijn om later door andere adviesmodules gebruikt te worden, zonder zelf een algemene adviesengine te worden.

Weersafhankelijke huishoudadviezen zijn een natuurlijke latere uitbreiding: ramen open/dicht, was buiten hangen, drinkfles vullen, zonnebrand, batterij/zon-opwek context. Deze adviezen mogen niet in MVP-weather responses worden gemengd. Eerst moet het vertrekadvies stabiel zijn.

De belangrijkste uitbreidbaarheidsregel is begrenzing: maak nu de adapter seam en normalized weather shape goed, maar bouw geen brede smart-home abstraction voordat er tweede domeinen zijn.

## Risks

Het grootste risico is over-engineering. Een provider-neutral design kan doorschieten naar pluginarchitectuur, multi-provider orchestration en generieke advice engines. Dat past niet bij het MVP-doel.

Het tweede risico is under-engineering: Open-Meteo veldnamen direct in API-contracten of frontendcomponenten gebruiken. Dat maakt de latere Home Assistant provider duur en verspreidt providerkennis door de applicatie.

Het derde risico is cachevertrouwen. Een snelle Home-header is belangrijk, maar oude data kan schadelijk zijn als het als actueel kledingadvies wordt gepresenteerd. Freshness moet daarom productlogica beïnvloeden, niet alleen zichtbaar zijn.

Het vierde risico is location governance. Een huishoudlocatie lijkt simpel, maar raakt privacy, timezone, daggrenzen en latere Home Assistant Home zone integratie. Te weinig expliciet ontwerp kan later tot inconsistenties leiden.

Het vijfde risico is advice ambiguity. “Dunne jas aanbevolen” klinkt zeker. Als data gedeeltelijk of oud is, moet de backend voorkomen dat zo'n zin onterecht hard wordt.

## Open Questions

Waar wordt de primaire household location uiteindelijk beheerd: bestaande household settings, onboarding, Settings, of later Home Assistant Home zone?

Welke freshness-limiet geldt per adviescategorie? Regenadvies vereist waarschijnlijk kortere freshness dan temperatuuradvies.

Moet de backend een expliciete confidence/tone voor vertrekadvies teruggeven, of is status plus adviescategorie genoeg?

Hoeveel hourly horizon heeft Agenda nodig: alleen vandaag, komende 24 uur, of meerdere dagen voor latere afspraken?

Moet de detaildialoog dezelfde endpointdata gebruiken als Home plus aanvullingen, of een eigen projection krijgen uit dezelfde snapshot?

Hoe zichtbaar moet provider status worden voor gebruikers? Te veel transparantie maakt de UI technisch; te weinig transparantie schaadt troubleshooting.

## Explicit Non-Goals

Dit onderzoek bevat geen backendimplementatie, frontendimplementatie, databasewijziging, API-implementatie, dependency change, projectfile wijziging, testwijziging of generated-file wijziging.

Dit onderzoek schrijft geen exact vertrekadviesalgoritme, geen endpointdefinitie, geen class/interface ontwerp, geen cachecode en geen databaseontwerp.

Er is geen automatische fallback tussen providers in MVP.

Mobiele UI, Shopping, Taken, Motivatie, Mijn Pagina, Weekly Reset en een aparte weerpagina blijven buiten scope.

Er zijn geen screenshots, mockups, UML, class diagrams of binary artifacts toegevoegd.

## Modified Files

Alleen dit backend-architectuuronderzoeksrapport is toegevoegd:

- `docs/reports/2026-07-04-weather-backend-research/weather-backend-research.md`

[^openmeteo-docs]: Open-Meteo Forecast API documentation, https://open-meteo.com/en/docs
[^ha-weather]: Home Assistant Weather integration documentation, https://www.home-assistant.io/integrations/weather/
[^ha-rest]: Home Assistant REST API documentation, https://developers.home-assistant.io/docs/api/rest/

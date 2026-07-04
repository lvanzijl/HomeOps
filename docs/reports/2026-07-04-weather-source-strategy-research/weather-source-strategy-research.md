# Weather Source Strategy Research

## Summary

De beste bronstrategie voor FamilyBoard is: start met direct Open-Meteo als MVP-bron, maar ontwerp de weerlaag conceptueel als provider-neutraal zodat Home Assistant later als voorkeursbron kan worden toegevoegd. Een directe Home Assistant-first strategie past beter bij de latere smart-home visie, maar maakt de eerste weerintegratie afhankelijk van lokale installatie, authenticatie, entity-keuze en Home Assistant-beschikbaarheid.

De productregel blijft leidend: Home geeft een advies, Agenda geeft context, de detaildialoog geeft uitleg. Daarvoor is voorspelbare beschikbaarheid belangrijker dan maximale integratiezuiverheid. Direct Open-Meteo is voor demo/dev en eerste huishoudens eenvoudiger, omdat het geen API-key vereist, via eenvoudige HTTP/JSON werkt en current, hourly en daily data kan leveren. Open-Meteo noemt current conditions, hourly data en een groot aantal variabelen in de forecast API, en vermeldt dat geen API-key nodig is voor open/non-commercial gebruik.[^openmeteo-docs]

Home Assistant is strategisch belangrijk omdat dezelfde laag later waarschijnlijk sensoren, energie, zonnepanelen, accu en huisstatus levert. De weerbron via Home Assistant kan current conditions en daily/hourly forecast leveren via weather entities en `weather.get_forecasts`; de REST API vereist echter bearer-token authenticatie en forecast-response ophalen via service calls met response data.[^ha-weather][^ha-rest]

## Recommended Source Strategy

Aanbevolen: gebruik direct Open-Meteo als MVP/dev/demo pad, met een kleine provider-abstraction op conceptueel niveau vanaf het begin. Die abstraction moet niet groter worden dan nodig: FamilyBoard heeft een normalized weather view nodig voor Home-header, detaildialoog en Agenda, geen generiek weather-platform.

Home Assistant moet in deze fase niet de enige bron worden. Dat zou de weerfunctie onnodig koppelen aan een werkende lokale HA-installatie terwijl de Home-header juist betrouwbaar moet laden bij openen van Home. Voor huishoudens zonder HA of zonder geconfigureerde weather entity zou de kernwaarde direct wegvallen.

Ook een volledige runtime fallback “HA eerst, Open-Meteo fallback” is niet de beste eerste stap. Het lijkt robuust, maar introduceert dubbele configuratie, bronverschillen, cache-inconsistenties en moeilijk uitlegbare situaties waarin Home en HA verschillende verwachtingen tonen. Fallback is alleen nuttig als FamilyBoard exact kan uitleggen welke bron actief is en als beide bronnen dezelfde locatie, units en tijdzone gebruiken.

De meest proportionele strategie is daarom:

- MVP: direct Open-Meteo voor weer.
- Architectuurhouding: normalizeer naar FamilyBoard-weather behoeften, niet naar Open-Meteo types.
- Later: voeg Home Assistant weather provider toe als voorkeursbron voor HA-huishoudens.
- Fallback: pas later beoordelen; niet automatisch in de eerste implementatie.

## Direct Open-Meteo Option

Direct Open-Meteo betekent dat FamilyBoard zelf weerdata ophaalt voor de huishoudlocatie. Dit is de eenvoudigste route voor MVP, demo en ontwikkelomgevingen. Er is geen account- of tokenflow nodig, geen Home Assistant-installatie, geen entity-selectie en geen lokale netwerkafhankelijkheid.

Voordelen:

- Lage configuratiedrempel: locatie/coördinaten zijn genoeg.
- Geschikt voor demo/dev zonder smart-home setup.
- Current, hourly en daily data zijn direct bij de bron opvraagbaar.
- Geen Home Assistant-authenticatie of entity-discovery nodig.
- Caching kan volledig door FamilyBoard worden bepaald.

Nadelen:

- FamilyBoard wordt zelf verantwoordelijk voor providerintegratie, rate limits, caching en failure handling.
- Latere HA-integratie krijgt mogelijk een tweede weerpad naast sensoren/energie/huisstatus.
- Open-Meteo free/open-access heeft rate limits en geen uptime-garantie; de pricingpagina noemt onder andere 10.000 calls per dag voor de free API en geen uptime guarantee.[^openmeteo-pricing]
- Locatie- en consentkeuzes moeten in FamilyBoard zelf worden opgelost.

Datavolledigheid is voor de vastgezette UX/UI waarschijnlijk voldoende. Home heeft current/ochtendtemperatuur, weather code, neerslag, wind en gevoelstemperatuur nodig. Agenda heeft hourly icoon/temperatuur nodig bij getimede afspraken. De detaildialoog vraagt current, hourly en daily data. Open-Meteo ondersteunt deze categorieën direct in één API-familie.[^openmeteo-docs]

Failure behavior is overzichtelijk: als internet of Open-Meteo faalt, toont FamilyBoard fallback-copy zoals “Geen weeradvies”. Met caching kan de Home-header eventueel laatst bekende data tonen met voorzichtige status, maar dit moet niet als actueel advies worden gepresenteerd als de data te oud is.

Ontwikkelcomplexiteit is laag tot middel. De complexiteit zit niet in ophalen, maar in brononafhankelijke interpretatie naar FamilyBoard-advies. Die interpretatie is sowieso nodig, ook bij Home Assistant.

## Home Assistant Weather Backend Option

Home Assistant als weather backend betekent dat FamilyBoard weerdata ophaalt via een HA weather entity. Dit past strategisch bij een toekomst waarin Home Assistant ook sensoren, energie, zonnepanelen, accu en huisstatus levert. Eén lokale smart-home hub als bron kan op termijn logisch voelen voor huishoudens die HA al gebruiken.

Voordelen:

- Sluit aan bij latere Home Assistant-integratie voor huisstatus en energie.
- Gebruikt de provider die het huishouden al in HA heeft gekozen.
- Kan weather current conditions en hourly/daily forecasts leveren via HA weather entities en forecast actions.[^ha-weather]
- Units en locatie kunnen aansluiten bij Home Assistant-instellingen.
- HA kan Open-Meteo zelf gebruiken via de Home Assistant Open-Meteo integratie, inclusief zonekeuze en 30-minuten polling.[^ha-openmeteo]

Nadelen:

- Vereist werkende Home Assistant-installatie, netwerkbereikbaarheid en tokenconfiguratie.
- De Home Assistant REST API vereist bearer-token authenticatie.[^ha-rest]
- Forecast ophalen is praktisch een service/action call (`weather.get_forecasts`) met response data, niet simpelweg een statisch JSON-document lezen.[^ha-rest-services]
- Huishoudens moeten weten welke weather entity FamilyBoard moet gebruiken.
- HA offline betekent dat de Home-header zijn primaire weeradvies mist, tenzij FamilyBoard eigen cache of fallback-bron heeft.

Current conditions zijn via weather entity state/attributes beschikbaar, maar forecasts vragen specifiek om `weather.get_forecasts`. Home Assistant documenteert hourly forecastgebruik via die action en toont fields zoals condition, precipitation_probability, wind, temperature, precipitation en humidity in de action response.[^ha-weather]

Het grootste praktische probleem is niet dat HA geen data kan leveren, maar dat HA een extra operationele afhankelijkheid wordt voor een Home-headerfunctie die altijd snel moet zijn. Als HA herstart, offline is, of tokens verlopen/verkeerd zijn geconfigureerd, krijgt FamilyBoard geen weer. Voor sensoren en energie is die afhankelijkheid later logisch; voor het eerste weer-MVP is zij zwaar.

## Hybrid Strategy Option

Er zijn drie hybride routes.

Eerste route: Home Assistant als voorkeursbron met direct Open-Meteo als fallback. Dit maximaliseert theoretische beschikbaarheid, maar is complex. FamilyBoard moet dan twee bronnen configureren, bronprioriteit bepalen, cache per bron bijhouden, verschillen in forecastmodel accepteren en voorkomen dat Home en Agenda data uit verschillende bronnen mengen. Dit is alleen zinvol voor huishoudens waar HA belangrijk is én waar weer in de Home-header kritiek genoeg is om dubbele broncomplexiteit te dragen.

Tweede route: direct Open-Meteo als MVP-pad met latere Home Assistant-adapter. Dit is de aanbevolen hybride strategie. De eerste implementatie blijft eenvoudig en demo-vriendelijk, terwijl de interne shape van weerdata niet aan Open-Meteo mag vastgroeien. Later kan een HA-provider dezelfde FamilyBoard-weather shape vullen.

Derde route: provider-abstraction vanaf het begin. Dit is verstandig als het klein blijft. Het moet gaan om een broncontract op productniveau: current summary, hourly slots, daily summaries, freshness en source status. Het moet geen algemene pluginarchitectuur worden. Te veel abstraction vóór de eerste werkende weerfunctie is scope creep.

Fallback is dus niet automatisch nuttig. Een fallback kan juist verkeerde verwachtingen creëren: als HA offline is maar Open-Meteo werkt, ziet de gebruiker wel weer maar mist misschien lokale HA-specifieke voorkeuren of locatie. Als Open-Meteo via HA en direct Open-Meteo allebei bestaan, kunnen updatefrequentie en modelselectie verschillen.

## Data Needs From UX and UI

De UX/UI vraagt geen volledige weer-app dataset. De minimale databehoefte is:

- Home-header: icoon/condition, temperatuur, adviesgrondslag, freshness.
- Detaildialoog: current conditions, samenvatting vandaag, hourly forecast, daily forecast, details zoals wind, gevoelstemperatuur, neerslag en UV waar beschikbaar.
- Agenda: hourly condition en temperatuur per getimed afspraakmoment.

Direct Open-Meteo past hier goed omdat current, hourly en daily in dezelfde forecast API zitten. Home Assistant past ook, mits de gekozen weather integration hourly en daily forecasts levert. Niet iedere HA-weather provider zal exact dezelfde velden of horizon leveren; FamilyBoard moet daarom geen UX beloven die elke HA-provider altijd kan vullen.

Agenda is de scherpste datapunt-test. Voor een afspraak om 16:00 is hourly temperatuur/condition nodig. Als een bron alleen daily forecast levert, is die bron onvoldoende voor Agenda-itemweer. In dat geval moet Agenda itemweer weglaten in plaats van daily data te misbruiken.

Voor het Home-advies is datakwaliteit belangrijker dan datavolledigheid. Een advies zonder neerslag of gevoelstemperatuur kan te stellig worden. De bronstrategie moet dus ook missing-field gedrag definiëren: bij onvoldoende signalen liever “Geen weeradvies” of voorzichtige copy dan een harde uitspraak.

## Configuration and Setup Impact

Direct Open-Meteo vraagt vooral een huishoudlocatie. Dat kan via coördinaten, bestaande household timezone/location-instellingen of een later onboarding-veld. Voor MVP/dev/demo is dit beheersbaar.

Home Assistant vraagt meer:

- HA basis-URL.
- Long-lived access token of andere veilige authenticatiekeuze.
- Geselecteerde weather entity.
- Netwerkbereikbaarheid vanuit FamilyBoard backend/runtime.
- Begrip van wat er gebeurt als HA lokaal offline is.

Voor een smart-home huishouden is dit acceptabel, maar voor FamilyBoard als product kan het de eerste weerervaring onnodig zwaar maken. Een ouder wil “Regenjas mee” zien, niet eerst een weather entity kiezen.

Als Home Assistant later toch de centrale huislaag wordt, moet configuratie UX helder scheiden tussen “weer direct via Open-Meteo” en “weer via Home Assistant”. Een verborgen automatische fallback zou moeilijk te begrijpen zijn wanneer bronnen verschillen.

## Caching and Freshness

De Home-header moet snel zijn. Het weer mag Home niet blokkeren. Daarom is caching noodzakelijk, ongeacht de bron.

Direct Open-Meteo: FamilyBoard kan zelf een cachebeleid kiezen, bijvoorbeeld kort genoeg voor ochtendadvies maar lang genoeg om Home direct te openen. Open-Meteo free usage vraagt bovendien discipline in requestfrequentie. De documentatie en pricing geven voldoende reden om calls te bundelen en niet per component apart op te halen.[^openmeteo-pricing]

Home Assistant: HA pollt zijn Open-Meteo integratie zelf iedere 30 minuten, volgens de HA Open-Meteo documentatie.[^ha-openmeteo] FamilyBoard moet daar niet bovenop agressief pollen. Het kan HA-data cachen en freshness tonen/interpreteren. Let op: HA freshness is tweeledig; FamilyBoard weet wanneer HA is geraadpleegd, maar moet ook begrijpen wanneer HA de onderliggende provider voor het laatst heeft bijgewerkt als dat beschikbaar is.

Voor Agenda is hourly data relatief stabiel voor de komende uren, maar bij buien kan snelle verandering relevant zijn. Toch moet FamilyBoard de page niet continu verversen. Beter is één weather snapshot per Home/Agenda laadmoment plus rustige background refresh later.

## Failure Behavior

Bij direct Open-Meteo failure zijn de oorzaken meestal internet, providerdown, rate limit of ongeldige locatie. De UI kan dan stabiel fallbacken: Home “Geen weeradvies”, detaildialoog korte uitleg, Agenda zonder itemweer.

Bij Home Assistant failure zijn er meer varianten: HA offline, token ongeldig, entity ontbreekt, providerintegratie in HA unavailable, HA kan internet niet bereiken, of `weather.get_forecasts` levert niet de gevraagde forecast type. De HA Open-Meteo documentatie noemt bijvoorbeeld dat de weather entity unavailable kan worden als Open-Meteo niet bereikbaar is en later herstelt.[^ha-openmeteo]

Fallback naar direct Open-Meteo bij HA failure klinkt aantrekkelijk, maar is productmatig dubbelzinnig. Als de gebruiker HA als voorkeursbron koos, moet FamilyBoard dan stil overschakelen? Of zichtbaar melden “Weer via reservebron”? Zichtbaar melden maakt de rustige Home-header drukker. Stil overschakelen kan vertrouwen schaden wanneer waarden verschillen.

Voor MVP is de eenvoudigste failure-strategie beter: één bron, duidelijke fallback, cache met freshness-limiet. Later kan fallback als expliciete instelling worden toegevoegd als er bewijs is dat HA-offline vaak genoeg voorkomt en dat gebruikers de reservebron begrijpen.

## Risks

Het grootste risico van direct Open-Meteo is dat FamilyBoard een tweede integratieroute bouwt naast de latere Home Assistant-laag. Dit kan technische schuld worden als de Open-Meteo-shape diep in productlogica lekt.

Het grootste risico van Home Assistant-first is dat de eerste weerervaring faalt bij huishoudens zonder HA of met incomplete HA-configuratie. Dat raakt direct de Home-header, waar weer functioneel prioriteit 1 krijgt binnen de gereserveerde plek.

Het grootste risico van hybride fallback is complexiteit die groter is dan het probleem. Twee bronnen kunnen verschillende temperatuur, condition, regenmomenten en updatefrequenties geven. Dat kan het vertrouwen in het advies ondermijnen.

Een tweede risico is commerciële/licentieontwikkeling. Open-Meteo is aantrekkelijk voor MVP/dev/demo, maar free/open-access voorwaarden en commerciële vereisten moeten vóór productie opnieuw juridisch/productmatig worden beoordeeld. De pricingpagina maakt onderscheid tussen free/open-access en customer API met commerciële licentie.[^openmeteo-pricing]

Een derde risico is HA-provider-variatie. Home Assistant normaliseert weather entities, maar onderliggende integraties verschillen. FamilyBoard moet dus blijven omgaan met ontbrekende hourly/daily velden.

## Open Questions

Moet FamilyBoard in productie commercieel gebruik van Open-Meteo plannen via een betaalde/customer endpoint, of blijft het uitsluitend binnen toegestane open/non-commercial contexten?

Waar komt de huishoudlocatie vandaan: onboarding, Home Assistant Home zone, handmatige coördinaten, of een bestaande household setting? Dit bepaalt zowel configuratiegemak als privacyverwachting.

Moet Home Assistant later alleen weather leveren, of wordt HA de generieke “house context provider” waar weather, sensoren, energie en status onder vallen? Die keuze bepaalt hoe breed de provider-abstraction moet worden.

Moet de gebruiker de actieve bron kunnen zien of kiezen? Transparantie helpt troubleshooting, maar te veel bronkeuze past slecht bij een rustig gezinsdashboard.

Welke freshness-limiet maakt een Home-advies nog acceptabel? Een temperatuur van 45 minuten oud kan vaak prima zijn; regenadvies van 45 minuten oud kan misleidend zijn.

## Explicit Non-Goals

Dit onderzoek bevat geen backend-, frontend-, database-, API-, dependency-, projectfile-, test- of generated-file wijzigingen.

Dit onderzoek ontwerpt geen datamodel, endpoint, adapter-interface, cache-implementatie of Home Assistant setup flow.

Dit onderzoek kiest geen definitieve commerciële/licentiepositie voor Open-Meteo; het signaleert alleen dat dit vóór productie beoordeeld moet worden.

Mobiele UI, Shopping, Taken, Motivatie, Mijn Pagina, Weekly Reset en een aparte weerpagina blijven buiten scope.

Er zijn geen screenshots, mockups of binary artifacts toegevoegd.

## Modified Files

Alleen dit bronstrategie-onderzoeksrapport is toegevoegd:

- `docs/reports/2026-07-04-weather-source-strategy-research/weather-source-strategy-research.md`

[^openmeteo-docs]: Open-Meteo Forecast API documentation, https://open-meteo.com/en/docs
[^openmeteo-pricing]: Open-Meteo Pricing documentation, https://open-meteo.com/en/pricing
[^ha-weather]: Home Assistant Weather integration documentation, https://www.home-assistant.io/integrations/weather/
[^ha-rest]: Home Assistant REST API documentation, https://developers.home-assistant.io/docs/api/rest/
[^ha-rest-services]: Home Assistant REST API service response documentation, https://developers.home-assistant.io/docs/api/rest/#post-apiservicesdomainservice
[^ha-openmeteo]: Home Assistant Open-Meteo integration documentation, https://www.home-assistant.io/integrations/open_meteo/

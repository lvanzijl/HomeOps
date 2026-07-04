# Weather UX Research

## Summary

De weerintegratie moet in FamilyBoard geen algemene weerservice worden, maar een ochtendbeslissing ondersteunen: moeten de jongens vandaag een jas, regenjas of extra laag aan? De beste UX-richting is daarom een kleine, betrouwbare beslissingsmodule in de Home-header met alleen een icoon, temperatuur en één praktische advieszin.

De Home-header is de juiste primaire plek omdat FamilyBoard daar al de dag opent met datum, tijd en gezinscontext. Weer hoort daar als gezinsrelevante context naast, niet als extra kaart in het dashboard. Agenda mag weer alleen gebruiken als subtiele context rond tijden; de detaildialoog is de enige plek waar meer meteorologische informatie thuishoort.

Open-Meteo kan hiervoor voldoende variabelen leveren, waaronder temperatuur, gevoelstemperatuur, neerslag, wind en UV-index. Dat betekent niet dat FamilyBoard al die waarden prominent moet tonen. Hoe meer ruwe weerdata zichtbaar wordt, hoe groter het risico dat ouders alsnog zelf moeten interpreteren in plaats van snel een kledingbesluit te nemen.

## Recommended UX Direction

De aanbevolen UX is een gelaagde benadering: Home geeft een oordeel, de detaildialoog geeft onderbouwing, Agenda geeft context. Het oordeel moet kort en handelingsgericht zijn, bijvoorbeeld “Regenjas mee”, “Dunne jas aanbevolen” of “Geen jas nodig”. De temperatuur ondersteunt het oordeel, maar mag het oordeel niet vervangen.

De interface moet expliciet prioriteren op ochtendgebruik. Ouders hebben op dat moment weinig tijd, kinderen bewegen door het huis, en het scherm moet vanaf afstand leesbaar blijven. Daarom moet de Home-header geen reeks met regenpercentages, windkracht, uurblokken of dagverwachtingen tonen. Eén advieszin met een herkenbaar weericoon is sterker dan een compacte mini-weerapp in de header.

De detaildialoog mag rijker zijn, maar moet nog steeds gezinsgericht blijven. De dialoog moet antwoord geven op “waarom zegt FamilyBoard dit?” en “verandert het later vandaag?”. Als de dialoog vooral meteorologische volledigheid toont, verliest FamilyBoard zijn rol als rustig huishoudbord.

## Home Header Weather

De bestaande Home-header bestaat uit een datum/tijdblok en een gezinsstrip. Daardoor is de gereserveerde weerruimte UX-technisch het meest logisch als derde, compacte header-entiteit: niet dominanter dan de dag zelf, maar wel zichtbaar genoeg om de ochtendbeslissing te sturen.

De minimale informatie die nodig is:

- weericoon voor snelle herkenning;
- actuele of ochtend-relevante temperatuur;
- korte praktische advieszin.

Voorbeelden van goede UI-tekst zijn “Geen jas nodig”, “Dunne jas aanbevolen”, “Regenjas mee” en “Warme jas aan”. Deze zinnen zijn bewust normatief. Dat is passend voor FamilyBoard, omdat het product niet alleen informatie toont maar het gezinsritme rustiger moet maken.

De header blijft rustig wanneer aanvullende signalen niet naast de advieszin concurreren. Regenkans, wind, gevoelstemperatuur en UV horen niet standaard in de header. Ze mogen alleen indirect invloed hebben op het advies. Bij uitzondering kan één kleine nuance zinvol zijn, bijvoorbeeld “Regenjas mee · later regen”, maar dit moet zeldzaam blijven; anders wordt de header alsnog een weerwidget.

Een belangrijk risico is schijnzekerheid. “Geen jas nodig” kan onbedoeld klinken alsof het de hele dag geldt. Een betere UX kan daarom impliciet of expliciet de tijdshorizon bewaken: het advies gaat over vandaag naar school/opvang en de komende relevante uren, niet over elk mogelijk buitenscenario. Woorden als “vandaag” moeten voorzichtig worden gebruikt wanneer het weer later sterk verandert.

## Weather Details Dialog

De detaildialoog mag aanvoelen als een compacte weer-app, maar moet inhoudelijk gefilterd blijven door de FamilyBoard-vraag. De dialoog opent vanuit de Home-header en moet de compacte Home-weergave niet dupliceren met alleen meer cijfers; hij moet verklaren waarom het advies gegeven is.

De aanbevolen inhoudsvolgorde:

Eerst een beslissingssamenvatting: icoon, temperatuur, gevoelstemperatuur en dezelfde advieszin als in de header. Daaronder hoort een korte onderbouwing in gewone taal, bijvoorbeeld “Koud in de ochtend, droog tot na school” of “Regen verwacht rond ophalen”. Dit voorkomt dat ouders zelf uurdata moeten vertalen naar kledingkeuzes.

Daarna komen de komende uren. Dit is belangrijker dan de komende dagen, omdat de jasvraag meestal gaat over vertrek, schooldag, ophalen en buitenspelen. Uurblokken moeten beperkt blijven tot de relevante dagdelen, niet tot een lange horizontale dataset. Regenmomenten, temperatuurverloop en wind kunnen hier visueel samengaan, maar de nadruk moet liggen op verandering: wordt het later kouder, natter of winderiger?

Komende dagen zijn secundair. Een compacte 3- tot 5-daagse vooruitblik kan helpen voor planning, maar mag niet concurreren met vandaag. Als de dialoog te veel ruimte aan de weekverwachting geeft, verandert de functie van “ochtendhulp” naar “weer-app”.

Regen, wind, gevoelstemperatuur en UV-index horen in de dialoog wanneer ze gedragsrelevant zijn. Regen is relevant voor regenjas of laarzen. Wind is relevant als de gevoelstemperatuur of stormachtige omstandigheden het kledingadvies veranderen. UV-index is vooral relevant bij zonnige dagen en buitenspelen, maar moet niet standaard even prominent zijn als regen. Gevoelstemperatuur is vaak belangrijker dan luchttemperatuur, maar moet worden uitgelegd door het advies en niet als los technisch getal domineren.

## Agenda Weather Context

In Agenda moet weer ondersteunend blijven. Het mag afspraken niet classificeren als binnen of buiten en mag geen nieuwe verwachting wekken dat FamilyBoard weet welke activiteit buiten plaatsvindt. De gevraagde richting is daarom passend: subtiele weercontext bij dagheaders en bij getimede afspraken, geen itemweer bij all-day of tijdloze afspraken.

Bij de dagheader “Vandaag” kan een klein weericoon met temperatuur helpen om de dag visueel te ankeren. Dit moet afgezonderd zijn van de agendastatus, bijvoorbeeld als rustige meta-informatie naast of onder de header. Het mag niet lijken op een waarschuwing tenzij het weer echt bepalend is.

Bij afspraken met tijd is rechts uitgelijnde context logisch. Ouders lezen links wat er gebeurt en rechts wanneer/onder welke omstandigheden. Een icoon en temperatuur op het tijdstip is genoeg. Extra labels zoals regenpercentage per afspraak zouden snel te druk worden en kunnen onterecht suggereren dat de afspraak buiten plaatsvindt.

Voor latere afspraken blijft hetzelfde patroon bruikbaar, maar de betrouwbaarheid neemt af naarmate het tijdstip verder weg ligt. De UX moet daarom vermijden dat latere weersymbolen te stellig aanvoelen. Subtiele visuele behandeling is hier belangrijker dan volledigheid.

Voor all-day events en afspraken zonder tijd is geen per-item weerinformatie de juiste keuze. Zonder tijdstip is de weersituatie te vaag en zou FamilyBoard meer zekerheid suggereren dan beschikbaar is. De dagheader kan dan voldoende context bieden.

## Fallbacks and Empty States

Wanneer weerdata ontbreekt, moet de Home-header niet leeg of technisch aanvoelen. Een rustige fallback zoals “Weer niet beschikbaar” is duidelijker dan een spinner die blijft staan. Als de datum/tijd en gezinsstrip normaal werken, mag het ontbreken van weer de Home-header niet visueel uit balans trekken.

Een goede fallback toont geen advies. “Kijk even buiten” kan sympathiek zijn, maar moet spaarzaam worden gebruikt omdat het als grap of als productfalen kan voelen. Beter is een neutrale staat: “Geen weeradvies beschikbaar”. In de detaildialoog kan iets meer uitleg: “We kunnen het weer nu niet ophalen. Probeer later opnieuw.”

Voor Agenda moet ontbrekende weerdata simpelweg betekenen dat de weercontext wegvalt. Afspraken mogen hun layout niet herschikken of lege weercontainers tonen. Het ontbreken van weer mag de agenda niet minder bruikbaar maken.

Er is ook een gedeeltelijke fallback nodig. Als temperatuur beschikbaar is maar regenverwachting ontbreekt, is een jasadvies mogelijk minder betrouwbaar. De UX moet dan liever een voorzichtiger advies tonen dan een harde uitspraak. Bijvoorbeeld “Neem voor de zekerheid een jas mee” kan beter zijn dan “Geen jas nodig” wanneer belangrijke signalen ontbreken.

## Risks

Het grootste UX-risico is dat FamilyBoard ongemerkt een weer-app wordt. Dat gebeurt vooral als de Home-header meer velden krijgt, de detaildialoog te veel meteorologische data toont, of Agenda per afspraak uitgebreide weersamenvattingen krijgt. De productvisie vraagt om huishoudelijke rust, niet om datadichtheid.

Een tweede risico is verkeerde verwachting. Ouders kunnen een kledingadvies interpreteren als garantie voor de hele dag, terwijl weerdata onzeker is en per locatie kan afwijken. Dit is extra gevoelig bij regenbuien, windvlagen en veranderlijke dagen. De UX moet daarom geen absolute taal gebruiken wanneer de situatie onzeker of wisselend is.

Een derde risico is inconsistentie tussen Home en Agenda. Als Home “Regenjas mee” zegt maar Agenda bij de middagafspraak zon toont, kan dat verwarrend zijn. Dit hoeft geen fout te zijn, maar de UX moet de verschillende tijdshorizons helder houden: Home adviseert voor de praktische dagstart, Agenda toont context per tijdstip.

Een vierde risico is visuele concurrentie in de Home-header. De gezinsstrip is emotioneel belangrijk en datum/tijd zijn oriëntatiepunten. Het weer mag functioneel prioriteit 1 worden binnen de gereserveerde plek, maar niet de hele header overnemen. Te grote iconen, felle waarschuwingstinten of meerdere regels tekst zouden de Home-layout onrustiger maken.

## Open Questions

De belangrijkste open vraag is welke tijdshorizon het kledingadvies precies gebruikt. Gaat het om vertrek naar school, de hele schooldag, ophalen, avondactiviteiten, of een combinatie? Zonder deze keuze kan dezelfde weersituatie tot verschillende adviezen leiden.

Een tweede vraag is hoe gezinscontext wordt meegenomen zonder profielen of persoonlijke voorkeuren te introduceren. “De jongens” impliceert kinderen, maar niet ieder kind heeft dezelfde koubeleving of jasregel. UX-wise is één gezinsadvies rustiger, maar mogelijk minder precies.

Een derde vraag is hoe streng het advies moet zijn bij onzekerheid. Moet FamilyBoard vaker voorzichtig adviseren, zoals “Jas mee voor de zekerheid”, of juist alleen waarschuwen wanneer data duidelijk is? Een te voorzichtige app wordt genegeerd; een te stellige app veroorzaakt fouten.

Een vierde vraag is of er aparte tekst nodig is voor regenjas versus paraplu. Voor kinderen is “Regenjas mee” waarschijnlijk praktischer dan “Paraplu mee”, maar dit raakt huishoudelijke gewoontes en leeftijd.

## Explicit Non-Goals

Dit onderzoek neemt Shopping, Taken, Motivatie, Mijn Pagina, Weekly Reset en een aparte weerpagina niet mee. Het weer blijft beperkt tot Home-header, weer-detaildialoog en Agenda-context.

Dit onderzoek beoordeelt niet of afspraken binnen of buiten plaatsvinden. FamilyBoard moet uit agendatitels of locaties geen buitenactiviteit afleiden. Dat zou verkeerde verwachtingen creëren en vraagt om productlogica die buiten deze UX-scope valt.

Dit onderzoek bevat geen backend-, frontend-, database-, API- of dependency-implementatie. Het doet geen uitspraak over datamodellen, endpoints, projectstructuur of technische integratievolgorde.

## Modified Files

Alleen dit UX-onderzoeksrapport is toegevoegd:

- `docs/reports/2026-07-04-weather-ux-research/weather-ux-research.md`

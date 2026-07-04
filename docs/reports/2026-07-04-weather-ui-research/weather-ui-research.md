# Weather UI Research

## Summary

De UI-richting voor Open-Meteo weer in FamilyBoard moet de UX-regel visueel bewaken: Home geeft een advies, Agenda geeft context, de detaildialoog geeft uitleg. Het weer is functioneel belangrijk, maar mag de bestaande Home-header niet overnemen van datum, tijd en gezinscontext.

De beste richting is een compacte, klikbare weather pill of mini-card in de Home-header met één rustig SVG-icoon, een duidelijke temperatuur en een korte Nederlandse advieszin voor vertrek. De dialoog mag rijker zijn, maar moet geordend blijven rond gezinsbeslissingen in plaats van meteorologische volledigheid. Agenda moet juist terughoudender zijn: alleen icoon en temperatuur, zonder adviezen of interpretatie.

De grootste UI-risico's zijn drukte in de header, icon overload in Agenda en een detaildialoog die te veel op een generieke weer-app gaat lijken. Deze risico's zijn beheersbaar als de visuele hiërarchie strikt blijft: advies prominent in Home, uitleg in de dialoog, objectieve context in Agenda.

## Recommended UI Direction

Gebruik één consistente visuele taal voor weer: zachte FamilyBoard-oppervlakken, afgeronde vormen, voldoende touchruimte, rustige custom SVG-iconen en korte Nederlandse tekst. Weer mag een herkenbare eigen kleurtoon hebben, bijvoorbeeld zacht blauw of warm geel, maar moet binnen het bestaande pastelpalet blijven en niet als alarmbanner aanvoelen.

De UI moet niet proberen alle Open-Meteo-data zichtbaar te maken. Open-Meteo is de bron, niet de interface. FamilyBoard toont alleen wat een ouder in de ochtend helpt: wat moet mee of aan, waarom is dat zo, en op welk moment verandert het weer ongeveer.

Aanbevolen patroon:

- Home-header: één compacte vertrekadvies-tegel.
- Detaildialoog: een compacte, gezinsgerichte weerlaag met cards.
- Agenda: kleine objectieve weersignalen bij dag en tijd.

Dit houdt de Home rustig en maakt de detaildialoog de plek voor verdieping. Het voorkomt ook dat Agenda adviezen gaat herhalen of concurreren met afspraken.

## Home Header Weather UI

De Home-header moet het weer tonen als een derde header-element naast datum/tijd en gezinscontext. De weather UI moet zichtbaar zijn bij het openen van Home, maar mag qua gewicht niet groter voelen dan de dag zelf. Een compacte pill of kleine card is daarom beter dan een brede banner.

De aanbevolen opbouw binnen de header is horizontaal op desktop: links een weericoon, centraal de temperatuur, rechts of onder de temperatuur een korte advieszin. Op smallere tabletbreedtes kan de advieszin onder temperatuur en icoon vallen, zolang de card één duidelijk geheel blijft en niet twee regels extra hoogte afdwingt.

Visuele hiërarchie:

- advieszin is de belangrijkste tekst;
- temperatuur is groot genoeg voor scanbaarheid, maar secundair aan het advies;
- icoon ondersteunt herkenning en mag niet het grootste element zijn;
- eventuele microcopy is alleen zichtbaar in fallback of warning-state.

De maximale tekstlengte moet streng zijn. Goede adviezen passen bij voorkeur op één regel en ongeveer 18 tot 24 tekens. “Dunne jas aanbevolen” zit aan de veilige kant. “Neem voor de zekerheid een regenjas mee” is te lang voor de header en hoort in de dialoog. Korte labels zoals “Regenjas mee”, “Warme jas aan”, “Zonnebrand mee”, “Drinkfles vullen” en “Veel wind” werken beter.

De klik/tap affordance moet subtiel maar duidelijk zijn. De hele weather pill kan een touch target zijn met een kleine chevron, “Details” hoeft niet als aparte knop zichtbaar te zijn. Een expliciete knop zou de header drukker maken. Hover/focus mag de rand of achtergrond iets versterken; op touch moet de card als tappable aanvoelen door vorm, schaduw en consistentie met andere FamilyBoard-cards.

Om dominantie te voorkomen moet de card geen felle rood/oranje alarmstijl gebruiken voor normale situaties. Ook moet de header niet meerdere weerregels tonen, geen uurblokjes bevatten en geen regenpercentages naast het advies zetten. Als er meer uitleg nodig is, is dat juist het bewijs dat de gebruiker de detaildialoog moet openen.

Bij ontbrekende data blijft de plek stabiel. Toon een ingetogen staat met bijvoorbeeld “Geen weeradvies” en een neutraal wolk- of streepicoon. De temperatuur kan dan ontbreken. De card moet niet instorten, want dat zou de header laten verspringen.

Een warning-state moet waarschuwen zonder paniek. “Veel wind” of “Regen later” kan in een iets warmere tint staan, maar niet als rode foutmelding. Alleen situaties die direct invloed hebben op vertrek horen in de header. Een weerwaarschuwing-achtige uitstraling zou te technisch en te generiek dashboardachtig worden.

## Weather Details Dialog UI

De detaildialoog mag de rijkste weerervaring bieden, maar moet compact blijven en vanuit FamilyBoard voelen. De dialoog moet openen vanuit de Home-header en bij sluiten terugkeren naar dezelfde Home-context zonder navigatiegevoel. Het sluitgedrag moet voorspelbaar zijn: sluitknop rechtsboven, escape/backdrop waar passend, en focus terug naar de weather pill.

De aanbevolen visuele volgorde is:

1. Advies voor vertrek.
2. Samenvatting vandaag.
3. Uurverwachting.
4. Komende dagen.
5. Details onderaan.

Bovenaan hoort een hero-card met het advies voor vertrek. Die herhaalt de Home-boodschap, maar mag één verklarende zin toevoegen, bijvoorbeeld “Koud bij vertrek, droog tot ophalen” of “Regen rond schooltijd”. Deze card moet niet te hoog worden; hij is een beslisanker, geen marketinghero.

De samenvatting van vandaag kan als compacte card met maximaal drie signalen: temperatuurverloop, regenmoment en wind/gevoel. Drie is belangrijk: vier of vijf badges maken de dialoog meteen druk. Labels moeten Nederlands en praktisch blijven, bijvoorbeeld “Ochtend 8°”, “Regen na 14:00”, “Frisse wind”.

De uurverwachting moet horizontaal scanbaar of in compacte dagdelen worden getoond. Voor desktop kan een rij met 6 tot 8 tijdpunten werken; voor tablet is dagdeelgroepering rustiger. Elk uurblok bevat maximaal icoon, tijd en temperatuur. Regen kan met een kleine druppelindicator worden aangegeven, maar niet met lange percentages per blok tenzij dit visueel zeer ingetogen blijft.

De komende dagen horen onder de uurverwachting, compact als 5-daagse vooruitblik. Zeven dagen kan op desktop, maar maakt de dialoog sneller generiek. De FamilyBoard-vraag is vandaaggericht; vijf dagen is waarschijnlijk voldoende. Elke dagregel toont dagnaam, icoon, min/max of gemiddelde temperatuur en eventueel één kort signaal. Meer informatie hoort niet in deze laag.

Details onderaan mogen gevoelstemperatuur, neerslagkans, wind en UV tonen. Deze details moeten visueel ondergeschikt zijn, bijvoorbeeld als kleine facts-grid. UV hoeft alleen prominent te worden wanneer het tot een advies als “Zonnebrand mee” leidt. Anders is het een detail, geen hoofdboodschap.

Iconen in de dialoog mogen groter zijn dan in Agenda, maar moeten consistent blijven met de Home-header. De dialoog mag rijk voelen door ruimte, groepering en zachte contrasten, niet door veel verschillende iconstijlen of kleuren.

## Agenda Weather UI

Agenda moet uitsluitend objectieve weersinformatie tonen: icoon en temperatuur. Er komen geen advieszinnen, geen regenjasadvies, geen binnen/buiten-aannames en geen waarschuwingsteksten per afspraak. Dit is essentieel om Agenda rustig te houden en verkeerde verwachtingen te voorkomen.

De dagheader “Vandaag” kan rechts of ondergeschikt naast de titel een klein weercluster krijgen: icoon plus temperatuur. Het cluster moet visueel afgezonderd zijn van agenda-statussen, bijvoorbeeld met een dunne scheidingslijn, lichte achtergrond of meta-stijl. Het mag niet de indruk wekken dat het de status van de dag bepaalt.

Bij afspraken met tijd hoort het weer rechts uitgelijnd in dezelfde horizontale lijn als tijd of event-meta. De eventtitel blijft links dominant. Het weercluster is compact: klein icoon, temperatuur, geen extra tekst. Bij latere afspraken blijft hetzelfde patroon bruikbaar, maar de styling moet subtiel blijven omdat latere voorspellingen minder zeker voelen.

Voor all-day events en afspraken zonder tijd wordt geen per-item weer getoond. Een tijdloze afspraak heeft geen passend weerslot, en een itemweerbadge zou valse precisie geven. De dagheader blijft dan de enige weerscontext.

Spacing en alignment zijn kritisch. Het weercluster moet een vaste, kleine breedte hebben zodat titels niet gaan springen per item. Als een eventregel te smal wordt, moet weer eerder verdwijnen dan dat de titel afbreekt op een rommelige manier. Agenda blijft primair een planningsoverzicht.

Fallback bij itemweer is eenvoudig: toon niets. Geen streepjes, geen “n.v.t.” en geen lege iconplek per afspraak. Voor de dagheader kan een neutrale fallback wel nuttig zijn, maar alleen als de Home-header ook geen data heeft; anders ontstaan inconsistenties tussen Home en Agenda.

## Iconography Direction

FamilyBoard moet voor productie richting eigen consistente SVG-weather assets bewegen. Unicode emoji zijn hooguit acceptabel als tijdelijke MVP-placeholder, maar passen niet goed bij de gewenste volwassen producttaal. Emoji verschillen per platform, voelen soms te speels en zijn visueel minder controleerbaar in desktop/tablet dashboards.

De beste richting is een hybride in ontwikkelvolgorde maar niet in uiteindelijke stijl: hergebruik de bestaande icon-componentstructuur en voeg daar custom weer-SVG's aan toe. Zo blijven sizing, accessibility, kleur en stroke/fill-conventies consistent met de rest van FamilyBoard.

Weericonen moeten rustig, afgerond en leesbaar zijn. Ze mogen vriendelijk zijn, maar niet kinderachtig. Zon, wolk, regen, wind, mist en sneeuw zijn waarschijnlijk voldoende voor de eerste UI-richting. Complexe meteorologische iconen of provider-specifieke pictogrammen zouden Home te technisch maken.

Agenda-iconen moeten kleiner en simpeler zijn dan Home-iconen. In Agenda is het icoon een contextpunt, geen beslisanker. Een 16 tot 20 px visuele maat is waarschijnlijk passend, mits touch targets van het agenda-item zelf niet kleiner worden. In de Home-header en dialoog kan het icoon groter zijn, maar nog steeds binnen de cardhiërarchie.

Icon overload ontstaat wanneer elk datapunt een eigen icoon krijgt. Daarom moet de detailsdialoog iconen groeperen: één hoofdicoon bovenaan, kleine iconen in uur/dagrijen, en details onderaan eventueel met minimale symbols. Niet elke detailwaarde heeft een illustratie nodig.

## Fallback and Warning States

Fallback-states moeten layout-stabiel zijn. In de Home-header blijft de weather pill aanwezig met neutrale copy zoals “Geen weeradvies”. De temperatuur verdwijnt of wordt vervangen door een rustig placeholder-teken, maar de card behoudt ongeveer dezelfde afmeting.

In de detaildialoog toont de fallback geen lege weer-app. Beter is een korte uitlegkaart: “We kunnen het weer nu niet ophalen.” Daaronder kan de rest van de dialoog wegblijven. Een retry-knop is een functionele keuze voor later; UI-wise moet de staat vooral kalm en begrijpelijk zijn.

In Agenda is het ontbreken van weer minder belangrijk. Bij itemweer verdwijnt het cluster volledig. Bij de dagheader kan een neutraal icoon plus “Geen weer” overwogen worden, maar dit is alleen wenselijk als het niet extra aandacht trekt.

Warning-states moeten niet alarmistisch zijn. FamilyBoard moet niet visueel concurreren met officiële weerwaarschuwingen. Gebruik liever compacte adviezen zoals “Veel wind”, “Regen later” of “Zonnebrand mee” in Home. In Agenda blijven waarschuwingsteksten verboden; daar blijft het bij icoon en temperatuur.

Een inconsistentie om te vermijden: een Home-warning in warme tint terwijl Agenda overal normale icoontjes toont. Dat kan kloppen door verschillende doelen, maar de UI moet het verklaren via de detaildialoog, niet door meer tekst in Agenda toe te voegen.

## Desktop and Tablet Considerations

Op desktop is er genoeg breedte om de weather pill horizontaal in de Home-header te plaatsen. Toch moet de UI ontworpen worden alsof de header schaars is, omdat gezinsavatars, datum en toekomstige statusinformatie ook ruimte nodig hebben. De weather pill moet daarom compact blijven en geen brede banner worden.

Op tablet is hoogte vaak de beperkende factor. De weather UI mag de header niet hoger maken op een manier die de Home-summary-grid naar beneden duwt. Als de tekst niet past, moet de advieszin korter worden of op compacte wijze afbreken; het dashboard mag niet documentachtig gaan scrollen.

De detaildialoog moet op desktop ruim maar begrensd zijn. Op tablet moet hij touch-friendly blijven zonder lange verticale scroll. Een interne dialoogscroll is acceptabeler dan page scroll, maar de belangrijkste vertrekadvies-card en vandaag-samenvatting moeten direct zichtbaar blijven.

Agenda heeft op tablet minder ruimte voor rechts uitgelijnde itemweerclusters. Daarom moet itemweer optioneel weg kunnen vallen bij krappe breedte. Het is ondersteunende context; de afspraak zelf is belangrijker. Dit betekent dat de UI-richting niet afhankelijk mag zijn van itemweer om begrijpelijk te blijven.

## Risks

De header kan te druk worden als advies, temperatuur, icoon, warning, detailknop en extra weerdata tegelijk zichtbaar zijn. De UI moet daarom één primaire tekstregel afdwingen en detailinformatie consequent verplaatsen naar de dialoog.

De detaildialoog kan te veel een volledige weer-app worden als 7-daagse voorspelling, regenpercentages, windrichting, UV, gevoelstemperatuur en uurdata allemaal even prominent zijn. De dialoog moet rijk zijn in structuur, niet in datadichtheid.

Icon overload is een reëel risico. FamilyBoard heeft al domeiniconen, gezinsavatars en statusaccenten. Weericonen moeten daarom een beperkte set vormen en niet elke rij visueel domineren.

Agenda kan rommelig worden wanneer rechts uitgelijnde temperatuurclusters de eventtitel verdringen of wanneer elk item een mini-weersvoorspelling lijkt te krijgen. Objectieve icoon-plus-temperatuur is voldoende; meer hoort niet in Agenda.

Temperatuur plus icoon is niet altijd voldoende duidelijk, vooral bij wind, gevoelstemperatuur of regen later op de dag. Dat is acceptabel in Agenda, omdat Agenda context toont. Voor Home moet het advies die interpretatie opvangen.

Advieszinnen kunnen snel te lang worden. Als de UI langere zinnen toestaat, wordt de header onrustig en minder scanbaar. De contentstrategie moet dus net zo streng zijn als de visuele layout.

## Open Questions

Hoeveel karakters mag de Home-advieszin exact hebben voordat zij wordt vervangen door een kortere variant? Een harde contentlimiet voorkomt dat de UI later ongemerkt groeit.

Moet “Zonnebrand mee” dezelfde prioriteit krijgen als jas- of regenadvies, of alleen verschijnen bij hoge UV en zonnig buitenspeelweer? UI-wise voelt zonnebrand als een ander type vertrekadvies dan jas, maar het kan voor ouders wel praktisch zijn.

Moet de Home-header één advies tegelijk tonen, of mogen twee compacte signalen naast elkaar bestaan, bijvoorbeeld “Regenjas mee” en “Drinkfles vullen”? Twee signalen verhogen nut, maar verdubbelen ook de headerdrukte.

Welke iconstijl sluit het beste aan bij de bestaande custom SVG-richting: line icons, filled soft icons of een combinatie met zachte kleurvlakken? Deze keuze raakt de bredere FamilyBoard icon library.

Op welk breekpunt verdwijnt itemweer in Agenda op tablet? Dit moet later visueel worden gevalideerd, omdat tekstlengtes en eventtitels sterk variëren.

## Explicit Non-Goals

Dit onderzoek bevat geen backend-, frontend-, database-, API-, dependency-, projectfile- of testwijzigingen. Het beschrijft alleen UI-richting.

Mobiele UI valt buiten scope. De analyse richt zich op desktop en tablet.

Shopping, Taken, Motivatie, Mijn Pagina, Weekly Reset en een aparte weerpagina vallen buiten scope. Weer wordt alleen onderzocht voor Home-header, weer-detaildialoog en Agenda.

Agenda krijgt geen advieszinnen, geen regenjasadvies, geen binnen/buiten-aannames en geen waarschuwingsteksten per afspraak.

Er zijn geen mockup-afbeeldingen of binary artifacts toegevoegd.

## Modified Files

Alleen dit UI-onderzoeksrapport is toegevoegd:

- `docs/reports/2026-07-04-weather-ui-research/weather-ui-research.md`

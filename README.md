# Website Landelijke Onderwijsdag 2026

Statische website (gewone HTML, CSS en JavaScript, geen build-stap) van de Landelijke Onderwijsdag op 24 november 2026.
Live op https://landelijkeonderwijsdag.nl.

**Een push naar de `master`-branch staat binnen ongeveer een minuut live.** Netlify pakt het automatisch op.
Controleer dus altijd eerst lokaal (open het bestand in je browser) voordat je pusht.

## Eerste keer opzetten

1. Installeer [GitHub Desktop](https://desktop.github.com) en log in.
2. Kies File → Clone repository → `landelijkeonderwijsdag2026` en sla op in een gewone lokale map, **niet in OneDrive, SharePoint of Google Drive**. Een git-map in een gesynchroniseerde map kan beschadigen.
3. Ga naar File → Options → Git en vul je eigen naam en e-mailadres in. Zo is in de geschiedenis te zien wie wat heeft gewijzigd.

## Dagelijks werken

1. **Fetch/Pull** in GitHub Desktop: haal eerst de wijzigingen van collega's op.
2. Pas bestanden aan (bijvoorbeeld in VS Code of Claude Code).
3. Open de pagina in je browser en controleer of het klopt.
4. Schrijf onderaan links in GitHub Desktop een korte omschrijving (bijvoorbeeld "Nr.12 aangepast: nieuwe spreker"), klik **Commit** en daarna **Push origin**.
5. Werk niet tegelijk met een collega aan hetzelfde bestand. `programma.html` is erg groot, spreek dus af wie er bezig is.

Ging er iets mis? Rechtsklik in het tabblad History op de laatste commit en kies "Revert changes in commit" om hem terug te draaien, en push opnieuw.

## Waar staat wat

| Bestand of map | Inhoud |
| --- | --- |
| `index.html`, `programma.html`, `funplein.html`, `praktische-informatie.html`, `word-standhouder.html`, `contact.html` | de pagina's van de site |
| `persoonlijk-programma.html` | verborgen pagina voor deelnemers (staat niet in het menu) |
| `assets/styles.css` | alle opmaak (kleuren, lettertypes, kaarten) |
| `assets/main.js` | menu, filters, favorieten |
| `assets/img/` | foto's, logo's van sprekers en standhouders |
| `assets/files/` | timetable-PDF, brochure, agenda-bestand (.ics) |
| `assets/data/` | sessiegegevens voor het persoonlijk programma (wordt gegenereerd, niet handmatig aanpassen) |
| `netlify/`, `netlify.toml` | server-functie en instellingen voor het persoonlijk programma |
| `tools/` | scripts en uitleg voor het persoonlijk programma (zie `tools/README.md`) |
| `sitemap.xml`, `robots.txt` | zoekmachine-instellingen |

Huisstijl: kleuren `#39B9EC`, `#E72B76`, `#CCD626`, `#F2B300`; lettertypes Ubuntu (koppen) en Poppins (tekst). Zie de styleguide-PDF in de hoofdmap.

## Veelvoorkomende wijzigingen

**Een sessie aanpassen (titel, spreker, toelichting)**
Zoek in `programma.html` op de titel of het sessienummer en pas de tekst aan. Elke sessie is één `<article class="session-card">`.
Staat de titel ook in een `data-fav-titel`, pas die dan ook aan.

**Een sessie als vol markeren**
Voeg `session-card--full` toe aan de klasse van de kaart (`class="session-card session-card--full"`). Er verschijnt dan een label "Sessie vol".
Een sessie weer vrijgeven doe je door die klasse weg te halen.

**De timetable-PDF vervangen**
1. Zet de nieuwe PDF in `assets/files/` met dezelfde naam: `timetable-2026.pdf`.
2. Zoek in `programma.html` naar `timetable-2026.pdf?v=` en verhoog het getal erachter (bijvoorbeeld van 14 naar 15). Zo zien bezoekers meteen de nieuwe versie en niet de oude uit hun cache.

**Een standhouder of spreker toevoegen**
Zet de afbeelding in `assets/img/` en kopieer een bestaand blok in de juiste pagina. Gebruik het logo in de originele kleuren, zoals het is aangeleverd.

**Opmaak (CSS) aanpassen**
Pas `assets/styles.css` aan en verhoog daarna in **alle** `.html`-bestanden het getal in `styles.css?v=...` (zoek en vervang over alle bestanden). Anders zien bezoekers nog even de oude opmaak.

**Het persoonlijk programma bijwerken met een nieuwe deelnemerslijst**
Zie `tools/README.md`. Dat vraagt de Excel en een geheime sleutel; vraag hulp aan wie dit eerder deed.

## Wat je nooit moet committen

- De Excel met deelnemers (`*.xlsx`, `*.csv`) en het bestand `.programma-key`. Ze staan in `.gitignore`, maar controleer in GitHub Desktop bij het committen dat ze niet in de lijst met wijzigingen staan.
- Persoonsgegevens, wachtwoorden of API-sleutels in een gewoon tekstbestand.
- De repository is **publiek**: alles wat gepusht wordt, is voor iedereen te lezen, ook als je het later verwijdert.

## Hulp nodig?

Staat er na een push iets raars op de site? Draai dan de laatste commit terug (zie hierboven) en pas het daarna in alle rust aan.

# Afspraken voor Claude (en collega's) bij deze website

Statische website van de Landelijke Onderwijsdag 2026 (Consortium Beroepsonderwijs / Stichting Praktijkleren), live op https://landelijkeonderwijsdag.nl.
Zie `README.md` voor de praktische handleiding en `tools/README.md` voor het persoonlijk programma.

## Werkwijze

- **Taal:** praat en schrijf in het Nederlands, ook in commit-berichten en teksten op de site.
- **Niet pushen zonder akkoord.** Een push naar `master` zet de site binnen een minuut live (en kost een Netlify-build). Wijzig en controleer lokaal, laat zien wat er veranderd is en vraag: "Wil je dat ik dit naar live push?" Push pas na een duidelijk ja.
- Bij een reeks kleine aanpassingen: bundel ze in één push.
- Controleer na elke wijziging met een zoekopdracht of de aanpassing overal staat waar het hoort (bijvoorbeeld een titel in de kaart én in `data-fav-titel`) en dat er niets anders is gewijzigd (`git diff`).
- Canva-ontwerpen (bijvoorbeeld LinkedIn-afbeeldingen) hoef je niet aan te passen; dat doet de gebruiker zelf.

## Huisstijl (bindend)

Bron: `Consortium Beroepsonderwijs_huisstijl_Styleguide_V1.pdf`.

- Kleuren: blauw `#39B9EC`, roze `#E72B76`, geel `#F2B300`, groen `#CCD626`, plus warm grijs `#E9E4E1` en `#DDD6D3`, zwart en wit. Gebruik de CSS-variabelen in `assets/styles.css`, nooit eigen hexcodes.
- Lettertypes: Ubuntu voor koppen, Poppins voor lopende tekst. Voeg geen ander lettertype toe.
- Logo's van standhouders en partners in hun originele kleuren, zoals aangeleverd of van hun eigen website. Niet inkleuren, uitrekken of roteren.
- Het logo met de vier gekleurde bolletjes (roze, blauw, geel, groen) is bewust gekozen als favicon (`assets/favicon*`) en deelafbeelding (`assets/og-image.png`).

## Veelvoorkomende wijzigingen (valkuilen)

- **Sessies** staan in `programma.html` als `<article class="session-card">`. Een sessietitel staat meestal op meer dan één plek (kop, `data-fav-titel`, teaser en toelichting): pas alles aan.
- **"Sessie vol":** voeg `session-card--full` toe aan de klasse van de kaart. Haal de klasse weg om de sessie weer vrij te geven.
- **Timetable-PDF vervangen:** zet de nieuwe PDF als `assets/files/timetable-2026.pdf` en verhoog het getal in `timetable-2026.pdf?v=` in `programma.html`. Bij een nieuwe PDF van de gebruiker: controleer eerst met een PDF-reader of er wijzigingen in staan die ook op de site moeten (volle sessies, titels, sprekers, tijden).
- **CSS of JavaScript gewijzigd:** verhoog het versienummer (`styles.css?v=`, `main.js?v=`) in alle `.html`-bestanden, anders ziet de bezoeker nog even de oude versie.
- **Starttijden:** lange sessie in ronde 1 is 11.00 – 12.30, korte sessies 11.00 en 12.00. Ronde 2: lange sessie 13.15 – 14.30, korte sessies 13.15 en 14.00. Ronde 3 is 15.00 – 15.30. Lunch 12.30 – 13.15, pauze 14.30 – 15.00, afsluiting en borrel 15.30. Deze tijden staan op de programmapagina (dagoverzicht en boven elke ronde) en in `tools/tijden.json`/`tools/build_persoonlijk_programma.py` voor het persoonlijk programma; houd ze gelijk.
- **Standhouders** staan op `funplein.html` en `word-standhouder.html`; de afbeelding hoort in `assets/img/`.
- Het programma is volledig. Er staat geen "er volgt nog meer"-melding meer; alleen een kleine regel dat het programma onder voorbehoud van last-minute wijzigingen is.

## Persoonlijk programma (verborgen pagina)

- Pagina `persoonlijk-programma.html` (adres `/persoonlijk-programma`): een deelnemer vult voor- en achternaam in en ziet de eigen sessies per ronde plus de rest van de dag. Niet in het menu en niet in `sitemap.xml`; blijft `noindex`.
- De deelnemerslijst komt uit een Excel ("Badges"). Die wordt versleuteld (AES-256-GCM) opgeslagen in `netlify/functions/persoonlijk-programma/data.mjs`. Een Netlify Function (`index.mjs`) zoekt de naam op en geeft alleen de sessies van die ene persoon terug. De publieke sessiegegevens (zonder namen) staan in `assets/data/programma-sessies.json`.
- **Dit JSON-bestand wordt gegenereerd uit `programma.html`.** Pas je een sessietitel, spreker of toelichting aan, draai dan ook het build-script (zie `tools/README.md`), anders toont het persoonlijk programma de oude tekst.
- Zaalindeling is nog niet bekend. De gebruiker levert een nieuwe Excel met een kolom waarin "zaal" in de kop staat; het script neemt die over (details in `tools/README.md`).
- **Nooit committen:** de Excel (`*.xlsx`, `*.csv`) en `.programma-key` staan in `.gitignore`. De repo is publiek.
- De sleutel staat in een gedeelde Google Drive-map van het team (samen met de Excel) en in Netlify als omgevingsvariabele `PERSOONLIJK_PROGRAMMA_SLEUTEL`. Wordt de sleutel vervangen, werk dan `data.mjs` en de variabele samen bij. Een geheime variabele moet in de Netlify-webinterface worden gezet (via de koppeling lukt dat niet).
- Beperkingen om te weten: wie een volledige naam raadt, ziet dat programma; er is een eenvoudige limiet per IP-adres. Overweeg een tweede veld (e-mail of badgenummer) als dat een probleem wordt.

## Hosting en deploy

- GitHub: `Stichting-Praktijkleren/landelijkeonderwijsdag2026`, branch `master`. Netlify-project `landelijkeonderwijsdag2026` bouwt automatisch bij elke push; er is geen build-stap, de bestanden gaan zoals ze zijn online.
- De Netlify-app moet op de GitHub-organisatie geïnstalleerd blijven staan, anders verdwijnen de automatische deploys.
- Netlify-instellingen (omleidingen, headers, functiemap) staan in `netlify.toml`, `_headers` en `_redirects`. `/netlify/*` en `/tools/*` geven bewust een 404.
- Draai teruggedraaide fouten terug met `git revert`, niet met een geforceerde push.

## Achtergrond

De site is eerder herbouwd op basis van de bestaande landelijkeonderwijsdag.nl. Wil je weten waarom iets zo is opgezet (favicon, menu-volgorde), kijk dan eerst in de git-geschiedenis voordat je aanneemt dat het een fout is.

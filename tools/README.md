# Persoonlijk programma bijwerken

De pagina `/persoonlijk-programma` zoekt een deelnemer op naam op en toont de eigen dag.
De deelnemerslijst staat **versleuteld** in `netlify/functions/persoonlijk-programma/data.mjs`.
De publieke sessiegegevens (zonder namen) staan in `assets/data/programma-sessies.json`.

## Nieuwe Excel verwerken

1. Zet de Excel ergens buiten de repo-map of laat hem staan (`*.xlsx` wordt nooit gecommit).
2. Draai vanuit de hoofdmap:

   ```
   python tools/build_persoonlijk_programma.py "pad\naar\2026-MM-DD Badges Landelijke Onderwijsdag 2026.xlsx"
   ```

   De datum aan het begin van de bestandsnaam wordt op de pagina getoond als "bijgewerkt tot".
3. Controleer de samenvatting (aantallen). Het script stopt als een sessie niet in `programma.html` voorkomt.
4. `git add -A`, commit en push naar `master`; Netlify zet het live.

## Zalen

Zodra de zaalindeling bekend is, kan die op drie manieren mee:

- Een extra kolom in de Excel met "zaal" plus de ronde in de kop, bijvoorbeeld `Ronde 1 lange sessie zaal`
  of `Ronde 2 korte sessie deel 1 zaal`.
- Achter de sessietitel in de cel: `(Zaal Earth)`.
- Of een bestand `tools/zalen.json` met sessienummer naar zaal: `{"9": "Zaal Earth", "37": "Zaal Fire 1"}`.

Zonder zaal toont de pagina "Wordt nog bekendgemaakt".

## Starttijden van korte sessies

Standaard staat het tijdvak van de ronde bij elke sessie. Exacte tijden per slot overschrijf je in
`tools/tijden.json`, bijvoorbeeld `{"r1_kort1": "11.00 – 11.30 uur", "r1_kort2": "11.45 – 12.15 uur"}`.

## Sleutel

De sleutel staat in `.programma-key` (niet in git) en moet als geheime omgevingsvariabele
`PERSOONLIJK_PROGRAMMA_SLEUTEL` in Netlify staan. Raak je de sleutel kwijt, dan kan de lijst niet meer gelezen worden:
draai het script dan opnieuw met een nieuwe sleutel en zet die ook in Netlify. Het script maakt de sleutel aan als hij ontbreekt.
Bij een nieuwe sleutel moeten `data.mjs` en de omgevingsvariabele altijd samen worden bijgewerkt.

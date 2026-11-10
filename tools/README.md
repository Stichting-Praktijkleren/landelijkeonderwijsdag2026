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

## Zalen en plattegrond

- `tools/zalen.json`: sessienummer naar zaal (uit de timetable-PDF).
- `tools/zaal-locaties.json`: per zaal de toevoeging (bijvoorbeeld "1e verdieping") en de plek op de plattegrond
  (`verdieping` 0 of 1, `x`, `y`, `w`, `h` in procenten van de afbeelding in `assets/img/plattegrond/`).
- Een zaal in de Excel (kolom met "zaal" in de kop of `(Zaal ...)` achter de sessietitel) gaat vóór `zalen.json`.

Na een wijziging:

```
python tools/zalen_op_programma.py
python tools/build_persoonlijk_programma.py "pad\naar\Badges.xlsx"
```

Het eerste script zet de zaal op de sessiekaarten in `programma.html`, het tweede zet zalen en plattegrondposities in het persoonlijk programma.

## Pendelservice

Wie in de Excel-kolom `Pendelservice` "Ja" heeft, ziet in het persoonlijk programma bovenaan de busschema's naar De Werelt
en onderaan terug naar het station. Het schema komt uit `praktische-informatie.html` (blok `id="pendelbus"`).
Pas je daar de tijden aan, draai dan het script opnieuw.

## Starttijden van korte sessies

Standaard staat het tijdvak van de ronde bij elke sessie. Exacte tijden per slot overschrijf je in
`tools/tijden.json`, bijvoorbeeld `{"r1_kort1": "11.00 – 11.30 uur", "r1_kort2": "11.45 – 12.15 uur"}`.

## Sleutel

De sleutel staat in `.programma-key` (niet in git) en moet als geheime omgevingsvariabele
`PERSOONLIJK_PROGRAMMA_SLEUTEL` in Netlify staan. Raak je de sleutel kwijt, dan kan de lijst niet meer gelezen worden:
draai het script dan opnieuw met een nieuwe sleutel en zet die ook in Netlify. Het script maakt de sleutel aan als hij ontbreekt.
Bij een nieuwe sleutel moeten `data.mjs` en de omgevingsvariabele altijd samen worden bijgewerkt.

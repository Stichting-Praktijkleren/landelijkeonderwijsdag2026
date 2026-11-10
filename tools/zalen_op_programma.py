"""
Zet de zaal (met toevoeging) op elke sessiekaart in programma.html.

Gebruik (vanuit de hoofdmap):
    python tools/zalen_op_programma.py

Bron: tools/zalen.json (sessienummer -> zaal) en tools/zaal-locaties.json (toevoeging per zaal).
Het script is herhaalbaar: een bestaande zaalregel wordt eerst weggehaald en daarna opnieuw geplaatst.
Draai daarna ook tools/build_persoonlijk_programma.py, zodat het persoonlijk programma dezelfde zalen toont.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROGRAMMA = ROOT / "programma.html"
ZALEN = ROOT / "tools" / "zalen.json"
LOCATIES = ROOT / "tools" / "zaal-locaties.json"

PIN = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
       '<path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>')
OUD = re.compile(r'\n?\s*<p class="session-card__zaal">.*?</p>', re.S)


def main():
    zalen = json.loads(ZALEN.read_text(encoding="utf-8"))
    locaties = {k: v for k, v in json.loads(LOCATIES.read_text(encoding="utf-8")).items() if not k.startswith("_")}
    tekst = PROGRAMMA.read_text(encoding="utf-8")
    tekst = OUD.sub("", tekst)

    delen = re.split(r'(<article class="session-card[^"]*"[^>]*>)', tekst)
    gezet, zonder = 0, []
    for i in range(1, len(delen), 2):
        kaart = delen[i + 1]
        m = re.search(r'data-fav-nr="(\d+)"', kaart)
        if not m:
            continue
        nr = str(int(m.group(1)))
        zaal = zalen.get(nr)
        if not zaal:
            zonder.append(nr)
            continue
        toevoeging = locaties.get(zaal, {}).get("toevoeging", "")
        regel = (f'\n          <p class="session-card__zaal">{PIN}<span><strong>{html.escape(zaal)}</strong>'
                 + (f' <span class="session-card__zaal-route">{html.escape(toevoeging)}</span>' if toevoeging else "")
                 + "</span></p>")
        kop = re.search(r"</h3>", kaart)
        if not kop:
            sys.exit(f"Sessie {nr}: geen <h3> gevonden.")
        delen[i + 1] = kaart[:kop.end()] + regel + kaart[kop.end():]
        gezet += 1

    PROGRAMMA.write_text("".join(delen), encoding="utf-8")
    print(f"Zaal gezet op {gezet} sessiekaarten.")
    if zonder:
        print("LET OP: geen zaal bekend voor sessie(s):", ", ".join(zonder))


if __name__ == "__main__":
    main()

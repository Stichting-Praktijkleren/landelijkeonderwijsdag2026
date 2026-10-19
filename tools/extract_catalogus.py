"""
Leest alle sessiekaarten uit programma.html en schrijft ze naar een catalogus (dict op nummer).
Wordt gebruikt door build_persoonlijk_programma.py. Bevat alleen publieke programma-informatie.
"""
import html
import re
from pathlib import Path

from bs4 import BeautifulSoup

PROGRAMMA = Path(__file__).resolve().parent.parent / "programma.html"


def _clean(text):
    return re.sub(r"\s+", " ", html.unescape(text or "")).strip()


def _title(h3):
    # get_text zonder scheidingsteken: delen in <strong> (zoals 'exAmIneren') horen aan elkaar
    return _clean(h3.get_text(""))


def _speakers(dl):
    """Geeft [{naam, rol}] terug uit het <dl> van een sessiekaart."""
    result = []
    if dl is None:
        return result
    for dt in dl.find_all("dt"):
        if _clean(dt.get_text()).lower() not in ("spreker", "sprekers"):
            continue
        dd = dt.find_next_sibling("dd")
        if dd is None:
            continue
        items = dd.select("ul.session-card__speakers li")
        if items:
            for li in items:
                name = li.select_one(".session-card__speaker-name")
                role = li.select_one(".session-card__speaker-role")
                result.append({"naam": _clean(name.get_text()) if name else "",
                               "rol": _clean(role.get_text()) if role else ""})
        else:
            role = dd.select_one(".session-card__speaker-role")
            role_text = _clean(role.get_text()) if role else ""
            if role:
                role.extract()
            name_text = _clean(dd.get_text())
            if name_text:
                result.append({"naam": name_text, "rol": role_text})
    return result


def extract_typen(soup):
    """Per sessietype (workshop, presentatie, ...) het label en het icoon zoals op de programmapagina."""
    typen = {}
    for art in soup.select("article.session-card"):
        slug = art.get("data-session-type", "")
        if not slug or slug in typen:
            continue
        badge = art.select_one(".session-badge")
        icon = art.select_one(".session-card__visual-icon svg")
        typen[slug] = {"label": _clean(badge.get_text()) if badge else slug,
                       "icoon": str(icon) if icon else ""}
    return typen


def extract(with_typen=False):
    soup = BeautifulSoup(PROGRAMMA.read_text(encoding="utf-8"), "html.parser")
    catalogus = {}
    for art in soup.select("article.session-card"):
        fav = art.select_one("button.session-card__fav")
        if fav is None:
            continue
        nr = int(fav["data-fav-nr"])
        if nr in catalogus:
            raise SystemExit(f"Nr.{nr} komt meer dan één keer voor in programma.html")
        badge = art.select_one(".session-badge")
        duur = art.select_one(".session-card__duration")
        partner = art.select_one(".session-card__partner-name")
        details = art.select_one("details.session-card__more")
        paragraphs = [_clean(p.get_text()) for p in details.find_all("p", recursive=False)] if details else []
        subtitle = art.select_one("p.subtitle")
        catalogus[nr] = {
            "nr": nr,
            "titel": _title(art.select_one("h3")),
            "ondertitel": _clean(subtitle.get_text()) if subtitle else "",
            "type": _clean(badge.get_text()) if badge else _clean(fav.get("data-fav-type", "")),
            "typeSlug": art.get("data-session-type", ""),
            "ronde": int(fav["data-fav-ronde"]),
            "tijdvak": _clean(fav.get("data-fav-tijd", "")),
            "duur": _clean(duur.get_text()) if duur else "",
            "organisatie": _clean(partner.get_text()) if partner else "",
            "toelichting": paragraphs,
            "sprekers": _speakers(details.find("dl") if details else None),
        }
    if with_typen:
        return catalogus, extract_typen(soup)
    return catalogus


if __name__ == "__main__":
    cat = extract()
    print(f"{len(cat)} sessies gevonden")
    leeg = [n for n, s in cat.items() if not s["toelichting"]]
    print("zonder toelichting:", leeg)
    zonder_spreker = [n for n, s in cat.items() if not s["sprekers"]]
    print("zonder sprekers:", zonder_spreker)

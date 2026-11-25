"""
Maakt de fotogalerij (fotos.html) en een pagina per foto (foto/NNNNN.html) uit tools/fotos.json.

Gebruik (vanuit de hoofdmap):
    python tools/maak_fotogalerij.py

Voorwaarden
  - assets/img/fotos/NNNNN.jpg (groot, o.a. voor downloaden en de LinkedIn-voorvertoning)
  - assets/img/fotos/thumbs/NNNNN.webp (miniatuur voor het raster)
  - tools/fotos.json: lijst van {"nr", "w", "h", "alt"} in de gewenste volgorde (alt = beschrijving voor slechtzienden)

Elke fotopagina heeft eigen Open Graph-tags, zodat LinkedIn bij het delen precies die foto toont.
Koptekst en voettekst komen uit contact.html, zodat het menu overal gelijk blijft.
Alleen standaardbibliotheek nodig.
"""
import html
import json
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://landelijkeonderwijsdag.nl"
CSS = "assets/styles.css?v=46"
FOTOS = json.loads((ROOT / "tools" / "fotos.json").read_text(encoding="utf-8"))


def lees(pad):
    return (ROOT / pad).read_text(encoding="utf-8").replace("\r\n", "\n")


def schrijf(pad, tekst):
    p = ROOT / pad
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(tekst, encoding="utf-8", newline="\n")


def blok(bron, begin, einde):
    i = bron.index(begin)
    j = bron.index(einde, i) + len(einde)
    return bron[i:j]


contact = lees("contact.html")
HEADER = blok(contact, "<header", '<div class="nav-backdrop"></div>')
FOOTER = blok(contact, "<footer", "</footer>")


def absoluut(tekst):
    """Maakt de relatieve links en bestanden uit contact.html geschikt voor pagina's in een submap."""
    tekst = tekst.replace('href="index.html"', 'href="/"')
    tekst = re.sub(r'href="([a-z\-]+\.html)', r'href="/\1', tekst)
    tekst = re.sub(r'src="assets/', 'src="/assets/', tekst)
    return tekst


def actief(tekst, doel):
    tekst = tekst.replace(' class="active"', "")
    return tekst.replace(f'<a href="{doel}">', f'<a href="{doel}" class="active">', 1)


def esc(t):
    return html.escape(t, quote=True)


def hoofd(titel, omschrijving, canoniek, og_afbeelding, og_w, og_h, pad_prefix, noindex=False):
    robots = '<meta name="robots" content="noindex, follow">\n' if noindex else ""
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(titel)}</title>
<meta name="description" content="{esc(omschrijving)}">
{robots}<link rel="canonical" href="{canoniek}">
<meta property="og:title" content="{esc(titel)}">
<meta property="og:description" content="{esc(omschrijving)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canoniek}">
<meta property="og:image" content="{og_afbeelding}">
<meta property="og:image:width" content="{og_w}">
<meta property="og:image:height" content="{og_h}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{og_afbeelding}">
<link rel="icon" href="{pad_prefix}assets/favicon.svg?v=3" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="{pad_prefix}assets/favicon-32.png?v=3">
<link rel="apple-touch-icon" sizes="180x180" href="{pad_prefix}assets/favicon-180.png?v=3">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@500;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>document.documentElement.classList.add("js");</script>
<link rel="stylesheet" href="{pad_prefix}{CSS}">
</head>
<body>

"""


# ---------------- galerij ----------------
def maak_galerij():
    items = []
    for f in FOTOS:
        items.append(
            f'      <li><a href="foto/{f["nr"]}.html"><img src="assets/img/fotos/thumbs/{f["nr"]}.webp" '
            f'alt="{esc(f["alt"])}" width="640" height="{round(640 * f["h"] / f["w"])}" loading="lazy"></a></li>'
        )
    kop = hoofd(
        "Foto's | Landelijke Onderwijsdag 2026",
        "Terugblik in beeld op de Landelijke Onderwijsdag 2026, op 24 november in De Werelt, Lunteren. Bekijk, download en deel de foto's.",
        f"{SITE}/fotos.html", f"{SITE}/assets/og-image.png", 1200, 630, "")
    header = actief(HEADER, "fotos.html")
    body = f"""{header}

<section class="page-hero">
  <span class="blob"></span>
  <div class="container">
    <div class="breadcrumb"><a href="index.html">Home</a> &nbsp;/&nbsp; Foto's</div>
    <span class="eyebrow">24 november 2026</span>
    <h1>Foto's</h1>
    <p class="lead">Een terugblik in beeld op de Landelijke Onderwijsdag 2026. Klik op een foto om hem groot te bekijken, te downloaden of te delen.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <ul class="foto-grid">
{chr(10).join(items)}
    </ul>
    <p class="muted foto-note">Sta je ongewenst op een foto? <a href="contact.html">Neem contact met ons op</a>, dan halen we de foto weg.</p>
  </div>
</section>

{FOOTER}

<script src="assets/main.js?v=13"></script>
</body>
</html>
"""
    schrijf("fotos.html", kop + body)


# ---------------- fotopagina's ----------------
def maak_fotopagina(i):
    f = FOTOS[i]
    nr = f["nr"]
    n, totaal = i + 1, len(FOTOS)
    url = f"{SITE}/foto/{nr}.html"
    groot = f"{SITE}/assets/img/fotos/{nr}.jpg"
    titel = f"Foto {n} van {totaal} | Landelijke Onderwijsdag 2026"
    omschrijving = "Terugblik in beeld op de Landelijke Onderwijsdag 2026, op 24 november in De Werelt, Lunteren."
    vorige = FOTOS[(i - 1) % totaal]["nr"]
    volgende = FOTOS[(i + 1) % totaal]["nr"]
    linkedin = "https://www.linkedin.com/sharing/share-offsite/?url=" + urllib.parse.quote(url, safe="")
    mail = ("mailto:?subject=" + urllib.parse.quote("Foto van de Landelijke Onderwijsdag 2026")
            + "&body=" + urllib.parse.quote("Kijk eens naar deze foto van de Landelijke Onderwijsdag 2026: " + url))
    kop = hoofd(titel, omschrijving, url, groot, f["w"], f["h"], "/", noindex=True)
    header = actief(absoluut(HEADER), "/fotos.html")
    footer = absoluut(FOOTER)
    body = f"""{header}

<section class="page-hero">
  <span class="blob"></span>
  <div class="container">
    <div class="breadcrumb"><a href="/">Home</a> &nbsp;/&nbsp; <a href="/fotos.html">Foto's</a> &nbsp;/&nbsp; Foto {n}</div>
    <span class="eyebrow">Foto {n} van {totaal}</span>
    <h1>Terugblik in beeld</h1>
  </div>
</section>

<section class="section">
  <div class="container">
    <figure class="foto-viewer">
      <img src="/assets/img/fotos/{nr}.jpg" alt="{esc(f["alt"])}" width="{f["w"]}" height="{f["h"]}">
    </figure>
    <div class="foto-actions">
      <a href="/assets/img/fotos/{nr}.jpg" download="landelijke-onderwijsdag-2026-{nr}.jpg" class="btn">Download foto</a>
      <a href="{linkedin}" class="btn btn--ghost" target="_blank" rel="noopener">Deel op LinkedIn</a>
      <a href="{mail}" class="btn btn--ghost">Deel per mail</a>
      <button type="button" class="btn btn--ghost" data-deel hidden>Deel via je telefoon</button>
    </div>
    <nav class="foto-nav" aria-label="Foto's">
      <a href="/foto/{vorige}.html">&larr; Vorige foto</a>
      <a href="/fotos.html">Alle foto's</a>
      <a href="/foto/{volgende}.html">Volgende foto &rarr;</a>
    </nav>
    <p class="muted foto-note">Sta je ongewenst op deze foto? <a href="/contact.html">Neem contact met ons op</a>, dan halen we de foto weg.</p>
  </div>
</section>

{footer}

<script src="/assets/main.js?v=13"></script>
<script>
(function () {{
  var b = document.querySelector('[data-deel]');
  if (b && navigator.share) {{
    b.hidden = false;
    b.addEventListener('click', function () {{
      navigator.share({{ title: 'Landelijke Onderwijsdag 2026', text: 'Foto van de Landelijke Onderwijsdag 2026', url: location.href }}).catch(function () {{}});
    }});
  }}
}})();
</script>
</body>
</html>
"""
    schrijf(f"foto/{nr}.html", kop + body)


if __name__ == "__main__":
    maak_galerij()
    for i in range(len(FOTOS)):
        maak_fotopagina(i)
    print(f"Galerij en {len(FOTOS)} fotopagina's gemaakt.")

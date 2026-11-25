"""
Verkleint de originele foto's voor de fotogalerij.

Gebruik (vanuit de hoofdmap), met de map waarin de originele JPG's staan:
    python tools/fotos_verkleinen.py "C:/pad/naar/map-met-originelen"

Resultaat
  - assets/img/fotos/NNNNN.jpg          lange zijde 1800 px (downloaden, grote weergave, LinkedIn-voorvertoning)
  - assets/img/fotos/thumbs/NNNNN.webp  lange zijde 640 px (raster)
  - tools/fotos.json                    nieuw bestand met nr, w, h en een lege alt per foto (alleen als het nog niet bestaat;
                                        bestaande beschrijvingen blijven behouden)

NNNNN zijn de laatste vijf cijfers van de bestandsnaam (DSC05190.jpg wordt 05190). Vul daarna de alt-teksten in
(korte beschrijving voor slechtzienden) en draai: python tools/maak_fotogalerij.py
Vereist Pillow. Lees originelen van onbekende herkomst alleen met een Python die geen script uit die map laadt (python -I).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "assets" / "img" / "fotos"
JSON_UIT = ROOT / "tools" / "fotos.json"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    bron = Path(sys.argv[1])
    (UIT / "thumbs").mkdir(parents=True, exist_ok=True)
    bestaand = {}
    if JSON_UIT.exists():
        bestaand = {f["nr"]: f for f in json.loads(JSON_UIT.read_text(encoding="utf-8"))}
    lijst = []
    for pad in sorted(p for p in bron.iterdir() if p.suffix.lower() in (".jpg", ".jpeg")):
        nr = pad.stem[-5:]
        im = ImageOps.exif_transpose(Image.open(pad)).convert("RGB")
        groot = im.copy()
        groot.thumbnail((1800, 1800), Image.LANCZOS)
        groot.save(UIT / f"{nr}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        klein = im.copy()
        klein.thumbnail((640, 640), Image.LANCZOS)
        klein.save(UIT / "thumbs" / f"{nr}.webp", "WEBP", quality=78)
        lijst.append({"nr": nr, "w": groot.width, "h": groot.height, "alt": bestaand.get(nr, {}).get("alt", "")})
    JSON_UIT.write_text(json.dumps(lijst, ensure_ascii=False, indent=1), encoding="utf-8")
    zonder = [f["nr"] for f in lijst if not f["alt"]]
    print(f"{len(lijst)} foto's verwerkt. Zonder alt-tekst: {zonder or 'geen'}")


if __name__ == "__main__":
    main()

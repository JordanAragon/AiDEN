"""Genera el kit de exportación de la marca AiDEN a partir de los SVG master.

Uso (desde la raíz del repo):
    pip install cairosvg pillow
    python MARCA/herramientas/generar_kit.py

Lee   MARCA/Identidad visual/Logo/svg/*.svg
Crea  MARCA/Identidad visual/Logo/png/        (PNG transparentes por tamaño)
      MARCA/Identidad visual/Logo/favicon/    (copia del set que usa la web, desde public/)
      MARCA/Aplicaciones/Redes/archivos/      (avatares y portadas)
      MARCA/Aplicaciones/Web/archivos/og-image.png  y public/marca/og-image.png
No modifica los SVG master ni el arte original.
"""
import io
import re
import shutil
from pathlib import Path

import cairosvg
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
MARCA = RAIZ / "MARCA"
LOGO = MARCA / "Identidad visual" / "Logo"
SVG = LOGO / "svg"
PNG = LOGO / "png"
FAVICON = LOGO / "favicon"
REDES = MARCA / "Aplicaciones" / "Redes" / "archivos"
WEB = MARCA / "Aplicaciones" / "Web" / "archivos"

PAPER = (247, 246, 240, 255)
FOREST = (11, 43, 27, 255)

# pieza -> anchos de exportación (px)
TAMANOS = {
    "a-isotipo-color": [64, 128, 256, 512, 1024],
    "a-logo-horizontal-color": [400, 800, 1600, 3200],
    "a-logotipo-color": [400, 800, 1600],
    "b-isotipo-color": [64, 128, 256, 512, 1024],
    "b-isotipo-monocromatico": [128, 256, 512, 1024],
    "b-isotipo-blanco": [128, 256, 512, 1024],
    "b-logo-horizontal-monocromatico": [400, 800, 1600, 3200],
    "b-logo-horizontal-blanco": [400, 800, 1600, 3200],
    "b-app-icon-oscuro": [180, 192, 512, 1024],
    "b-app-icon-negativo": [180, 192, 512, 1024],
    "b-favicon-claro": [32, 64, 192, 512],
    "b-favicon-monocromatico": [32, 64, 192, 512],
}


def render(svg_path: Path, ancho: int) -> Image.Image:
    png = cairosvg.svg2png(url=str(svg_path), output_width=ancho)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def recortar(im: Image.Image) -> Image.Image:
    caja = im.getbbox()
    return im.crop(caja) if caja else im


def lienzo(w, h, fondo, pieza, ancho_pieza, centro=None):
    c = Image.new("RGBA", (w, h), fondo)
    p = recortar(render(SVG / f"{pieza}.svg", ancho_pieza * 2))
    p = p.resize((ancho_pieza, round(p.height * ancho_pieza / p.width)), Image.LANCZOS)
    cx, cy = centro or (w // 2, h // 2)
    c.alpha_composite(p, (cx - p.width // 2, cy - p.height // 2))
    return c


def avatar_icono(lado=1080, escala=0.7):
    """Avatar circular: placa a sangre y símbolo más pequeño para que el recorte circular no lo corte."""
    s = (SVG / "b-app-icon-oscuro.svg").read_text()
    s = re.sub(r'rx="\d+"', 'rx="0"', s, count=1)
    m = re.search(r'(<g transform=")([^"]+)(">)', s)
    centro = 256
    nuevo = f"translate({centro} {centro}) scale({escala}) translate({-centro} {-centro}) " + m.group(2)
    s = s[: m.start(2)] + nuevo + s[m.end(2):]
    png = cairosvg.svg2png(bytestring=s.encode(), output_width=lado)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def main():
    PNG.mkdir(exist_ok=True)
    for pieza, anchos in TAMANOS.items():
        for a in anchos:
            im = render(SVG / f"{pieza}.svg", a)
            im.save(PNG / f"{pieza}-{a}.png", optimize=True)

    # Favicon: el mismo set que sirve la web (generado del favicon claro original)
    FAVICON.mkdir(exist_ok=True)
    for f in ["favicon.ico", "favicon-96x96.png", "apple-touch-icon.png", "icon-192.png",
              "icon-512.png", "icon-maskable-512.png", "site.webmanifest"]:
        shutil.copy(RAIZ / "public" / f, FAVICON / f)
    shutil.copy(SVG / "b-favicon-claro.svg", FAVICON / "favicon.svg")

    # Redes
    REDES.mkdir(parents=True, exist_ok=True)
    lienzo(1080, 1080, PAPER, "a-isotipo-color", 640).save(REDES / "avatar-isotipo-claro-1080.png", optimize=True)
    avatar_icono().save(REDES / "avatar-icono-oscuro-1080.png", optimize=True)
    lienzo(1500, 500, PAPER, "a-logo-horizontal-color", 760).save(REDES / "portada-x-1500x500.png", optimize=True)
    lienzo(1128, 191, PAPER, "a-logo-horizontal-color", 380, centro=(1128 - 260, 96)).save(
        REDES / "portada-linkedin-1128x191.png", optimize=True)
    lienzo(1200, 490, PAPER, "a-logo-horizontal-color", 640).save(REDES / "portada-facebook-1200x490.png", optimize=True)
    lienzo(2560, 1440, PAPER, "a-logo-horizontal-color", 1200).save(REDES / "banner-youtube-2560x1440.png", optimize=True)

    # Web: imagen para compartir enlaces (Open Graph)
    WEB.mkdir(parents=True, exist_ok=True)
    og = lienzo(1200, 630, PAPER, "a-logo-horizontal-color", 760)
    og.convert("RGB").save(WEB / "og-image.png", optimize=True)
    shutil.copy(WEB / "og-image.png", RAIZ / "public" / "marca" / "og-image.png")
    print("Kit generado.")


if __name__ == "__main__":
    main()

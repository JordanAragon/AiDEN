"""Genera MARCA/manual-de-marca-aiden.pdf (A4 horizontal) desde HTML con Chromium (Playwright).

Uso (desde la raíz del repo):
    pip install playwright && playwright install chromium
    python MARCA/herramientas/manual/generar_manual.py
"""
import json
from datetime import date
from pathlib import Path

from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
M = RAIZ / "MARCA"
SVG = M / "Identidad visual" / "Logo" / "svg"
FUENTES = M / "Identidad visual" / "Tipografía" / "fuentes"
REC = M / "Identidad visual" / "Recursos gráficos" / "svg"
REDES = M / "Aplicaciones" / "Redes" / "archivos"
ICONOS = json.loads((AQUI / "iconos-lucide.json").read_text())
FOTO = RAIZ / "src" / "assets" / "imagenes" / "login.webp"
VERSION = "1.0"
FECHA = date.today().strftime("%Y-%m")


def u(p: Path) -> str:
    return p.resolve().as_uri()


def s(nombre):
    return u(SVG / f"{nombre}.svg")


def fuente(familia, archivo, peso):
    return f"@font-face{{font-family:'{familia}';src:url('{u(archivo)}') format('woff2');font-weight:{peso};font-style:normal}}"


CSS_FUENTES = "".join(
    [fuente("Nunito Sans", FUENTES / "nunito-sans" / f"nunito-sans-latin-{w}-normal.woff2", w) for w in (400, 600, 700, 800)]
    + [fuente("DM Sans", FUENTES / "dm-sans" / f"dm-sans-latin-{w}-normal.woff2", w) for w in (400, 600, 700, 800)]
)

CSS = CSS_FUENTES + """
@page { size: 297mm 210mm; margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
:root { --forest:#0b2b1b; --moss:#718b58; --lime:#d9ea73; --paper:#f7f6f0; --cream:#ebe7db; --white:#fffdf8; --ink:#12251b; --muted:#526057; --tinta:#232221 }
body { font-family: 'DM Sans', sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact }
.pag { width: 297mm; height: 210mm; padding: 16mm 18mm 14mm; position: relative; overflow: hidden; background: var(--paper); page-break-after: always; display: flex; flex-direction: column }
.pag.blanca { background: var(--white) }
.pag.oscura { background: var(--forest); color: var(--paper) }
.rotulo { font-family: 'Nunito Sans'; font-weight: 800; font-size: 8.5pt; letter-spacing: .22em; text-transform: uppercase; color: var(--moss); margin-bottom: 4mm }
.oscura .rotulo { color: var(--lime) }
h1 { font-family: 'Nunito Sans'; font-weight: 800; font-size: 30pt; line-height: 1.05; color: var(--forest); letter-spacing: -.01em }
.oscura h1 { color: var(--paper) }
h2 { font-family: 'Nunito Sans'; font-weight: 800; font-size: 13pt; color: var(--forest); margin-bottom: 2mm }
.oscura h2 { color: var(--lime) }
p, li, td, th { font-size: 9.5pt; line-height: 1.5 }
.muted { color: var(--muted) }
.pie { position: absolute; left: 18mm; right: 18mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: var(--muted) }
.oscura .pie { color: #a9b8ae }
.grid { display: grid; gap: 7mm }
.c2 { grid-template-columns: 1fr 1fr } .c3 { grid-template-columns: repeat(3, 1fr) } .c4 { grid-template-columns: repeat(4, 1fr) }
.cuerpo { flex: 1; display: flex; flex-direction: column; justify-content: center }
.tarjeta { background: var(--white); border: 1px solid var(--cream); border-radius: 4mm; padding: 6mm; display: flex; flex-direction: column; gap: 3mm }
.tarjeta .arte { height: 42mm; display: flex; align-items: center; justify-content: center; border-radius: 3mm }
.tarjeta .arte img { max-height: 100%; max-width: 100%; object-fit: contain }
.cap { font-size: 8.5pt; color: var(--muted) } .cap b { color: var(--ink); font-weight: 700 }
code { font-family: ui-monospace, monospace; font-size: 8pt; background: var(--cream); padding: .3mm 1.2mm; border-radius: 1mm }
table { border-collapse: collapse; width: 100% }
th { text-align: left; font-family: 'Nunito Sans'; font-weight: 800; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: var(--moss); padding: 2mm 3mm; border-bottom: 1.5px solid var(--forest) }
td { padding: 2mm 3mm; border-bottom: 1px solid var(--cream); vertical-align: top }
.mal { position: relative } .mal::after { content: '✕'; position: absolute; top: 3mm; right: 4mm; font-size: 14pt; font-weight: 800; color: #c0392b }
.bien::after { content: '✓'; position: absolute; top: 3mm; right: 4mm; font-size: 14pt; font-weight: 800; color: #176b45 } .bien { position: relative }
"""


def pie(n, oscura=False):
    return f'<div class="pie"><span>AiDEN · Manual de marca · v{VERSION}</span><span>{n:02d}</span></div>'


def pagina(n, rotulo, titulo, contenido, clase=""):
    return f'<section class="pag {clase}"><div class="rotulo">{rotulo}</div><h1>{titulo}</h1><div class="cuerpo">{contenido}</div>{pie(n)}</section>'


def tarjeta(img, titulo, texto, fondo="var(--paper)", clase=""):
    return (f'<div class="tarjeta {clase}"><div class="arte" style="background:{fondo}"><img src="{img}"></div>'
            f'<div class="cap"><b>{titulo}</b><br>{texto}</div></div>')


def construir():
    P = []
    # 1 Portada
    P.append(f'''<section class="pag" style="justify-content:space-between;padding:22mm 24mm">
      <img src="{s('a-logo-horizontal-color')}" style="width:150mm">
      <div><div class="rotulo">Manual de marca</div><h1 style="font-size:44pt">Identidad AiDEN</h1>
      <p class="muted" style="font-size:12pt;margin-top:3mm">Agricultural Intelligence &amp; Data Ecosystem for Nurseries</p></div>
      <p class="muted">Versión {VERSION} · {FECHA}</p>
      <img src="{u(REC / 'curva-cinta.svg')}" style="position:absolute;right:-40mm;bottom:-30mm;width:190mm;opacity:.9"></section>''')
    # 2 Índice
    idx = ["La marca", "Concepto", "Logo a color", "Logo monocromático", "Favicon y app icon", "Zona de protección y tamaños",
           "Fondos", "Usos incorrectos", "Color", "Tipografía", "Iconografía", "Fotografía", "Recursos gráficos",
           "Identidad verbal", "Aplicaciones"]
    filas = "".join(f'<div style="display:flex;gap:6mm;padding:2.2mm 0;border-bottom:1px solid var(--cream)"><span style="font-family:Nunito Sans;font-weight:800;color:var(--moss);width:10mm">{i + 3:02d}</span><span style="font-size:11pt">{t}</span></div>' for i, t in enumerate(idx))
    P.append(pagina(2, "Contenido", "Índice", f'<div style="columns:2;column-gap:16mm">{filas}</div>'))
    # 3 La marca
    P.append(pagina(3, "01 / La marca", "Qué es AiDEN", f'''<div class="grid c2">
      <div><h2>Definición</h2><p>AiDEN es un sistema de gestión inteligente para viveros e invernaderos: conecta producción, ambiente, inventario, calidad, trazabilidad y costos.</p>
      <h2 style="margin-top:6mm">Nombre</h2><p><b>A</b>gricultural · <b>i</b>ntelligence · <b>D</b>ata · <b>E</b>cosystem · <b>N</b>urseries.<br>Se escribe siempre <b>AiDEN</b>: A, D, E y N en mayúscula; i en minúscula.</p></div>
      <div><h2>Descriptores</h2><table><tr><th>Descriptor</th><th>Dónde</th></tr>
      <tr><td><b>Gestión inteligente para viveros</b></td><td>Web, producto, piezas a color</td></tr>
      <tr><td><b>Gestión agrícola inteligente</b></td><td>Documentación, informes, piezas monocromáticas</td></tr></table>
      <h2 style="margin-top:6mm">Propósito</h2><p>Digitalizar y mejorar la gestión de viveros e invernaderos.</p>
      <h2 style="margin-top:6mm">Personalidad</h2><p>Clara, inteligente, confiable, práctica, natural, tecnológica y cercana.</p></div></div>'''))
    # 4 Concepto
    P.append(pagina(4, "02 / Concepto", "A + hoja + punto", f'''<div class="grid c3">
      <div class="tarjeta"><h2>Letra A</h2><p>Inicial del nombre. Agricultura, crecimiento y evolución.</p></div>
      <div class="tarjeta"><h2>Hoja</h2><p>Vida, naturaleza y sostenibilidad.</p></div>
      <div class="tarjeta"><h2>Punto</h2><p>Tecnología, datos e inteligencia.</p></div></div>
      <div class="grid c2" style="margin-top:7mm">{tarjeta(s('a-isotipo-color'), 'Estilo A · montaña', 'Logo a color de la web y del producto.')}
      {tarjeta(s('b-isotipo-monocromatico'), 'Estilo B · cinta', 'Favicon, app icon y piezas monocromáticas institucionales.')}</div>'''))
    # 5 Logo a color
    P.append(pagina(5, "03 / Logo · web", "Versiones a color", f'''<p class="muted" style="margin-bottom:6mm">Todas las piezas son oficiales. <b>A color para la web.</b></p><div class="grid c4">
      {tarjeta(s('a-logo-horizontal-color'), 'Logo horizontal', '<code>a-logo-horizontal-color</code>')}
      {tarjeta(s('a-logotipo-color'), 'Logotipo', 'Sin descriptor, para espacios bajos.')}
      {tarjeta(s('a-isotipo-color'), 'Isotipo A', 'Sellos, avatares, barra lateral.')}
      {tarjeta(s('b-isotipo-color'), 'Isotipo B', 'Íconos y piezas pequeñas.')}</div>'''))
    # 6 Mono
    P.append(pagina(6, "04 / Logo · documentación", "Versiones monocromáticas", f'''<p class="muted" style="margin-bottom:6mm"><b>Monocromático para documentación, informes y reportes.</b> Descriptor: «Gestión agrícola inteligente».</p><div class="grid c4">
      {tarjeta(s('b-logo-horizontal-monocromatico'), 'Logo monocromático', 'Informes, reportes, entregables.', 'var(--white)')}
      {tarjeta(s('b-isotipo-monocromatico'), 'Isotipo monocromático', 'Sello y marca de agua.', 'var(--white)')}
      {tarjeta(s('b-logo-horizontal-blanco'), 'Logo en blanco', 'Documentos sobre fondo oscuro.', 'var(--forest)')}
      {tarjeta(s('b-isotipo-blanco'), 'Isotipo en blanco', 'Sello sobre fondo oscuro.', 'var(--forest)')}</div>'''))
    # 7 Favicon
    P.append(pagina(7, "05 / Íconos", "Favicon y app icon", f'''<div class="grid c4">
      {tarjeta(s('b-favicon-claro'), 'Favicon claro', 'Pestaña del navegador y app web.', 'var(--white)')}
      {tarjeta(s('b-app-icon-oscuro'), 'App icon oscuro', 'Ícono de app y avatar de redes.', 'var(--white)')}
      {tarjeta(s('b-app-icon-negativo'), 'App icon negativo', 'Ícono sobre fondos claros.', 'var(--white)')}
      {tarjeta(s('b-favicon-monocromatico'), 'Favicon monocromático', 'Entornos sin color.', 'var(--white)')}</div>
      <div style="display:flex;align-items:flex-end;gap:7mm;margin-top:8mm">{''.join(f'<div style="text-align:center"><img src="{s("b-favicon-claro")}" style="width:{w}px;height:{w}px"><div class="cap">{w} px</div></div>' for w in (16, 24, 32, 48, 64, 96, 128))}</div>'''))
    # 8 Zona de protección
    zona = f'''<div style="position:relative;display:inline-block;padding:7.4mm;border:1px dashed var(--moss);background:var(--white)">
      <img src="{s('a-logo-horizontal-color')}" style="width:110mm;display:block;outline:1px solid var(--cream)"><!-- x = 6,7 % del ancho del logo (110 mm) = 7,4 mm -->
      {''.join(f'<div style="position:absolute;{pos};width:7.4mm;height:7.4mm;background:rgba(113,139,88,.18);display:flex;align-items:center;justify-content:center;font-family:Nunito Sans;font-weight:800;color:var(--moss)">x</div>' for pos in ('top:0;left:50%;margin-left:-3.7mm', 'bottom:0;left:50%;margin-left:-3.7mm', 'left:0;top:50%;margin-top:-3.7mm', 'right:0;top:50%;margin-top:-3.7mm'))}</div>'''
    P.append(pagina(8, "06 / Construcción", "Zona de protección y tamaño mínimo", f'''<div class="grid c2" style="align-items:center">
      <div>{zona}<p class="cap" style="margin-top:3mm"><b>x</b> = diámetro de la esfera o del punto. Zona libre de 1x en los cuatro lados.</p></div>
      <div><table><tr><th>Pieza</th><th>Digital</th><th>Impreso</th></tr>
      <tr><td>Logo con descriptor</td><td>320 px</td><td>60 mm</td></tr><tr><td>Logotipo sin descriptor</td><td>100 px</td><td>25 mm</td></tr>
      <tr><td>Isotipo</td><td>24 px</td><td>8 mm</td></tr><tr><td>Menos de 24 px</td><td>Favicon</td><td>—</td></tr></table>
      <p class="muted" style="margin-top:4mm">Por debajo del mínimo con descriptor, usar el logotipo sin descriptor.</p></div></div>'''))
    # 9 Fondos
    P.append(pagina(9, "07 / Fondos", "Dónde va cada versión", f'''<div class="grid c4">
      {tarjeta(s('a-logo-horizontal-color'), 'Paper', 'Fondo principal.', 'var(--paper)', 'bien')}
      {tarjeta(s('a-logo-horizontal-color'), 'Cream o blanco', 'Fondos claros.', 'var(--cream)', 'bien')}
      <div class="tarjeta bien"><div class="arte" style="background:var(--forest)"><span style="display:flex;align-items:center;gap:3mm;color:white;font-family:Nunito Sans;font-weight:800;font-size:15pt"><span style="background:var(--white);border-radius:2.5mm;padding:2mm;display:flex"><img src="{s('a-isotipo-color')}" style="height:13mm"></span>AiDEN</span></div><div class="cap"><b>Oscuro</b><br>Isotipo sobre placa clara.</div></div>
      {tarjeta(s('b-logo-horizontal-blanco'), 'Oscuro · documentos', 'Versión en blanco.', 'var(--forest)', 'bien')}</div>
      <div class="grid c4" style="margin-top:6mm">{tarjeta(s('a-logo-horizontal-color'), 'Color sobre oscuro', 'El verde bosque desaparece.', 'var(--forest)', 'mal')}
      {tarjeta(s('a-logo-horizontal-color'), 'Bajo contraste', 'Moss no da contraste.', 'var(--moss)', 'mal')}
      {tarjeta(s('b-logo-horizontal-monocromatico'), 'Monocromático en web', 'En la web va a color.', 'var(--paper)', 'mal')}
      <div class="tarjeta mal"><div class="arte" style="background:url('{u(FOTO)}') center/cover"><img src="{s('a-logo-horizontal-color')}"></div><div class="cap"><b>Foto recargada</b><br>Usar placa o banda.</div></div></div>'''))
    # 10 Usos incorrectos
    def mal(est, t):
        return f'<div class="tarjeta mal"><div class="arte" style="background:var(--paper)"><img src="{s("a-logo-horizontal-color")}" style="{est}"></div><div class="cap"><b>{t}</b></div></div>'
    P.append(pagina(10, "08 / Usos incorrectos", "Así no", f'''<div class="grid c4">
      {mal('transform:scaleX(1.35);max-width:70%', 'Deformar')}{mal('transform:rotate(-12deg)', 'Rotar')}{mal('filter:hue-rotate(150deg)', 'Recolorear')}
      {mal('filter:drop-shadow(2mm 2mm 1.5mm rgba(0,0,0,.45))', 'Añadir efectos')}</div>
      <div class="grid c4" style="margin-top:6mm">
      <div class="tarjeta mal"><div class="arte" style="background:var(--paper);gap:3mm"><img src="{s('a-isotipo-color')}" style="height:22mm"><span style="font-family:Georgia;font-size:22pt;color:var(--forest)">AiDEN</span></div><div class="cap"><b>Reescribir el nombre</b></div></div>
      <div class="tarjeta mal"><div class="arte" style="background:var(--paper);gap:4mm"><img src="{s('a-isotipo-color')}" style="height:20mm"><img src="{s('b-isotipo-color')}" style="height:20mm"></div><div class="cap"><b>Mezclar estilos A y B</b></div></div>
      <div class="tarjeta mal"><div class="arte" style="background:var(--paper)"><img src="{s('a-logo-horizontal-color')}" style="width:22mm"></div><div class="cap"><b>Menor que el mínimo con descriptor</b></div></div>
      <div class="tarjeta mal"><div class="arte" style="background:var(--paper);flex-direction:column;gap:2mm"><img src="{s('a-isotipo-color')}" style="height:16mm"><img src="{s('a-logotipo-color')}" style="height:9mm;clip-path:inset(0 0 0 22%)"></div><div class="cap"><b>Reordenar isotipo y logotipo</b></div></div></div>'''))
    # 11 Color
    paleta = [("Forest", "#0b2b1b", "11 43 27", "Solidez · confianza", True), ("Moss", "#718b58", "113 139 88", "Crecimiento · equilibrio", True),
              ("Lime", "#d9ea73", "217 234 115", "Vitalidad · innovación", False), ("Paper", "#f7f6f0", "247 246 240", "Claridad · respiro", False)]
    sw = "".join(f'<div><div style="height:46mm;border-radius:4mm;background:{h};border:1px solid var(--cream);padding:5mm;display:flex;align-items:flex-end;color:{"var(--paper)" if o else "var(--forest)"};font-family:Nunito Sans;font-weight:800;font-size:13pt">{n}</div><p class="cap" style="margin-top:2mm"><b>{h}</b> · RGB {r}<br>{t}</p></div>' for n, h, r, t, o in paleta)
    P.append(pagina(11, "09 / Color", "Paleta", f'''<div class="grid c4">{sw}</div>
      <div class="grid c2" style="margin-top:7mm"><table><tr><th>Texto sobre fondo</th><th>Contraste</th><th>Uso</th></tr>
      <tr><td>Forest sobre Paper</td><td>14,10</td><td>Texto ✓</td></tr><tr><td>Lime sobre Forest</td><td>11,61</td><td>Texto ✓</td></tr>
      <tr><td>Moss sobre Paper</td><td>3,50</td><td>Solo títulos grandes</td></tr><tr><td>Lime sobre Paper</td><td>1,21</td><td>Nunca texto</td></tr></table>
      <div><h2>Proporción</h2><div style="display:flex;height:9mm;border-radius:2mm;overflow:hidden;border:1px solid var(--cream)"><div style="flex:60;background:var(--paper)"></div><div style="flex:25;background:var(--forest)"></div><div style="flex:10;background:var(--moss)"></div><div style="flex:5;background:var(--lime)"></div></div>
      <p class="cap" style="margin-top:2mm">60 % claros · 25 % Forest · 10 % Moss · 5 % Lime. Apoyo: Cream <code>#ebe7db</code>, White <code>#fffdf8</code>, Ink <code>#12251b</code>.</p></div></div>'''))
    # 12 Tipografía
    P.append(pagina(12, "10 / Tipografía", "Nunito Sans y DM Sans", f'''<div class="grid c2">
      <div class="tarjeta"><div style="font-family:Nunito Sans;font-weight:800;font-size:54pt;color:var(--forest);line-height:1">Aa</div><h2>Nunito Sans · principal</h2>
      <p style="font-family:Nunito Sans;font-size:11pt">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br>abcdefghijklmnñopqrstuvwxyz 0123456789</p><p class="muted">Títulos, portadas y cifras. Pesos 600, 700 y 800.</p></div>
      <div class="tarjeta"><div style="font-family:DM Sans;font-weight:700;font-size:54pt;color:var(--moss);line-height:1">Aa</div><h2>DM Sans · secundaria</h2>
      <p style="font-family:DM Sans;font-size:11pt">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br>abcdefghijklmnñopqrstuvwxyz 0123456789</p><p class="muted">Texto, tablas e interfaz. Pesos 400, 600 y 700.</p></div></div>
      <p class="cap" style="margin-top:5mm">Ambas con licencia SIL Open Font License 1.1, libres para uso comercial. La palabra AiDEN del logo es un dibujo propio: nunca se reescribe con una fuente.</p>'''))
    # 13 Iconografía
    ic = "".join(f'<div style="text-align:center"><div style="width:16mm;height:16mm;border-radius:3mm;background:var(--white);border:1px solid var(--cream);display:flex;align-items:center;justify-content:center;margin:0 auto">{svg}</div><div class="cap" style="margin-top:2mm">{n}</div></div>'
                 for n, svg in zip(["Producción", "Ambiental", "Inventario", "Calidad", "Trazabilidad", "Costos", "Reportes", "Personal", "Configuración"], [ICONOS[k] for k in ["Sprout", "Thermometer", "Package", "ShieldCheck", "GitBranch", "CircleDollarSign", "BarChart3", "Users", "Settings"]]))
    P.append(pagina(13, "11 / Iconografía", "Lucide, trazo redondeado", f'''<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4mm">{ic}</div>
      <div class="grid c3" style="margin-top:8mm"><div><h2>Trazo</h2><p>2 px a 24 px. Sin mezclar grosores.</p></div>
      <div><h2>Tamaño</h2><p>16 px en texto, 18 px en navegación, 20–24 px en tarjetas.</p></div>
      <div><h2>Color</h2><p>El del texto. Lime solo sobre oscuro. Nunca la hoja de Lucide como marca.</p></div></div>'''))
    # 14 Fotografía
    P.append(pagina(14, "12 / Fotografía", "Campo real, luz natural", f'''<div class="grid c2" style="align-items:stretch">
      <div style="border-radius:4mm;background:url('{u(FOTO)}') center/cover;min-height:110mm"></div>
      <div><h2>Temas</h2><p>Viveros e invernaderos reales, plantas en sus etapas, personas trabajando, tecnología en el campo, contexto colombiano.</p>
      <h2 style="margin-top:5mm">Tratamiento</h2><p>Luz natural, color cálido sin filtros saturados, profundidad de campo corta, encuadres con aire para texto o logo.</p>
      <h2 style="margin-top:5mm">Evitar</h2><p>Stock corporativo genérico, paisajes sin relación con viveros, imágenes generadas que muestren plantas o equipos irreales.</p>
      <h2 style="margin-top:5mm">Derechos</h2><p>Fotos propias con autorización de las personas, o con licencia comercial registrada.</p></div></div>'''))
    # 15 Recursos
    P.append(pagina(15, "13 / Recursos gráficos", "La marca sin el logo", f'''<div class="grid c4">
      {tarjeta(u(REC / 'curva-cinta.svg'), 'Curva cinta', 'Fondo de portadas, grande y recortada.', 'var(--white)')}
      {tarjeta(u(REC / 'punto-de-datos.svg'), 'Punto de datos', 'Viñeta destacada y marcador.', 'var(--white)')}
      <div class="tarjeta"><div class="arte" style="background:url('{u(REC / 'patron-isotipos.svg')}') center/cover"></div><div class="cap"><b>Patrón claro</b><br>Isotipo al 6 % sobre Paper.</div></div>
      <div class="tarjeta"><div class="arte" style="background:url('{u(REC / 'patron-isotipos-oscuro.svg')}') center/cover"></div><div class="cap"><b>Patrón oscuro</b><br>Lime al 7 % sobre Forest.</div></div></div>
      <p class="cap" style="margin-top:6mm">Un recurso por pieza, siempre como apoyo. Esquinas redondeadas de 18 px en digital.</p>'''))
    # 16 Verbal
    P.append(pagina(16, "14 / Identidad verbal", "Clara, directa y humana", '''<table><tr><th>Contexto</th><th>Tono</th><th>Ejemplo</th></tr>
      <tr><td>Informativo</td><td>Preciso y neutral</td><td>«El lote LT-2026-011 pasó a trasplante el 3 de octubre.»</td></tr>
      <tr><td>Operativo</td><td>Breve y accionable</td><td>«Registra la lectura de humedad del Invernadero 2.»</td></tr>
      <tr><td>Error</td><td>Claro, sin culpar</td><td>«No pudimos guardar la tarea. Revisa la fecha e inténtalo de nuevo.»</td></tr>
      <tr><td>Alerta</td><td>Prioritario y específico</td><td>«Humedad bajo el rango en el Invernadero 2 desde las 6:00.»</td></tr>
      <tr><td>Institucional</td><td>Profesional y sobrio</td><td>«AiDEN conecta la operación de un vivero: producción, ambiente, inventario, calidad, trazabilidad y costos.»</td></tr></table>
      <p class="muted" style="margin-top:5mm">Imperativo para acciones, cifras con unidad y periodo, sin exclamaciones ni emojis, sin prometer lo que el producto no hace.</p>'''))
    # 17 Aplicaciones
    P.append(pagina(17, "15 / Aplicaciones", "La marca en uso", f'''<div class="grid c3">
      <div class="tarjeta"><div class="arte" style="background:var(--white)"><img src="{u(M / 'Aplicaciones' / 'Web' / 'archivos' / 'og-image.png')}"></div><div class="cap"><b>Web</b><br>Logo a color, favicon claro, imagen para enlaces.</div></div>
      <div class="tarjeta"><div class="arte" style="background:var(--white)"><img src="{u(REDES / 'portada-x-1500x500.png')}"></div><div class="cap"><b>Redes</b><br>Avatares y portadas en <code>Aplicaciones/Redes</code>.</div></div>
      <div class="tarjeta"><div class="arte" style="background:var(--white)"><img src="{u(REDES / 'avatar-icono-oscuro-1080.png')}" style="border-radius:50%;height:38mm"></div><div class="cap"><b>Perfil</b><br>App icon oscuro, recorte circular.</div></div></div>
      <div class="grid c2" style="margin-top:6mm"><div class="tarjeta"><h2>Documentos</h2><p>Plantilla de informe en Word con logo monocromático, estilos y tabla: <code>Aplicaciones/Documentos</code>.</p></div>
      <div class="tarjeta"><h2>Presentaciones</h2><p>Plantilla de PowerPoint 16:9 con tema AiDEN y cinco diseños: <code>Aplicaciones/Presentaciones</code>.</p></div></div>'''))
    # 18 Cierre
    P.append(f'''<section class="pag oscura" style="justify-content:center;align-items:center;text-align:center">
      <img src="{s('b-isotipo-blanco')}" style="width:40mm;margin-bottom:8mm"><h1 style="font-size:24pt">Gestión agrícola inteligente</h1>
      <p style="margin-top:4mm;color:#a9b8ae">Archivos, reglas y plantillas: carpeta <b>MARCA/</b> del repositorio de AiDEN.</p>{pie(18)}</section>''')
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(P)}</body></html>'


def main():
    html = AQUI / "manual.html"
    html.write_text(construir(), encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto(html.as_uri())
        pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        pg.pdf(path=str(M / "manual-de-marca-aiden.pdf"), width="297mm", height="210mm", print_background=True)
        b.close()
    html.unlink()
    print("Manual generado.")


if __name__ == "__main__":
    main()

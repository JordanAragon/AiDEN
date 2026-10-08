"""Genera un informe PDF con la identidad de AiDEN a partir de un archivo YAML.

Uso (desde la raíz del repo de AiDEN):
    pip install playwright pyyaml pypdf && playwright install chromium
    python MARCA/Aplicaciones/Documentos/informes/generar_informe.py ruta/informe.yaml [salida.pdf]

El esquema del YAML está en README.md de esta carpeta; las reglas de redacción, en GUIA-DE-REDACCION.md.
"""
import html
import io
import re
import sys
from pathlib import Path

import yaml
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

AQUI = Path(__file__).resolve().parent
MARCA = AQUI.parents[2]
LOGO = MARCA / "Identidad visual" / "Logo" / "svg"
FUENTES = MARCA / "Identidad visual" / "Tipografía" / "fuentes"

COLORES = {"forest": "#0b2b1b", "moss": "#718b58", "verde": "#176b45", "lime": "#c3d65a",
           "ok": "#176b45", "alerta": "#d39a1c", "critico": "#b42318", "info": "#24609b", "neutro": "#9aa59e"}


def uri(p: Path) -> str:
    return p.resolve().as_uri()


def fuentes_css() -> str:
    defs = [("Nunito Sans", "nunito-sans/nunito-sans-latin-{}-normal.woff2", (400, 600, 700, 800)),
            ("DM Sans", "dm-sans/dm-sans-latin-{}-normal.woff2", (400, 600, 700)),
            ("JetBrains Mono", "jetbrains-mono/jetbrains-mono-latin-{}-normal.woff2", (400, 500, 700))]
    out = []
    for fam, patron, pesos in defs:
        for w in pesos:
            out.append(f"@font-face{{font-family:'{fam}';src:url('{uri(FUENTES / patron.format(w))}') format('woff2');font-weight:{w}}}")
    return "".join(out)


def md(texto) -> str:
    """Formato en línea: **negrita**, `código` y [[estado:texto]] como chip."""
    if texto is None:
        return ""
    t = html.escape(str(texto))
    t = re.sub(r"\[\[(ok|alerta|critico|info|neutro):([^\]]+)\]\]", r'<span class="chip \1">\2</span>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    return t


def parrafos(texto) -> str:
    if not texto:
        return ""
    return "".join(f"<p>{md(p.strip())}</p>" for p in str(texto).strip().split("\n\n") if p.strip())


def lista(items) -> str:
    return "<ul class='lista'>" + "".join(f"<li>{md(i)}</li>" for i in items) + "</ul>"


def bloque(b: dict) -> str:
    tipo = b.get("tipo", "parrafo")
    if tipo == "parrafo":
        cab = f"<h3>{md(b['titulo'])}</h3>" if b.get("titulo") else ""
        return f"<div class='bloque'>{cab}{parrafos(b.get('texto'))}</div>"
    if tipo == "lista":
        cab = f"<h3>{md(b['titulo'])}</h3>" if b.get("titulo") else ""
        return f"<div class='bloque'>{cab}{lista(b['items'])}</div>"
    if tipo == "tarjetas":
        n = b.get("columnas", 3)
        items = "".join(
            f"<div class='tarjeta' style='border-top-color:{COLORES.get(i.get('color', 'forest'), i.get('color', '#0b2b1b'))}'>"
            + (f"<div class='mono etq'>{md(i['etiqueta'])}</div>" if i.get("etiqueta") else "")
            + f"<h3>{md(i['titulo'])}</h3>" + parrafos(i.get("texto"))
            + (lista(i["lista"]) if i.get("lista") else "") + "</div>"
            for i in b["items"])
        return f"<div class='bloque partible'><div class='tarjetas' style='grid-template-columns:repeat({n},1fr)'>{items}</div></div>"
    if tipo == "aviso":
        cuerpo = parrafos(b.get("texto")) + ("<ul>" + "".join(f"<li>{md(i)}</li>" for i in b["lista"]) + "</ul>" if b.get("lista") else "")
        return f"<div class='bloque'><div class='aviso {b.get('estilo', 'ok')}'><div class='t'>{md(b.get('titulo', ''))}</div>{cuerpo}</div></div>"
    if tipo == "banda":
        return (f"<div class='bloque'><div class='banda'>" + (f"<div class='mono'>{md(b['rotulo'])}</div>" if b.get("rotulo") else "")
                + f"<h3>{md(b.get('titulo', ''))}</h3>{parrafos(b.get('texto'))}" + (lista(b["lista"]) if b.get("lista") else "") + "</div></div>")
    if tipo == "tabla":
        anchos = b.get("anchos")
        cols = "".join(f"<col style='width:{a}'>" for a in anchos) if anchos else ""
        cab = "".join(f"<th>{md(c)}</th>" for c in b["columnas"])
        filas = "".join("<tr>" + "".join(f"<td>{md(c)}</td>" for c in f) + "</tr>" for f in b["filas"])
        pie = ("<tfoot><tr>" + "".join(f"<td>{md(c)}</td>" for c in b["total"]) + "</tr></tfoot>") if b.get("total") else ""
        titulo = f"<h3>{md(b['titulo'])}</h3>" if b.get("titulo") else ""
        nota = f"<div class='nota-tabla'>{md(b['nota'])}</div>" if b.get("nota") else ""
        return f"<div class='bloque partible'>{titulo}<table><colgroup>{cols}</colgroup><thead><tr>{cab}</tr></thead><tbody>{filas}</tbody>{pie}</table>{nota}</div>"
    if tipo == "kpis":
        n = b.get("columnas", len(b["items"]))
        ks = "".join(f"<div class='k'><div class='v'>{md(k['valor'])}</div><div class='e'>{md(k['etiqueta'])}</div><div class='d'>{md(k.get('detalle', ''))}</div></div>" for k in b["items"])
        return f"<div class='bloque'><div class='kpis-int' style='grid-template-columns:repeat({n},1fr)'>{ks}</div></div>"
    if tipo == "barras":
        titulo = f"<h3>{md(b['titulo'])}</h3>" if b.get("titulo") else ""
        filas = "".join(
            f"<div class='barra'><div class='n'>{md(i['nombre'])}</div><div class='pista'><div class='relleno' style='width:{i['valor']}%;background:{COLORES.get(i.get('color', 'verde'), i.get('color'))}'></div></div><div class='pct'>{i['valor']} %</div>"
            + (f"<div></div><div class='nota'>{md(i['nota'])}</div>" if i.get("nota") else "") + "</div>"
            for i in b["items"])
        return f"<div class='bloque'>{titulo}<div class='barras'>{filas}</div></div>"
    if tipo == "fuentes":
        return f"<div class='bloque fuentes'>{md(b['texto'])}</div>"
    raise ValueError(f"Tipo de bloque desconocido: {tipo}")


def portada(d: dict) -> str:
    lineas = d["titulo"] if isinstance(d["titulo"], list) else [d["titulo"]]
    h1 = "<br>".join(md(l) for l in lineas[:-1])
    h1 += ("<br>" if len(lineas) > 1 else "") + f"<span class='resalte'>{md(lineas[-1])}</span>"
    kpis = d.get("kpis", [])
    k = "".join(f"<div class='kpi'><div class='v'>{md(x['valor'])}</div><div class='e'>{md(x['etiqueta'])}</div><div class='d'>{md(x.get('detalle', ''))}</div></div>" for x in kpis)
    pp = d.get("preparado_por", {})
    return f"""<section class="portada"><div class="tarjeta-portada">
      <div class="cabeza"><div><img src="{uri(LOGO / 'b-logo-horizontal-blanco.svg')}"><div class="mono sub">{md(d.get('area', 'Gestión agrícola inteligente'))}</div></div>
        <div class="mono meta">{md(d.get('codigo', ''))} · {md(d.get('version', ''))}<br>{md(d.get('fecha', ''))}</div></div>
      <div class="centro"><div class="pastilla mono">{md(d.get('etiqueta', ''))}</div><h1>{h1}</h1>
        <div class="resumen">{md(d.get('resumen', ''))}</div>
        {f'<div class="kpis" style="grid-template-columns:repeat({len(kpis)},1fr)">{k}</div>' if kpis else ''}</div>
      <div class="pie-portada"><div><div class="mono">Preparado por</div><div class="quien">{md(pp.get('nombre', 'AiDEN'))}</div><div class="donde">{md(pp.get('detalle', ''))}</div></div>
        <img src="{uri(LOGO / 'b-isotipo-blanco.svg')}"></div></div></section>"""


def secciones(d: dict) -> str:
    out = []
    for i, s in enumerate(d.get("secciones", []), 1):
        num = f"{i:02d}"
        empieza_pagina = i == 1 or s.get("nueva_pagina", True)
        nueva = "nueva" if (i > 1 and empieza_pagina) else "continua"
        enc = s.get("encabezado", s["titulo"])
        cuerpo = "".join(bloque(b) for b in s.get("bloques", []))
        sub = f"<p>{md(s['subtitulo'])}</p>" if s.get("subtitulo") else ""
        cabecera = (f"""<div class="cabecera"><img src="{uri(LOGO / 'b-logo-horizontal-monocromatico.svg')}"><span class="mono">{num} · {md(enc)}</span></div>"""
                    if empieza_pagina else "")
        out.append(f"""<section class="seccion {nueva}">{cabecera}
          <div class="titulo-seccion"><div class="numero">{num}</div><div><h2>{md(s['titulo'])}</h2>{sub}</div></div>{cuerpo}</section>""")
    return "".join(out)


def documento(cuerpo: str) -> str:
    css = (AQUI / "estilos.css").read_text(encoding="utf-8")
    return f"<!doctype html><html lang='es'><head><meta charset='utf-8'><style>{fuentes_css()}{css}</style></head><body>{cuerpo}</body></html>"


def pdf(pg, html_doc: str, pie: str | None) -> bytes:
    tmp = AQUI / "_tmp_informe.html"
    tmp.write_text(html_doc, encoding="utf-8")
    pg.goto(tmp.as_uri()); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready")
    opciones = dict(format="A4", print_background=True, margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    if pie:
        opciones.update(display_header_footer=True, header_template="<span></span>", footer_template=pie,
                        margin={"top": "8mm", "bottom": "16mm", "left": "0", "right": "0"})
    datos = pg.pdf(**opciones)
    tmp.unlink()
    return datos


def generar(yaml_path: Path, salida: Path):
    d = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    pie = ("<div style=\"width:100%;padding:0 14mm;font-family:monospace;font-size:6.5pt;letter-spacing:.12em;color:#5d6a62;"
           "display:flex;justify-content:space-between;text-transform:uppercase\">"
           f"<span>AiDEN · {html.escape(str(d.get('codigo', '')))}</span>"
           "<span>Página <span class=\"pageNumber\"></span> de <span class=\"totalPages\"></span></span></div>")
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        portada_pdf = pdf(pg, documento(portada(d)), None)
        cuerpo_pdf = pdf(pg, documento(secciones(d)), pie)
        b.close()
    w = PdfWriter()
    for parte in (portada_pdf, cuerpo_pdf):
        for page in PdfReader(io.BytesIO(parte)).pages:
            w.add_page(page)
    w.add_metadata({"/Title": " ".join(d["titulo"]) if isinstance(d["titulo"], list) else d["titulo"], "/Author": "AiDEN"})
    with open(salida, "wb") as f:
        w.write(f)
    print(f"Informe generado: {salida}")


if __name__ == "__main__":
    entrada = Path(sys.argv[1])
    generar(entrada, Path(sys.argv[2]) if len(sys.argv) > 2 else entrada.with_suffix(".pdf"))

"""Íconos de app vectoriales construidos con el isotipo B vectorizado sobre una placa redondeada.
Proporciones medidas en los originales: símbolo 84 % del ancho, offset 8 % / 13 %, radio 18 %."""
import re, numpy as np
from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import sys; sys.path.insert(0, str(Path(__file__).parent))
from vec_todo import cargar, O, LUM, OUT, mascara_grabcut
B = f"{O}/simbolo-b-cinta"
mono = open(OUT + '/b-isotipo-monocromatico.svg').read()
vb = re.search(r'viewBox="([^"]+)"', mono).group(1); vx, vy, vw, vh = map(float, vb.split())
d_mono = re.search(r' d="([^"]+)"', mono).group(1)
color = open(OUT + '/b-isotipo-color.svg').read()
vbc = re.search(r'viewBox="([^"]+)"', color).group(1); cvx, cvy, cvw, cvh = map(float, vbc.split())
color_inner = re.search(r'<svg[^>]*>(.*)</svg>', color, re.S).group(1)
N = 512; RX = round(0.18 * N); SW = 0.84 * N; SX = 0.08 * N; SY = 0.13 * N

def grad_simbolo(src, mask):
    a = cargar(src); rgb = a[..., :3].astype(float)
    ys, xs = np.where(ndi.binary_erosion(mask, iterations=4)); col = rgb[ys, xs]
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    u = np.array([1.0, -1.0]) / np.sqrt(2)          # de abajo-izquierda a arriba-derecha
    t = ((xs - x0) / (x1 - x0)) * u[0] + ((ys - y0) / (y1 - y0)) * u[1]
    t = (t - t.min()) / np.ptp(t); stops = []
    for k in range(5):
        sel = np.abs(t - k / 4) < 0.08
        cb = col[sel]; lb = cb @ LUM; cb = cb[lb >= np.median(lb)]
        c = np.median(cb, 0).astype(int); stops.append(f'<stop offset="{k/4:.2f}" stop-color="#%02x%02x%02x"/>' % tuple(c))
    return ''.join(stops)

def placa_grad(src, simbolo_claro):
    a = cargar(src); rgb = a[..., :3].astype(float); al = a[..., 3] > 128
    lab, n = ndi.label(al); placa = ndi.binary_fill_holes(lab == (np.argmax(ndi.sum(al, lab, range(1, n + 1))) + 1))
    ys, xs = np.where(placa); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    def c(px, py): return '#%02x%02x%02x' % tuple(np.median(rgb[py - 15:py + 15, px - 15:px + 15].reshape(-1, 3), 0).astype(int))
    w, h = x1 - x0, y1 - y0
    return c(int(x0 + 0.25 * w), int(y0 + 0.05 * h)), c(int(x0 + 0.75 * w), int(y0 + 0.95 * h))

def simbolo_mono(fill):
    s = SW / vw
    return f'<g transform="translate({SX:.1f} {SY:.1f}) scale({s:.4f}) translate({-vx} {-vy})"><path fill="{fill}" fill-rule="evenodd" d="{d_mono}"/></g>'

def simbolo_color():
    s = SW / cvw
    inner = color_inner.replace('id="b', 'id="ic').replace('url(#b', 'url(#ic')
    return f'<g transform="translate({SX:.1f} {SY:.1f}) scale({s:.4f}) translate({-cvx} {-cvy})">{inner}</g>'

def svg(cuerpo, defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}">{("<defs>" + defs + "</defs>") if defs else ""}{cuerpo}</svg>'

# Oscuro: placa forest en degradado + símbolo lima en degradado
c1, c2 = placa_grad(f"{B}/app-icon-oscuro.png", True)
stops = grad_simbolo(f"{B}/app-icon-oscuro.png", mascara_grabcut(f"{B}/app-icon-oscuro.png"))
defs = (f'<linearGradient id="placa" x1="0.25" y1="0" x2="0.75" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
        f'<linearGradient id="sim" x1="0" y1="1" x2="1" y2="0">{stops}</linearGradient>')
open(OUT + '/b-app-icon-oscuro.svg', 'w').write(svg(f'<rect width="{N}" height="{N}" rx="{RX}" fill="url(#placa)"/>' + simbolo_mono('url(#sim)'), defs))
# Negativo: placa forest + símbolo crema
c1, c2 = placa_grad(f"{B}/app-icon-negativo.png", True)
defs = f'<linearGradient id="placa" x1="0.25" y1="0" x2="0.75" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
open(OUT + '/b-app-icon-negativo.svg', 'w').write(svg(f'<rect width="{N}" height="{N}" rx="{RX}" fill="url(#placa)"/>' + simbolo_mono('#f5f3ec'), defs))
# Claro: placa paper + isotipo B a color
open(OUT + '/b-favicon-claro.svg', 'w').write(svg(f'<rect width="{N}" height="{N}" rx="{RX}" fill="#f4f2ec"/>' + simbolo_color()))
# Monocromático: placa paper + símbolo tinta
open(OUT + '/b-favicon-monocromatico.svg', 'w').write(svg(f'<rect width="{N}" height="{N}" rx="{RX}" fill="#f4f2ec"/>' + simbolo_mono('#232221')))
print('ok', c1, c2)

import os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from vgrad import construir, caja, error, trazo
from vec_iso import dividir
from pathlib import Path
ORIG = str(Path(__file__).resolve().parents[2] / "Identidad visual" / "Logo" / "originales")
O = ORIG
OUT = str(Path(__file__).parent / "salida"); os.makedirs(OUT, exist_ok=True)
LUM = np.array([0.3, 0.59, 0.11])

def cargar(p):
    im = Image.open(p)
    a = np.asarray(im.convert('RGBA')).copy()
    if im.mode == 'RGB':   # fondo blanco → transparente
        d = 255 - a[..., :3].astype(int).min(2)
        a[..., 3] = np.where(d > 5, 255, 0)
    return a

def mascara_grabcut(src):
    """Separa el símbolo de la placa oscura cuando el color no basta (app icon oscuro)."""
    import cv2
    a = np.asarray(Image.open(src).convert('RGBA')); rgb = a[..., :3].copy(); al = a[..., 3] > 128
    lum = rgb.astype(float) @ LUM; placa = ndi.binary_fill_holes(al)
    m = np.full(al.shape, cv2.GC_BGD, np.uint8); m[placa] = cv2.GC_PR_BGD
    m[placa & (lum > 60)] = cv2.GC_PR_FGD; m[placa & (lum > 110)] = cv2.GC_FGD
    m[placa & ~ndi.binary_erosion(placa, iterations=45)] = cv2.GC_BGD
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), m, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
    sim = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
    return ndi.binary_closing(ndi.binary_opening(sim, iterations=2), iterations=2)

def es_plana(rgb, m):
    c = rgb[m & ndi.binary_erosion(m, iterations=2)].astype(float)
    return len(c) < 30 or (c @ LUM).std() < 6

def capas_auto(rgb, al, umbral=95, cierre=4, apertura=4, minimo=40, rango=70):
    lab, n = ndi.label(al); sizes = ndi.sum(al, lab, range(1, n + 1))
    capas, planas = [], {}
    for k in np.argsort(sizes)[::-1] + 1:
        if sizes[k - 1] < minimo: continue
        m = lab == k
        if es_plana(rgb, m):
            c = np.median(rgb[m], 0); clave = tuple((c // 24).astype(int))
            planas.setdefault(clave, [np.zeros_like(m), []]); planas[clave][0] |= m; planas[clave][1].append(c)
            continue
        lum = rgb[m].astype(float) @ LUM
        if np.percentile(lum, 90) - np.percentile(lum, 10) > rango and m.sum() > 20000:
            capas += dividir(rgb, m, umbral, cierre=cierre, it=apertura)
        else:
            capas.append((m, None))
    for m, cs in planas.values():
        c = np.median(np.array(cs), 0).astype(int); capas.append((m, '#%02x%02x%02x' % tuple(c)))
    return capas

def pieza(nombre, src, **kw):
    a = cargar(src); rgb = a[..., :3]; al = a[..., 3] > 128
    capas = capas_auto(rgb, al, **kw)
    svg = construir(rgb, capas, caja(al), nombre.replace('-', '')[:6])
    open(f"{OUT}/{nombre}.svg", 'w').write(svg); e = error(a, svg)
    Image.fromarray(e[2].astype(np.uint8)).save(f"{OUT}/{nombre}_r.png")
    print(f"{nombre:34s} err={e[0]:.2f} p95={e[1]:.1f} KB={len(svg)/1024:.1f} capas={len(capas)}")

def icono(nombre, src, simbolo_claro, umbral=95, delta=45, dividir_simbolo=True, **kw):
    """Placa (tile) + símbolo. simbolo_claro: el símbolo es más claro que la placa."""
    a = cargar(src); rgb = a[..., :3].astype(float); al = a[..., 3] > 128
    lab, n = ndi.label(al); placa = lab == (np.argmax(ndi.sum(al, lab, range(1, n + 1))) + 1)
    placa = ndi.binary_fill_holes(placa)
    lum = rgb @ LUM; ref = np.median(lum[placa & (ndi.binary_erosion(placa, iterations=40) == False)])
    if kw.pop('grabcut', False):
        sim = mascara_grabcut(src)
    else:
        sim = placa & ((lum > ref + delta) if simbolo_claro else (lum < ref - delta))
        sim = ndi.binary_opening(sim, iterations=1)
    sim &= ndi.binary_erosion(placa, iterations=10)
    fondo_placa = placa & ~ndi.binary_dilation(sim, iterations=3)
    a2 = a.copy(); a2[..., 3] = np.where(sim, 255, 0)
    # placa como rectángulo redondeado exacto
    ys, xs = np.where(placa); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    fila = np.where(placa[y0 + 1])[0]; rx = max(fila.min() - x0, 4) * 1.15
    rect = np.zeros_like(placa); rect[y0:y1, x0:x1] = True
    if not dividir_simbolo: kw['umbral'] = 999
    else: kw['umbral'] = umbral
    capas = [(rect, None, fondo_placa)] + capas_auto(a[..., :3], sim, **kw)
    svg = construir(a[..., :3], capas, caja(placa), nombre.replace('-', '')[:6])
    import re
    svg = re.sub(r'<path fill="([^"]+)" d="[^"]*"/>', lambda m: f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="{rx:.0f}" fill="{m.group(1)}"/>', svg, count=1)
    open(f"{OUT}/{nombre}.svg", 'w').write(svg); e = error(a, svg)
    Image.fromarray(e[2].astype(np.uint8)).save(f"{OUT}/{nombre}_r.png")
    print(f"{nombre:34s} err={e[0]:.2f} p95={e[1]:.1f} KB={len(svg)/1024:.1f} capas={len(capas)}")

if __name__ == '__main__':
    A, B = f"{O}/simbolo-a-montana", f"{O}/simbolo-b-cinta"
    pieza('a-isotipo-color', f"{A}/isotipo-color.png", cierre=12, apertura=1)
    pieza('a-logo-horizontal-color', f"{A}/logo-horizontal-color.png", cierre=12, apertura=1, minimo=8)
    pieza('b-isotipo-color', f"{B}/isotipo-color.png", rango=30)
    pieza('b-isotipo-monocromatico', f"{B}/isotipo-monocromatico.png")
    pieza('b-logo-horizontal-monocromatico', f"{B}/logo-horizontal-monocromatico.png", minimo=8)
    # icono('b-app-icon-oscuro', f"{B}/app-icon-oscuro.png", True, umbral=105, grabcut=True, cierre=3, apertura=2)
    icono('b-app-icon-negativo', f"{B}/app-icon-negativo.png", True, dividir_simbolo=False)
    icono('b-favicon-claro', f"{B}/favicon-claro.png", False, umbral=125)
    icono('b-favicon-monocromatico', f"{B}/favicon-monocromatico.png", False)

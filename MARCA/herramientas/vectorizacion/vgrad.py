"""Vectoriza piezas a color: regiones trazadas con potrace y rellenas con degradados lineales ajustados."""
import io, re, numpy as np, potrace, cairosvg
from PIL import Image
from scipy import ndimage as ndi

def trazo(mask, turd=10, opt=0.2):
    p = potrace.Bitmap(~mask).trace(turdsize=turd, alphamax=1.0, opticurve=True, opttolerance=opt)
    d = []
    for c in p:
        s = c.start_point; d.append(f"M{s.x:.1f} {s.y:.1f}")
        for g in c.segments:
            if g.is_corner: d.append(f"L{g.c.x:.1f} {g.c.y:.1f}L{g.end_point.x:.1f} {g.end_point.y:.1f}")
            else: d.append(f"C{g.c1.x:.1f} {g.c1.y:.1f} {g.c2.x:.1f} {g.c2.y:.1f} {g.end_point.x:.1f} {g.end_point.y:.1f}")
        d.append("Z")
    return "".join(d)

def _stops(col, t, t0, t1, nstops):
    out, err = [], 0.0
    for k in range(nstops):
        a = t0 + (t1 - t0) * k / (nstops - 1); w = (t1 - t0) / (nstops - 1) / 2 + 1e-6
        sel = np.abs(t - a) <= w
        if sel.sum() < 5: continue
        c = np.median(col[sel], 0); out.append((k / (nstops - 1), c))
    # error de reconstrucción
    offs = np.array([o for o, _ in out]); cs = np.array([c for _, c in out])
    tt = np.clip((t - t0) / max(t1 - t0, 1e-6), 0, 1)
    rec = np.stack([np.interp(tt, offs, cs[:, ch]) for ch in range(3)], 1)
    return out, np.abs(rec - col).mean()

def _fmt(stops):
    return "".join(f'<stop offset="{o:.2f}" stop-color="#%02x%02x%02x"/>' % tuple(int(v) for v in c) for o, c in stops)

def degradado(rgb, mask, gid, nstops=6):
    ys, xs = np.where(mask & (ndi.binary_erosion(mask, iterations=3)))
    if len(xs) < 50: ys, xs = np.where(mask)
    col = rgb[ys, xs].astype(float); lum = col @ [0.3, 0.59, 0.11]
    # radial: centro en lo más claro
    top = lum >= np.percentile(lum, 92); cx, cy = xs[top].mean(), ys[top].mean()
    r = np.hypot(xs - cx, ys - cy); r1 = np.percentile(r, 99)
    rad, erad = _stops(col, r, 0, r1, nstops)
    lin = degradado_lineal(rgb, mask, gid, nstops, ys, xs, col)
    if lin[2] is not None and lin[2] <= erad * 0.97:
        return lin[0], lin[1]
    gd = (f'<radialGradient id="{gid}" gradientUnits="userSpaceOnUse" cx="{cx:.1f}" cy="{cy:.1f}" r="{r1:.1f}">'
          + _fmt(rad) + '</radialGradient>')
    return gd, f'url(#{gid})'

def degradado_lineal(rgb, mask, gid, nstops, ys, xs, col):
    X = np.c_[np.ones(len(xs)), xs, ys]
    lum = col @ [0.3, 0.59, 0.11]
    coef, *_ = np.linalg.lstsq(X, lum, rcond=None)
    g = coef[1:]
    if np.linalg.norm(g) * max(np.ptp(xs), np.ptp(ys), 1) < 6:   # casi plano
        c = np.median(col, 0).astype(int); return None, '#%02x%02x%02x' % tuple(c), np.abs(col - c).mean()
    u = g / np.linalg.norm(g); t = xs * u[0] + ys * u[1]
    t0, t1 = np.percentile(t, 1), np.percentile(t, 99)
    cx, cy = xs.mean(), ys.mean(); tc = cx * u[0] + cy * u[1]
    p0 = (cx + (t0 - tc) * u[0], cy + (t0 - tc) * u[1]); p1 = (cx + (t1 - tc) * u[0], cy + (t1 - tc) * u[1])
    stops, e = _stops(col, t, t0, t1, nstops)
    gd = (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{p0[0]:.1f}" y1="{p0[1]:.1f}" '
          f'x2="{p1[0]:.1f}" y2="{p1[1]:.1f}">' + _fmt(stops) + '</linearGradient>')
    return gd, f'url(#{gid})', e

def construir(rgb, capas, viewbox, prefijo='g', fondo=None):
    """capas: lista de (mascara, color_fijo|None) en orden de dibujo."""
    defs, paths = [], []
    for i, capa in enumerate(capas):
        m, fijo = capa[0], capa[1]; muestra = capa[2] if len(capa) > 2 else m
        if fijo: fill = fijo
        else:
            gd, fill = degradado(rgb, muestra, f'{prefijo}{i}')
            if gd: defs.append(gd)
        paths.append(f'<path fill="{fill}" d="{trazo(m)}"/>')
    x, y, w, h = viewbox
    bg = fondo or ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.0f} {y:.0f} {w:.0f} {h:.0f}">'
            + (f'<defs>{"".join(defs)}</defs>' if defs else '') + bg + "".join(paths) + '</svg>')

def caja(mask, pad=6):
    ys, xs = np.where(mask); return (xs.min() - pad, ys.min() - pad, np.ptp(xs) + 2 * pad, np.ptp(ys) + 2 * pad)

def error(orig_rgba, svg):
    h, w = orig_rgba.shape[:2]
    s = re.sub(r'<svg[^>]*>', f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', svg, count=1)
    r = np.asarray(Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode()))).convert('RGBA')).astype(float)
    a = orig_rgba.astype(float)
    comp = lambda x: x[..., :3] * (x[..., 3:] / 255) + 255 * (1 - x[..., 3:] / 255)
    d = np.abs(comp(a) - comp(r)); m = (a[..., 3] > 10) | (r[..., 3] > 10)
    return d[m].mean(), np.percentile(d[m].max(1), 95), r

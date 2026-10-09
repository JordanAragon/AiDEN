import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from vgrad import *
from pathlib import Path
ORIG = str(Path(__file__).resolve().parents[2] / "Identidad visual" / "Logo" / "originales")
O = ORIG
def cargar(p):
    a=np.asarray(Image.open(p).convert('RGBA')); return a, a[...,:3], a[...,3]>128
def componentes(al, minimo=300):
    lab, n = ndi.label(al); sizes = ndi.sum(al, lab, range(1, n+1)); orden = np.argsort(sizes)[::-1] + 1
    return [lab == k for k in orden if sizes[k-1] > minimo]
def dividir(rgb, comp, umbral, sigma=4, minimo=2000, it=4, cierre=4):
    """Separa una componente en cuerpo oscuro + zonas claras (cintas) suavizadas."""
    w = comp.astype(float); l0 = rgb.astype(float) @ [0.3, 0.59, 0.11]
    lum = ndi.gaussian_filter(l0 * w, sigma) / np.maximum(ndi.gaussian_filter(w, sigma), 1e-6)
    claro = comp & (lum >= umbral)
    claro = ndi.binary_closing(ndi.binary_opening(claro, iterations=it), iterations=cierre) & comp
    lc, nc = ndi.label(claro); zonas = [lc == k for k in range(1, nc+1) if (lc == k).sum() > minimo]
    resto = comp & ~np.any(zonas, axis=0) if zonas else comp
    return [(comp, None, resto)] + [(ndi.binary_dilation(ndi.binary_fill_holes(z), iterations=4) & comp, None, z) for z in zonas]
def vectorizar(src, umbral, nombre, prefijo, cierre=4, apertura=4):
    a, rgb, al = cargar(src); cs = componentes(al)
    capas = dividir(rgb, cs[0], umbral, cierre=cierre, it=apertura) + [(m, None) for m in cs[1:]]
    svg = construir(rgb, capas, caja(al), prefijo)
    open(nombre + '.svg', 'w').write(svg); e = error(a, svg)
    print(nombre, 'err=%.2f p95=%.1f' % e[:2], 'KB=%.1f' % (len(svg)/1024), 'capas', len(capas))
    Image.fromarray(e[2].astype(np.uint8)).save(nombre + '_r.png')

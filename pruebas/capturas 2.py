import os, sys, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *
from playwright.sync_api import sync_playwright
out = sys.argv[1]; paginas = json.loads(sys.argv[2])  # [nombre, ruta, rol|null, ancho, completa, oscuro]
r = Registro(); srv = servir()
with sync_playwright() as p:
    b = p.chromium.launch()
    for nombre, ruta, rol, ancho, completa, oscuro in paginas:
        ctx = b.new_context(viewport={"width": ancho, "height": 900 if ancho > 600 else 844}, device_scale_factor=1)
        if oscuro: ctx.add_init_script("localStorage.setItem('aiden-theme','dark')")
        pg = ctx.new_page(); r.conectar(pg, nombre)
        if rol: entrar(pg, rol)
        pg.goto(BASE + ruta); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{out}/{nombre}.png", full_page=bool(completa))
        ctx.close()
    b.close()
srv.shutdown()
print("Consola:", "limpia" if not r.errores else "\n".join(r.errores))

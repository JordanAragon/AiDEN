import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *
from playwright.sync_api import sync_playwright
AXE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "axe.min.js")).read()
r = Registro(); srv = servir()
def auditar(pg, nombre, oscuro=False):
    pg.add_script_tag(content=AXE)
    res = pg.evaluate("async () => (await axe.run(document, {resultTypes:['violations'], runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => [v.id, v.impact, v.nodes.length, v.nodes[0].target.join(' '), (v.nodes[0].failureSummary||'').slice(0,160)])")
    print(f"  {nombre}: {len(res)} tipos de violación")
    for v in res: print("     ", v)
    return res
with sync_playwright() as p:
    b = p.chromium.launch()
    for oscuro in (False, True):
        ctx = b.new_context(viewport={"width":1440,"height":900})
        if oscuro: ctx.add_init_script("localStorage.setItem('aiden-theme','dark')")
        pg = ctx.new_page()
        print("TEMA", "oscuro" if oscuro else "claro")
        pg.goto(BASE + "/"); pg.wait_for_timeout(700); auditar(pg, "landing")
        for pub in ["/signup", "/forgot-password", "/terminos", "/no-existe"]:
            pg.goto(BASE + pub); pg.wait_for_timeout(400); auditar(pg, pub)
        pg.goto(BASE + "/login"); pg.wait_for_timeout(300); auditar(pg, "login")
        for rol, rutas in {"admin": ["/dashboard-admin","/produccion","/inventario","/costos","/personal?vista=accesos","/reportes","/ia","/configuracion","/calidad?incidencia=INC-031", "/calidad", "/trazabilidad?lote=LT-2026-011", "/ambiental?zona=Invernadero%202"], "supervisor": ["/dashboard-supervisor","/ambiental","/trazabilidad"], "operario": ["/dashboard-operario"]}.items():
            try:
                entrar(pg, rol)
            except Exception as e:
                print("FALLO ENTRAR", rol, pg.url); print(pg.locator("body").inner_text()[:500]); raise
            for ruta in rutas:
                pg.goto(BASE + ruta); pg.wait_for_timeout(900); auditar(pg, f"{rol} {ruta}")
            pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
            pg.get_by_role("button", name="Cuenta").click(); pg.get_by_role("button", name="Cerrar sesión").click(); pg.wait_for_url("**/login")
        ctx.close()

    print("TECLADO")
    pg = b.new_page(viewport={"width":1440,"height":900}); entrar(pg, "supervisor")
    pg.goto(BASE + "/produccion"); pg.wait_for_timeout(400)
    pg.keyboard.press("Tab")
    r.check(pg.evaluate("document.activeElement.textContent") == "Saltar al contenido", "primer Tab enfoca 'Saltar al contenido'")
    boton = pg.get_by_role("button", name="Nuevo lote"); boton.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    r.check(pg.evaluate("document.activeElement.closest('[role=dialog]') !== null"), "al abrir el modal el foco entra al diálogo")
    for _ in range(25): pg.keyboard.press("Tab")
    r.check(pg.evaluate("document.activeElement.closest('[role=dialog]') !== null"), "Tab no se escapa del modal (25 tabs)")
    pg.keyboard.press("Shift+Tab"); pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    r.check(pg.evaluate("document.activeElement.textContent.includes('Nuevo lote')"), "Escape cierra y devuelve el foco al botón")
    pg.goto(BASE + "/personal"); pg.get_by_role("tab", name="Colaboradores").focus(); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(200)
    r.check(pg.get_by_role("tab", name="Tareas").get_attribute("aria-selected") == "true", "pestañas navegables con flechas")
    pg.goto(BASE + "/produccion"); pg.wait_for_timeout(600); etiqueta = pg.locator("button[aria-label^='Abrir ficha del lote']").first; etiqueta.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    r.check(pg.get_by_role("dialog").count() == 1, "la etiqueta de lote abre la ficha con Enter")
    b.close()
srv.shutdown(); r.resumen()

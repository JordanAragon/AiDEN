import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *
from playwright.sync_api import sync_playwright
AXE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "axe.min.js")).read(); srv = servir()
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width":1440,"height":900})
    ctx.add_init_script("localStorage.setItem('aiden-theme','dark')"); pg = ctx.new_page()
    entrar(pg, "admin")
    for ruta, sel in [("/ambiental?zona=Invernadero%202", ".recharts-line"), ("/dashboard-admin", ".recharts-bar-rectangle")]:
        pg.goto(BASE + ruta); pg.wait_for_timeout(700)
        pg.locator(".recharts-wrapper").last.wait_for(timeout=8000); pg.locator(".recharts-wrapper").last.scroll_into_view_if_needed(); pg.wait_for_timeout(300); box = pg.locator(".recharts-wrapper").last.bounding_box()
        pg.mouse.move(box["x"] + box["width"] * 0.55, box["y"] + box["height"] * 0.5); pg.wait_for_timeout(300)
        visible = pg.locator(".recharts-tooltip-wrapper").last.evaluate("e => getComputedStyle(e).visibility")
        pg.add_script_tag(content=AXE)
        v = pg.evaluate("async () => (await axe.run('.recharts-wrapper', {runOnly:{type:'rule', values:['color-contrast']}})).violations.length")
        print(ruta, "tooltip", visible, "| violaciones de contraste en la gráfica:", v)
        pg.screenshot(path=f"/tmp/o-tooltip{len(ruta)}.png", clip={"x":box["x"],"y":box["y"],"width":box["width"],"height":box["height"]})
    b.close()
srv.shutdown()

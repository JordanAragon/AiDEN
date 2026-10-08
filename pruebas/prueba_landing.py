import json
import re
from base import BASE, Registro, servir
from playwright.sync_api import sync_playwright

registro = Registro()
servidor = servir()

try:
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": 375, "height": 812})
        registro.conectar(pagina, "landing responsive")

        pagina.goto(BASE + "/")
        pagina.wait_for_load_state("domcontentloaded")
        registro.check("AiDEN" in pagina.title(), "la landing define el título del documento")
        registro.check(
            pagina.get_by_role("link", name="Saltar al contenido principal").count() == 1,
            "la landing incluye un enlace para saltar al contenido",
        )
        registro.check(
            pagina.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
            "la landing no desborda horizontalmente a 375 px",
        )

        boton_menu = pagina.get_by_role("button", name="Abrir menú")
        boton_menu.click()
        panel = pagina.locator("#aiden-mobile-panel")
        registro.check(
            pagina.get_by_role("button", name="Cerrar menú").get_attribute("aria-expanded") == "true",
            "el menú móvil anuncia su estado abierto",
        )
        registro.check(panel.is_visible(), "el panel de navegación móvil se muestra al abrirlo")
        pagina.keyboard.press("Escape")
        registro.check(
            pagina.get_by_role("button", name="Abrir menú").get_attribute("aria-expanded") == "false",
            "Escape cierra el menú móvil",
        )
        registro.check(
            pagina.evaluate("document.activeElement.getAttribute('aria-label') === 'Abrir menú'"),
            "el foco regresa al botón al cerrar el menú",
        )

        pagina.set_viewport_size({"width": 1440, "height": 900})
        pagina.get_by_role("button", name=re.compile("Entender costos")).click()
        registro.check(
            pagina.locator(".aiden-demo-readout strong").inner_text() == "Costo y trazabilidad",
            "la ruta de costos actualiza el recorrido interactivo",
        )
        pagina.get_by_role("button", name=re.compile("Acción registrada")).click()
        registro.check(
            pagina.locator(".aiden-demo-readout strong").inner_text() == "Acción registrada",
            "el recorrido refleja el paso seleccionado",
        )

        solicitud = {}

        def interceptar(route):
            try:
                solicitud["payload"] = json.loads(route.request.post_data or "{}")
            except json.JSONDecodeError:
                solicitud["payload"] = {}
            route.fulfill(status=200, content_type="application/json", body='{"ok":true}')

        pagina.route("**/api/contacto", interceptar)
        pagina.locator('.aiden-lead-form input[name="nombre"]').fill("María González")
        pagina.locator('.aiden-lead-form input[name="empresa"]').fill("Vivero del Sur")
        pagina.locator('.aiden-lead-form input[name="email"]').fill("maria@vivero.co")
        pagina.locator('.aiden-lead-form textarea[name="mensaje"]').fill("Seguimiento de lotes")
        pagina.locator(".aiden-lead-form button[type=submit]").click()
        pagina.get_by_role("status", name=re.compile("Solicitud recibida")).wait_for()
        registro.check(
            solicitud.get("payload", {}).get("nombre") == "María González"
            and solicitud.get("payload", {}).get("empresa") == "Vivero del Sur"
            and solicitud.get("payload", {}).get("email") == "maria@vivero.co",
            "el formulario envía los campos de captación como JSON",
        )
        registro.check(
            pagina.locator('.aiden-lead-form input[name="nombre"]').input_value() == "",
            "el formulario se limpia cuando la API confirma la recepción",
        )
        registro.check(
            pagina.locator(".aiden-lead-form").get_by_role("link", name="Política de privacidad").count() == 1,
            "el formulario enlaza a la política de privacidad",
        )

        navegador.close()
    registro.resumen()
finally:
    servidor.shutdown()

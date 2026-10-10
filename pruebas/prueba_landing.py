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
        pagina.locator(".aiden-landing").wait_for()
        registro.check("AiDEN" in pagina.title(), "la landing define el título del documento")
        enlace_salto = pagina.locator(".aiden-skip-link")
        registro.check(
            enlace_salto.count() == 1
            and enlace_salto.inner_text().strip() == "Saltar al contenido principal"
            and enlace_salto.get_attribute("href") == "#contenido",
            "la landing incluye un enlace funcional para saltar al contenido",
        )
        registro.check(
            pagina.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
            "la landing no desborda horizontalmente a 375 px",
        )
        registro.check(
            "Timbío" in pagina.locator("h1").inner_text(),
            "el titular abre la historia del despacho hacia Timbío",
        )
        guia = pagina.locator(".aiden-guia-papel")
        registro.check(
            "LT-2026-011" in guia.inner_text() and "Tomate chonto" in guia.inner_text(),
            "la guía de despacho muestra el lote real de los datos de ejemplo",
        )
        registro.check(
            "datos de ejemplo" in pagina.locator(".aiden-escena-nota").inner_text(),
            "la escena declara que la historia sale de los datos de ejemplo",
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

        # El rebobinado: las estaciones existen y van del presente al día 0.
        pagina.set_viewport_size({"width": 1440, "height": 900})
        estaciones = pagina.locator(".aiden-estacion")
        registro.check(estaciones.count() == 7, "el rebobinado tiene las siete estaciones de la historia")
        textos_dia = pagina.locator(".aiden-estacion-dia > span").all_inner_texts()
        dias = [int(numeros) for texto in textos_dia if (numeros := re.sub(r"\D", "", texto))]
        registro.check(
            dias == sorted(dias, reverse=True) and dias[-1] == 0,
            "las estaciones van hacia atrás y terminan en el día 0",
        )
        registro.check(
            pagina.locator(".aiden-estaciones .aiden-ventana").count() == 7,
            "cada estación muestra la ventana del módulo real del sistema",
        )
        registro.check(
            pagina.locator(".aiden-ventana-ruta").first.inner_text().startswith("Calidad"),
            "la primera ventana pertenece al módulo de Calidad",
        )
        pagina.locator(".aiden-estacion").last.scroll_into_view_if_needed()
        pagina.wait_for_timeout(700)
        registro.check(
            pagina.locator(".aiden-riel-dia").inner_text().strip() == "0",
            "el riel acompaña el scroll y marca el día 0 al final",
        )

        # El saldo sale de los selectores reales.
        saldo = pagina.locator(".aiden-liquidacion")
        registro.check(
            "$" in saldo.inner_text() and "420" in saldo.inner_text(),
            "la liquidación muestra costo por planta y plantas vivas reales",
        )

        # La fila de lotes se lee entera.
        fila = pagina.locator(".aiden-fila-lotes li")
        registro.check(fila.count() == 6, "la fila muestra los seis lotes activos del vivero de ejemplo")
        registro.check(
            pagina.locator(".aiden-fila-lotes li.is-protagonista").count() == 1,
            "el lote de la historia queda señalado en la fila",
        )
        modulos = pagina.locator(".aiden-marquee ul").first.inner_text()
        registro.check(
            all(nombre.upper() in modulos.upper() for nombre in ["Producción", "Inventario", "Trazabilidad", "Ambiental", "Calidad", "Costos", "Personal", "Reportes", "Configuración"]),
            "la cinta nombra los nueve módulos",
        )

        # El asistente real responde en la página, con fuente verificable.
        pagina.locator(".aiden-chat-chips button").first.click()
        pagina.locator(".aiden-chat-respuesta").first.wait_for()
        registro.check(
            "Verificable en" in pagina.locator(".aiden-chat-respuesta").first.inner_text(),
            "el chip del asistente produce una respuesta real con su fuente",
        )
        entrada_chat = pagina.locator("#pregunta-asistente")
        entrada_chat.fill("LT-2026-012")
        entrada_chat.press("Enter")
        pagina.wait_for_timeout(300)
        registro.check(
            "Café" in pagina.locator(".aiden-chat-respuesta").last.inner_text(),
            "el asistente responde una pregunta libre por código de lote",
        )

        # La pila de roles y la cinta de módulos dan vida a la mitad de la página.
        registro.check(pagina.locator(".aiden-roles-pila .aiden-rol").count() == 3, "los tres roles se apilan en tarjetas propias")

        # Planes vive en su propia página, sin precios inventados.
        pagina.goto(BASE + "/planes")
        pagina.locator(".aiden-planes-fila").wait_for()
        registro.check(pagina.locator(".aiden-planes-fila article").count() == 3, "la página de planes ofrece tres formas de adoptar AiDEN")
        registro.check(
            "$" not in pagina.locator(".aiden-planes-fila").inner_text(),
            "los planes no muestran precios inventados",
        )
        registro.check(
            "se define contigo" in pagina.locator(".aiden-planes-banda").inner_text(),
            "la banda de planes declara que el precio se define en la demo",
        )
        pagina.locator(".aiden-plan-selector").nth(1).click()
        registro.check(
            "Licencia" in pagina.locator(".aiden-plan-detalle").inner_text(),
            "elegir un plan actualiza el detalle y el llamado a la acción",
        )

        # Preguntas vive en su propia página, como acordeón honesto.
        pagina.goto(BASE + "/preguntas")
        pagina.locator(".aiden-acordeon").wait_for()
        registro.check(pagina.locator(".aiden-acordeon-item").count() >= 6, "la página de preguntas responde al menos seis dudas")
        boton_incluye = pagina.get_by_role("button", name="¿Qué incluye hoy?")
        boton_incluye.click()
        registro.check(
            "todavía no están disponibles" in pagina.locator(".aiden-acordeon-item.is-abierta").inner_text(),
            "el acordeón aclara qué no está disponible todavía",
        )
        pagina.goto(BASE + "/")
        pagina.locator(".aiden-landing").wait_for()

        # Fuentes externas citadas de forma segura.
        fuentes = pagina.locator(".aiden-datos-sector a")
        registro.check(fuentes.count() >= 2, "la sección de contexto cita sus fuentes")
        seguras = all(
            "noopener" in (fuentes.nth(i).get_attribute("rel") or "")
            for i in range(fuentes.count())
        )
        registro.check(seguras, "los enlaces externos llevan rel noopener")

        # Formulario: campos, honeypot y consentimiento (Ley 1581).
        formulario = pagina.locator(".aiden-formulario")
        formulario.scroll_into_view_if_needed()
        for campo in ["nombre", "empresa", "email"]:
            registro.check(
                formulario.locator(f"[name='{campo}']").get_attribute("required") is not None,
                f"el campo {campo} es obligatorio",
            )
        trampa = formulario.locator("[name='sitio_web']")
        registro.check(
            trampa.count() == 1 and formulario.locator(".aiden-campo-trampa").get_attribute("aria-hidden") == "true",
            "el honeypot existe y queda oculto para lectores de pantalla",
        )
        consentimiento = formulario.locator("[name='consentimiento']")
        registro.check(
            consentimiento.get_attribute("required") is not None,
            "el consentimiento de datos es obligatorio antes de enviar",
        )
        registro.check(
            formulario.locator("a[href='/privacidad']").count() == 1,
            "el consentimiento enlaza la política de privacidad",
        )

        # El envío llega a la API con el consentimiento y el honeypot vacío.
        capturada = {}

        def responder(ruta):
            capturada.update(json.loads(ruta.request.post_data))
            ruta.fulfill(status=200, content_type="application/json", body="{\"ok\":true}")

        pagina.route("**/api/contacto", responder)
        formulario.locator("[name='nombre']").fill("Prueba Vivero")
        formulario.locator("[name='empresa']").fill("Vivero de prueba")
        formulario.locator("[name='email']").fill("prueba@vivero.com")
        consentimiento.check()
        formulario.get_by_role("button", name=re.compile("Solicitar demo")).click()
        pagina.locator(".aiden-form-estado.is-exito").wait_for()
        registro.check(
            capturada.get("consentimiento") is True and capturada.get("sitio_web") == "",
            "la solicitud viaja con consentimiento explícito y honeypot vacío",
        )

        # Navegación: login y legales.
        registro.check(
            pagina.locator(".aiden-footer a[href='/terminos']").count() == 1
            and pagina.locator(".aiden-footer a[href='/privacidad']").count() == 1,
            "el pie enlaza términos y privacidad",
        )
        pagina.locator(".aiden-footer").get_by_role("link", name="Ingresar").click()
        pagina.wait_for_url("**/login")
        registro.check("/login" in pagina.url, "desde la landing se llega al inicio de sesión")

        navegador.close()
finally:
    servidor.shutdown()

registro.resumen()

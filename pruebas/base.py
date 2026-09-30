import os
import sys
import http.server, socketserver, threading
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
BASE = "http://127.0.0.1:4173"

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def log_message(self, *a): pass
    def send_head(self):
        ruta = self.translate_path(self.path.split("?")[0])
        if not os.path.exists(ruta) or os.path.isdir(ruta):
            self.path = "/index.html"
        return super().send_head()

def servir():
    socketserver.TCPServer.allow_reuse_address = True
    s = socketserver.ThreadingTCPServer(("127.0.0.1", 4173), H)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s

class Registro:
    def __init__(self): self.errores = []; self.ok = []; self.fallos = []
    def conectar(self, pg, nombre):
        pg.on("console", lambda m: self.errores.append(f"[{nombre}] {m.type}: {m.text}") if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: self.errores.append(f"[{nombre}] PAGEERROR: {e}"))
    def check(self, cond, texto):
        (self.ok if cond else self.fallos).append(texto)
        print(("  OK   " if cond else "  FALLA ") + texto)
    def resumen(self):
        print(f"\n{len(self.ok)} verificaciones OK, {len(self.fallos)} fallas")
        for f in self.fallos: print("  - " + f)
        print("Consola:", "sin errores ni advertencias" if not self.errores else "")
        for e in self.errores: print("  " + e)
        if self.fallos or self.errores:
            raise SystemExit(1)

CREDENCIALES_PRUEBA = {
    "admin": ("jordanaragon@aiden.com", "aiden123"),
    "supervisor": ("supervisor@aiden.com", "aiden123"),
    "operario": ("operario@aiden.com", "aiden123"),
}

def entrar(pg, rol):
    try:
        correo, clave = CREDENCIALES_PRUEBA[rol]
    except KeyError as exc:
        raise ValueError(f"Rol de prueba no reconocido: {rol}") from exc

    pg.goto(BASE + "/login")
    pg.get_by_label("Correo electrónico").fill(correo)
    pg.get_by_label("Contraseña").fill(clave)
    pg.get_by_role("button", name="Iniciar sesión", exact=True).click()
    pg.wait_for_url("**/dashboard-*")
    pg.wait_for_timeout(400)

def toast(pg, texto, timeout=3000):
    try:
        pg.locator("[role=status], [role=alert]").filter(has_text=texto).first.wait_for(timeout=timeout)
        return True
    except Exception:
        return False

def visible(localizador, timeout=8000):
    try:
        localizador.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False

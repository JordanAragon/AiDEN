# Pruebas de navegador

Pruebas funcionales y de accesibilidad con Playwright (Python) sobre la versión compilada. Cada script levanta su propio servidor estático en `127.0.0.1:4173` con respaldo SPA.

```bash
npm run build                      # desde la raíz del proyecto
pip install playwright && playwright install chromium
curl -L https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js -o pruebas/axe.min.js   # solo para a11y.py y tooltip.py

python3 pruebas/prueba_admin.py    # 43 verificaciones: landing, lotes, ficha, inventario→costos→trazabilidad, calidad, configuración, CSV, buscador, inteligencia, accesos, 404
python3 pruebas/prueba_roles.py    # 36 verificaciones: supervisor, operario en móvil, permisos por rol, reasignar y desactivar, registro y revisión de cuenta, restaurar datos base
python3 pruebas/prueba_landing.py  # 47 verificaciones: navegación móvil, recorrido con datos reales, escenas vivas ocultas a lectores, tres pantallas sincronizadas, asistente en vivo y formulario con autorización
python3 pruebas/a11y.py            # axe-core WCAG 2.1 AA en 26 vistas por tema (claro y oscuro) y navegación por teclado
python3 pruebas/tooltip.py         # contraste de los tooltips de gráficas en modo oscuro
python3 pruebas/capturas.py carpeta '[["nombre","/ruta","admin",1440,1,0]]'   # capturas: rol|null, ancho, página completa, oscuro
```

Cada contexto de Playwright empieza con el navegador vacío, así que las pruebas corren sobre los datos base recién generados.

## Pruebas unitarias

`npm test` ejecuta `pruebas/unitarias/*.test.mjs` con `node:test`, sin dependencias: un cargador resuelve los imports sin extensión de Vite y `entorno.mjs` simula `localStorage`, `sessionStorage` y los eventos de ventana. Cubren el almacén (migraciones, claves corruptas, respaldos, ids), las reglas de negocio de `acciones.js`, alertas y costo por planta, el CSV, el asistente, la API de solicitudes y las contraseñas.

# Pruebas de navegador

Pruebas funcionales y de accesibilidad con Playwright (Python) sobre la versión compilada. Cada script levanta su propio servidor estático en `127.0.0.1:4173` con respaldo SPA.

```bash
npm run build                      # desde la raíz del proyecto
pip install playwright && playwright install chromium
curl -L https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js -o pruebas/axe.min.js   # solo para a11y.py y tooltip.py

python3 pruebas/prueba_admin.py    # 38 verificaciones: landing, lotes, ficha, inventario→costos→trazabilidad, calidad, configuración, CSV, buscador, inteligencia, accesos, 404
python3 pruebas/prueba_roles.py    # 34 verificaciones: supervisor, operario en móvil, permisos por rol, registro y revisión de cuenta, restablecer demo
python3 pruebas/a11y.py            # axe-core WCAG 2.1 AA en 22 vistas por tema (claro y oscuro) y navegación por teclado
python3 pruebas/tooltip.py         # contraste de los tooltips de gráficas en modo oscuro
python3 pruebas/capturas.py carpeta '[["nombre","/ruta","admin",1440,1,0]]'   # capturas: rol|null, ancho, página completa, oscuro
```

Cada contexto de Playwright empieza con el navegador vacío, así que las pruebas corren sobre los datos de demostración recién generados.

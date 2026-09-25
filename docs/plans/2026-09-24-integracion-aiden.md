# Integración: funcionalidades de AiDEN Premium sobre la identidad visual de AiDEN

**Objetivo:** que AiDEN se vea exactamente como AiDEN (rama `main`) y tenga todas las funcionalidades de AiDEN Premium Final (rama `rediseno-premium`).

**Arquitectura:** la base es `main`. De Premium se trae la capa invisible (datos, reglas, selectores, sesión, formatos, permisos, pruebas). La capa visible se construye con el vocabulario del original: sus archivos CSS, su shell, su landing, sus páginas de acceso y sus clases Tailwind (paleta slate/emerald, tarjetas `rounded-2xl`, rótulos `AiDEN / …`, KPI con ícono en cuadro tintado, tarjeta oscura `bg-slate-950`, aviso inferior oscuro). El modo oscuro del original (`modo-oscuro.css`, clase `aiden-dark`) funciona sobre esas mismas clases, así que toda pieza nueva usa solo clases que ese archivo ya cubre.

## Análisis de los dos estados

| Capa | `main` (AiDEN) | `rediseno-premium` | Se conserva de |
| --- | --- | --- | --- |
| Estilos globales | index.css, modo-oscuro.css, animaciones-app.css, experiencia-aiden.css, CSS de landing | Tokens nuevos (papel, musgo, Bricolage/Plex) | **main** |
| Shell | Barra lateral blanca, logo hoja, «Modo oscuro», barra superior con buscador ⌘K, campana, perfil | Barra agrupada, paleta modal | **main**, con las funciones de Premium dentro |
| Landing y acceso | Editorial (DM Sans + Instrument Serif), foto de fresas en login | Rediseñadas | **main** (con defectos corregidos) |
| Módulos | Estructura visual por módulo, datos sueltos en cada componente | Capa de datos única, acciones validadas, ficha de lote, filtros, CSV, edición, confirmaciones | Estructura de **main**, lógica de **Premium** |
| Datos / reglas / sesión | Semillas por componente, se pierden, fechas UTC | `src/datos`, `acciones`, `selectores`, `asistente`, sesión revalidada | **Premium** |

## Defectos del original que se corrigen sin cambiar su aspecto

Botones de la landing con texto invisible, párrafo de Roles invisible, vista previa del hero en ceros, hamburguesa móvil encima del buscador, `<main>` que se remontaba en cada cambio (perdía el foco al escribir), favicon vacío, textos `slate-400` con contraste insuficiente en información necesaria.

## Tareas

1. Rama `integracion-aiden` desde `main`. Traer capa invisible de Premium. Compila.
2. Kit de UI con el vocabulario del original (Modal, botones, campos, KPI, encabezado con rótulo, panel, segmentos, pestañas, insignias, vacíos, aviso oscuro, confirmación). Ficha de lote y formularios con ese kit.
3. Shell original + funciones Premium (conteos, notificaciones calculadas, buscador con registros y teclado, ficha global, límite de error, carga diferida).
4. Dashboards y módulos: estructura de secciones del original, lógica y funciones de Premium. Uno por uno, con captura de comparación.
5. Landing, login, registro, recuperación, legal y 404 del original conectados a la capa nueva.
6. Verificación: lint, build, suites Playwright adaptadas, axe claro/oscuro, comparación visual lado a lado con `main`.
7. README, documento de identidad visual, commit, ZIP.

## Resultado

- Todas las tareas completadas. Rama `integracion-aiden`.
- Verificación: `npm run build` sin errores ni avisos de lint; `pruebas/prueba_admin.py` 38/38, `pruebas/prueba_roles.py` 34/34, teclado 6/6, tooltips en oscuro sin avisos; axe 26 de 44 vistas sin avisos (restantes: decisiones de identidad documentadas en `docs/IDENTIDAD.md`).
- Comparación visual lado a lado con `main` en landing, tableros y módulos, en claro, oscuro y móvil.

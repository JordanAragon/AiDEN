---
version: 1
slug: "src-pages-home-jsx"
primary_target: "src/pages/Home.jsx"
related_targets: []
---

## Scope

Landing pública `/` (src/pages/Home.jsx). Modo: Persuade. Audiencia: dueños y administradores de viveros en Colombia que deciden pedir una demo; stakeholders que exigen trazabilidad (compradores, ICA). Acción: solicitar demo (formulario real con consentimiento Ley 1581). Prueba: los datos de ejemplo del propio sistema (vivero del Cauca, `generarSemilla()`), etiquetados como ejemplo; cifras del sector solo con fuente (Colviveros 2022, Resolución ICA 780006 de 2020). Restricciones: marca AiDEN fija (paleta forest/moss/lime, DM Sans + Instrument Serif), formulario y API intactos funcionalmente, sin claims comerciales inventados, sin lenguaje de demo en la app.

## Direction contract

THESIS: La página rebobina el despacho de un lote real —del camión a la semilla— y demuestra que el sistema escribió cada día; rechaza la plantilla de categoría: hero partido copy|captura con fila de badges, grids de tarjetas iguales, eyebrows en mayúsculas, numerales decorativos y métricas infladas. Solo afirma lo que los datos de ejemplo prueban línea a línea.

OWN-WORLD: Forest-deep como la víspera del despacho (apertura y cierre), paper/cream como la mañana del origen; la historia aclara al retroceder. Lime únicamente para lo vivo y lo pendiente; moss para lo cumplido. DM Sans operativa; Instrument Serif itálica como voz narrativa. Cifras tabulares. Artefactos del mundo: la guía de despacho como placa-documento y el eje de días con regla vertical al margen. Radios 20–28 px propios de la landing. Selection, caret y scrollbar tematizados en forest/lime.

STORY: El visitante ve un despacho a punto de salir y una incidencia abierta a dos días; entiende que cada línea la escribió el sistema durante 68 días; comprueba que el vivero entero se lee de un barrido; sabe exactamente qué incluye hoy el producto; pide la demo.

FIRST VIEWPORT: Fondo forest-deep. Header: logo, enlaces, «Iniciar sesión», «Solicitar demo». Titular editorial dominante: «Pasado mañana salen 400 plantas de tomate hacia Timbío.» con el destino en itálica serif lime-crema; debajo, una línea: «AiDEN escribió cada día de ese lote. Esta página lo rebobina.» Acciones: primaria «Solicitar demo», secundaria «Rebobinar la historia». A la derecha (abajo en móvil), la guía de despacho: placa clara tipo remisión con LT-2026-011, tomate chonto, 400 de 420 plantas, Invernadero 1 → Timbío, validación pendiente de Laura Méndez, y el sello DÍA 66 / 68 en tabular monumental.

FORM: «El despacho, hacia atrás» — índice 2 de mi lista ordenada; estaba en la mano repartida (3, 2, 1); seed key 67df13cb; elegida aplicando el criterio del usuario «el de más impacto sobre los stakeholders». Raises nombradas: eje-de-días vertical que gobierna cada línea (mesophotic deep dive); contador de día monumental tabular (anime command center, traducido a la paleta AiDEN); fila uniforme de lotes que se lee de un barrido (vu-meter bridge); etapa en curso sólida y las demás punteadas (sewing pattern); el futuro pre-anunciado: las tareas de mañana visibles antes de ocurrir (algorave).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Build path

Code-led: no hay generación de imágenes en este harness; la ambición vive en FIRST VIEWPORT y en la interacción firma: el contador de días que corre hacia atrás con el scroll (scroll-driven animations CSS con fallback IntersectionObserver; con reduced-motion todo visible y contador estático por estación).

## Unresolved

- Foto real del vivero (David no ha entregado activos fotográficos; la página no usa fotos de archivo).
- Datos del responsable del tratamiento (Ley 1581) siguen pendientes en la política.

# Identidad visual de AiDEN y reglas para extenderla

Este documento describe la identidad **original** de AiDEN (rama `main`) y cómo se construyeron sobre ella las funciones de AiDEN Premium sin cambiarla. Sirve para que cualquier pantalla nueva se vea como AiDEN.

## Dos registros visuales

**Landing (`src/pages/Home.jsx` + `landing-aiden-redesign.css`).** Editorial: DM Sans con acentos en Instrument Serif cursiva, verde bosque `#0b2b1b`, acento lima, fondos papel y crema (`#f7f6f0`, `#ebe7db`), numeración de sección (`02 / LA OPERACIÓN`), rótulos diminutos espaciados, vista previa del producto en el hero. No se modificó su diseño.

**Aplicación (`index.css`, `experiencia-aiden.css`, `animaciones-app.css`, `modo-oscuro.css`).** Tailwind con paleta slate y emerald:

| Pieza | Clases del original |
| --- | --- |
| Fondo de la aplicación | `bg-[#f5f7f5]` |
| Rótulo sobre el título | `text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700` (`AiDEN / operación`) |
| Título | `text-2xl font-bold tracking-tight text-slate-950` |
| Tarjeta | `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` |
| Tarjeta oscura (prioridades) | `rounded-2xl bg-slate-950 p-5 text-white`, rótulo `text-emerald-300` |
| Indicador (KPI) | cuadro de ícono `h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700` (o amber, red, sky) + valor `text-2xl font-bold` |
| Botón principal | `rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800` |
| Botón secundario | `rounded-xl border border-slate-200 bg-white … text-slate-700` |
| Filtros | `rounded-lg px-3 py-1.5 text-xs font-semibold`, activo `bg-emerald-700 text-white`, inactivo `bg-slate-100 text-slate-500` |
| Tabla | encabezado `bg-slate-50` con `text-[11px] font-bold uppercase tracking-wider`, filas `border-t border-slate-100 hover:bg-slate-50` |
| Código de lote | `font-mono text-[10px] font-bold text-emerald-700` |
| Modal | fondo `bg-slate-950/35 backdrop-blur-sm`, caja `rounded-2xl border border-slate-200 bg-white shadow-2xl` |
| Aviso | `rounded-xl bg-slate-950 px-4 py-3 text-white shadow-2xl` abajo a la derecha |
| Marca | cuadro `bg-emerald-800` con el ícono de hoja + «AiDEN» en `text-emerald-800` |

## Cómo se integró Premium

- `src/components/ui/` reproduce esas clases con la API que usan los módulos Premium (`Boton`, `Campo`, `Modal`, `Cifras`, `EncabezadoPagina`, `Panel` con variante `oscuro`, `Segmentos`, `Pestanas`, `Insignia`, `Piezas` para estadísticas, acciones rápidas y tarjetas de acceso, `tabla.js`). Una pantalla nueva debe usar este kit, no clases nuevas.
- La **ficha de lote** usa la forma del detalle de lote original (modal ancho, etapas en recuadros, datos en celdas grises, panel lateral de seguimiento).
- Cada módulo conserva el orden y el tipo de sus secciones originales; lo nuevo se agregó dentro de esas secciones o como tarjetas del mismo tipo.

## Modo oscuro

Funciona sobrescribiendo clases concretas bajo `html.aiden-dark` (`modo-oscuro.css`). **Solo se deben usar clases que ese archivo cubre.** Se añadieron complementos, al final del archivo, para colores que el propio original ya usaba y no estaban cubiertos (`sky`, bordes ámbar y rojos, `bg-white/70`) y para el contenedor de la aplicación, que se quedaba claro detrás de tarjetas oscuras.

## Particularidades del CSS original a tener en cuenta

- `index.css` declara `button, a { font: inherit }` y `a { color: inherit }` fuera de las capas de Tailwind, así que ganan a las utilidades. Por eso los botones heredan la tipografía del contenedor (rasgo del original, se mantiene). Cuando un botón o enlace debe verse con una tipografía o color propios, se usa el modificador `!` (por ejemplo el código de lote o el botón de la página 404).
- Dentro de la aplicación, `experiencia-aiden.css` da color blanco a los elementos con `bg-emerald-700`.

## Defectos del original corregidos sin cambiar el diseño

| Defecto | Causa | Corrección |
| --- | --- | --- |
| Texto invisible en «Explorar AiDEN» y «Entrar a AiDEN» | `.aiden-redesign a` pesaba más que `.aiden-button-dark` | Regla más específica con el mismo color |
| Párrafo de Roles invisible | Heredaba el gris claro de secciones oscuras | Mismo ajuste que ya tenía Módulos |
| Vista previa del hero en «00» | Leía datos que nunca se guardaban | Lee la capa de datos real |
| Hamburguesa móvil sobre el buscador | Botón fijo sin espacio reservado | Margen izquierdo en la barra superior móvil |
| Se perdía el foco al escribir | `<main>` se remontaba con cada cambio de datos | Solo cambia al navegar |
| Fondo claro en modo oscuro y rótulos ilegibles | El contenedor no se oscurecía | Mismo fondo que el `body` oscuro |
| Minigráficas de Ambiental con puntos sueltos | Solo existía una lectura por zona | Historial real de lecturas por zona |
| Favicon vacío | Archivo de 0 bytes | Logo original (hoja) en SVG |
| Textos de detalle `slate-400` | Contraste 2,56 | `slate-500` (4,76) |

## Accesibilidad

Auditoría con axe-core (WCAG 2.1 AA) en 44 vistas (22 en tema claro y 22 en oscuro): 26 sin avisos. Los avisos restantes son decisiones de identidad, documentadas:

- Rótulos de 8 px de la landing (contrastes entre 2,6 y 4,4 según el fondo): forman parte del carácter editorial de la landing.
- Descripción bajo el título de cada módulo en `slate-500` sobre `#f5f7f5` (4,42, el mínimo es 4,5).

Si se prioriza la conformidad AA completa, basta con oscurecer esos grises un tono; el cambio es pequeño pero visible en la landing.

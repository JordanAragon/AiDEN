---
name: AiDEN
description: Sistema de gestión inteligente para viveros e invernaderos
colors:
  aiden-ink: "#12251b"
  aiden-forest: "#0b2b1b"
  aiden-forest-deep: "#071b11"
  aiden-moss: "#718b58"
  aiden-lime: "#d9ea73"
  aiden-paper: "#f7f6f0"
  aiden-cream: "#ebe7db"
  aiden-white: "#fffdf8"
  aiden-muted: "#526057"
  aiden-moss-oscuro: "#66804f"
  verde-900: "#0b2f20"
  verde-800: "#104a31"
  verde-700: "#176b45"
  verde-500: "#2f9d65"
  verde-300: "#9bd7b5"
  verde-100: "#e9f5ed"
  verde-50: "#f5faf6"
  texto: "#132019"
  texto-2: "#66736b"
  texto-3: "#89938d"
  borde: "#dfe8e2"
  borde-fuerte: "#cbd9d0"
  fondo: "#ffffff"
  fondo-2: "#f5f7f5"
  dark-bg: "#0b100e"
  dark-surface: "#121815"
  dark-surface-2: "#18201c"
  dark-border: "#26332d"
  dark-texto: "#f1f5f3"
  dark-texto-2: "#c5d0ca"
  dark-texto-3: "#91a098"
typography:
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontWeight: 400
  ui-strong:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
  editorial:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontWeight: 400
rounded:
  lg: "8px"
  xl: "12px"
  brand: "18px"
  2xl: "16px"
  full: "9999px"
components:
  focus-ring:
    textColor: "{colors.verde-500}"
---

# Design System: AiDEN

Fuente de verdad visual de AiDEN, extraída del código (`src/estilos/`) el 2026-10-04. Los tokens del frontmatter son normativos; el texto explica cómo aplicarlos.

## Overview

Herramienta de trabajo para viveros e invernaderos: densa, clara y tranquila, con una marca verde bosque cálida que se nota en la landing y en los encabezados, y una interfaz operativa sobria en los módulos. Tres roles (admin, supervisor, operario) comparten la misma base visual; se distinguen por acentos, no por paletas distintas. Modo claro y oscuro.

Stack: React 19 + Vite, Tailwind CSS 4, React Router, Recharts para gráficas, lucide-react para íconos, `shaders` (WebGPU, MIT) para las escenas vivas (ver **Escenas vivas**), `vgpu` 0.5.0 (Vercel Labs, WebGPU, MIT) para el vivero en 3D (ver **El vivero en 3D**) y `@samasante/liquid-glass` 0.1.1 (MIT) para las dos lentes de vidrio (ver **Vidrio líquido**).

## Colors

### Primary

Escala verde de la app (`--verde-*`): `verde-700` para acciones y enlaces, `verde-500` para foco y estados activos, `verde-50`/`verde-100` para fondos suaves.

### Secondary

Paleta de marca AiDEN (`--aiden-*`): `aiden-forest` y `aiden-forest-deep` en paneles oscuros de marca; `aiden-lime` como acento vivo (rol operario, highlights); `aiden-moss` como acento del rol admin; `aiden-paper`, `aiden-cream` y `aiden-white` como fondos cálidos de la landing y la autenticación.

### Neutral

Texto `texto`, `texto-2`, `texto-3`; bordes `borde`, `borde-fuerte`; fondos `fondo`, `fondo-2`. En los módulos se usan las clases `slate` de Tailwind (texto `slate-500…900`, bordes `slate-100/200`, fondos `slate-50/100`), con `emerald-700`/`emerald-50` para acción y éxito, `red-600`/`red-50` para error y `amber-700` para advertencia.

### Named Rules

- **Paneles oscuros de marca:** `aiden-forest-deep` en modo claro y `verde-900` en modo oscuro (`bg-aiden-forest-deep`), con acentos en `aiden-lime`. No se usa `slate-950` (negro azulado ajeno a la paleta) ni el menta `emerald-300` como acento sobre ellos.
- **Itálica sobre crema:** en las secciones de fondo crema de la landing, la itálica serif usa `aiden-moss-oscuro` (3,5:1); el moss de marca queda en 2,99:1.
- **Gráficas:** ingresos en verde (`verde-700`) y gastos en neutro (`texto-3`), nunca dos verdes para series opuestas. Los colores viven en `useColoresGrafica`.
- **Utilidades de Tailwind:** la paleta está expuesta en `@theme` (`bg-aiden-lime`, `text-verde-700`…). Se prefieren a los hex sueltos.
- **Modo oscuro obligatorio:** clase `aiden-dark` en `<html>` (`src/estilos/modo-oscuro.css`). Fondo `dark-bg`, superficies `dark-surface`/`dark-surface-2`, bordes `dark-border`. Todo componente nuevo se verifica en los dos modos.
- **Contraste:** texto de lectura con 4.5:1 como mínimo en ambos modos.

## Typography

DM Sans en toda la interfaz (variable, rango 400–700). Instrument Serif (normal e itálica) solo como acento editorial en la landing y en titulares puntuales, nunca en la interfaz operativa. Las dos se sirven desde el propio sitio (`public/fuentes`, licencia OFL), se declaran en `src/estilos/index.css` y las que pintan primero se precargan en `index.html`. No se usa Google Fonts: evita una cadena bloqueante, no entrega la IP de la visita a terceros y funciona sin conexión.

- **Piso de tamaño:** 11 px para rótulos y metadatos; el texto de lectura de la app, 14–15 px.
- **Títulos:** tracking no menor a −0,045 em e interlineado de al menos 0,98, para que la itálica serif no choque con la línea de arriba. El titular del hero tiene tope de 5 rem.
- **Números:** cifras, tablas y lecturas con `tabular-nums`.

### Hierarchy

Títulos de página con `EncabezadoPagina` y una barra de acento por rol (`::after`, `src/estilos/sistema-aiden.css`). Texto secundario en `slate-500`.

## Motion

Tokens en `:root` (`src/estilos/index.css`), sacados de la guía de movimiento de Refero:

- **Duraciones:** `--dur-rapida` 120 ms (hover, presión), `--dur-base` 200 ms (cambios de estado), `--dur-lenta` 320 ms (paneles, indicadores que viajan). Nada de la interfaz operativa pasa de 500 ms.
- **Curvas:** `--curva-salida` (entra), `--curva-retiro` (sale), `--curva-enfasis` (llega con intención), `--curva-resorte` (indicadores que se deslizan). `--curva-entrada` y `--curva-micro` son las de la landing.
- **Reglas:** todo bajo `prefers-reduced-motion: no-preference`; con movimiento reducido el cambio es instantáneo o solo opacidad. Nada infinito en la app (la campana de notificaciones se mueve una vez; los pulsos, dos ciclos). Los indicadores (pestañas, segmentos, pastilla de navegación) viajan a la opción elegida en vez de aparecer.

## Layout

Plantilla con barra lateral, barra superior y contenido con scroll propio (`src/plantillas/PlantillaPrincipal.jsx`), con enlace «Saltar al contenido». El supervisor tiene una vista propia (`aiden-supervisor-shell`, `aiden-supervisor-main`). Contenido con `p-4` en móvil y `p-6` desde `sm`. El fondo de la app es papel con un brillo lima suave, sin cuadrícula decorativa.

- **Operario en el celular:** el trabajo va primero (tareas antes que cifras) y las acciones rápidas en una barra fija abajo, al alcance del pulgar.
- **Objetivos táctiles:** 44 px como mínimo en las acciones de campo.
- **Shell de estudio (2026-10-11):** la barra lateral agrupa los módulos en **Operación**, **Gestión** y **Sistema** (rótulos de 11 px en mayúsculas: son etiquetas de navegación, no eyebrows) y muestra el atajo «G + letra» de cada módulo al pasar el cursor. El registro de módulos vive una sola vez en `src/components/navegacion/modulos.js`. Al pie: «Buscar o ejecutar ⌘K» y el interruptor de tema con lente de vidrio.
- **Paleta ⌘K** (`PaletaComandos`, al estilo de Raycast y Linear): diálogo centrado con acciones, módulos, registros y ajustes; vista previa a la derecha (≥ 860 px) con datos reales del elemento activo; Enter hace lo principal y ⌘/Ctrl + Enter lo secundario (ver la trazabilidad de un lote, registrar la entrada de un insumo); recuerda los últimos registros abiertos por cuenta. La barra superior la abre desde un botón con forma de campo («Buscar o ejecutar…»).
- **Atajos** (`ProveedorComandos`): ⌘K, «G + letra» para ir, «N + letra» para registrar (lote, tarea, lectura, incidencia, actividad), «?» para la hoja de atajos y ⇧D para el tema. Tras la G o la N aparece una pista con las letras posibles. Nada se dispara escribiendo en un campo ni con un diálogo abierto.
- **Ficha del lote:** se recorre con J/K (o las flechas del encabezado) en el orden de la lista que la abrió; sin lista, en el de los lotes visibles (activos primero).
- **Tema:** almacén compartido (`useTema`); el cambio se revela en círculo desde el control que lo pidió (View Transitions), instantáneo con movimiento reducido.
- **Landing «El despacho, hacia atrás»** (`src/pages/Home.jsx` + `src/estilos/landing.css`): la página rebobina el despacho de un lote sobre un lienzo claro (`aiden-paper`): la noche vive enmarcada, no de pared a pared. La palabra de marca monumental —el dibujo oficial del logotipo (`src/assets/marca/aiden-palabra.svg`); el lettering nunca se reescribe con una fuente (manual `MARCA/`)— corona el marco del hero: un bloque `aiden-forest-deep` de radio 28 px con brillos radiales suaves en lima y moss, botón circular de flecha en la esquina y la ficha del lote colgada del borde inferior del marco (en escritorio el marco mide al menos `clamp(540px, 62vh, 610px)` y la ficha sobresale ~150 px para que el isotipo sembrado quede entero). «La pregunta» (`aiden-forest`), el manifiesto, el asistente y el contacto (`aiden-forest-deep`) repiten el marco redondeado de 28 px sobre el lienzo; la historia se rebobina a plena luz (`aiden-cream` → `aiden-paper`). Lime solo para lo vivo y lo pendiente; moss para lo cumplido. La voz narrativa es Instrument Serif itálica en los `em` de los titulares: lima sobre los marcos nocturnos, `aiden-moss-oscuro` sobre las secciones claras. Los títulos de sección van en caja alta grotesca con el remate serif itálico en minúscula (el `em` no se transforma).
  - **El invernadero vivo (2026-10-10):** capa de `src/estilos/landing-vivo.css` sobre `landing.css`. Cada marco nocturno tiene una escena WebGPU propia, con una sola idea: el hero es el invernadero de noche (niebla que empuja el cursor, luz lima por la esquina y policarbonato acanalado); «La pregunta», curvas de nivel que derivan (el terreno del vivero); el manifiesto, el isotipo en vidrio extruido que gira con el cursor; el asistente, una malla de verdes con un brillo lima que respira mientras consulta; el contacto, la noche del hero como cierre. Las secciones claras no llevan escena: la lectura manda.
  - **Isotipo sembrado:** en el hero, el símbolo hecho de plantas —un punto por cada planta viva del vivero (4.894 en la semilla), en tresbolillo dentro de la silueta oficial— brota en ola desde la base de la hoja, se mece con brisa y se aparta del cursor como un cultivo con viento (`SembradoIsotipo`, Canvas 2D: funciona sin WebGPU). Una leyenda con punto lima dice qué es cada punto.
  - **Titular que emerge:** las palabras del h1 suben desde su propia línea, desenfocadas → nítidas, en cascada de 55 ms (`TituloVivo`); el texto sigue siendo texto.
  - **Tono de producto terminado:** CTA «Agendar presentación»; la página habla como el producto y una sola nota al pie dice que lotes, nombres y cifras de producción son ilustrativos. Nada de «demo», «datos de ejemplo» ni «demostración» en la superficie.
  - **Navegación en cápsula:** el header vive en una píldora flotante (radio 999 px), visible en reposo con hairline (`borde` al 80 %) y papel translúcido (55 %), y sólida con blur y sombra al compactarse (scroll > 18 px); compacta, lleva el avance de la lectura en una línea moss→lima de 2 px (`animation-timeline: scroll(root)`). Menú móvil a pantalla completa desde 860 px.
  - **Riel de días:** columna sticky con el número del día monumental (clamp 64–92 px, tabular) que rebobina de forma continua con el scroll (rAF interpolando entre estaciones; la estación activa se marca con IntersectionObserver); su línea se llena con una animación scroll-driven (`animation-timeline: --historia`, bajo `@supports`) cuyo respaldo universal es la variable `--avance` que escribe el mismo rAF. El wordmark del hero se hunde en parallax al salir; todo bajo `prefers-reduced-motion: no-preference`, y con movimiento reducido el contador queda estático por estación. Bajo 980 px el riel se vuelve una barra sticky superior y la composición pasa a una columna; ajustes móviles bajo 860 px y la barra de la ventana se pliega bajo 480 px.
  - **Ventanas del módulo real:** cada estación del rebobinado muestra una `VentanaModulo` —barra de ventana con puntos, isotipo y ruta del módulo («Calidad / Incidencias», «Producción / Lotes»…)— con los componentes reales de la app dentro (`Insignia`, `PasosEtapa`, `LineaTiempo`, `BarraRango`), alimentados por la semilla determinista (`generarSemilla`); nada se dibuja a mano. Al entrar, cada ventana se «escribe»: emerge del plano en 3D (rotateX 24° → 0, desenfoque → nítido, recorte que se abre) y una línea lima la barre de arriba abajo (scroll-driven, `view()`).
  - **Tres pantallas** (`CapituloPantallas`, `#roles`): reemplaza la pila de roles. Celular de Andrés, portátil de Laura y tableta de Jordan dibujados en CSS (cuerpo grafito `#0b100e`, isla, cámara, base de aluminio crema) con la interfaz de AiDEN viva dentro y los mismos datos. Marcar una tarea en el celular dispara un registro que viaja por un hilo de luz lima sobre los equipos: el portátil destella, la actividad muestra «Andrés Rojas completó…», la carga y el trabajo abierto ruedan, y la tableta suma el registro del día (con la regla de la app: solo una tarea con lote deja evento). Todo en memoria: la landing no escribe en el navegador. En escritorio (≥ 1100 px) los equipos se arman con el scroll desde una vista isométrica; en una columna se apilan y las pantallas se recogen con container queries. Objetivos táctiles de 44 px.
  - **El vivero, planta por planta** (`CapituloVivero`, sección `#vivero`, 2026-10-11): sobre la fila de lotes, un marco nocturno de 28 px con el vivero de la semilla en 3D (ver **El vivero en 3D**), recorrido con el scroll en un escenario sticky. La cámara para en cada zona —primero la del lote protagonista— y la parada, escrita desde los datos (etapas, salidas, incidencias abiertas, última lectura de la zona), va en una placa abajo a la izquierda; leyenda de etapas arriba y riel de paradas a la derecha. El CTA flotante móvil se retira mientras dura. Con movimiento reducido: plano general quieto y las paradas en lista.
  - **Luz bajo el cursor:** los botones de la landing llevan un brillo radial que sigue al cursor (blanco sobre lima, lima sobre los marcos), solo con puntero fino.
  - **La siembra:** al recibirse la solicitud de presentación, dieciocho semillas musgo y lima saltan del botón y caen en tresbolillo (`SiembraExito`, Web Animations). Es el único confeti de AiDEN.
  - **Asistente en vivo** (`AsistenteVivo`): «consultando los registros» con tres puntos y luego la respuesta palabra a palabra con cursor; la lista y la fuente llegan al final. Responde como la supervisora (sin sesión, las alertas por rol salían vacías). El lector de pantalla oye la respuesta completa una vez.
  - **Marcadores de capítulo:** `aiden-capitulo` —punto en `verde-700` y nombre en mayúsculas con tracking 0,15 em («● La historia»)— abre las secciones del recorrido. Es un recurso de la referencia fijado por David para esta landing; no es licencia para eyebrows o kickers en otras superficies.
  - **Artefactos documentales:** la guía de despacho como placa-remisión (línea discontinua de corte, sello circular rotado −7° en reposo con el día en tabular) y la liquidación del lote con líneas de cuenta y puntos conductores, que sale impresa con el scroll (el papel baja y se despliega como recién salido de la impresora) y en escritorio ocupa la columna derecha del saldo; en la comparativa, los sellos de AiDEN caen uno a uno. Sus títulos en mayúsculas («GUÍA DE DESPACHO», «LIQUIDACIÓN DEL LOTE») son nombres de documento dentro del artefacto dibujado, no eyebrows de sección.
  - **Fila de lotes de un barrido:** una línea por lote con columnas alineadas (código tabular, cultivo, etapa, vivas, zona), nunca tarjetas sueltas; el lote protagonista se marca con fondo `verde-50`. La pista de etapas pinta lo cumplido sólido en moss, la etapa en curso sólida y más larga en bosque, y el resto punteado.
  - **Pie mayor:** cierre narrativo con CTA sobre la noche, columnas de enlaces (Recorrido, Cuenta, Legal), el dibujo de marca monumental en moss (`src/assets/marca/aiden-palabra-moss.svg`) y la banda legal al final.
  - **Detalles tematizados:** `::selection` lima sobre noche, caret del formulario en `verde-700`, scrollbar en moss/forest sobre papel. Radios de 20–28 px propios de la landing (20–24 px en las fichas y el formulario, 28 px en los marcos), una excepción que no sale de ella. Las cifras del sector siempre con fuente citada (Resolución ICA 780006 de 2020, Colviveros).
  - **Conflicto de token conocido:** la landing fija `--tinta-suave` en `#526057` (el valor del frontmatter para `aiden-muted`) porque el `:root` transversal de `src/estilos/index.css` pisa `--aiden-muted` con `#647169`, que baja de 4,5:1 sobre crema. No es un token nuevo: queda pendiente la unificación global.

## Escenas vivas (WebGPU)

Componentes en `src/components/vivo/`. Las escenas (`escenas/*.jsx`) se componen con la librería `shaders` (shaders.com, MIT) y siempre se montan con `LienzoVivo`:

- **Respaldo primero:** el marco pinta su fondo CSS desde el primer cuadro; la escena se descarga diferida (chunk `motor-vivo`, ~325 KB gzip), se monta cuando el marco se acerca a la pantalla y solo lo tapa cuando el motor confirma que dibuja. Sin WebGPU, sin adaptador, con ahorro de datos o en 2G/3G, el motor ni se descarga y queda el respaldo. Es decorativo de punta a punta (`aria-hidden`).
- **Una idea por escena** y colores solo de la paleta (forest-deep, verde-900/800, moss, lima, crema). Nada reacciona al cursor en la interfaz operativa.
- **Movimiento reducido:** velocidades a 0 y sin cursor; la escena queda como imagen quieta.
- **Interfaz operativa:** solo el panel «Pulso de la operación» del supervisor y el de «Prioridad» del administrador llevan `EscenaPulso` (curvas de nivel casi quietas y un brillo lima que crece con los asuntos abiertos). El «Mapa del vivero» de esos dos tableros no es una escena sino una visualización de datos (ver **El vivero en 3D**). El operario no lleva escena ni mapa: trabaja en campo, desde el celular y al sol.
- **Acceso:** la foto del panel lateral pasa por el vidrio acanalado del invernadero, con ondas de condensación bajo el cursor (`EscenaAcceso`).
- **Isotipo en GPU:** la silueta sale de los trazos oficiales (`isotipoTrazos.js`, copia de `MARCA/…/a-isotipo-color.svg`) con una ranura entre montaña, cinta, hoja y esfera; `sdfMarca.js` genera su campo de distancia en el navegador. El sembrado (lima/moss) y el vidrio son representaciones monocromas de la silueta sobre la noche, permitidas solo en escenas vivas; el isotipo a color sigue la regla de la placa clara.
- **Privacidad y seguridad:** siempre `disableTelemetry` (la librería envía métricas a shaders.com por defecto); sin componentes que carguen Google Fonts. La CSP permite `connect-src blob:` para el campo del isotipo; el motor se compila sin `eval` (`vite.config.js`).
- **Peso:** el build recorta la librería a los componentes de `COMPONENTES_VIVOS` (`vite.config.js`). Un componente nuevo en una escena se agrega ahí, o el build falla al cargarlo. El motor no entra en la precarga del service worker.

## El vivero en 3D (vgpu)

`src/components/vivero3d/`. El vivero como plano, dibujado con `vgpu` (Vercel Labs, MIT) sobre WebGPU:

- **Una instancia por planta viva** (4.894 en la semilla): `planoVivero` (función pura y determinista, con pruebas en `pruebas/unitarias/vivero3d.test.mjs`) reparte cada lote activo en camas dentro de la estructura de su zona —invernadero a dos aguas, cuarto de germinación, umbráculo con malla o campo— según el nombre de la zona. Las zonas no traen coordenadas: es un esquema en dos columnas, no un levantamiento. Por encima de 40.000 plantas cada instancia representa varias, y la interfaz lo dice.
- **Color por etapa** en la escala de musgo a lima (Germinación la más fresca, Cosecha la más honda); el lote que se ubica se tiñe de lima y los demás se apagan en la niebla, que se funde con forest-deep. Estructuras en crema translúcido; vidrio y malla más visibles de canto.
- **Respaldo primero:** el mismo plano y la misma cámara se dibujan en Canvas 2D (un punto por planta) mientras el motor carga o si no hay WebGPU; el motor (chunk `motor-vivero3d`, ~51 KB gzip, en la precarga sin conexión) se pide cerca de la pantalla y se funde encima. No exige cambios en la CSP (sin eval, sin workers, sin descargas).
- **Etiquetas en HTML** colocadas con la proyección de la cámara: siguen a sus lotes, se apartan si se pisan y no se salen del lienzo. El lienzo es `aria-hidden`; la información accesible está en el texto que lo acompaña (las paradas en la landing, la lista de lotes en el mapa).
- **Dónde va:** el capítulo de la landing y el «Mapa del vivero» de los tableros de supervisión y administración (`MapaVivero`: zonas con la última lectura fuera de rango marcadas en ámbar, lista de lotes que ubica en el mapa y abre la ficha, giro lento). Con movimiento reducido no hay brisa ni giro.

## Vidrio líquido

`@samasante/liquid-glass` (MIT), siempre en modo en sitio (la lente dobla su propio contenido, así funciona igual en Chrome, Safari y Firefox) y cargado diferido. Solo dos usos, los dos como efecto concreto y nunca sobre datos:

- **Interruptor de tema** (`InterruptorTema` + `LenteTema`): la lente viaja de «Claro» a «Oscuro» sobre la pista y la aumenta apenas; con la barra colapsada, un solo botón.
- **Lupa de la 404** (`LupaVidrio`): sigue al cursor sobre el titular y lo agranda; el texto sigue siendo texto. Sin puntero fino o con movimiento reducido no hay lupa.

## Elevation & Depth

Sombra de marca `0 30px 90px rgba(11, 47, 32, 0.11)`; paneles oscuros `0 20px 54px rgba(7, 27, 17, 0.13)`. El resto de la interfaz se apoya en bordes, no en sombras.

## Shapes

`rounded-xl` por defecto (botones, campos, tarjetas pequeñas), `rounded-2xl` en paneles, `rounded-full` en insignias y avatares. Radio de marca de 18 px (`--radio`).

## Brand

Símbolo oficial desde 2026-10-05: una **A** abstracta con una **hoja** y un **punto** circular (inteligencia y datos), en la familia forest/moss/lime. Sustituye al ícono de hoja de lucide que se usaba como marca provisional.

- Componentes: `IsotipoAiden` y `LogotipoAiden` en `src/components/ui/MarcaAiden.jsx`. No volver a dibujar la marca con íconos de lucide.
- Fondo claro (landing, autenticación móvil, 404): `LogotipoAiden` (isotipo + palabra AiDEN). Fondo oscuro (panel lateral de autenticación): `IsotipoAiden` con `placa` + «AiDEN» en blanco. Barra lateral: `IsotipoAiden` con clase `aiden-isotipo-adaptable` (gana una placa clara en modo oscuro).
- El isotipo nunca va directo sobre verde bosque u oscuro: sus partes verde bosque desaparecen. Siempre con placa clara.
- Assets: `src/assets/marca/` (los que importa la app), `public/marca/` (versiones grandes para compartir y `og:image`) y en `public/` el favicon, los íconos de la PWA y `site.webmanifest`.
- Favicon e íconos de app: favicon claro oficial (A con cinta sobre placa clara), recortado de `MARCA/Identidad visual/Logo/originales/simbolo-b-cinta/favicon-claro.png`.
- En la web se usan las versiones a color; las monocromáticas son para documentación, informes y reportes.
- Sistema de marca completo en `MARCA/` (manual en PDF, masters SVG, kit de exportación, color, tipografía, plantillas). Las reglas de marca viven allí; este archivo manda en la interfaz.
- Pendiente de confirmar: la tipografía de marca (propuesta Nunito Sans + DM Sans) y el significado oficial del acrónimo. Hasta entonces la interfaz sigue con DM Sans.

## Components

Reutilizar los de `src/components/ui/` antes de crear otros: `Boton` (clases en `clasesBoton.js`), `Campo`, `Modal`, `Panel`, `Pestanas`, `Filtros`, `Insignia` (tonos en `tonos.js`), `Avatar`, `EncabezadoPagina`, `EstadoVacio`, `AlertaFormulario`, `Cifras`, `BarraRango`, `EstadoConexion`, `CargandoVista` y `LimiteError`. Tablas con `tabla.js`.

- **Cifras:** etiqueta, ícono discreto en `aiden-moss` y valor tabular. El tono solo se marca con un punto ámbar o rojo cuando pide atención; sin cuadros de ícono de colores.
- **BarraRango:** una lectura contra su rango objetivo: banda `verde-100`, rango reciente en moss y punto en la lectura actual (rojo fuera de rango). El desvío siempre va en texto.
- **LineaTiempo** (`components/lote`): eventos agrupados por día, con un ícono de lucide por tipo; los hitos (registro, etapa, despacho) en bosque y las incidencias en ámbar.
- **PasosEtapa:** pista de cuatro tramos; lo hecho en moss con check, la etapa en curso en bosque con «Día N».
- **PulsoSemana** (`components/dashboard`): registros de los últimos 7 días con etiquetas directas y una tabla equivalente para lectores de pantalla.
- **CifraRodante** (`components/ui`): dígitos de contador mecánico que ruedan al cambiar el valor (y desde cero al montar con `desdeCero`); los dígitos se dibujan con contenido CSS, así el texto legible es solo el número. `Cifras` la usa en todos los módulos para números e importes, que ruedan solo cuando cambian; el panel de pulso del supervisor rueda desde cero al abrir su tablero.
- **Kit de estudio (2026-10-11):** `Boton` con `estado` («cargando», «listo» con check que se dibuja, «error»); `Pestanas` y `Segmentos` con indicador que se desliza a la opción elegida; `EstadoVacio` con `variante` (inicio, búsqueda, acceso, error) y una sola acción en verbo + sustantivo; avisos apilados que se abren y esperan con el cursor encima, con su tiempo en una línea musgo → lima; confirmación destructiva cuyo botón espera 1,1 s llenándose antes de poder confirmar; `TiempoRelativo` («hace 3 h» con la fecha completa al pasar el cursor y un solo reloj de minuto); `AnilloProgreso` (valor contra su meta, con el umbral dicho en texto); `Sello` (el timbre circular de la guía de despacho; cae al cerrar una incidencia); `MapaCalor` (filas por columnas con tabla equivalente para lectores de pantalla; en Ambiental, 72 horas en franjas de 4 horas por zona); `PilaAvatares` (el equipo en iniciales; la ficha de cada uno se inclina apenas hacia el cursor).
- **Tarea recién hecha:** en la jornada del operario el check se dibuja y suelta un anillo lima (y una vibración corta donde exista). Sin confeti.
- **Línea de tiempo:** los días se quedan arriba al bajar y la historia completa de un lote cierra con «Aquí empezó LT-…».
- **Inteligencia:** antes de la respuesta, el asistente dice en pasos de qué módulo lee y con qué lo cruza; la respuesta completa está en el documento desde el primer instante.
- **Transiciones de módulo:** los enlaces de la barra lateral navegan con View Transitions; la pastilla del módulo activo (`aiden-nav-pastilla`) viaja al nuevo ítem, el módulo anterior se apaga y el nuevo entra con `aidenEntradaModulo`. Los desplegables de la barra superior (⌘K, notificaciones, cuenta) nacen del control que los abre (`@starting-style`).

### Navigation

`BarraLateral` con los módulos filtrados por rol y `BarraSuperior` con búsqueda de módulos, notificaciones y perfil.

## Do's and Don'ts

### Do:

- Foco visible: `outline: 2px solid` `verde-500` con `outline-offset: 3px`.
- Animaciones solo con `prefers-reduced-motion: no-preference`.
- Escenas WebGPU solo a través de `LienzoVivo`, con respaldo y telemetría apagada; el vivero en 3D solo a través de `Vivero3D`, con su respaldo en Canvas 2D.
- Atajos de teclado visibles donde se usan (paleta, barra lateral, hoja de atajos) y nunca mientras se escribe.
- Íconos de lucide-react, con `aria-hidden` cuando son decorativos.
- Terminología agrícola colombiana (vivero, lote, etapa, incidencia fitosanitaria).

### Don't:

- Paletas o tipografías nuevas sin aprobación de David.
- Gradientes morado o rosa, neones o estilos genéricos de plantilla SaaS.
- Cuadrícula decorativa de fondo, numerales fantasma de sección o barras laterales de color en tarjetas.
- Textos de menos de 11 px.
- Emojis como íconos.
- Lenguaje de «demo» en la interfaz.
- Vidrio o desenfoque como decoración, y nunca sobre datos (solo el interruptor de tema y la lupa de la 404).
- Efectos que siguen al cursor en la interfaz operativa (salvo la inclinación leve de la ficha de un avatar) o confeti fuera del formulario de contacto.
- Bento genérico, Spline o íconos de Iconly (licencia sin redistribución; el repo es público).

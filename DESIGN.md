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

Stack: React 19 + Vite, Tailwind CSS 4, React Router, Recharts para gráficas y lucide-react para íconos.

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

## Layout

Plantilla con barra lateral, barra superior y contenido con scroll propio (`src/plantillas/PlantillaPrincipal.jsx`), con enlace «Saltar al contenido». El supervisor tiene una vista propia (`aiden-supervisor-shell`, `aiden-supervisor-main`). Contenido con `p-4` en móvil y `p-6` desde `sm`. El fondo de la app es papel con un brillo lima suave, sin cuadrícula decorativa.

- **Operario en el celular:** el trabajo va primero (tareas antes que cifras) y las acciones rápidas en una barra fija abajo, al alcance del pulgar.
- **Objetivos táctiles:** 44 px como mínimo en las acciones de campo.
- **Landing:** composición móvil de una columna bajo 900 px (capa final de `landing-aiden-redesign.css`). Sus tarjetas editoriales usan radios de 20–28 px, una excepción propia de la landing.

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

### Navigation

`BarraLateral` con los módulos filtrados por rol y `BarraSuperior` con búsqueda de módulos, notificaciones y perfil.

## Do's and Don'ts

### Do:

- Foco visible: `outline: 2px solid` `verde-500` con `outline-offset: 3px`.
- Animaciones solo con `prefers-reduced-motion: no-preference`.
- Íconos de lucide-react, con `aria-hidden` cuando son decorativos.
- Terminología agrícola colombiana (vivero, lote, etapa, incidencia fitosanitaria).

### Don't:

- Paletas o tipografías nuevas sin aprobación de David.
- Gradientes morado o rosa, neones o estilos genéricos de plantilla SaaS.
- Cuadrícula decorativa de fondo, numerales fantasma de sección o barras laterales de color en tarjetas.
- Textos de menos de 11 px.
- Emojis como íconos.
- Lenguaje de «demo» en la interfaz.

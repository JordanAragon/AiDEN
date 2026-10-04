# AiDEN — Design System (MASTER)

Fuente de verdad visual de AiDEN. **Extraído del código existente** (commit `3ab0c43`, 2026-10-04), no generado: describe la identidad que ya tiene la app.

Regla de prioridad para cualquier IA o skill de diseño (incluida `ui-ux-pro-max`):

1. Este archivo y, si existe, `pages/<página>.md` (sobrescribe a este).
2. Preferencias de diseño de David (brain David-AI, `knowledge/diseno/preferencias-de-diseno.md`).
3. Recomendaciones de `ui-ux-pro-max`: solo como checklist de UX y accesibilidad y guía del stack. **No** se aplican sus paletas, tipografías ni estilos sobre esta identidad.

Si una mejora exige cambiar algo de aquí, se propone a David y este archivo se actualiza en el mismo cambio.

## Stack

React 19 + Vite, Tailwind CSS 4, React Router, Recharts (gráficas), lucide-react (íconos). Estilos propios en `src/estilos/`.

## Tipografía

| Uso | Fuente | Pesos |
|---|---|---|
| Interfaz y cuerpo | DM Sans | 400, 500, 600, 700 |
| Acentos editoriales (landing, titulares puntuales) | Instrument Serif (normal e itálica) | 400 |

Carga: Google Fonts en `src/estilos/index.css`. Respaldo: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` y `Georgia, serif`.

## Color

Tokens en `:root` de `src/estilos/index.css`.

**Marca (paleta AiDEN):**

| Token | Valor | Uso |
|---|---|---|
| `--aiden-ink` | `#12251b` | Texto de marca, títulos de cabecera |
| `--aiden-forest` | `#0b2b1b` | Paneles oscuros de marca |
| `--aiden-forest-deep` | `#071b11` | Fondo más profundo |
| `--aiden-moss` | `#718b58` | Acento de rol admin |
| `--aiden-lime` | `#d9ea73` | Acento vivo (rol operario, highlights) |
| `--aiden-paper` | `#f7f6f0` | Fondo cálido |
| `--aiden-cream` | `#ebe7db` | Superficie secundaria cálida |
| `--aiden-white` | `#fffdf8` | Blanco cálido |
| `--aiden-muted` | `#526057` | Texto secundario de marca |

**Escala verde de la app:** `--verde-900 #0b2f20`, `--verde-800 #104a31`, `--verde-700 #176b45`, `--verde-500 #2f9d65` (foco y estados), `--verde-300 #9bd7b5`, `--verde-100 #e9f5ed`, `--verde-50 #f5faf6`.

**Neutros y texto:** `--texto #132019`, `--texto-2 #66736b`, `--texto-3 #89938d`, `--borde #dfe8e2`, `--borde-fuerte #cbd9d0`, `--fondo #fff`, `--fondo-2 #f5f7f5`.

**En módulos (Tailwind):** neutros `slate` (texto `slate-500…900`, bordes `slate-100/200`, fondos `slate-50/100`), acción y éxito `emerald` (`emerald-700`, `emerald-50`), error `red-600`/`red-50`, advertencia `amber-700`.

**Modo oscuro:** clase `aiden-dark` en `<html>` (`src/estilos/modo-oscuro.css`), fondo `#0b100e`, superficies `#121815`/`#0e1411`/`#18201c`, bordes `#26332d`. Todo componente nuevo debe verse bien en ambos modos.

## Forma y profundidad

- Radios: `rounded-xl` por defecto (botones, campos, tarjetas pequeñas), `rounded-2xl` en paneles, `rounded-full` en insignias y avatares. Token `--radio: 18px`.
- Sombra de marca: `--sombra: 0 30px 90px rgba(11, 47, 32, 0.11)`; paneles oscuros `0 20px 54px rgba(7, 27, 17, 0.13)`.

## Componentes base

Reutilizar los de `src/components/ui/` antes de crear nuevos: `Boton`, `Campo`, `Modal`, `Panel`, `Pestanas`, `Filtros`, `Insignia`, `Avatar`, `EncabezadoPagina`, `EstadoVacio`, `AlertaFormulario`, `Cifras`, `CargandoVista`, `LimiteError`. Clases de botón en `clasesBoton.js`, tonos en `tonos.js`, tablas en `tabla.js`.

## Roles

Tres dashboards (admin, supervisor, operario) con la misma base visual. Diferencias por rol mediante clases `aiden-rol-*` y `aiden-supervisor-shell` (`src/estilos/sistema-aiden.css`, `PlantillaPrincipal.jsx`), no con paletas distintas.

## Accesibilidad e interacción

- Foco visible: `outline: 2px solid var(--verde-500); outline-offset: 3px`.
- Enlace «Saltar al contenido» en la plantilla principal.
- Animaciones bajo `prefers-reduced-motion: no-preference`; con `reduce` se desactivan.
- Íconos de lucide-react con `aria-hidden` cuando son decorativos; nunca emojis como íconos.
- Contraste de texto mínimo 4.5:1 en ambos modos.

## Evitar

- Paletas o tipografías nuevas sin aprobación de David.
- Gradientes morado/rosa "de IA", neones y estilos genéricos de plantilla.
- Lenguaje de «demo» en la interfaz.

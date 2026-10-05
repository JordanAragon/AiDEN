# Logo

## Versiones
- Isotipo principal.
- Isotipo monocromático.
- Logo institucional monocromático para documentación.
- Favicon/app icon claro.
- Favicon/app icon oscuro.
- Favicon/app icon monocromático.

## Uso documental
Para reportes, manuales, entregables y documentación se prioriza la versión monocromática institucional.

## Regla
No deformar, rotar, recolorear fuera de la paleta ni aplicar efectos no documentados.

## Estado
**Todas las piezas son oficiales** (confirmado por David, 2026-10-05). Son estilos de la misma marca para contextos distintos. El arte original está, sin modificar, en `originales/`:

| Carpeta | Estilo | Piezas |
| --- | --- | --- |
| `originales/simbolo-a-montana/` | A en forma de montaña, hojas y esfera | isotipo a color, logo horizontal a color («Gestión inteligente para viveros») y tablero de marca |
| `originales/simbolo-b-cinta/` | A con cinta plegada, hoja y punto | isotipo a color y monocromático, logo horizontal monocromático («iDEN», «Gestión agrícola inteligente»), app icon oscuro y negativo, favicon claro, monocromático y escalas |

## Uso por contexto
- **Documentación, informes, reportes y entregables:** versiones **monocromáticas** (`isotipo-monocromatico.png`, `logo-horizontal-monocromatico.png`, `favicon-monocromatico.png`).
- **Web:** versiones **a color**.
  - Logo de la interfaz (landing, autenticación, 404): logo horizontal a color (símbolo A), en `src/assets/marca/`.
  - Isotipo de la interfaz (barra lateral, panel de autenticación): isotipo a color (símbolo A).
  - Favicon e íconos de app (`public/`): favicon claro (símbolo B), recortado de `favicon-claro.png`. Su placa clara se lee en pestañas claras y oscuras.

## SVG
Los SVG sueltos de esta carpeta (`isotipo-*.svg`, `logo-monocromatico.svg`, `favicon-*.svg`) son aproximaciones a mano del símbolo B, no masters: no reproducen sus formas. No usarlos como arte final; los PNG de `originales/` son la referencia hasta que se vectorice.

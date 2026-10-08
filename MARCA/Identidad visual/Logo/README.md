# Logo

Todas las piezas son oficiales (confirmado por David, 2026-10-05). Son estilos de la misma marca para contextos distintos: **monocromático para documentación, informes y reportes; a color para la web.**

## Los dos estilos del símbolo

| Estilo | Forma | Dónde vive |
| --- | --- | --- |
| **A · montaña** | A en forma de montaña, cinta clara, hoja y esfera | Logo a color de la web y del producto |
| **B · cinta** | A de trazo con cinta plegada, ola, hoja y punto | Favicon, app icon y piezas monocromáticas institucionales |

Los dos comparten el concepto: **A** (agricultura, crecimiento) + **hoja** (vida, naturaleza) + **punto** (tecnología, datos, inteligencia).

## Versiones y archivos

Masters vectoriales en `svg/`; exportaciones en `png/` (`<pieza>-<ancho>.png`, fondo transparente).

| Pieza | SVG | Uso |
| --- | --- | --- |
| Logo horizontal a color | `a-logo-horizontal-color.svg` | Web, portadas, presentaciones |
| Logotipo a color (sin descriptor) | `a-logotipo-color.svg` | Cabeceras de la web, espacios bajos |
| Isotipo a color | `a-isotipo-color.svg` | Sellos, avatares, barra lateral de la app |
| Isotipo a color (B) | `b-isotipo-color.svg` | Íconos y piezas pequeñas a color |
| Logo horizontal monocromático | `b-logo-horizontal-monocromatico.svg` | Informes, reportes, documentación |
| Logo horizontal en blanco | `b-logo-horizontal-blanco.svg` | Documentos sobre fondo oscuro |
| Isotipo monocromático | `b-isotipo-monocromatico.svg` | Sello en documentos, marcas de agua |
| Isotipo en blanco | `b-isotipo-blanco.svg` | Sello sobre fondo oscuro |
| App icon oscuro | `b-app-icon-oscuro.svg` | Ícono de app, avatar de redes |
| App icon negativo | `b-app-icon-negativo.svg` | Ícono de app sobre fondos claros |
| Favicon claro | `b-favicon-claro.svg` | Favicon (versión vectorial) |
| Favicon monocromático | `b-favicon-monocromatico.svg` | Favicon en documentos y entornos sin color |

El set de favicon que sirve la web está en `favicon/` (`favicon.ico`, PNG, `apple-touch-icon`, íconos PWA y `site.webmanifest`), generado del favicon claro original.

### Cómo se hicieron los SVG

- Los PNG de `originales/` son el arte entregado, sin modificar: la referencia de verdad.
- Logos e isotipos: vectorizados del original (formas trazadas y degradados ajustados a sus colores). Las piezas monocromáticas coinciden con el original en más del 99 % de su superficie.
- App icons y favicons: **construidos** con el isotipo B vectorizado sobre una placa redondeada, con las proporciones medidas en los originales (símbolo al 84 % del ancho, radio de esquina del 18 %). Son la versión vectorial limpia; si se necesita el aspecto exacto del arte (sombras suaves), usar el PNG original.
- Versiones en blanco: el monocromático cambiado a blanco, sin otros cambios.

El proceso es reproducible: `MARCA/herramientas/`.

## Construcción y zona de protección

La unidad **x** es el diámetro del punto (o de la esfera) en la versión que se use.

- **Zona de protección:** 1x libre en los cuatro lados. Nada (texto, bordes, otras marcas) entra en ese espacio.
- Referencia: en el logo horizontal a color, x ≈ 24 % de su alto; en el monocromático, x ≈ 16 % de su alto.

## Tamaño mínimo

| Pieza | Digital | Impreso |
| --- | --- | --- |
| Logo horizontal con descriptor | 320 px de ancho | 60 mm |
| Logotipo sin descriptor | 100 px de ancho | 25 mm |
| Isotipo | 24 px | 8 mm |
| Por debajo de 24 px | usar el favicon (diseñado para 16 px) | — |

Por debajo del mínimo con descriptor, el descriptor deja de leerse: usar el logotipo sin descriptor.

## Fondos

- **Logo a color:** sobre Paper `#f7f6f0`, Cream `#ebe7db`, blanco o fotografía clara y despejada.
- **Fondos oscuros (Forest, fotografía oscura):** isotipo a color sobre placa clara, o las versiones en blanco. Las partes verde bosque del logo a color se pierden sobre oscuro.
- **Monocromático:** tinta sobre papel claro; en blanco sobre fondos oscuros.

## Usos incorrectos

- Deformar, estirar o comprimir.
- Rotar o inclinar.
- Cambiar los colores fuera de la paleta o recolorear el logo a color.
- Añadir sombras, contornos, brillos u otros efectos.
- Reordenar o separar el isotipo y el logotipo en el logo horizontal.
- Reescribir la palabra AiDEN con otra tipografía.
- Usar el logo a color sobre fondos oscuros o con poco contraste.
- Mezclar los estilos A y B en la misma pieza.
- Usar los dos descriptores juntos.
- Usar el logo con descriptor por debajo de su tamaño mínimo.

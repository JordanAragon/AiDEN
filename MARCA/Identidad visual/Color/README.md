# Color

La paleta de marca es la misma del producto (`DESIGN.md`, tokens `--aiden-*`). No se crean colores nuevos sin aprobación de David.

## Paleta principal

| Color | HEX | RGB | Rol | Significado |
| --- | --- | --- | --- | --- |
| **Forest** | `#0b2b1b` | 11 43 27 | Color principal: texto de marca, fondos oscuros, logotipo | Solidez, confianza, naturaleza |
| **Moss** | `#718b58` | 113 139 88 | Secundario: acentos, rótulos, líneas | Crecimiento, equilibrio, productividad |
| **Lime** | `#d9ea73` | 217 234 115 | Acento vivo, siempre sobre oscuro | Vitalidad, innovación, oportunidad |
| **Paper** | `#f7f6f0` | 247 246 240 | Fondo cálido principal | Claridad, simplicidad, respiro |

## Apoyo

| Color | HEX | Uso |
| --- | --- | --- |
| Cream | `#ebe7db` | Fondos secundarios, bordes cálidos |
| White | `#fffdf8` | Superficies sobre Paper |
| Ink | `#12251b` | Texto largo |
| Forest deep | `#071b11` | Fondos oscuros profundos |
| Muted | `#526057` | Texto secundario |
| Tinta monocromática | `#232221` | Logo monocromático y documentos |

Los colores funcionales de la app (éxito, advertencia, error, información) pertenecen al producto y están en `DESIGN.md`. No reemplazan a la paleta de marca.

## Proporción

Por pieza, como guía: **60 %** Paper/Cream/White, **25 %** Forest, **10 %** Moss, **5 %** Lime. Lime es un acento: nunca como fondo grande ni para texto sobre claro.

## Contraste (WCAG 2.1)

Relación de contraste calculada. AA exige 4,5:1 en texto normal y 3:1 en texto grande (≥ 24 px, o ≥ 18,7 px en negrita).

| Texto \ Fondo | Paper | Cream | White | Forest |
| --- | --- | --- | --- | --- |
| Forest | **14,10** ✓ | **12,35** ✓ | **15,02** ✓ | — |
| Ink | **14,85** ✓ | **13,00** ✓ | **15,82** ✓ | 1,05 ✗ |
| Moss | 3,50 · solo grande | 3,07 · solo grande | 3,73 · solo grande | 4,02 · solo grande |
| Lime | 1,21 ✗ | 1,06 ✗ | 1,29 ✗ | **11,61** ✓ |
| Paper | — | — | — | **14,10** ✓ |

Reglas que salen de la tabla:

- Texto de lectura: Forest o Ink sobre claros; Paper o Lime sobre Forest.
- Moss solo en títulos grandes, rótulos de 24 px o más, o elementos no textuales.
- Lime nunca como texto sobre fondos claros.

## Impresión

Valores **de referencia**, convertidos sin perfil de color. Para imprimir, validar con una prueba de color en la imprenta (perfil recomendado: FOGRA39 para papel estucado).

| Color | CMYK referencial |
| --- | --- |
| Forest | 74 / 0 / 37 / 83 |
| Moss | 19 / 0 / 37 / 45 |
| Lime | 7 / 0 / 51 / 8 |
| Paper | 0 / 0 / 3 / 3 |
| Cream | 0 / 2 / 7 / 8 |

No hay equivalencias Pantone definidas. Si se necesitan, se eligen con muestrario físico y se registran aquí.

## Degradados del símbolo

El símbolo a color usa degradados de la misma familia (Forest → Moss → Lime). Están dentro de los SVG master: no se recrean a mano.

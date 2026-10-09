# Iconografía

AiDEN usa **[Lucide](https://lucide.dev)** (licencia ISC, uso libre) en el producto y en las piezas de comunicación. No se crea una segunda familia de íconos.

## Por qué Lucide

Trazo redondeado y uniforme, coherente con las curvas del isotipo y con Nunito Sans. Ya es la librería del producto (`lucide-react`).

## Reglas

| Aspecto | Regla |
| --- | --- |
| Trazo | 2 px a 24 px (el valor por defecto). No mezclar grosores en una misma vista. |
| Tamaño | 16 px en texto y tablas, 18 px en navegación, 20–24 px en tarjetas y botones grandes. |
| Color | El del texto que acompaña (Ink, Forest o Muted). Moss o Verde 700 para estados activos. Lime solo sobre fondo oscuro. |
| Contenedor | Opcional: cuadro redondeado de 36 px con fondo suave (`verde-50` o Cream) y el ícono en Forest o Verde 700. |
| Relación con texto | Ícono a la izquierda, separado 8 px, alineado al centro de la línea. |
| Accesibilidad | Decorativos con `aria-hidden`; si un ícono es la única etiqueta de un botón, el botón lleva `aria-label`. |

## No hacer

- Usar la hoja de Lucide (`Leaf`) como marca: la marca es el isotipo (`IsotipoAiden` en la app).
- Íconos rellenos, con degradado o en 3D.
- Emojis como íconos.
- Íconos de otras familias mezclados con Lucide.

## Íconos de módulo

Los nueve módulos de la app tienen su ícono asignado en `src/components/navegacion/BarraLateral.jsx`. En piezas de comunicación sobre un módulo se usa ese mismo ícono.

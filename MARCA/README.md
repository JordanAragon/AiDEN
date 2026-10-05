# Marca AiDEN

Sistema de identidad de AiDEN: estrategia, identidad verbal, identidad visual, producto y aplicaciones. Esta carpeta es la fuente de verdad de la marca; `DESIGN.md` (raíz) lo es de la interfaz del producto.

**Manual completo:** [`manual-de-marca-aiden.pdf`](manual-de-marca-aiden.pdf).

## Definición

**AiDEN** — *Agricultural Intelligence & Data Ecosystem for Nurseries*. A = Agricultural, i = Intelligence, D = Data, E = Ecosystem, N = Nurseries.

Se escribe siempre **AiDEN**: A, D, E y N en mayúscula, i en minúscula. Nunca «Aiden», «AIDEN» ni «AiDen».

Descriptores oficiales:

- **Gestión inteligente para viveros**: web, producto y piezas a color.
- **Gestión agrícola inteligente**: piezas institucionales monocromáticas (documentación, informes, reportes).

## Qué pieza usar

Regla general (confirmada por David, 2026-10-05): **monocromático para documentación, informes y reportes; a color para la web.** Todas las piezas son oficiales.

| Contexto | Pieza | Archivo |
| --- | --- | --- |
| Web: cabecera, pie, autenticación | Logo horizontal a color (A) | `Identidad visual/Logo/svg/a-logo-horizontal-color.svg` o `a-logotipo-color.svg` |
| Web: barra lateral, avatar, sello | Isotipo a color (A) | `Identidad visual/Logo/svg/a-isotipo-color.svg` |
| Web: favicon y pestaña | Favicon claro (B) | `Identidad visual/Logo/favicon/` |
| App instalada, tiendas, perfiles | App icon oscuro o negativo (B) | `Identidad visual/Logo/svg/b-app-icon-*.svg` |
| Informes, reportes, entregables | Logo monocromático (B) | `Identidad visual/Logo/svg/b-logo-horizontal-monocromatico.svg` |
| Documentos sobre fondo oscuro | Logo o isotipo en blanco (B) | `Identidad visual/Logo/svg/b-*-blanco.svg` |
| Sello pequeño en documentos | Isotipo monocromático (B) | `Identidad visual/Logo/svg/b-isotipo-monocromatico.svg` |

## Estructura

```
MARCA/
├── manual-de-marca-aiden.pdf       Manual completo
├── Estrategia/                     Propósito, visión, personalidad, propuesta de misión y valores
├── Identidad verbal/               Nombre, descriptores, voz, tono, mensajes
├── Identidad visual/
│   ├── Logo/                       Versiones, construcción, usos
│   │   ├── originales/             Arte entregado, sin modificar (referencia de verdad)
│   │   ├── svg/                    Masters vectoriales
│   │   ├── png/                    Exportaciones por tamaño
│   │   └── favicon/                Set de favicon de la web
│   ├── Color/                      Paleta, contrastes, valores de impresión
│   ├── Tipografía/                 Nunito Sans y DM Sans, con licencias
│   ├── Iconografía/
│   ├── Fotografía/
│   └── Recursos gráficos/          Curva, punto de datos, patrones
├── Producto/                       Cómo vive la marca en la app
├── Aplicaciones/                   Web, documentos, presentaciones, redes, institucional
└── herramientas/                   Scripts para regenerar el kit
```

## Estado

| Bloque | Estado |
| --- | --- |
| Logo, color, tipografía | Oficial. Masters vectoriales y kit completo. |
| Identidad verbal | Oficial en nombre y descriptores; voz y tono como guía de trabajo. |
| Estrategia | Propósito y visión confirmados. Misión, valores y posicionamiento: **propuesta** pendiente de validar por David. |
| Aplicaciones | Plantillas de informe y presentación, kit de redes y web. |

Pendientes:

- Validar la propuesta de misión y valores (`Estrategia/`).
- Posicionamiento: depende de la investigación de mercado en Colombia.
- El símbolo A solo existe a color: no hay arte suelto monocromático ni en blanco de la A montaña (aparece en el tablero de marca, pero no como archivo). Si se necesita, pedirlo a diseño.

# Informes PDF de AiDEN

Sistema para producir informes con la identidad de AiDEN: portada oscura con la conclusión y cifras clave, páginas interiores con cabecera, secciones numeradas, tarjetas, avisos, tablas con estados y fuentes. Inspirado en el formato de propuestas de Ocean Industries, adaptado a la marca AiDEN.

Cuando David pida «genera un informe de AiDEN», el informe sale de aquí.

## Cómo se genera

```bash
pip install playwright pyyaml pypdf && playwright install chromium
python MARCA/Aplicaciones/Documentos/informes/generar_informe.py docs/informes/<fecha>-<tema>/informe.yaml
```

1. Crear `docs/informes/AAAA-MM-DD-<tema>/informe.yaml` (el contenido).
2. Escribirlo con [`GUIA-DE-REDACCION.md`](GUIA-DE-REDACCION.md): conclusión primero, cifras con fuente, sin frases de relleno.
3. Generar el PDF (queda junto al YAML) y revisarlo página por página antes de entregarlo.

Ejemplo completo: [`docs/informes/2026-10-05-estado-frontend/informe.yaml`](../../../../docs/informes/2026-10-05-estado-frontend/informe.yaml).

## Identidad

| Elemento | Regla |
| --- | --- |
| Portada | Tarjeta Forest profundo con brillos suaves (verde y lima), logo monocromático en blanco, código y fecha en mono, pastilla Lime, titular en Nunito Sans 800 con la última línea en Lime, resumen y 3–4 cifras. |
| Páginas interiores | Fondo blanco. Cabecera con logo monocromático y sección en mono. Número de sección en cuadro Forest con cifra Lime. |
| Tipografía | Nunito Sans (títulos, cifras), DM Sans (texto), JetBrains Mono (códigos, rótulos, encabezados de tabla y pie). |
| Logo | Siempre monocromático (regla de documentación): blanco en la portada, tinta en el interior. |
| Pie | `AiDEN · <código>` y `Página X de Y`. La portada no lleva número. |

## Esquema del YAML

```yaml
codigo: AIDEN-INF-2026-001          # obligatorio
version: Borrador 1
fecha: 5 de octubre de 2026
area: Gestión agrícola inteligente · Frontend   # bajo el logo
etiqueta: Estado del frontend · octubre 2026    # pastilla
titulo: [Primera línea, Segunda línea, Línea resaltada en Lime]
resumen: Una a tres frases con la conclusión.
kpis:                                # 3 o 4
  - {valor: "9 de 9", etiqueta: módulos funcionando, detalle: más Inteligencia}
preparado_por: {nombre: ..., detalle: ...}
secciones:
  - titulo: La respuesta corta
    subtitulo: Una línea que explica la sección.
    encabezado: Resumen               # texto corto de la cabecera
    nueva_pagina: true                # por defecto; false continúa en la misma página
    bloques: [ ... ]
```

### Bloques

| `tipo` | Campos | Para qué |
| --- | --- | --- |
| `parrafo` | `titulo`, `texto` (párrafos separados por línea en blanco) | Texto corrido |
| `lista` | `titulo`, `items` | Viñetas |
| `banda` | `rotulo`, `titulo`, `texto`, `lista` | Conclusión destacada en fondo Forest |
| `tarjetas` | `columnas`, `items: [{etiqueta, titulo, texto, lista, color}]` | Comparar 2–4 cosas |
| `aviso` | `estilo` (`ok`, `alerta`, `critico`, `info`, `marca`), `titulo`, `texto`, `lista` | Lo que no se puede pasar por alto |
| `tabla` | `titulo`, `columnas`, `filas`, `anchos`, `total`, `nota` | Datos, pendientes, planes |
| `kpis` | `columnas`, `items: [{valor, etiqueta, detalle}]` | Cifras clave |
| `barras` | `titulo`, `items: [{nombre, valor (0–100), color, nota}]` | Porcentajes de avance o cumplimiento |
| `fuentes` | `texto` | Nota final de fuentes y método |

Colores (`color`): `forest`, `moss`, `verde`, `lime`, `ok`, `alerta`, `critico`, `info`, `neutro` o un HEX.

### Formato en el texto

- `**negrita**`, `` `código` ``.
- Chips de estado: `[[ok:Listo]]`, `[[alerta:Parcial]]`, `[[critico:Falta]]`, `[[info:Decisión]]`, `[[neutro:Fuera de alcance]]`.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `generar_informe.py` | YAML → HTML → PDF (Chromium), portada y cuerpo unidos con pypdf |
| `estilos.css` | Todo el diseño del informe |
| `GUIA-DE-REDACCION.md` | Cómo se escribe un informe de AiDEN |

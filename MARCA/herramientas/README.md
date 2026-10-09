# Herramientas de marca

Scripts para regenerar los archivos de `MARCA/`. No hacen falta para usar la marca: solo para reconstruirla si cambia el arte original.

## Requisitos

```bash
pip install -r MARCA/herramientas/requirements.txt
```

## Kit de exportación

```bash
python MARCA/herramientas/generar_kit.py
```

Lee los SVG master de `Identidad visual/Logo/svg/` y regenera:

- `Identidad visual/Logo/png/`: PNG transparentes por tamaño.
- `Identidad visual/Logo/favicon/`: copia del set de favicon que sirve la web (`public/`).
- `Aplicaciones/Redes/archivos/`: avatares y portadas.
- `Aplicaciones/Web/archivos/og-image.png` y `public/marca/og-image.png`.

Ejecútalo cada vez que cambie un SVG master.

## Vectorización

`vectorizacion/` contiene el proceso que convirtió el arte original (`Identidad visual/Logo/originales/`) en los SVG master:

1. `vec_todo.py` traza cada pieza con potrace (formas) y rellena cada región con un degradado lineal o radial ajustado a los colores del original. Escribe en `vectorizacion/salida/`.
2. `iconos_construidos.py` arma los cuatro íconos de app (placa redondeada + isotipo B vectorizado), con las proporciones medidas en los originales.

```bash
cd MARCA/herramientas/vectorizacion
python vec_todo.py && python iconos_construidos.py
```

La salida es determinista: con el mismo arte original produce exactamente los SVG que hay en `svg/`. Revisa `salida/` antes de copiar nada a `svg/`.

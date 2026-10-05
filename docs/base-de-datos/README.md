# Base de datos de AiDEN (MySQL 8)

Estructura completa para pasar AiDEN del almacenamiento del navegador a una base de datos. Cubre todo lo que la app guarda hoy (`src/datos/almacen.js` y las cuentas de `src/utilidades/autenticacion.js`) y lo prepara para varios viveros, auditoría y sensores.

Probado en MySQL 8.0.46: el esquema carga sin errores, los datos de ejemplo de la app entran completos y las 20 pruebas de `herramientas/pruebas.sql` pasan.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `aiden_mysql_esquema.sql` | Crea la base `aiden`: 17 tablas, 14 disparadores, 5 procedimientos, 1 función y 6 vistas |
| `aiden_mysql_datos_ejemplo.sql` | Los mismos datos de ejemplo de la app (5 personas, 7 lotes, 72 lecturas…). Cuentas de prueba con contraseña `aiden123` guardada como hash bcrypt |
| `herramientas/pruebas.sql` | Comprueba que las reglas bloquean lo que deben y que los procedimientos funcionan |
| `herramientas/exportar_semilla.sh` y `generar_datos_ejemplo.py` | Regeneran los datos de ejemplo desde `src/datos/semilla.js` |

## Abrirlo en MySQL Workbench

1. **Crear la base:** File › Open SQL Script › `aiden_mysql_esquema.sql` y ejecutar todo (rayo ⚡). Ojo: el script empieza con `DROP DATABASE IF EXISTS aiden`.
2. **Cargar los datos de ejemplo (opcional):** abrir `aiden_mysql_datos_ejemplo.sql` y ejecutar.
3. **Ver el diagrama:** Database › Reverse Engineer… › elegir la conexión › base `aiden` › Execute. Workbench arma el diagrama EER con todas las relaciones.
4. **Probar las reglas (opcional):** ejecutar `herramientas/pruebas.sql` sobre la base con datos. Cada fila debe decir `OK`. Cambia datos: vuelve a cargar los dos scripts después.

## Tablas

| Tabla | Para qué sirve | Se relaciona con |
| --- | --- | --- |
| `viveros` | Empresa o finca que usa AiDEN | Todas las tablas |
| `usuarios` | Cuenta de acceso, rol y si administración ya la revisó | `personas` (1 a 1, opcional) |
| `personas` | Personal operativo del vivero | Responsable de lotes, tareas, incidencias, lecturas, eventos |
| `configuracion` | Umbrales generales de temperatura, humedad y luz | `viveros` (1 a 1) |
| `zonas` | Invernaderos, umbráculo, germinación; umbrales propios opcionales | `lotes`, `lecturas_ambientales`, `dispositivos` |
| `cultivos` | Especie y variedad, para reportes por cultivo | `lotes` |
| `lotes` | Núcleo de producción: etapa, plantas vivas, cierre | Zona, cultivo, responsable; casi todo apunta aquí |
| `tareas` | Trabajo asignado | Persona, lote (opcional), usuario que la creó |
| `inventario` | Insumos, stock, mínimo y precio | `movimientos_inventario` |
| `movimientos_inventario` | Entradas y salidas, con el valor del momento | Insumo, lote (solo salidas), persona |
| `costos` | Gastos e ingresos | Lote (opcional), movimiento (si viene de inventario) |
| `incidencias` | Problemas de calidad y fitosanitarios | Lote, responsable, quien reporta |
| `dispositivos` | Sensores (vacía hasta conectarlos) | Zona, lecturas |
| `lecturas_ambientales` | Temperatura, humedad e iluminación | Zona, dispositivo o persona |
| `eventos_trazabilidad` | Historia de cada lote (solo se agregan registros) | Lote, persona |
| `notificaciones_leidas` | Qué notificaciones ya vio cada usuario | `usuarios` |
| `auditoria` | Cambios sensibles: roles, contraseñas, configuración, borrados | `usuarios` |

Frente a la propuesta inicial de 14 tablas: `perfiles` + `auth.users` pasan a ser `usuarios` (sin Supabase, la cuenta vive en la base), y se agregan `cultivos`, `dispositivos` y `notificaciones_leidas`.

## Reglas que cuida la base

No dependen de la pantalla: aunque alguien escriba directo en la base, se cumplen.

- **Un vivero no ve datos de otro.** Todas las tablas llevan `vivero_id` y las relaciones son compuestas (`vivero_id`, `id`), así un lote nunca puede apuntar a una zona de otro vivero.
- **Nada con historial se borra.** Insumos con movimientos, zonas con lotes o lecturas, personas con tareas: la base lo impide. Se desactivan (`activo`, `activa`, `estado`).
- **Stock nunca negativo.** Restricción en `inventario` y verificación en el procedimiento de salida.
- **Un lote cerrado no se reabre** ni cambia de etapa o de plantas vivas.
- **Una incidencia solo se cierra con acción correctiva** y fecha de cierre.
- **Un costo por movimiento de inventario**, y ese costo no se edita ni se borra desde Costos.
- **La categoría del costo corresponde a su tipo** (un gasto no puede ser «Anticipo»).
- **No se asignan tareas abiertas** a lotes cerrados ni a personas inactivas.
- **No se desactiva a una persona con tareas abiertas**: primero se reasignan.
- **Trazabilidad y auditoría no se editan ni se borran.**
- **Lecturas con rangos físicos válidos** (humedad entre 0 y 100, etc.).
- **Auditoría automática** de cuentas creadas, cambios de rol, revisión, activación, contraseña, configuración y borrados de costos y tareas. La app debe ejecutar `SET @aiden_usuario_id = <id>` al abrir cada conexión para registrar quién hizo el cambio.

## Procedimientos (acciones que tocan varias tablas)

Todo o nada: si una parte falla, no queda nada a medias.

| Procedimiento | Qué hace |
| --- | --- |
| `sp_registrar_movimiento` | Ajusta el stock, guarda el movimiento con su valor y, si es una salida hacia un lote, deja el evento de consumo y (opcional) carga el costo |
| `sp_avanzar_etapa` | Pasa el lote a la etapa siguiente y lo registra en la trazabilidad |
| `sp_cerrar_lote` | Cierra como despachado o descartado, con su evento |
| `sp_cerrar_incidencia` | Cierra con acción correctiva y deja el evento en el lote |
| `sp_completar_tarea` | Completa la tarea y, si tiene lote, lo registra en su historia |

## Vistas (lo que calculan hoy los tableros)

| Vista | Muestra |
| --- | --- |
| `v_lotes_resumen` | Supervivencia, gastos, ingresos y costo por planta de cada lote |
| `v_insumos_por_reponer` | Insumos en o por debajo del mínimo |
| `v_ultima_lectura_zona` | Última lectura de cada zona y si está en rango (umbral de la zona o del vivero) |
| `v_carga_personal` | Tareas abiertas, vencidas y lotes activos por persona |
| `v_incidencias_abiertas` | Incidencias sin cerrar y cuántos días llevan |
| `v_resultado_mensual` | Gastos, ingresos y balance por mes |

## Decisiones de diseño

- **Ids numéricos** (`AUTO_INCREMENT`) para las relaciones y **códigos visibles** (`LT-2026-011`, `INC-031`) como campo aparte, únicos por vivero. Renombrar o recodificar no rompe nada.
- **Listas fijas como `ENUM`** (etapas, prioridades, estados, categorías, unidades), copiadas de `src/datos/catalogos.js`. Si un vivero necesita sus propias categorías, se pasan a tabla.
- **Valores en pesos** como `DECIMAL(14,2)`; cantidades de insumo como `DECIMAL(12,2)` (hay litros y kilos).
- **Fechas:** `DATE` para fechas sin hora (vencimiento, inicio del lote) y `DATETIME` para lecturas y eventos.
- **Contraseñas:** solo el hash (bcrypt o argon2). La app actual las guarda sin cifrar en el navegador; eso desaparece con esta base.
- **Sin borrado en cascada** en ninguna relación.

## Regenerar los datos de ejemplo

Desde la raíz del repo (Node 22 y Python 3):

```bash
bash docs/base-de-datos/herramientas/exportar_semilla.sh      # crea semilla.json
pip install bcrypt
python docs/base-de-datos/herramientas/generar_datos_ejemplo.py semilla.json > docs/base-de-datos/aiden_mysql_datos_ejemplo.sql
rm semilla.json
```

Las fechas de la semilla son relativas al día en que se exporta (los datos actuales se generaron el 2026-10-05).

## Siguiente paso para conectarla a la app

La app no cambia de forma: `src/datos/almacen.js` pasa a llamar a una API que lee y escribe en esta base, y las validaciones de `src/datos/acciones.js` ya están replicadas aquí como restricciones y procedimientos. La autenticación pasa a `usuarios` con contraseñas cifradas y el rol verificado en el servidor.

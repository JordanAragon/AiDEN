# AiDEN

AiDEN es una plataforma web para organizar y centralizar la gestión operativa de viveros agrícolas: producción, trazabilidad, ambiente, calidad, inventario, costos, personal, reportes e inteligencia, conectados alrededor de cada lote.

Esta versión integra las funcionalidades de **AiDEN Premium** sobre la **identidad visual original de AiDEN**: la interfaz, los colores, la navegación y la landing son los de AiDEN; la capa de datos, las reglas y las funciones nuevas vienen de Premium. Es **solo frontend**: no hay servidor, base de datos remota ni autenticación real.

## Probarla

```bash
npm install
npm run dev          # desarrollo
npm run build        # lint + compilación de producción en dist/
npm run preview      # sirve dist/
```

Cuentas de demostración (contraseña `aiden123`), también disponibles con un clic en la pantalla de inicio de sesión y desde las filas de Roles de la landing:

| Rol | Correo | Tablero |
| --- | --- | --- |
| Administrador | jordanaragon@aiden.com | Centro de administración |
| Supervisor | supervisor@aiden.com | Centro de supervisión |
| Operario | operario@aiden.com | Mi jornada |

## Qué hace

- **Lotes conectados:** cada código de lote abre su ficha con etapas, plantas vivas y supervivencia, salida estimada, costo por planta, condición de su zona, historia, tareas, incidencias y costos.
- **Producción:** crear, editar, avanzar etapa con confirmación, cerrar lote (despachado o descartado), filtros por etapa, zona y búsqueda.
- **Inventario:** existencias y movimientos, cola de reposición, detalle por insumo, salidas cargadas al costo de un lote, edición y eliminación con confirmación, CSV.
- **Trazabilidad:** línea de vida por lote con filtros de lote, tipo, origen y búsqueda; enlace directo `?lote=`; CSV.
- **Ambiental:** tarjetas por zona con minigráfica, historial con la franja del rango configurado, tabla de lecturas, registro de lecturas con aviso previo si quedará en alerta, tarea de revisión desde la alerta.
- **Calidad:** acción correctiva editable en la tarjeta; una incidencia solo se cierra con acción documentada; detalle con tareas relacionadas; tiempo medio de cierre.
- **Costos:** periodo, gasto por categoría, resultado por lote, movimientos con edición, eliminación, filtros y CSV.
- **Personal:** colaboradores, tareas del equipo (filtros, estado, edición) y, para administración, accesos (roles y cuentas nuevas por revisar). Desactivar exige reasignar primero.
- **Reportes:** ocho reportes con periodo o lote, vista previa, CSV (se abre en Excel con tildes correctas) e impresión.
- **Configuración:** umbrales con vista previa de qué zonas quedarían en alerta, notificaciones, zonas del vivero, respaldo JSON (exportar/importar) y restablecer la demo.
- **Inteligencia:** asistente basado en reglas sobre los datos locales; cada respuesta indica de qué módulo sale. No usa modelos de lenguaje ni servicios externos.
- **Transversal:** buscador ⌘K / Ctrl K de módulos y registros navegable con teclado, notificaciones calculadas con estado de leídas, conteo de alertas en el menú, avisos y confirmaciones, permisos por rol, modo oscuro.

## Cómo está organizada

```text
src/
├── datos/            # Capa de datos (sin React): almacén, semilla, catálogos, acciones, selectores, asistente
├── components/
│   ├── ui/           # Kit visual escrito con el vocabulario del AiDEN original
│   ├── lote/         # Código de lote, ficha, etapas y línea de tiempo
│   ├── formularios/  # Modales de lote, tarea, incidencia, actividad y lectura
│   ├── navegacion/   # Barra lateral y barra superior originales
│   ├── dashboard/    # Tableros por rol y vista previa de la landing
│   └── …             # Producción, inventario, módulos y reportes
├── contexto/         # Avisos, confirmaciones y ficha de lote
├── hooks/            # Sesión, usuarios, título, colores de gráficas
├── pages/            # Landing, acceso, inteligencia, legal y 404
├── plantillas/       # Estructura de las vistas autenticadas
├── routes/           # Rutas con carga diferida y permisos por rol
├── estilos/          # CSS original (index, modo oscuro, animaciones, experiencia, landing)
└── utilidades/       # Autenticación local, formatos, exportación CSV
pruebas/              # Pruebas de navegador con Playwright (ver pruebas/README.md)
docs/                 # Identidad visual y plan de integración
```

Regla principal: **los componentes no escriben en el almacenamiento**. Todo cambio pasa por `datos/acciones.js`, que valida, devuelve mensajes claros y registra el evento en la trazabilidad del lote. Los cálculos compartidos (alertas, costo por planta, carga del equipo) viven una sola vez en `datos/selectores.js`.

## Datos locales

- Cada colección se guarda en `localStorage` con claves `aiden-*`; cuentas en `aiden_users` y sesión en `aiden_session`.
- La primera carga genera datos de ejemplo con fechas relativas al día actual. `VERSION_DATOS` en `src/datos/almacen.js` fuerza la regeneración si cambia la estructura.
- Guardar varias colecciones es atómico: si el navegador se queda sin espacio, se restaura lo anterior y se muestra el error.

## Limitaciones de esta versión

- **Sin backend:** los datos existen solo en el navegador donde se crearon; no hay sincronización entre usuarios ni equipos.
- **Autenticación no segura:** contraseñas sin cifrar en `localStorage` y roles verificados solo en el cliente.
- **Recuperación de contraseña sin correo:** la contraseña se cambia directamente en el navegador.
- **Lecturas ambientales manuales:** no hay integración con sensores; las de ejemplo son simuladas.
- **Inteligencia por reglas:** responde con palabras clave y cálculos sobre los datos locales, y lo dice en pantalla.
- **Contraste heredado del diseño original:** los rótulos diminutos de la landing y el gris de las descripciones de encabezado se conservaron por identidad y no alcanzan el mínimo WCAG AA (ver `docs/IDENTIDAD.md`).

## Pasos para una versión con backend

`almacen.js` se reemplaza por llamadas a una API, `acciones.js` se mueve al servidor (sus validaciones ya están escritas) y `autenticacion.js` se sustituye por un proveedor real con roles verificados en el servidor. Los componentes no necesitan cambiar su forma de leer datos.

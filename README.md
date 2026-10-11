# AiDEN

AiDEN es una plataforma web para organizar y centralizar la gestión operativa de viveros agrícolas: producción, trazabilidad, ambiente, calidad, inventario, costos, personal, reportes e inteligencia, conectados alrededor de cada lote.

Esta versión integra las funcionalidades de **AiDEN Premium** sobre la **identidad visual original de AiDEN**: la interfaz, los colores, la navegación y la landing son los de AiDEN; la capa de datos, las reglas y las funciones nuevas vienen de Premium. Es **solo frontend**: no hay servidor, base de datos remota ni autenticación real.

## Probarla

```bash
npm install
npm run dev          # desarrollo
npm run lint         # calidad de código
npm test             # pruebas de la capa de datos y de la API (node:test, sin dependencias)
npm run build        # compilación de producción en dist/ (incluye el service worker)
npm run preview      # sirve dist/
```

Cuentas de prueba (contraseña `aiden123`), definidas en `CUENTAS_INICIALES` de `src/utilidades/autenticacion.js`:

| Rol | Correo | Tablero |
| --- | --- | --- |
| Administrador | jordanaragon@aiden.com | Centro de administración |
| Supervisor | supervisor@aiden.com | Centro de supervisión |
| Operario | operario@aiden.com | Mi jornada |

## Qué hace

- **Lotes conectados:** cada código de lote abre su ficha con etapas, plantas vivas y supervivencia, salida estimada, costo por planta, condición de su zona, historia, tareas, incidencias y costos.
- **Producción:** crear, editar, avanzar etapa con confirmación y filtros por etapa, zona y búsqueda. Un lote se despacha desde Cosecha y se descarta en cualquier etapa; no se cierra con tareas abiertas y el descarte cierra sus incidencias dejando constancia.
- **Inventario:** existencias y movimientos, cola de reposición, detalle por insumo, salidas cargadas al costo de un lote, anulación de movimientos (devuelve el stock y retira el costo del lote), edición y eliminación con confirmación, CSV.
- **Trazabilidad:** línea de vida por lote con filtros de lote, tipo, origen y búsqueda; enlace directo `?lote=`; CSV.
- **Ambiental:** cada zona con barras de rango (banda objetivo, rango reciente y lectura actual, con el desvío en texto), minigráfica, historial con la franja del rango configurado, tabla de lecturas, registro con aviso previo si quedará en alerta, tarea de revisión desde la alerta y alerta cuando una zona lleva más de 12 h sin lectura.
- **Calidad:** acción correctiva editable en la tarjeta; una incidencia solo se cierra con acción documentada; detalle con tareas relacionadas; tiempo medio de cierre.
- **Costos:** periodo, gasto por categoría, resultado por lote, movimientos con edición, eliminación, filtros y CSV.
- **Personal:** colaboradores y tareas del equipo (filtros, estado, edición). Desactivar a alguien con trabajo abierto lo reasigna a otra persona en un solo paso.
- **Reportes:** ocho reportes con periodo o lote, vista previa, CSV (se abre en Excel con tildes correctas) e impresión.
- **Configuración:** usuarios y accesos (roles, revisión de cuentas nuevas, alta administrativa y restablecimiento de contraseñas), umbrales con vista previa de qué zonas quedarían en alerta, notificaciones, zonas del vivero, respaldo JSON validado (exportar/importar) y restablecer los datos de ejemplo.
- **Inteligencia:** asistente basado en reglas sobre los datos locales; cada respuesta indica de qué módulo sale. No usa modelos de lenguaje ni servicios externos.
- **Transversal:** buscador ⌘K / Ctrl K de módulos y registros navegable con teclado, notificaciones por cuenta (una alerta resuelta que vuelve aparece como nueva), avisos y confirmaciones, permisos por rol, modo oscuro y Mi perfil (datos y contraseña).
- **Sin conexión:** tras la primera visita a la app, AiDEN abre y funciona completa sin señal (service worker con la lista exacta del build). Una versión nueva espera a que la persona pulse «Actualizar».
- **Landing «El invernadero vivo»:** escenas WebGPU con respaldo en CSS (invernadero de noche, curvas de nivel, isotipo en vidrio), el isotipo sembrado con una planta por punto, la historia de un lote rebobinada en las ventanas reales de cada módulo, el capítulo «tres pantallas» (celular, portátil y tableta con la app viva y sincronizada), el asistente que escribe en vivo y el formulario para agendar una presentación con autorización de datos (Ley 1581).

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
├── routes/           # Rutas con carga diferida (con reintento) y permisos por rol
├── pwa/              # Plantilla del service worker y su registro
├── estilos/          # CSS original (index, modo oscuro, animaciones, experiencia, landing)
└── utilidades/       # Autenticación local, formatos, exportación CSV, carga diferida
api/contacto.js       # Función de Vercel que recibe las solicitudes de demo
public/fuentes/       # DM Sans e Instrument Serif alojadas en el sitio (licencia OFL)
pruebas/              # Pruebas de navegador (Playwright) y unitarias (pruebas/unitarias, node:test)
docs/                 # Identidad visual, informes y plan de integración
```

Regla principal: **los componentes no escriben en el almacenamiento**. Todo cambio pasa por `datos/acciones.js`, que valida, devuelve mensajes claros y registra el evento en la trazabilidad del lote. Los cálculos compartidos (alertas, costo por planta, carga del equipo) viven una sola vez en `datos/selectores.js`.

## Datos locales

- Cada colección se guarda en `localStorage` con claves `aiden-*`; cuentas en `aiden_users` y sesión en `aiden_session`.
- La primera carga (navegador vacío) genera datos de ejemplo con fechas relativas al día actual.
- Si cambia la estructura, se sube `VERSION_DATOS` y se agrega su transformación en `MIGRACIONES` (`src/datos/almacen.js`): los datos existentes se migran, nunca se vuelven a sembrar, y antes se guarda una copia en `aiden-respaldo-automatico`.
- Una colección ilegible se copia a `<clave>:corrupto` antes de que cualquier escritura la pise.
- Importar un respaldo valida cada registro (ids únicos, sin nulos, versión conocida) y guarda antes una copia de los datos actuales.
- Guardar varias colecciones es atómico: si el navegador se queda sin espacio, se restaura lo anterior y se muestra el error.

## Limitaciones de esta versión

- **Sin backend:** los datos existen solo en el navegador donde se crearon; no hay sincronización entre usuarios ni equipos.
- **Autenticación no segura:** contraseñas sin cifrar en `localStorage` y roles verificados solo en el cliente. Como mitigación, la sesión vence (12 h; 30 días con «Recordarme») y cerrar sesión borra el historial del asistente.
- **Recuperación de contraseña sin correo:** solo para cuentas de operario; las de administración y supervisión las restablece administración en Configuración › Usuarios.
- **Lecturas ambientales manuales:** no hay integración con sensores; las de ejemplo son simuladas.
- **Inteligencia por reglas:** responde con palabras clave y cálculos sobre los datos locales, y lo dice en pantalla.
- **Formulario de demo:** necesita en Vercel `AIDEN_LEADS_WEBHOOK_URL` (y, si el receptor la valida, `AIDEN_LEADS_WEBHOOK_SECRET`). Antes de activarlo hay que completar los datos del responsable en `src/pages/InformacionLegal.jsx` (constante `RESPONSABLE`); sin receptor configurado, la API responde 503.

## Despliegue

`vercel.json` define cabeceras de seguridad (CSP estricta, `nosniff`, protección contra *framing*, `Referrer-Policy`, `Permissions-Policy`), caché inmutable para `/assets` y `/fuentes`, `sw.js` sin caché y una reescritura SPA que no captura `/api`, `/assets` ni `/fuentes` (sus 404 son reales).

## Pasos para una versión con backend

`almacen.js` se reemplaza por llamadas a una API, `acciones.js` se mueve al servidor (sus validaciones ya están escritas) y `autenticacion.js` se sustituye por un proveedor real con roles verificados en el servidor. Los componentes no necesitan cambiar su forma de leer datos.

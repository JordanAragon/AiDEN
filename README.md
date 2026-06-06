# AiDEN

Sistema de gestion inteligente para viveros. Esta version alinea el backend con las 38 historias de usuario de AiDEN v1.0.

## Diagnostico contra las HU

Lo que estaba bien:

- La maqueta HTML ya comunicaba los dominios principales: inventario, produccion, trazabilidad y usuarios.
- El lenguaje visual y la estructura por paginas eran utiles como prototipo de navegacion.
- Existia un backend Node inicial y una separacion basica entre frontend estatico y servidor.

Lo que faltaba para cumplir las HU:

- Autenticacion real, sesiones, roles Administrador/Supervisor/Operario, bloqueo por intentos fallidos y contrasenas con hash.
- Parametros maestros configurables, auditoria y exportacion.
- Reglas de inventario: proveedores, insumos, stock inicial como movimiento, entradas, ajustes, umbrales, semaforo e historial inmutable.
- Gestion de ciclos, lotes, fases, actividades, consumos, mermas, QR publico y trazabilidad consolidada.
- Sensores, lecturas ambientales, umbrales, alertas por fuera de rango y sensor sin senal.
- Incidencias fitosanitarias, tratamientos, descuento de inventario y fecha temprana de despacho.
- Personal, planes de trabajo, costos por lote, reportes y dashboard por rol.
- Un mecanismo verificable sin depender de una base MySQL local ya creada.

## Correccion aplicada

El backend ahora usa un almacen JSON local en `backend/data/aiden-store.json`, generado automaticamente al iniciar. Esto permite validar el comportamiento sin instalar MySQL.

Modulos implementados:

- Configuracion del sistema: `/api/master/:type`, `/api/settings`, `/api/audit`.
- Usuarios y autenticacion: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/users`.
- Inventario e insumos: `/api/suppliers`, `/api/supplies`, `/api/inventory/movements`, `/api/supplies/:id/movements`, `/api/supplies/:id/adjustments`.
- Produccion y lotes: `/api/cycles`, `/api/lots`, `/api/lots/:id/activities`, `/api/lots/:id/advance-phase`, `/api/lots/:id/losses`.
- Trazabilidad: `/api/lots/:id/traceability`, `/api/public/lots/:code`.
- Monitoreo ambiental: `/api/sensors`, `/api/sensors/:id/readings`, `/api/environment/realtime`, `/api/environment/thresholds`, `/api/sensors/:id/history`.
- Calidad y alertas: `/api/technical-constraints`, `/api/alerts`, `/api/lots/:id/incidents`, `/api/incidents/:id/treatments`.
- Personal y tareas: `/api/personnel`, `/api/work-plans`, `/api/my-day`.
- Costos y reportes: `/api/lots/:id/costs`, `/api/dashboard`, `/api/reports/production`, `/api/reports/supplies-consumption`, `/api/reports/alerts-incidents`.
- Notificaciones v1.0: `/api/notification-settings`, `/api/notification-settings/:id/test`.

## Credenciales semilla

- Administrador: `admin@aiden.local` / `Admin123!`
- Supervisor: `supervisor@aiden.local` / `Supervisor123!`
- Operario: `operario@aiden.local` / `Operario123!`

## Ejecutar

```bash
cd backend
node server.js
```

El servidor inicia en `http://localhost:3000`.

## Probar

```bash
cd backend
node aiden.test.js
```

Nota: en el entorno de Codex el sandbox puede bloquear puertos locales; la prueba paso al ejecutarse con permiso para abrir un puerto efimero.

## Estado del frontend

Las paginas en `Pages/` siguen siendo prototipos estaticos. El backend ya expone los datos y validaciones para conectar formularios, tablas, filtros y dashboards reales. El siguiente paso natural es reemplazar los datos quemados por llamadas a la API y agregar guards de sesion en cada vista.

# AiDEN

Prototipo estático HTML/CSS para AiDEN v1.0, sistema de gestión inteligente para viveros.

## Alcance actual

Por ahora el proyecto no implementa backend ni base de datos. La prioridad es representar en pantallas estáticas los 9 módulos definidos en las nuevas historias de usuario y sus criterios de aceptación.

## Módulos del prototipo

1. Configuración del sistema: `Pages/configuracion.html`
2. Inventario e insumos: `Pages/inventario.html`
3. Gestión de cultivos y producción: `Pages/produccion.html`
4. Trazabilidad de lotes: `Pages/trazabilidad.html`
5. Monitoreo ambiental: `Pages/ambiental.html`
6. Control de calidad y alertas: `Pages/calidad-alertas.html`
7. Personal y tareas diarias: `Pages/personal.html`
8. Costos operativos: `Pages/costos.html`
9. Reportes y dashboard: `Pages/reportes-dashboard.html`

## Qué cubre

- Navegación entre los 9 módulos.
- Formularios representativos de los campos requeridos por las HU.
- Tablas, filtros, badges, semáforos, líneas de tiempo, Kanban y paneles de resumen.
- Roles oficiales: Administrador, Supervisor y Operario.
- Exportaciones, auditoría, QR, notificaciones y reportes representados como acciones de interfaz.

## Cómo abrirlo

Abre `index.html` directamente en el navegador. No se necesita servidor local.

## Pendiente para fases futuras

- Conectar formularios a datos reales.
- Implementar validaciones con JavaScript o backend.
- Agregar persistencia, autenticación real y reportes exportables.
- Reemplazar acciones simuladas por funcionalidad completa.

# AiDEN — Auditoría y pulido frontend integral

## Criterio

Esta iteración no toma las mejoras de `refinamiento/landing-premium` como definitivas. Cada decisión visual se revisó con tres preguntas:

1. ¿Mejora la lectura real de la pantalla?
2. ¿Conserva el flujo y los datos existentes?
3. ¿Reduce fricción sin convertir el producto en una maqueta visual?

No se modificó backend, infraestructura ni el modelo de datos. El alcance se mantiene en React/Vite/Tailwind/CSS/componentes existentes.

## Referencias de dirección visual

Se revisaron referencias de Awwwards sobre tipografía editorial, formularios minimalistas, interacción responsive y layouts interactivos. Se tomaron principios —jerarquía, ritmo, contraste, estados, navegación y microinteracción— sin copiar composiciones.

- Awwwards — Form / 1440 Reserve: https://www.awwwards.com/inspiration/form-1440-reserve
- Awwwards — Mobile Screens / Responsive / Real Noni: https://www.awwwards.com/inspiration/mobile-screens-responsive-real-noni
- Awwwards — Fully interactive & responsive layout / Mattered Inbox: https://www.awwwards.com/inspiration/fully-interactive-responsive-layout-mattered-inbox
- Awwwards — Browse tags for UI, typography, responsive, minimal and microinteractions: https://www.awwwards.com/websites/single-page-1/

## Landing

### Revisado

- Hero: jerarquía tipográfica, ritmo vertical, CTA y preview del producto.
- Header: navegación, estado compacto al hacer scroll y responsive móvil.
- Sistema/Mapa: las relaciones tienen una microinteracción intencional; la selección de una relación destaca su nodo correspondiente.
- Readout: se retiró la apariencia de telemetría ficticia y se reemplazó por capacidades reales de conexión del sistema.
- Módulos: cada área conserva un propósito y sigue enlazando a su ruta real.
- Roles: los enlaces llevan al acceso normal; no rellenan ni exponen credenciales.
- Accesibilidad: foco visible en enlaces y controles principales; menú móvil sincronizado con estado del body.
- Responsive: hero, mapa, bento, roles y navegación se mantienen adaptables.

## Autenticación

### Login

- Se eliminó el precargado por query string de cuentas iniciales.
- Se mantiene la redirección por rol y el estado de sesión existente.
- Se mantienen show/hide password, recordar sesión, mensajes de error y loading.

### Registro

- Se mantiene validación de nombre, correo, contraseña, confirmación y aceptación legal.
- Indicador visual de fortaleza de contraseña.
- Se mantiene la política de alta: nueva cuenta comienza como operario hasta revisión.

### Recuperación

- Se mantiene el flujo existente de cambio de contraseña.
- Indicador de fortaleza de contraseña añadido.
- Estados de éxito, error y loading se mantienen dentro del lenguaje visual común.

## Roles

### Administrador

No se rehizo el dashboard. Se aplicó únicamente el sistema transversal de superficies, tablas, controles, foco y jerarquía para integrarlo con el resto del producto sin alterar su arquitectura informativa.

### Supervisor

Se conserva la composición de “Pulso de la operación” y la navegación por rutas. Se redujo el peso visual innecesario mediante el sistema transversal y se mantiene su jerarquía propia frente a Admin y Operario.

### Operario

Se conserva la vista orientada a jornada y acciones rápidas. Las superficies compartidas se simplificaron para priorizar ejecución, lectura de alertas y registros.

## Módulos funcionales

| Área | Funcionalidad revisada | Pulido/corrección |
|---|---|---|
| Producción | filtros, consulta, creación, edición, avance de etapa, ficha de lote | filas más ligeras y menos efecto de tarjeta dentro de tarjeta |
| Trazabilidad | filtros, línea de vida, consulta por lote, evento manual, CSV | tablas/filtros compartiendo el mismo sistema visual |
| Ambiental | zonas, lecturas, rangos, periodos, métricas, tareas de revisión | jerarquía de lectura y controles consistente |
| Calidad | filtros, incidencias, acciones correctivas, revisión, cierre/reapertura, tareas | validación de estado también en la capa de acciones |
| Inventario | existencias, movimientos, mínimos, búsqueda, categorías, entradas/salidas, detalle, CSV | **corregido:** no se permite eliminar un insumo con historial de movimientos |
| Costos | periodo, tipo, lote, gastos/ingresos, resultado, edición, eliminación, CSV | **corregido:** costos derivados de inventario quedan protegidos e identificados como integrados |
| Personal | colaboradores, tareas, filtros, estados, ficha, asignación | sistema transversal y tabs más editoriales |
| Reportes | tipos, periodos, lotes, tabla, impresión, CSV y límite visual | controles y tablas consistentes; el CSV conserva todas las filas |
| Configuración | umbrales, zonas, usuarios, respaldo, restauración | **corregido:** una zona con lotes activos no ofrece eliminación |
| Inteligencia | consultas basadas en datos locales, historial de sesión, recomendaciones | se mantiene claro que no usa un servicio externo de LLM |
| Perfil | datos personales, rol, área y navegación | integrado al sistema transversal |

## Correcciones de integridad

### Inventario

Un insumo con movimientos históricos no puede eliminarse. Esto evita dejar movimientos huérfanos y preservar la trazabilidad.

### Costos

Los costos generados desde un movimiento de inventario no se pueden editar ni eliminar desde Costos. La acción se mantiene vinculada al movimiento que los originó.

### Calidad

La capa de acciones solo acepta los estados `Abierta`, `En revisión` y `Cerrada`. El cierre continúa exigiendo una acción correctiva documentada.

### Configuración

Las zonas con lotes activos no pueden eliminarse. La UI ahora lo comunica deshabilitando la acción antes de abrir la confirmación.

## Sistema visual transversal

Se revisaron y ajustaron primitives y componentes compartidos:

- `Pestanas`: tabs con jerarquía editorial y foco por teclado.
- `Filtros`: buscadores y segmentos con menos ruido visual.
- `Cifras`: métricas menos ornamentales y estados activos más precisos.
- `tabla`: encabezados, separación de filas y hover más discretos.
- `Panel`: superficies sin sombra genérica obligatoria.
- CSS transversal: radios, bordes, controles, foco, responsive y dark mode.

## Verificación

### Correcto

- ESLint: **0 errores / 0 advertencias**.
- Python de pruebas: `py_compile` correcto.
- CSS: los 8 archivos principales pasan parseo PostCSS.
- Cobertura de rutas: Producción, Trazabilidad, Ambiental, Calidad, Inventario, Costos, Personal, Reportes, IA y Configuración están presentes en las rutas privadas.
- Suite browser actualizada para el flujo de restauración vigente.

### Limitación del entorno

No se pudo ejecutar un `vite build` nuevo porque el `node_modules` disponible en el ZIP original contiene únicamente el binding nativo de Rolldown para macOS, mientras este entorno ejecuta Linux. Los intentos de reinstalación/descarga del binding Linux agotaron el tiempo de instalación. Esta limitación pertenece al entorno de dependencias y no se debe presentar como una validación de build exitosa.

Por esta razón, la entrega final no incluye `node_modules`, `.git` ni `dist`; conserva `package-lock.json` para una instalación limpia y reproducible en el entorno del proyecto.

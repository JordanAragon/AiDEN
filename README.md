# AiDEN

AiDEN es una plataforma web para organizar y centralizar la gestión operativa de viveros agrícolas.

El proyecto está construido actualmente como frontend con React, Vite y Tailwind CSS. La aplicación incluye navegación por módulos, diferentes perfiles de usuario, paneles operativos y una primera interfaz de inteligencia artificial preparada para una futura integración con servicios de datos y modelos.

## Funcionalidades actuales

- Inicio de sesión, registro y recuperación de contraseña con almacenamiento local para la etapa de desarrollo frontend.
- Control de acceso por rol dentro de la aplicación.
- Paneles diferenciados para Administrador, Supervisor y Operario.
- Módulos de Inventario, Producción, Trazabilidad, Ambiental, Calidad, Costos, Personal, Reportes y Configuración.
- Módulo de Inteligencia Artificial con interacción provisional en el cliente.
- Búsqueda de módulos y gestión local de notificaciones.

## Tecnologías

- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React

## Estructura

```text
src/
├── components/       # Componentes reutilizables y partes dinámicas de la interfaz
├── datos/             # Datos de apoyo del frontend
├── hooks/             # Hooks reutilizables
├── pages/             # Páginas asociadas a rutas
├── plantillas/        # Estructuras generales de las páginas autenticadas
├── routes/            # Configuración de navegación y rutas protegidas
├── utilidades/        # Funciones auxiliares, incluida la sesión local
└── assets/            # Imágenes y recursos estáticos
```

## Desarrollo local

```bash
npm install
npm run dev
```

Para generar una compilación de producción:

```bash
npm run build
```

## Estado del proyecto

La rama `Jordan` corresponde a la etapa actual de desarrollo frontend. La persistencia remota, autenticación real, base de datos, APIs y servicios de inteligencia todavía no están configurados.

La autenticación local que existe en esta etapa es únicamente para permitir que los flujos del frontend puedan probarse sin backend.


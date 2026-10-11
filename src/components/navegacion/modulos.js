import {
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  GitBranch,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Sprout,
  Thermometer,
  Users,
} from "lucide-react";

/*
  Los módulos de la app, una sola vez: la barra lateral, la paleta ⌘K y los
  atajos «G + letra» leen de aquí. «Inicio» apunta al tablero del rol.
*/

const TODOS = ["admin", "supervisor", "operario"];
const GESTION = ["admin", "supervisor"];

export const GRUPOS_MODULOS = [
  { id: "operacion", nombre: "Operación" },
  { id: "gestion", nombre: "Gestión" },
  { id: "sistema", nombre: "Sistema" },
];

export const MODULOS = [
  { nombre: "Inicio", ruta: "/dashboard-admin", icono: LayoutDashboard, roles: TODOS, grupo: "operacion", atajo: "I", detalle: "El tablero de tu rol" },
  { nombre: "Producción", ruta: "/produccion", icono: Sprout, roles: TODOS, grupo: "operacion", atajo: "P", detalle: "Lotes, etapas y plantas vivas" },
  { nombre: "Trazabilidad", ruta: "/trazabilidad", icono: GitBranch, roles: TODOS, grupo: "operacion", atajo: "T", detalle: "La historia de cada lote" },
  { nombre: "Ambiental", ruta: "/ambiental", icono: Thermometer, roles: TODOS, grupo: "operacion", atajo: "A", detalle: "Lecturas por zona contra su rango" },
  { nombre: "Calidad", ruta: "/calidad", icono: ShieldCheck, roles: TODOS, grupo: "operacion", atajo: "C", detalle: "Incidencias y acciones correctivas" },
  { nombre: "Inventario", ruta: "/inventario", icono: Package, roles: GESTION, grupo: "gestion", atajo: "V", detalle: "Existencias, movimientos y reposición" },
  { nombre: "Costos", ruta: "/costos", icono: CircleDollarSign, roles: GESTION, grupo: "gestion", atajo: "O", detalle: "Gastos, ingresos y resultado por lote" },
  { nombre: "Personal", ruta: "/personal", icono: Users, roles: GESTION, grupo: "gestion", atajo: "E", detalle: "Equipo, tareas y carga de trabajo" },
  { nombre: "Inteligencia", ruta: "/ia", icono: BrainCircuit, roles: GESTION, grupo: "gestion", atajo: "N", detalle: "Preguntas sobre la operación" },
  { nombre: "Reportes", ruta: "/reportes", icono: BarChart3, roles: GESTION, grupo: "gestion", atajo: "R", detalle: "Ocho reportes con CSV e impresión" },
  { nombre: "Configuración", ruta: "/configuracion", icono: Settings, roles: ["admin"], grupo: "sistema", atajo: "S", detalle: "Usuarios, umbrales, zonas y respaldo" },
];

export function modulosDeRol(rol) {
  return MODULOS.filter((modulo) => modulo.roles.includes(rol));
}

export function rutaDeModulo(modulo, inicio) {
  return modulo.nombre === "Inicio" ? inicio : modulo.ruta;
}

export const ETAPAS = ["Germinación", "Adaptación", "Desarrollo", "Cosecha"];

export const DESCRIPCION_ETAPA = {
  Germinación: "Semilla en bandeja hasta la emergencia.",
  Adaptación: "Plántula que se ajusta al trasplante o al nuevo ambiente.",
  Desarrollo: "Crecimiento vegetativo hasta la talla comercial.",
  Cosecha: "Material listo para despacho o venta.",
};

export const ROLES = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operario: "Operario",
};

export const CARGO_A_ROL = {
  Administrador: "admin",
  Supervisor: "supervisor",
  Operario: "operario",
};

export const DEPARTAMENTOS = ["Producción", "Calidad", "Ambiental", "Inventario", "Administración"];

export const PRIORIDADES = ["Alta", "Media", "Baja"];

export const ESTADOS_TAREA = ["Pendiente", "En curso", "Completada"];

export const ESTADOS_INCIDENCIA = ["Abierta", "En revisión", "Cerrada"];

export const MODULOS_TAREA = ["Producción", "Ambiental", "Calidad", "Inventario", "Trazabilidad"];

export const CATEGORIAS_INSUMO = ["Sustratos", "Semillas", "Fertilizantes", "Fitosanitarios", "Envases", "Herramientas"];

export const UNIDADES = ["unidades", "bultos", "litros", "kilogramos", "sobres"];

export const CATEGORIAS_GASTO = ["Insumos", "Mano de obra", "Transporte", "Servicios", "Mantenimiento", "Otros"];

export const CATEGORIAS_INGRESO = ["Venta de plantas", "Anticipo", "Otros ingresos"];

export const TIPOS_EVENTO = [
  "Registro de lote",
  "Cambio de etapa",
  "Riego",
  "Fertilización",
  "Aplicación fitosanitaria",
  "Trasplante",
  "Inspección",
  "Consumo de insumo",
  "Incidencia",
  "Cierre de incidencia",
  "Tarea completada",
  "Despacho",
  "Traslado",
  "Observación",
];

export const EVENTOS_MANUALES = [
  "Riego",
  "Fertilización",
  "Aplicación fitosanitaria",
  "Trasplante",
  "Inspección",
  "Observación",
];

export const CONFIG_INICIAL = {
  tempMin: 18,
  tempMax: 27,
  humMin: 55,
  humMax: 80,
  notificaciones: "Activadas",
};

export function indiceEtapa(etapa) {
  return Math.max(0, ETAPAS.indexOf(etapa));
}

export function colorEtapa(etapa) {
  return `var(--etapa-${indiceEtapa(etapa) + 1})`;
}

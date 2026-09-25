import { CONFIG_INICIAL } from "./catalogos";
import { aISOLocal, hoyISO, sumarDias } from "../utilidades/formato";

/*
  Datos de demostración de un vivero en el Cauca. Todo se genera relativo a la
  fecha actual para que la demo siempre tenga tareas de hoy, vencidas y lecturas
  recientes. Los valores están relacionados entre sí: cada consumo de inventario
  tiene su costo, cada incidencia su lote y cada lote su historia.
*/

export const PERSONAS_SEMILLA = [
  { id: "PER-001", nombre: "Jordan Aragon", cargo: "Administrador", departamento: "Administración", contacto: "310 555 0101", estado: "Activo" },
  { id: "PER-002", nombre: "Laura Méndez", cargo: "Supervisor", departamento: "Producción", contacto: "310 555 0142", estado: "Activo" },
  { id: "PER-003", nombre: "Andrés Rojas", cargo: "Operario", departamento: "Producción", contacto: "312 555 0188", estado: "Activo" },
  { id: "PER-004", nombre: "Camila Pardo", cargo: "Operario", departamento: "Calidad", contacto: "314 555 0127", estado: "Activo" },
  { id: "PER-005", nombre: "Julián Gómez", cargo: "Operario", departamento: "Ambiental", contacto: "316 555 0104", estado: "Activo" },
];

const NOMBRE = Object.fromEntries(PERSONAS_SEMILLA.map((p) => [p.id, p.nombre]));

const ZONAS = [
  { id: "ZON-1", nombre: "Invernadero 1", descripcion: "Tomate y pimentón en camas elevadas." },
  { id: "ZON-2", nombre: "Invernadero 2", descripcion: "Hortalizas de hoja en bandeja y mesa." },
  { id: "ZON-3", nombre: "Área de germinación", descripcion: "Cuarto cerrado con humedad controlada." },
  { id: "ZON-4", nombre: "Umbráculo", descripcion: "Malla sombra al 50 % para café y frutales." },
];

function lote(codigo, cultivo, ubicacion, inicial, actual, etapa, responsableId, inicio, estimada, extra = {}) {
  return {
    id: codigo,
    lote: codigo,
    cultivo,
    ubicacion,
    cantidadInicial: inicial,
    cantidad: actual,
    etapa,
    responsableId,
    fecha: inicio,
    fechaEstimada: estimada,
    estado: "Activo",
    notas: "",
    ...extra,
  };
}

function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function lecturasAmbientales() {
  const perfiles = [
    { zona: "Invernadero 1", base: 23, amp: 3.4, hum: 66, luz: 9200, semilla: 11 },
    { zona: "Invernadero 2", base: 24.6, amp: 3.8, hum: 63, luz: 8800, semilla: 23 },
    { zona: "Área de germinación", base: 22.2, amp: 1.2, hum: 74, luz: 3200, semilla: 37 },
    { zona: "Umbráculo", base: 20.4, amp: 3, hum: 71, luz: 5400, semilla: 41 },
  ];
  const ahora = new Date();
  ahora.setMinutes(0, 0, 0);
  const lecturas = [];
  for (const perfil of perfiles) {
    const azar = aleatorio(perfil.semilla);
    for (let i = 17; i >= 0; i -= 1) {
      const momento = new Date(ahora.getTime() - i * 4 * 3_600_000 - perfil.semilla * 60_000);
      const h = momento.getHours() + momento.getMinutes() / 60;
      const curva = Math.sin(((h - 8) / 24) * Math.PI * 2);
      const dia = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
      let temperatura = perfil.base + perfil.amp * curva + (azar() - 0.5) * 1.2;
      let humedad = perfil.hum - curva * 7 + (azar() - 0.5) * 4;
      if (perfil.zona === "Invernadero 2" && i === 0) {
        temperatura = Math.max(temperatura + 2.6, 28.4);
        humedad = Math.min(humedad, 62);
      }
      lecturas.push({
        id: `AMB-${perfil.semilla}-${String(17 - i).padStart(2, "0")}`,
        zona: perfil.zona,
        temperatura: Math.round(temperatura * 10) / 10,
        humedad: Math.round(Math.min(98, Math.max(35, humedad))),
        iluminacion: Math.round(perfil.luz * dia + (dia ? azar() * 400 : 0)),
        fecha: `${aISOLocal(momento)}T${String(momento.getHours()).padStart(2, "0")}:${String(momento.getMinutes()).padStart(2, "0")}`,
        registradoPor: i % 3 === 0 ? "Julián Gómez" : "Sensor manual",
      });
    }
  }
  return lecturas;
}

export function generarSemilla() {
  const t = hoyISO();
  const d = (n) => sumarDias(t, n);
  const dh = (n, horaTexto) => `${d(n)}T${horaTexto}`;

  const lotes = [
    lote("LT-2026-009", "Lechuga crespa", "Invernadero 2", 900, 846, "Cosecha", "PER-003", d(-58), d(-12), {
      estado: "Cerrado",
      cierre: d(-10),
      motivoCierre: "Despachado",
      notas: "Despacho completo a Agroinsumos El Tambo.",
    }),
    lote("LT-2026-011", "Tomate chonto", "Invernadero 1", 450, 420, "Cosecha", "PER-003", d(-66), d(2), {
      notas: "Pedido de 400 plantas para la Asociación Campesina de Timbío.",
    }),
    lote("LT-2026-012", "Café variedad Castillo", "Umbráculo", 2400, 2310, "Desarrollo", "PER-004", d(-128), d(52), {
      notas: "Colinos en bolsa para renovación de cafetales.",
    }),
    lote("LT-2026-013", "Aguacate Hass injertado", "Umbráculo", 380, 371, "Adaptación", "PER-005", d(-34), d(150)),
    lote("LT-2026-015", "Lechuga crespa", "Invernadero 2", 900, 872, "Desarrollo", "PER-003", d(-26), d(14)),
    lote("LT-2026-016", "Pimentón", "Invernadero 1", 300, 281, "Adaptación", "PER-005", d(-19), d(48)),
    lote("LT-2026-017", "Cilantro", "Área de germinación", 640, 640, "Germinación", "PER-004", d(-6), d(34)),
  ];

  const tarea = (id, titulo, lote, responsableId, prioridad, estado, fecha, modulo, descripcion, extra = {}) => ({
    id,
    titulo,
    lote,
    responsableId,
    prioridad,
    estado,
    fecha,
    modulo,
    descripcion,
    creada: sumarDias(fecha, -3),
    ...extra,
  });

  const tareas = [
    tarea("TSK-001", "Deshoje y tutorado", "LT-2026-011", "PER-003", "Alta", "Pendiente", d(-1), "Producción", "Retirar hojas basales amarillas y ajustar tutores antes del despacho."),
    tarea("TSK-002", "Riego de mantenimiento", "LT-2026-015", "PER-003", "Media", "En curso", d(0), "Producción", "Riego por goteo de 12 minutos en las mesas 1 a 4."),
    tarea("TSK-003", "Registrar lectura ambiental de la tarde", "", "PER-003", "Media", "Pendiente", d(0), "Ambiental", "Tomar temperatura, humedad y luz en el Invernadero 1 a las 3:00 p. m."),
    tarea("TSK-004", "Preparar despacho de tomate", "LT-2026-011", "PER-003", "Media", "Pendiente", d(2), "Producción", "Contar, seleccionar y empacar 400 plantas en canastillas."),
    tarea("TSK-005", "Aplicar fertilizante foliar", "LT-2026-015", "PER-003", "Baja", "Completada", d(-1), "Producción", "Dosis de 3 ml por litro con bomba de espalda.", { completada: dh(-1, "10:40") }),
    tarea("TSK-006", "Retirar bandejas con volcamiento", "LT-2026-017", "PER-004", "Alta", "Pendiente", d(0), "Calidad", "Separar las 3 bandejas afectadas y aplicar fungicida preventivo al resto."),
    tarea("TSK-007", "Fertilización de colinos", "LT-2026-012", "PER-004", "Media", "Pendiente", d(1), "Producción", "Aplicación edáfica según plan de nutrición del mes."),
    tarea("TSK-008", "Medir uniformidad de plántulas", "LT-2026-016", "PER-005", "Alta", "En curso", d(0), "Calidad", "Medir altura en 20 plantas por bandeja y reportar la dispersión."),
    tarea("TSK-009", "Trasplante a bolsa 17×23", "LT-2026-013", "PER-005", "Media", "Pendiente", d(3), "Producción", "Trasplantar los injertos prendidos a bolsa definitiva."),
    tarea("TSK-010", "Validar lote para despacho", "LT-2026-011", "PER-002", "Media", "Pendiente", d(1), "Calidad", "Revisar sanidad y altura antes de autorizar la salida."),
    tarea("TSK-011", "Gestionar compra de sustrato", "", "PER-002", "Alta", "Pendiente", d(-2), "Inventario", "El sustrato turba está por debajo del mínimo; cotizar 20 bultos."),
    tarea("TSK-012", "Limpieza de bandejas de germinación", "", "PER-004", "Baja", "Completada", d(-3), "Producción", "Lavado y desinfección con hipoclorito.", { completada: dh(-3, "15:10") }),
  ];

  const inventario = [
    { id: "INV-001", nombre: "Sustrato turba (bulto 70 L)", categoria: "Sustratos", stock: 18, minimo: 25, unidad: "bultos", precio: 48000 },
    { id: "INV-002", nombre: "Bandeja de 128 alvéolos", categoria: "Envases", stock: 146, minimo: 60, unidad: "unidades", precio: 2400 },
    { id: "INV-003", nombre: "Bolsa vivero 17×23 cm", categoria: "Envases", stock: 1250, minimo: 500, unidad: "unidades", precio: 95 },
    { id: "INV-004", nombre: "Fertilizante foliar NPK", categoria: "Fertilizantes", stock: 42, minimo: 15, unidad: "litros", precio: 32000 },
    { id: "INV-005", nombre: "Semilla de tomate chonto", categoria: "Semillas", stock: 3, minimo: 4, unidad: "sobres", precio: 18500 },
    { id: "INV-006", nombre: "Fungicida preventivo", categoria: "Fitosanitarios", stock: 6, minimo: 5, unidad: "litros", precio: 58000 },
    { id: "INV-007", nombre: "Cal dolomita", categoria: "Fertilizantes", stock: 120, minimo: 50, unidad: "kilogramos", precio: 900 },
    { id: "INV-008", nombre: "Tijera de poda", categoria: "Herramientas", stock: 7, minimo: 4, unidad: "unidades", precio: 38000 },
  ];
  const precio = Object.fromEntries(inventario.map((i) => [i.id, i]));

  const mov = (id, itemId, tipo, cantidad, fecha, motivo, loteCodigo = "", responsableId = "PER-002") => ({
    id,
    itemId,
    item: precio[itemId].nombre,
    tipo,
    cantidad,
    fecha,
    motivo,
    lote: loteCodigo,
    responsableId,
    valor: cantidad * precio[itemId].precio,
  });

  const movimientos = [
    mov("MOV-001", "INV-001", "salida", 3, d(-58), "Llenado de bandejas", "LT-2026-009", "PER-003"),
    mov("MOV-002", "INV-001", "salida", 2, d(-66), "Llenado de bandejas", "LT-2026-011", "PER-003"),
    mov("MOV-003", "INV-002", "salida", 4, d(-66), "Siembra en bandeja", "LT-2026-011", "PER-003"),
    mov("MOV-004", "INV-004", "entrada", 20, d(-40), "Compra a Agroinsumos del Cauca"),
    mov("MOV-005", "INV-003", "salida", 380, d(-34), "Trasplante de injertos a bolsa", "LT-2026-013", "PER-005"),
    mov("MOV-006", "INV-001", "salida", 3, d(-26), "Llenado de bandejas", "LT-2026-015", "PER-003"),
    mov("MOV-007", "INV-003", "entrada", 1000, d(-20), "Compra a Plásticos del Sur"),
    mov("MOV-008", "INV-004", "salida", 6, d(-12), "Fertilización de colinos", "LT-2026-012", "PER-004"),
    mov("MOV-009", "INV-001", "salida", 1, d(-6), "Llenado de bandejas de germinación", "LT-2026-017", "PER-004"),
    mov("MOV-010", "INV-006", "salida", 1, d(-5), "Control preventivo de volcamiento", "LT-2026-017", "PER-004"),
    mov("MOV-011", "INV-004", "salida", 3, d(-1), "Fertilización foliar", "LT-2026-015", "PER-003"),
  ];

  const costo = (id, tipo, concepto, categoria, valor, fecha, loteCodigo = "", extra = {}) => ({
    id,
    tipo,
    concepto,
    categoria,
    valor,
    fecha,
    lote: loteCodigo,
    ...extra,
  });

  const costosInventario = movimientos
    .filter((m) => m.tipo === "salida" && m.lote)
    .map((m, i) =>
      costo(`CST-I${String(i + 1).padStart(2, "0")}`, "gasto", `${m.item} (${m.cantidad} ${precio[m.itemId].unidad})`, "Insumos", m.valor, m.fecha, m.lote, {
        origen: "inventario",
        movimientoId: m.id,
      }),
    );

  const costos = [
    ...costosInventario,
    costo("CST-001", "gasto", "Mezcla de sustrato y bolsas para colinos", "Insumos", 540000, d(-128), "LT-2026-012"),
    costo("CST-002", "gasto", "Jornales de llenado y siembra de café", "Mano de obra", 620000, d(-120), "LT-2026-012"),
    costo("CST-003", "gasto", "Patrones e injertación de aguacate", "Mano de obra", 1140000, d(-36), "LT-2026-013"),
    costo("CST-004", "gasto", "Jornales de siembra y tutorado", "Mano de obra", 180000, d(-60), "LT-2026-011"),
    costo("CST-005", "gasto", "Jornales de siembra", "Mano de obra", 120000, d(-56), "LT-2026-009"),
    costo("CST-006", "gasto", "Jornales de siembra", "Mano de obra", 90000, d(-25), "LT-2026-015"),
    costo("CST-007", "gasto", "Semilla y siembra de pimentón", "Insumos", 108000, d(-19), "LT-2026-016"),
    costo("CST-008", "gasto", "Energía y agua del mes", "Servicios", 420000, d(-95)),
    costo("CST-009", "gasto", "Energía y agua del mes", "Servicios", 435000, d(-65)),
    costo("CST-010", "gasto", "Energía y agua del mes", "Servicios", 448000, d(-35)),
    costo("CST-011", "gasto", "Energía y agua del mes", "Servicios", 452000, d(-5)),
    costo("CST-012", "gasto", "Transporte de insumos desde Popayán", "Transporte", 85000, d(-40)),
    costo("CST-013", "gasto", "Reparación de la bomba de riego", "Mantenimiento", 260000, d(-15)),
    costo("CST-014", "ingreso", "Venta de 846 plántulas de lechuga", "Venta de plantas", 380700, d(-10), "LT-2026-009"),
    costo("CST-015", "ingreso", "Anticipo por colinos de café", "Anticipo", 600000, d(-15), "LT-2026-012"),
    costo("CST-016", "ingreso", "Venta de excedente de plántulas", "Venta de plantas", 210000, d(-44)),
    costo("CST-017", "ingreso", "Venta de colinos de temporada anterior", "Venta de plantas", 1450000, d(-88)),
    costo("CST-018", "ingreso", "Anticipo pedido de tomate", "Anticipo", 150000, d(-8), "LT-2026-011"),
  ];

  const incidencia = (codigo, loteCodigo, prioridad, descripcion, responsableId, estado, accion, fecha, extra = {}) => ({
    id: codigo,
    codigo,
    lote: loteCodigo,
    prioridad,
    descripcion,
    responsableId,
    reportadoPor: responsableId,
    estado,
    accion,
    fecha,
    ...extra,
  });

  const calidad = [
    incidencia("INC-028", "LT-2026-015", "Baja", "Bandejas deterioradas en la mesa 3", "PER-003", "Cerrada", "Se reemplazaron 12 bandejas y se trasplantaron las plántulas afectadas.", d(-20), { cierre: d(-18) }),
    incidencia("INC-030", "LT-2026-016", "Media", "Crecimiento irregular entre bandejas del mismo lote", "PER-005", "En revisión", "Revisar la uniformidad del riego por goteo y del sustrato.", d(-3)),
    incidencia("INC-031", "LT-2026-011", "Alta", "Hojas amarillas en el tercio inferior de las plantas", "PER-003", "Abierta", "", d(-1)),
    incidencia("INC-032", "LT-2026-017", "Alta", "Volcamiento (damping-off) en 3 bandejas", "PER-004", "Abierta", "Retirar bandejas afectadas y aplicar fungicida preventivo.", d(0)),
  ];

  const ev = (id, loteCodigo, evento, fecha, responsableId, detalle, origen = "Manual") => ({
    id,
    lote: loteCodigo,
    evento,
    fecha,
    responsableId,
    responsable: NOMBRE[responsableId],
    detalle,
    origen,
  });

  const trazabilidad = [
    ev("TRZ-001", "LT-2026-012", "Registro de lote", dh(-128, "08:00"), "PER-002", "Lote creado: 2.400 colinos de café Castillo en Umbráculo.", "Producción"),
    ev("TRZ-002", "LT-2026-012", "Cambio de etapa", dh(-100, "09:15"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-003", "LT-2026-012", "Cambio de etapa", dh(-70, "09:30"), "PER-002", "Pasa de Adaptación a Desarrollo.", "Producción"),
    ev("TRZ-004", "LT-2026-012", "Consumo de insumo", dh(-12, "07:40"), "PER-004", "Salida de 6 litros de Fertilizante foliar NPK.", "Inventario"),
    ev("TRZ-005", "LT-2026-012", "Riego", dh(-2, "06:50"), "PER-004", "Riego por aspersión de 20 minutos.", "Manual"),
    ev("TRZ-010", "LT-2026-011", "Registro de lote", dh(-66, "08:10"), "PER-002", "Lote creado: 450 plantas de tomate chonto en Invernadero 1.", "Producción"),
    ev("TRZ-011", "LT-2026-011", "Consumo de insumo", dh(-66, "09:00"), "PER-003", "Salida de 2 bultos de sustrato y 4 bandejas.", "Inventario"),
    ev("TRZ-012", "LT-2026-011", "Cambio de etapa", dh(-54, "10:00"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-013", "LT-2026-011", "Cambio de etapa", dh(-38, "10:20"), "PER-002", "Pasa de Adaptación a Desarrollo.", "Producción"),
    ev("TRZ-014", "LT-2026-011", "Fertilización", dh(-20, "07:30"), "PER-003", "Aplicación edáfica de NPK en todas las camas.", "Manual"),
    ev("TRZ-015", "LT-2026-011", "Cambio de etapa", dh(-4, "11:00"), "PER-002", "Pasa de Desarrollo a Cosecha. 420 plantas vivas de 450.", "Producción"),
    ev("TRZ-016", "LT-2026-011", "Incidencia", dh(-1, "08:45"), "PER-003", "INC-031 · Hojas amarillas en el tercio inferior de las plantas.", "Calidad"),
    ev("TRZ-020", "LT-2026-009", "Registro de lote", dh(-58, "08:00"), "PER-002", "Lote creado: 900 plántulas de lechuga crespa en Invernadero 2.", "Producción"),
    ev("TRZ-021", "LT-2026-009", "Cambio de etapa", dh(-48, "09:00"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-022", "LT-2026-009", "Cambio de etapa", dh(-35, "09:00"), "PER-002", "Pasa de Adaptación a Desarrollo.", "Producción"),
    ev("TRZ-023", "LT-2026-009", "Cambio de etapa", dh(-14, "09:00"), "PER-002", "Pasa de Desarrollo a Cosecha.", "Producción"),
    ev("TRZ-024", "LT-2026-009", "Despacho", dh(-10, "14:30"), "PER-002", "Lote cerrado: 846 plantas despachadas a Agroinsumos El Tambo.", "Producción"),
    ev("TRZ-030", "LT-2026-013", "Registro de lote", dh(-34, "08:00"), "PER-002", "Lote creado: 380 injertos de aguacate Hass en Umbráculo.", "Producción"),
    ev("TRZ-031", "LT-2026-013", "Trasplante", dh(-34, "10:30"), "PER-005", "Injertos trasplantados a bolsa 17×23.", "Manual"),
    ev("TRZ-032", "LT-2026-013", "Cambio de etapa", dh(-20, "09:00"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-033", "LT-2026-013", "Inspección", dh(-7, "11:15"), "PER-005", "Prendimiento del 97,6 %: 9 injertos perdidos.", "Manual"),
    ev("TRZ-040", "LT-2026-015", "Registro de lote", dh(-26, "08:00"), "PER-002", "Lote creado: 900 plántulas de lechuga crespa en Invernadero 2.", "Producción"),
    ev("TRZ-041", "LT-2026-015", "Cambio de etapa", dh(-18, "09:00"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-042", "LT-2026-015", "Incidencia", dh(-20, "16:00"), "PER-003", "INC-028 · Bandejas deterioradas en la mesa 3.", "Calidad"),
    ev("TRZ-043", "LT-2026-015", "Cierre de incidencia", dh(-18, "12:00"), "PER-002", "INC-028 cerrada: se reemplazaron 12 bandejas.", "Calidad"),
    ev("TRZ-044", "LT-2026-015", "Cambio de etapa", dh(-8, "09:00"), "PER-002", "Pasa de Adaptación a Desarrollo.", "Producción"),
    ev("TRZ-045", "LT-2026-015", "Tarea completada", dh(-1, "10:40"), "PER-003", "Aplicar fertilizante foliar: dosis de 3 ml por litro.", "Personal"),
    ev("TRZ-050", "LT-2026-016", "Registro de lote", dh(-19, "08:00"), "PER-002", "Lote creado: 300 plantas de pimentón en Invernadero 1.", "Producción"),
    ev("TRZ-051", "LT-2026-016", "Cambio de etapa", dh(-9, "09:00"), "PER-002", "Pasa de Germinación a Adaptación.", "Producción"),
    ev("TRZ-052", "LT-2026-016", "Incidencia", dh(-3, "15:20"), "PER-005", "INC-030 · Crecimiento irregular entre bandejas del mismo lote.", "Calidad"),
    ev("TRZ-060", "LT-2026-017", "Registro de lote", dh(-6, "07:30"), "PER-002", "Lote creado: 640 semillas de cilantro en Área de germinación.", "Producción"),
    ev("TRZ-061", "LT-2026-017", "Consumo de insumo", dh(-6, "08:00"), "PER-004", "Salida de 1 bulto de sustrato turba.", "Inventario"),
    ev("TRZ-062", "LT-2026-017", "Aplicación fitosanitaria", dh(-5, "07:00"), "PER-004", "Fungicida preventivo en todas las bandejas.", "Inventario"),
    ev("TRZ-063", "LT-2026-017", "Incidencia", dh(0, "07:20"), "PER-004", "INC-032 · Volcamiento (damping-off) en 3 bandejas.", "Calidad"),
  ];

  return {
    personas: PERSONAS_SEMILLA,
    zonas: ZONAS,
    lotes,
    tareas,
    inventario,
    movimientos,
    costos,
    calidad,
    ambiental: lecturasAmbientales(),
    trazabilidad,
    configuracion: { ...CONFIG_INICIAL },
  };
}

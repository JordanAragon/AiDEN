import { ETAPAS } from "./catalogos";
import {
  alertas,
  cargaPorPersona,
  describirLectura,
  estadoIncidencia,
  evaluarLectura,
  lotesActivos,
  nombrePersona,
  resumenLote,
  ultimasLecturas,
} from "./selectores";
import { dinero, diasEntre, fechaCorta, haceTiempo, hoyISO, normalizar, numero, plural } from "../utilidades/formato";

/*
  Asistente por reglas. No genera texto con un modelo de lenguaje: identifica la
  intención con palabras clave y responde con cálculos sobre los datos locales.
  Cada respuesta declara su fuente para que se pueda verificar en el módulo.
*/

export const SUGERENCIAS = [
  "¿Qué requiere atención hoy?",
  "¿Qué lotes salen pronto?",
  "¿Cuánto cuesta cada planta por lote?",
  "¿Qué insumos hay que comprar?",
  "¿Quién tiene más carga?",
  "¿Cómo está el ambiente?",
  "¿Qué incidencias siguen abiertas?",
];

function atencion(datos, sesion) {
  const lista = alertas(datos, sesion);
  if (!lista.length) {
    return { texto: "No hay nada urgente: sin incidencias altas abiertas, zonas fuera de rango, insumos bajo mínimo ni tareas vencidas.", items: [], fuente: "Alertas de Calidad, Ambiental, Inventario y Personal" };
  }
  const criticas = lista.filter((a) => a.severidad === "critico").length;
  return {
    texto: `Hay ${plural(lista.length, "asunto abierto", "asuntos abiertos")}${criticas ? `, ${criticas} crítico${criticas === 1 ? "" : "s"}` : ""}. Empieza por los primeros: están ordenados por severidad.`,
    items: lista.slice(0, 8).map((a) => ({ texto: `${a.titulo}. ${a.detalle}`, ruta: a.ruta, lote: a.lote, etiqueta: a.tipo })),
    fuente: "Alertas de Calidad, Ambiental, Inventario y Personal",
  };
}

function salidas(datos) {
  const activos = lotesActivos(datos.lotes).filter((l) => l.fechaEstimada);
  if (!activos.length) return { texto: "Ningún lote activo tiene fecha de salida estimada.", items: [], fuente: "Producción" };
  const orden = [...activos].sort((a, b) => (a.fechaEstimada < b.fechaEstimada ? -1 : 1));
  const proximos = orden.filter((l) => diasEntre(hoyISO(), l.fechaEstimada) <= 30);
  const lista = proximos.length ? proximos : orden.slice(0, 3);
  return {
    texto: proximos.length
      ? `${plural(proximos.length, "lote sale", "lotes salen")} en los próximos 30 días.`
      : "Ningún lote sale en los próximos 30 días. Estos son los más cercanos:",
    items: lista.map((l) => {
      const d = diasEntre(hoyISO(), l.fechaEstimada);
      return {
        lote: l.lote,
        texto: `${l.cultivo}: ${numero(l.cantidad)} plantas en ${l.etapa}. ${d < 0 ? `Atrasado ${-d} días` : d === 0 ? "Sale hoy" : `Sale el ${fechaCorta(l.fechaEstimada)} (en ${d} días)`}.${l.etapa !== "Cosecha" && d <= 7 ? " Todavía no está en Cosecha." : ""}`,
      };
    }),
    fuente: "Producción (salida estimada de cada lote)",
  };
}

function costos(datos) {
  const activos = lotesActivos(datos.lotes).map((l) => ({ l, r: resumenLote(l, datos) }));
  if (!activos.length) return { texto: "No hay lotes activos para calcular su costo.", items: [], fuente: "Costos" };
  const orden = [...activos].sort((a, b) => b.r.costoPlanta - a.r.costoPlanta);
  const plantas = activos.reduce((s, x) => s + x.r.plantas, 0);
  const gasto = activos.reduce((s, x) => s + x.r.gasto, 0);
  return {
    texto: `El costo promedio acumulado es ${dinero(plantas ? gasto / plantas : 0)} por planta viva. El más alto es ${orden[0].l.lote}; el costo baja si sobreviven más plantas o se reparten gastos generales.`,
    items: orden.map(({ l, r }) => ({ lote: l.lote, texto: `${l.cultivo}: ${dinero(r.costoPlanta)} por planta (${dinero(r.gasto)} entre ${numero(r.plantas)} plantas, ${numero(r.supervivencia)} % de supervivencia).` })),
    fuente: "Costos asociados a cada lote ÷ plantas vivas en Producción",
  };
}

function insumos(datos) {
  const bajos = datos.inventario.filter((i) => Number(i.stock) <= Number(i.minimo));
  const consumo = new Map();
  const desde = hoyISO().slice(0, 7);
  for (const m of datos.movimientos) if (m.tipo === "salida" && String(m.fecha) >= `${desde}-01`) consumo.set(m.itemId, (consumo.get(m.itemId) || 0) + Number(m.cantidad));
  if (!bajos.length) {
    return { texto: "Ningún insumo está en o por debajo del mínimo. No hay compras urgentes.", items: [], fuente: "Inventario" };
  }
  return {
    texto: `${plural(bajos.length, "insumo está", "insumos están")} en o por debajo del mínimo. La cantidad sugerida lleva el stock al doble del mínimo.`,
    items: bajos.map((i) => {
      const sugerido = Math.max(1, Number(i.minimo) * 2 - Number(i.stock));
      return {
        ruta: `/inventario?insumo=${i.id}`,
        texto: `${i.nombre}: quedan ${numero(i.stock)} ${i.unidad} (mínimo ${numero(i.minimo)}). Comprar ${numero(sugerido)} ≈ ${dinero(sugerido * Number(i.precio || 0))}.${consumo.get(i.id) ? ` Este mes se han usado ${numero(consumo.get(i.id))}.` : ""}`,
      };
    }),
    fuente: "Inventario (stock, mínimo y precio unitario)",
  };
}

function carga(datos) {
  const lista = cargaPorPersona(datos).sort((a, b) => b.vencidas - a.vencidas || b.abiertas - a.abiertas);
  if (!lista.length) return { texto: "No hay personas activas con tareas.", items: [], fuente: "Personal" };
  const menos = [...lista].sort((a, b) => a.abiertas - b.abiertas)[0];
  return {
    texto: `${lista[0].persona.nombre} tiene la mayor carga. Si hay que reasignar, ${menos.persona.nombre} es quien tiene menos tareas abiertas (${menos.abiertas}).`,
    items: lista.map((c) => ({
      ruta: `/personal?persona=${c.persona.id}`,
      texto: `${c.persona.nombre} (${c.persona.cargo.toLowerCase()}): ${plural(c.abiertas, "tarea abierta", "tareas abiertas")}${c.vencidas ? `, ${c.vencidas} vencida${c.vencidas === 1 ? "" : "s"}` : ""} y ${plural(c.lotes, "lote", "lotes")} a cargo.`,
    })),
    fuente: "Tareas y lotes asignados en Personal y Producción",
  };
}

function ambiente(datos) {
  const cfg = datos.configuracion;
  const ultimas = ultimasLecturas(datos.ambiental);
  const items = datos.zonas.map((z) => {
    const l = ultimas.get(z.nombre);
    if (!l) return { texto: `${z.nombre}: sin lecturas.`, ruta: `/ambiental?zona=${encodeURIComponent(z.nombre)}` };
    const e = evaluarLectura(l, cfg);
    return {
      ruta: `/ambiental?zona=${encodeURIComponent(z.nombre)}`,
      etiqueta: e.fuera ? "Fuera de rango" : undefined,
      texto: `${z.nombre}: ${numero(l.temperatura)} °C y ${numero(l.humedad)} % ${haceTiempo(l.fecha)}${e.fuera ? `, ${describirLectura(l, cfg)}` : ", en rango"}.`,
    };
  });
  const fuera = items.filter((i) => i.etiqueta).length;
  return {
    texto: fuera ? `${plural(fuera, "zona está", "zonas están")} fuera del rango ${cfg.tempMin}–${cfg.tempMax} °C / ${cfg.humMin}–${cfg.humMax} %.` : `Todas las zonas están en rango (${cfg.tempMin}–${cfg.tempMax} °C, ${cfg.humMin}–${cfg.humMax} %).`,
    items,
    fuente: "Última lectura por zona en Ambiental y rango de Configuración",
  };
}

function calidad(datos) {
  const abiertas = datos.calidad.filter((i) => estadoIncidencia(i) !== "Cerrada").sort((a, b) => ["Alta", "Media", "Baja"].indexOf(a.prioridad) - ["Alta", "Media", "Baja"].indexOf(b.prioridad));
  if (!abiertas.length) return { texto: "No hay incidencias abiertas.", items: [], fuente: "Calidad" };
  return {
    texto: `${plural(abiertas.length, "incidencia sigue abierta", "incidencias siguen abiertas")}. ${abiertas.filter((i) => !i.accion).length ? `${plural(abiertas.filter((i) => !i.accion).length, "no tiene", "no tienen")} acción correctiva definida.` : "Todas tienen un plan de acción."}`,
    items: abiertas.map((i) => ({
      ruta: `/calidad?incidencia=${i.id}`,
      lote: i.lote,
      etiqueta: i.prioridad,
      texto: `${i.codigo}: ${i.descripcion}. ${estadoIncidencia(i)} hace ${plural(diasEntre(i.fecha), "día")}, a cargo de ${nombrePersona(datos.personas, i.responsableId)}.`,
    })),
    fuente: "Calidad",
  };
}

function lote(datos, codigo) {
  const l = datos.lotes.find((x) => x.lote === codigo);
  if (!l) return { texto: `No encontré el lote ${codigo}. Revisa el código en Producción.`, items: [], fuente: "Producción" };
  const r = resumenLote(l, datos);
  const ultimo = r.eventos[0];
  const items = [
    { texto: `${numero(r.plantas)} plantas vivas de ${numero(r.inicial)} sembradas (${numero(r.supervivencia)} %).` },
    { texto: `Costo acumulado ${dinero(r.gasto)}: ${dinero(r.costoPlanta)} por planta.${r.ingreso ? ` Ingresos ${dinero(r.ingreso)}.` : ""}` },
    { texto: r.incidenciasAbiertas.length ? `Incidencias abiertas: ${r.incidenciasAbiertas.map((i) => `${i.codigo} (${i.descripcion.toLowerCase()})`).join("; ")}.` : "Sin incidencias abiertas." },
    { texto: r.tareasAbiertas.length ? `${plural(r.tareasAbiertas.length, "tarea abierta", "tareas abiertas")}: ${r.tareasAbiertas.map((t) => t.titulo).join("; ")}.` : "Sin tareas abiertas." },
  ];
  if (ultimo) items.push({ texto: `Último registro: ${ultimo.evento.toLowerCase()} ${haceTiempo(ultimo.fecha)} por ${ultimo.responsable}.`, ruta: `/trazabilidad?lote=${l.lote}` });
  return {
    texto: `${l.lote} es ${l.cultivo.toLowerCase()} en ${l.estado === "Cerrado" ? `estado cerrado (${(l.motivoCierre || "").toLowerCase()})` : `${l.etapa} (etapa ${ETAPAS.indexOf(l.etapa) + 1} de 4)`}, en ${l.ubicacion}, a cargo de ${nombrePersona(datos.personas, l.responsableId)}.`,
    items,
    lote: l.lote,
    fuente: "Ficha del lote: Producción, Costos, Calidad, Personal y Trazabilidad",
  };
}

const INTENCIONES = [
  { claves: ["atencion", "urgente", "hoy", "alerta", "prioridad", "pendiente", "resumen"], responder: atencion },
  { claves: ["sale", "salen", "salida", "despacho", "despachar", "cosecha", "pronto", "entrega"], responder: salidas },
  { claves: ["costo", "cuesta", "planta", "rentab", "gasto", "ingreso", "resultado", "dinero", "margen"], responder: costos },
  { claves: ["insumo", "comprar", "compra", "inventario", "stock", "reponer", "bodega"], responder: insumos },
  { claves: ["carga", "equipo", "quien", "operario", "reasign", "trabajo"], responder: carga },
  { claves: ["ambiente", "temperatura", "humedad", "clima", "zona", "invernadero", "calor"], responder: ambiente },
  { claves: ["incidencia", "calidad", "problema", "plaga", "enfermedad", "hongo"], responder: calidad },
];

export function responder(pregunta, datos, sesion) {
  const codigo = String(pregunta).toUpperCase().match(/LT-\d{4}-\d{3,}/)?.[0];
  if (codigo) return lote(datos, codigo);
  const texto = normalizar(pregunta);
  const puntajes = INTENCIONES.map((i) => ({ i, puntos: i.claves.filter((c) => texto.includes(c)).length })).sort((a, b) => b.puntos - a.puntos);
  if (puntajes[0].puntos > 0) return puntajes[0].i.responder(datos, sesion);
  return {
    texto: "No tengo una regla para responder eso. Puedo contestar sobre prioridades del día, salidas de lotes, costo por planta, compras de insumos, carga del equipo, ambiente por zona, incidencias abiertas o un lote específico si escribes su código (por ejemplo LT-2026-011).",
    items: [],
    sinRegla: true,
    fuente: null,
  };
}

export function lotesSugeridos(datos) {
  return lotesActivos(datos.lotes)
    .map((l) => ({ l, abiertas: datos.calidad.filter((i) => i.lote === l.lote && estadoIncidencia(i) !== "Cerrada").length }))
    .sort((a, b) => b.abiertas - a.abiertas)
    .slice(0, 1)
    .map(({ l }) => `¿Cómo va ${l.lote}?`);
}


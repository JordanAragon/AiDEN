import { ETAPAS } from "./catalogos";
import {
  alertas,
  cargaPorPersona,
  describirLectura,
  estadoIncidencia,
  evaluarLectura,
  lecturaVencida,
  lotesActivos,
  nombrePersona,
  resumenLote,
  resumenMensual,
  ultimasLecturas,
} from "./selectores";
import { dinero, diasEntre, fechaCorta, haceTiempo, hoyISO, normalizar, numero, plural, cantidadConUnidad } from "../utilidades/formato";

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
  "¿Cuál es el balance del mes?",
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
  // Los lotes sin plantas vivas van al final: su costo por planta no existe.
  const orden = [...activos].sort((a, b) => (b.r.costoPlanta ?? -1) - (a.r.costoPlanta ?? -1));
  const plantas = activos.reduce((s, x) => s + x.r.plantas, 0);
  const gasto = activos.reduce((s, x) => s + x.r.gasto, 0);
  if (!plantas) return { texto: `Los lotes activos no tienen plantas vivas: hay ${dinero(gasto)} de gastos sin plantas a las que repartirlos.`, items: [], fuente: "Costos y Producción" };
  return {
    texto: `El costo promedio acumulado es ${dinero(gasto / plantas)} por planta viva. El más alto es ${orden[0].l.lote}; el costo baja si sobreviven más plantas o se reparten gastos generales.`,
    items: orden.map(({ l, r }) => ({
      lote: l.lote,
      texto:
        r.costoPlanta === null
          ? `${l.cultivo}: sin plantas vivas; ${dinero(r.gasto)} de gastos que ya no se recuperan por planta.`
          : `${l.cultivo}: ${dinero(r.costoPlanta)} por planta (${dinero(r.gasto)} entre ${numero(r.plantas)} plantas, ${numero(r.supervivencia)} % de supervivencia).`,
    })),
    fuente: "Costos asociados a cada lote ÷ plantas vivas en Producción",
  };
}

function balance(datos) {
  const meses = resumenMensual(datos.costos, 3);
  const mes = meses[meses.length - 1];
  const anterior = meses[meses.length - 2];
  return {
    texto:
      mes.balance < 0
        ? `En ${mes.mes} los gastos superan los ingresos en ${dinero(-mes.balance)} (${dinero(mes.gastos)} de gastos y ${dinero(mes.ingresos)} de ingresos).`
        : `En ${mes.mes} los ingresos superan los gastos en ${dinero(mes.balance)} (${dinero(mes.ingresos)} de ingresos y ${dinero(mes.gastos)} de gastos).`,
    items: meses.map((m) => ({ texto: `${m.mes}: ingresos ${dinero(m.ingresos)}, gastos ${dinero(m.gastos)}, balance ${dinero(m.balance)}.`, ruta: "/costos" })),
    fuente: anterior ? "Costos (movimientos de los últimos tres meses)" : "Costos",
  };
}

function plantasEnProduccion(datos) {
  const activos = lotesActivos(datos.lotes).map((l) => ({ l, r: resumenLote(l, datos) }));
  if (!activos.length) return { texto: "No hay lotes activos.", items: [], fuente: "Producción" };
  const vivas = activos.reduce((s, x) => s + x.r.plantas, 0);
  const sembradas = activos.reduce((s, x) => s + x.r.inicial, 0);
  return {
    texto: `Hay ${numero(vivas)} plantas vivas en ${plural(activos.length, "lote activo", "lotes activos")}, de ${numero(sembradas)} sembradas (${numero(sembradas ? Math.round((vivas / sembradas) * 1000) / 10 : 100)} % de supervivencia).`,
    items: [...activos]
      .sort((a, b) => a.r.supervivencia - b.r.supervivencia)
      .map(({ l, r }) => ({ lote: l.lote, texto: `${l.cultivo}: ${numero(r.plantas)} de ${numero(r.inicial)} (${numero(r.supervivencia)} %), en ${l.etapa}.` })),
    fuente: "Producción (plantas vivas y sembradas por lote)",
  };
}

function insumos(datos) {
  const bajos = datos.inventario.filter((i) => Number(i.minimo) > 0 && Number(i.stock) <= Number(i.minimo));
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
        texto: `${i.nombre}: quedan ${cantidadConUnidad(i.stock, i.unidad)} (mínimo ${numero(i.minimo)}). Comprar ${numero(sugerido)} ≈ ${dinero(sugerido * Number(i.precio || 0))}.${consumo.get(i.id) ? ` Este mes se han usado ${numero(consumo.get(i.id))}.` : ""}`,
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
    if (!l) return { texto: `${z.nombre}: sin lecturas.`, etiqueta: "Sin datos", ruta: `/ambiental?zona=${encodeURIComponent(z.nombre)}` };
    if (lecturaVencida(l)) return { texto: `${z.nombre}: la última lectura es de ${haceTiempo(l.fecha)}; no se sabe si sigue en rango.`, etiqueta: "Sin datos", ruta: `/ambiental?zona=${encodeURIComponent(z.nombre)}` };
    const e = evaluarLectura(l, cfg);
    return {
      ruta: `/ambiental?zona=${encodeURIComponent(z.nombre)}`,
      etiqueta: e.fuera ? "Fuera de rango" : undefined,
      texto: `${z.nombre}: ${numero(l.temperatura)} °C y ${numero(l.humedad)} % ${haceTiempo(l.fecha)}${e.fuera ? `, ${describirLectura(l, cfg)}` : ", en rango"}.`,
    };
  });
  const fuera = items.filter((i) => i.etiqueta === "Fuera de rango").length;
  const sinDatos = items.filter((i) => i.etiqueta === "Sin datos").length;
  const resumen = fuera
    ? `${plural(fuera, "zona está", "zonas están")} fuera del rango ${cfg.tempMin}–${cfg.tempMax} °C / ${cfg.humMin}–${cfg.humMax} %.`
    : sinDatos === items.length
      ? "No hay lecturas recientes en ninguna zona: registra una para saber cómo está el ambiente."
      : `Las zonas con lectura reciente están en rango (${cfg.tempMin}–${cfg.tempMax} °C, ${cfg.humMin}–${cfg.humMax} %).`;
  return {
    texto: sinDatos && sinDatos < items.length ? `${resumen} ${plural(sinDatos, "zona no tiene", "zonas no tienen")} lectura reciente.` : resumen,
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
    { texto: `Costo acumulado ${dinero(r.gasto)}${r.costoPlanta === null ? ", sin plantas vivas" : `: ${dinero(r.costoPlanta)} por planta`}.${r.ingreso ? ` Ingresos ${dinero(r.ingreso)}.` : ""}` },
    { texto: r.incidenciasAbiertas.length ? `Incidencias abiertas: ${r.incidenciasAbiertas.map((i) => `${i.codigo} (${i.descripcion.toLowerCase()})`).join("; ")}.` : "Sin incidencias abiertas." },
    { texto: r.tareasAbiertas.length ? `${plural(r.tareasAbiertas.length, "tarea abierta", "tareas abiertas")}: ${r.tareasAbiertas.map((t) => t.titulo).join("; ")}.` : "Sin tareas abiertas." },
  ];
  if (ultimo) items.push({ texto: `Último registro: ${ultimo.evento.toLowerCase()} ${haceTiempo(ultimo.fecha)} por ${ultimo.responsable}.`, ruta: `/trazabilidad?lote=${encodeURIComponent(l.lote)}` });
  return {
    texto: `${l.lote} es ${l.cultivo} en ${l.estado === "Cerrado" ? `estado cerrado (${(l.motivoCierre || "").toLowerCase()})` : `${l.etapa} (etapa ${ETAPAS.indexOf(l.etapa) + 1} de 4)`}, en ${l.ubicacion}, a cargo de ${nombrePersona(datos.personas, l.responsableId)}.`,
    items,
    lote: l.lote,
    fuente: "Ficha del lote: Producción, Costos, Calidad, Personal y Trazabilidad",
  };
}

/*
  Cada clave es la raíz de una palabra completa (no una subcadena cualquiera) con su
  peso: los términos del dominio pesan 2 y las palabras genéricas 1. Si dos
  intenciones empatan, se pide aclaración en vez de contestar otra pregunta.
*/
const INTENCIONES = [
  { nombre: "lo que requiere atención", ejemplo: "¿Qué requiere atención hoy?", claves: { atencion: 2, urgent: 2, alerta: 2, priorid: 2, pendient: 1, resumen: 1, revisar: 1 }, responder: atencion },
  { nombre: "las salidas de lotes", ejemplo: "¿Qué lotes salen pronto?", claves: { sale: 2, salid: 2, despach: 2, cosech: 1, pronto: 1, entreg: 2 }, responder: salidas },
  { nombre: "el costo por planta", ejemplo: "¿Cuánto cuesta cada planta por lote?", claves: { costo: 2, cuesta: 2, rentab: 2, margen: 2, gasto: 1 }, responder: costos },
  { nombre: "el balance del mes", ejemplo: "¿Cuál es el balance del mes?", claves: { balance: 2, resultado: 2, ganancia: 2, perdida: 1, utilidad: 2, ingreso: 2, gasto: 1, mes: 1, dinero: 1 }, responder: balance },
  { nombre: "las plantas en producción", ejemplo: "¿Cuántas plantas vivas hay?", claves: { viva: 2, superviv: 2, mortalidad: 2, planta: 1, cuanta: 1, sembrad: 1 }, responder: plantasEnProduccion },
  { nombre: "los insumos por comprar", ejemplo: "¿Qué insumos hay que comprar?", claves: { insumo: 2, compr: 2, inventario: 2, stock: 2, repon: 2, bodega: 2, existencia: 2, queda: 1 }, responder: insumos },
  { nombre: "la carga del equipo", ejemplo: "¿Quién tiene más carga?", claves: { carga: 2, reasign: 2, ocupad: 2, equipo: 1, quien: 1, trabajo: 1, operario: 1 }, responder: carga },
  { nombre: "el ambiente por zona", ejemplo: "¿Cómo está el ambiente?", claves: { ambiente: 2, temperatura: 2, humedad: 2, clima: 2, calor: 2, frio: 2, lectura: 2, zona: 1, invernadero: 1, rango: 1 }, responder: ambiente },
  { nombre: "las incidencias", ejemplo: "¿Qué incidencias siguen abiertas?", claves: { incidencia: 2, calidad: 2, plaga: 2, enfermedad: 2, hongo: 2, fitosanit: 2, problema: 1, reporto: 1 }, responder: calidad },
];

function puntuar(intencion, palabras, extra = 0) {
  let puntos = extra;
  for (const [raiz, peso] of Object.entries(intencion.claves)) {
    if (palabras.some((p) => p.startsWith(raiz))) puntos += peso;
  }
  return puntos;
}

export function responder(pregunta, datos, sesion) {
  const codigo = String(pregunta).toUpperCase().match(/LT-\d{4}-\d{3,}/)?.[0];
  if (codigo) return lote(datos, codigo);
  const palabras = normalizar(pregunta).split(/[^a-z0-9ñ]+/).filter(Boolean);
  // Nombrar un insumo concreto («¿cuánto sustrato queda?») es una pregunta de inventario.
  const nombraInsumo = datos.inventario.some((i) => normalizar(i.nombre).split(/\s+/).some((w) => w.length >= 5 && palabras.includes(w)));
  const puntajes = INTENCIONES.map((i) => ({ i, puntos: puntuar(i, palabras, i.responder === insumos && nombraInsumo ? 2 : 0) })).sort((a, b) => b.puntos - a.puntos);
  const [primera, segunda] = puntajes;
  if (primera.puntos > 0 && segunda.puntos === primera.puntos) {
    return {
      texto: `Tu pregunta puede referirse a ${primera.i.nombre} o a ${segunda.i.nombre}. Prueba con «${primera.i.ejemplo}» o «${segunda.i.ejemplo}».`,
      items: [],
      aclaracion: [primera.i.ejemplo, segunda.i.ejemplo],
      fuente: null,
    };
  }
  if (primera.puntos > 0) return primera.i.responder(datos, sesion);
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


import { indiceEtapa } from "./catalogos";
import { aFecha, diasEntre, fechaCorta, hoyISO, numero } from "../utilidades/formato";

export const estadoIncidencia = (incidencia) => incidencia?.estado ?? incidencia?.estadoManual ?? "Abierta";

export const esGestor = (sesion) => sesion?.role === "admin" || sesion?.role === "supervisor";

export function mapaPersonas(personas) {
  return new Map(personas.map((persona) => [persona.id, persona]));
}

export function nombrePersona(personas, id, respaldo = "Sin asignar") {
  return personas.find((persona) => persona.id === id)?.nombre || respaldo;
}

export function personasActivas(personas, cargos) {
  return personas.filter((p) => p.estado !== "Inactivo" && (!cargos || cargos.includes(p.cargo)));
}

export function lotesActivos(lotes) {
  return lotes.filter((lote) => lote.estado !== "Cerrado");
}

export function lotesVisibles(datos, sesion) {
  if (sesion?.role !== "operario") return datos.lotes;
  return datos.lotes.filter((lote) => lote.responsableId === sesion.personaId);
}

export function codigosVisibles(datos, sesion) {
  return new Set(lotesVisibles(datos, sesion).map((lote) => lote.lote));
}

export function zonasVisibles(datos, sesion) {
  if (sesion?.role !== "operario") return datos.zonas.map((zona) => zona.nombre);
  const propias = new Set(lotesActivos(lotesVisibles(datos, sesion)).map((lote) => lote.ubicacion));
  return datos.zonas.map((zona) => zona.nombre).filter((nombre) => propias.has(nombre));
}

export function tareasVisibles(datos, sesion) {
  if (sesion?.role !== "operario") return datos.tareas;
  return datos.tareas.filter((tarea) => tarea.responsableId === sesion.personaId);
}

export function incidenciasVisibles(datos, sesion) {
  if (sesion?.role !== "operario") return datos.calidad;
  const codigos = codigosVisibles(datos, sesion);
  return datos.calidad.filter((incidencia) => codigos.has(incidencia.lote) || incidencia.reportadoPor === sesion.personaId);
}

export function tareaVencida(tarea, hoy = hoyISO()) {
  return tarea.estado !== "Completada" && Boolean(tarea.fecha) && tarea.fecha < hoy;
}

export function tareaAbierta(tarea) {
  return tarea.estado !== "Completada";
}

export function ordenarTareas(tareas) {
  const peso = { Alta: 0, Media: 1, Baja: 2 };
  return [...tareas].sort((a, b) => {
    const abiertaA = a.estado === "Completada" ? 1 : 0;
    const abiertaB = b.estado === "Completada" ? 1 : 0;
    if (abiertaA !== abiertaB) return abiertaA - abiertaB;
    if ((a.fecha || "9") !== (b.fecha || "9")) return (a.fecha || "9") < (b.fecha || "9") ? -1 : 1;
    return (peso[a.prioridad] ?? 3) - (peso[b.prioridad] ?? 3);
  });
}

export function lecturasOrdenadas(ambiental) {
  return [...ambiental].sort((a, b) => aFecha(a.fecha) - aFecha(b.fecha));
}

export function ultimasLecturas(ambiental) {
  const porZona = new Map();
  for (const lectura of ambiental) {
    if (!lectura?.zona || !lectura?.fecha) continue;
    const actual = porZona.get(lectura.zona);
    if (!actual || aFecha(lectura.fecha) > aFecha(actual.fecha)) porZona.set(lectura.zona, lectura);
  }
  return porZona;
}

export function evaluarLectura(lectura, cfg) {
  if (!lectura) return { temperatura: null, humedad: null, fuera: false, desvio: 0 };
  const t = Number(lectura.temperatura);
  const h = Number(lectura.humedad);
  const temperatura = t > cfg.tempMax ? "alta" : t < cfg.tempMin ? "baja" : null;
  const humedad = h > cfg.humMax ? "alta" : h < cfg.humMin ? "baja" : null;
  const desvio = Math.max(t - cfg.tempMax, cfg.tempMin - t, (h - cfg.humMax) / 3, (cfg.humMin - h) / 3, 0);
  return { temperatura, humedad, fuera: Boolean(temperatura || humedad), desvio };
}

export function describirLectura(lectura, cfg) {
  const e = evaluarLectura(lectura, cfg);
  const partes = [];
  if (e.temperatura) partes.push(`temperatura ${e.temperatura} (${numero(lectura.temperatura)} °C)`);
  if (e.humedad) partes.push(`humedad ${e.humedad} (${numero(lectura.humedad)} %)`);
  return partes.join(" y ");
}

export function costosPorLote(costos) {
  const mapa = new Map();
  for (const costo of costos) {
    if (!costo.lote) continue;
    const actual = mapa.get(costo.lote) || { gasto: 0, ingreso: 0, movimientos: 0 };
    const valor = Number(costo.valor) || 0;
    if (costo.tipo === "ingreso") actual.ingreso += valor;
    else actual.gasto += valor;
    actual.movimientos += 1;
    mapa.set(costo.lote, actual);
  }
  for (const valor of mapa.values()) valor.resultado = valor.ingreso - valor.gasto;
  return mapa;
}

export function resumenLote(lote, datos) {
  const costos = costosPorLote(datos.costos).get(lote.lote) || { gasto: 0, ingreso: 0, resultado: 0, movimientos: 0 };
  const plantas = Number(lote.cantidad) || 0;
  const inicial = Number(lote.cantidadInicial) || plantas;
  const eventos = datos.trazabilidad
    .filter((evento) => evento.lote === lote.lote)
    .sort((a, b) => aFecha(b.fecha) - aFecha(a.fecha));
  const incidencias = datos.calidad.filter((incidencia) => incidencia.lote === lote.lote);
  const tareas = datos.tareas.filter((tarea) => tarea.lote === lote.lote);
  return {
    ...costos,
    plantas,
    inicial,
    supervivencia: inicial ? Math.round((plantas / inicial) * 1000) / 10 : 100,
    costoPlanta: plantas ? costos.gasto / plantas : 0,
    dias: diasEntre(lote.fecha),
    diasParaSalida: lote.fechaEstimada ? diasEntre(hoyISO(), lote.fechaEstimada) : null,
    avance: ((indiceEtapa(lote.etapa) + 1) / 4) * 100,
    eventos,
    incidencias,
    incidenciasAbiertas: incidencias.filter((i) => estadoIncidencia(i) !== "Cerrada"),
    tareas,
    tareasAbiertas: tareas.filter(tareaAbierta),
  };
}

export function resumenMensual(costos, meses = 4) {
  const hoy = new Date();
  const lista = [];
  for (let i = meses - 1; i >= 0; i -= 1) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    lista.push({
      clave,
      mes: fecha.toLocaleDateString("es-CO", { month: "short" }).replace(".", ""),
      ingresos: 0,
      gastos: 0,
    });
  }
  const indice = new Map(lista.map((item) => [item.clave, item]));
  for (const costo of costos) {
    const item = indice.get(String(costo.fecha).slice(0, 7));
    if (!item) continue;
    if (costo.tipo === "ingreso") item.ingresos += Number(costo.valor) || 0;
    else item.gastos += Number(costo.valor) || 0;
  }
  return lista.map((item) => ({ ...item, balance: item.ingresos - item.gastos }));
}

export function cargaPorPersona(datos) {
  const hoy = hoyISO();
  return personasActivas(datos.personas, ["Operario", "Supervisor"]).map((persona) => {
    const propias = datos.tareas.filter((tarea) => tarea.responsableId === persona.id);
    const abiertas = propias.filter(tareaAbierta);
    return {
      persona,
      total: propias.length,
      abiertas: abiertas.length,
      enCurso: abiertas.filter((t) => t.estado === "En curso").length,
      vencidas: abiertas.filter((t) => tareaVencida(t, hoy)).length,
      alta: abiertas.filter((t) => t.prioridad === "Alta").length,
      hoy: abiertas.filter((t) => t.fecha === hoy).length,
      completadas: propias.length - abiertas.length,
      lotes: lotesActivos(datos.lotes).filter((lote) => lote.responsableId === persona.id).length,
    };
  });
}

const PESO_SEVERIDAD = { critico: 0, alerta: 1 };

export function alertas(datos, sesion) {
  if (!sesion) return [];
  const cfg = datos.configuracion;
  const gestor = esGestor(sesion);
  const codigos = codigosVisibles(datos, sesion);
  const zonas = new Set(zonasVisibles(datos, sesion));
  const lista = [];

  for (const incidencia of incidenciasVisibles(datos, sesion)) {
    if (estadoIncidencia(incidencia) === "Cerrada" || incidencia.prioridad !== "Alta") continue;
    lista.push({
      id: `cal-${incidencia.id}`,
      tipo: "Calidad",
      severidad: "critico",
      titulo: `${incidencia.codigo} en ${incidencia.lote}`,
      detalle: incidencia.descripcion,
      ruta: `/calidad?incidencia=${incidencia.id}`,
      lote: incidencia.lote,
    });
  }

  for (const [zona, lectura] of ultimasLecturas(datos.ambiental)) {
    if (!zonas.has(zona)) continue;
    const evaluacion = evaluarLectura(lectura, cfg);
    if (!evaluacion.fuera) continue;
    lista.push({
      id: `amb-${lectura.id}`,
      tipo: "Ambiental",
      severidad: evaluacion.desvio >= 3 ? "critico" : "alerta",
      titulo: `${zona} fuera de rango`,
      detalle: `Última lectura: ${describirLectura(lectura, cfg)}.`,
      ruta: `/ambiental?zona=${encodeURIComponent(zona)}`,
      zona,
    });
  }

  if (gestor) {
    for (const insumo of datos.inventario) {
      if (Number(insumo.stock) > Number(insumo.minimo)) continue;
      lista.push({
        id: `inv-${insumo.id}`,
        tipo: "Inventario",
        severidad: Number(insumo.stock) <= 0 ? "critico" : "alerta",
        titulo: `${insumo.nombre} bajo el mínimo`,
        detalle: `Quedan ${numero(insumo.stock)} ${insumo.unidad}; el mínimo es ${numero(insumo.minimo)}.`,
        ruta: `/inventario?insumo=${insumo.id}`,
      });
    }
  }

  const hoy = hoyISO();
  for (const tarea of tareasVisibles(datos, sesion)) {
    if (!tareaVencida(tarea, hoy)) continue;
    const responsable = nombrePersona(datos.personas, tarea.responsableId);
    lista.push({
      id: `tsk-${tarea.id}`,
      tipo: "Tareas",
      severidad: tarea.prioridad === "Alta" ? "critico" : "alerta",
      titulo: `${tarea.titulo} está vencida`,
      detalle: gestor ? `${responsable} · venció el ${fechaCorta(tarea.fecha)}` : `Venció el ${fechaCorta(tarea.fecha)}`,
      ruta: sesion.role === "operario" ? "/dashboard-operario" : `/personal?vista=tareas&tarea=${tarea.id}`,
      lote: tarea.lote && codigos.has(tarea.lote) ? tarea.lote : undefined,
    });
  }

  return lista.sort((a, b) => PESO_SEVERIDAD[a.severidad] - PESO_SEVERIDAD[b.severidad]);
}

export function siguienteCodigo(prefijo, existentes, anio) {
  const patron = anio ? new RegExp(`^${prefijo}-${anio}-(\\d+)$`) : new RegExp(`^${prefijo}-(\\d+)$`);
  const maximo = existentes.reduce((max, codigo) => {
    const coincidencia = String(codigo).match(patron);
    return coincidencia ? Math.max(max, Number(coincidencia[1])) : max;
  }, 0);
  const numeroSiguiente = String(maximo + 1).padStart(3, "0");
  return anio ? `${prefijo}-${anio}-${numeroSiguiente}` : `${prefijo}-${numeroSiguiente}`;
}

export function diasAbierta(incidencia) {
  const fin = estadoIncidencia(incidencia) === "Cerrada" && incidencia.cierre ? incidencia.cierre : hoyISO();
  return diasEntre(incidencia.fecha, fin);
}

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Check, Lightbulb, MessageCircle, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { leerConfiguracion, leerDato, obtenerAlertasAmbientales, suscribirseADatos } from "../../utilidades/datosOperativos";

const leer = (tipo, fallback = []) => leerDato(`aiden-${tipo}`, fallback);
const estadoCalidad = (row) => row.estado ?? row.estadoManual ?? "Abierta";
const sugerencias = [
  { label: "Lotes que necesitan atención", query: "¿Qué lotes necesitan atención hoy?" },
  { label: "Revisar inventario", query: "¿Qué insumos están por debajo del mínimo?" },
  { label: "Comparar costos", query: "¿Cuál es el costo por planta de cada lote?" },
  { label: "Estado ambiental", query: "¿Qué zonas están fuera de rango?" },
];

function analizar(consulta, datos) {
  const q = consulta.toLowerCase();
  const cfg = leerConfiguracion();
  if (q.includes("inventario") || q.includes("insumo") || q.includes("stock")) {
    const bajos = datos.inventario.filter((row) => Number(row.stock) <= Number(row.minimo));
    return bajos.length
      ? { texto: `Hay ${bajos.length} insumo${bajos.length > 1 ? "s" : ""} por debajo del mínimo: ${bajos.map((row) => row.nombre).join(", ")}.`, links: bajos.map((row) => ({ label: row.nombre, ruta: "/inventario" })) }
      : { texto: "No hay insumos por debajo del stock mínimo registrado.", links: [] };
  }
  if (q.includes("ambiental") || q.includes("temperatura") || q.includes("humedad") || q.includes("zona")) {
    const alertas = obtenerAlertasAmbientales(datos.ambiental, cfg);
    return alertas.length
      ? { texto: `${alertas.length} zona${alertas.length > 1 ? "s requieren" : " requiere"} atención según los umbrales configurados: ${alertas.map((row) => `${row.zona} (${row.lectura.temperatura} °C, ${row.lectura.humedad}%)`).join(", ")}.`, links: alertas.map((row) => ({ label: row.zona, ruta: "/ambiental" })) }
      : { texto: `Las zonas registradas están dentro de los rangos configurados (${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax}%).`, links: [] };
  }
  if (q.includes("costo") || q.includes("planta")) {
    const lotes = datos.produccion.map((lote) => {
      const costo = datos.costos.filter((cost) => cost.lote === lote.lote && cost.tipo !== "ingreso").reduce((sum, cost) => sum + Number(cost.valor || 0), 0);
      return { ...lote, costo, porPlanta: lote.cantidad ? costo / Number(lote.cantidad) : 0 };
    }).filter((row) => row.costo > 0);
    if (!lotes.length) return { texto: "Todavía no hay costos asociados a los lotes registrados.", links: [] };
    const mayor = [...lotes].sort((a, b) => b.porPlanta - a.porPlanta)[0];
    return { texto: `El mayor costo por planta registrado corresponde a ${mayor.lote}, con ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(mayor.porPlanta)} por planta.`, links: [{ label: mayor.lote, ruta: "/costos" }] };
  }
  if (q.includes("lote") || q.includes("atención") || q.includes("atencion") || q.includes("hoy")) {
    const calidad = datos.calidad.filter((row) => estadoCalidad(row) !== "Cerrada" && row.prioridad === "Alta");
    const riesgo = datos.produccion.filter((row) => row.etapa === "Adaptación");
    const mensaje = [];
    if (calidad.length) mensaje.push(`${calidad.length} incidencia${calidad.length > 1 ? "s" : ""} de calidad pendiente${calidad.length > 1 ? "s" : ""}`);
    if (riesgo.length) mensaje.push(`${riesgo.length} lote${riesgo.length > 1 ? "s" : ""} en adaptación`);
    return {
      texto: mensaje.length ? `Hoy conviene priorizar ${mensaje.join(" y ")}.` : "No hay alertas operativas críticas con los datos registrados.",
      links: [...calidad.slice(0, 2).map((row) => ({ label: row.lote || row.codigo, ruta: "/calidad" })), ...riesgo.slice(0, 2).map((row) => ({ label: row.lote, ruta: "/produccion" }))],
    };
  }
  return { texto: "Puedo revisar inventario, producción, calidad, costos y condiciones ambientales usando únicamente los datos disponibles en AiDEN.", links: [] };
}

export default function PanelInteligencia() {
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [version, setVersion] = useState(0);
  const [datos, setDatos] = useState(() => ({ inventario: leer("inventario"), produccion: leer("produccion"), ambiental: leer("ambiental"), calidad: leer("calidad"), costos: leer("costos") }));

  useEffect(() => suscribirseADatos(() => setVersion((v) => v + 1)), []);
  useEffect(() => {
    setDatos({ inventario: leer("inventario"), produccion: leer("produccion"), ambiental: leer("ambiental"), calidad: leer("calidad"), costos: leer("costos") });
  }, [version]);

  const recomendaciones = useMemo(() => {
    const cfg = leerConfiguracion();
    const items = [];
    datos.inventario.filter((row) => Number(row.stock) <= Number(row.minimo)).forEach((row) => items.push({ text: `Stock bajo: ${row.nombre}`, ruta: "/inventario" }));
    datos.calidad.filter((row) => estadoCalidad(row) !== "Cerrada" && row.prioridad === "Alta").forEach((row) => items.push({ text: `Incidencia alta: ${row.lote || row.codigo}`, ruta: "/calidad" }));
    obtenerAlertasAmbientales(datos.ambiental, cfg).forEach((row) => items.push({ text: `Revisar condiciones: ${row.zona}`, ruta: "/ambiental" }));
    return items.length ? items.slice(0, 5) : [{ text: "No hay alertas prioritarias con los datos actuales.", ruta: "/dashboard-admin" }];
  }, [datos]);

  const consultar = (event, value = consulta) => {
    event?.preventDefault();
    if (!value.trim()) return;
    setRespuesta(analizar(value.trim(), datos));
    setFeedback(null);
    setConsulta("");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <article className="min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-start justify-between border-b border-slate-100 p-5"><section className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BrainCircuit size={20} /></span><section><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Inteligencia</p><h1 className="mt-1 text-xl font-bold text-slate-950">Asistente de AiDEN</h1><p className="mt-1 text-sm text-slate-500">Consulta la operación con datos reales del sistema.</p></section></section><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Datos locales</span></header>
        <section className="space-y-5 p-5">
          <section><p className="mb-2 text-xs font-semibold text-slate-500">Consultas frecuentes</p><nav className="flex flex-wrap gap-2" aria-label="Consultas sugeridas">{sugerencias.map((item) => <button key={item.query} type="button" onClick={() => consultar(null, item.query)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">{item.label}</button>)}</nav></section>
          <article className="rounded-2xl bg-slate-50 p-5"><section className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm"><Sparkles size={15} /></span><section className="min-w-0"><p className="text-sm font-semibold text-slate-800">{respuesta ? "Análisis" : "Resumen operativo"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{respuesta?.texto || "Detecto alertas y relaciones entre los registros guardados en AiDEN. No invento información que no exista en el sistema."}</p>{respuesta?.links?.length > 0 && <nav className="mt-3 flex flex-wrap gap-2">{respuesta.links.map((link) => <button key={`${link.ruta}-${link.label}`} type="button" onClick={() => navigate(link.ruta)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">{link.label}<ArrowRight size={12} /></button>)}</nav>}</section></section></article>
          {respuesta && <footer className="flex items-center gap-2 border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">¿Fue útil?</span><button type="button" onClick={() => setFeedback("up")} className={`rounded-lg p-2 ${feedback === "up" ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:bg-slate-100"}`} aria-label="Respuesta útil"><ThumbsUp size={14} /></button><button type="button" onClick={() => setFeedback("down")} className={`rounded-lg p-2 ${feedback === "down" ? "bg-red-50 text-red-600" : "text-slate-400 hover:bg-slate-100"}`} aria-label="Respuesta no útil"><ThumbsDown size={14} /></button>{feedback && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Check size={13} />Registrado</span>}</footer>}
          <form onSubmit={consultar} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><MessageCircle size={18} className="ml-2 mt-2.5 text-slate-400" /><input value={consulta} onChange={(e) => setConsulta(e.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none" placeholder="Pregunta sobre la operación..." aria-label="Consulta al asistente" /><button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Consultar</button></form>
        </section>
      </article>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><header className="flex items-center justify-between"><section className="flex items-center gap-2"><Lightbulb size={17} className="text-emerald-700" /><h2 className="font-semibold text-slate-900">Recomendaciones</h2></section><span className="text-[11px] font-medium text-slate-400">En vivo</span></header><section className="mt-4 space-y-2">{recomendaciones.map((item, index) => <button key={`${item.text}-${index}`} type="button" onClick={() => navigate(item.ruta)} className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-emerald-100 hover:bg-emerald-50/40"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Lightbulb size={13} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5 text-slate-700">{item.text}</span><span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100">Ver registro <ArrowRight size={11} /></span></span></button>)}</section></aside>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BrainCircuit, Eraser, Info, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import EtiquetaLote from "../components/lote/EtiquetaLote";
import { useDatos } from "../datos/almacen";
import { SUGERENCIAS, lotesSugeridos, responder } from "../datos/asistente";
import { alertas as calcularAlertas } from "../datos/selectores";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { ahoraLocal, hora } from "../utilidades/formato";

const CLAVE = "aiden-asistente";

function leerHistorial() {
  try {
    const valor = JSON.parse(sessionStorage.getItem(CLAVE) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function Respuesta({ mensaje }) {
  const r = mensaje.respuesta;
  return (
    <article className="rounded-2xl bg-slate-50 p-5">
      <section className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <section className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{mensaje.pregunta}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{r.texto}</p>
          {r.items?.length > 0 && (
            <ul className="mt-3 space-y-2">
              {r.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
                  <span className="min-w-0 flex-1 text-sm leading-6 text-slate-700">
                    {item.lote && <EtiquetaLote codigo={item.lote} className="mr-2" />}
                    {item.texto}
                  </span>
                  {item.ruta && (
                    <Link to={item.ruta} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
                      Ver <ArrowRight size={12} aria-hidden="true" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          {r.fuente && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <Info size={12} aria-hidden="true" />
              Calculado con los datos actuales de {r.fuente} · {hora(mensaje.fecha)}
            </p>
          )}
        </section>
      </section>
    </article>
  );
}

export default function InteligenciaArtificial() {
  const datos = useDatos();
  const sesion = useSesion();
  const [historial, setHistorial] = useState(leerHistorial);
  const [consulta, setConsulta] = useState("");
  const final = useRef(null);
  useTitulo("Inteligencia");

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(historial.slice(-20)));
    } catch (error) {
      console.warn("No se pudo guardar la conversación", error);
    }
    final.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [historial]);

  const consultar = (evento, valor = consulta) => {
    evento?.preventDefault();
    const pregunta = valor.trim();
    if (!pregunta) return;
    setHistorial((h) => [...h, { id: `${Date.now()}`, pregunta, respuesta: responder(pregunta, datos, sesion), fecha: ahoraLocal() }]);
    setConsulta("");
  };

  const recomendaciones = calcularAlertas(datos, sesion).slice(0, 6);
  const sugerencias = [...SUGERENCIAS, ...lotesSugeridos(datos)];

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Inteligencia</h1>
        <p className="mt-1 text-sm text-slate-500">Herramientas para apoyar el análisis y la gestión del vivero con los datos registrados en AiDEN.</p>
      </header>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
            <section className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BrainCircuit size={20} aria-hidden="true" />
              </span>
              <section>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Inteligencia</p>
                <h2 className="text-lg font-bold text-slate-900">Asistente de AiDEN</h2>
                <p className="mt-1 text-sm text-slate-500">Consulta la operación con datos reales del sistema. Responde con reglas sobre tus registros; no usa modelos de lenguaje ni servicios externos.</p>
              </section>
            </section>
            <section className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                Datos locales
              </span>
              {historial.length > 0 && (
                <button type="button" onClick={() => setHistorial([])} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Limpiar conversación" title="Limpiar conversación">
                  <Eraser size={16} aria-hidden="true" />
                </button>
              )}
            </section>
          </header>
          <section className="space-y-5 p-5">
            <section>
              <p className="mb-2 text-xs font-semibold text-slate-500">Consultas frecuentes</p>
              <nav className="flex flex-wrap gap-2" aria-label="Consultas sugeridas">
                {sugerencias.map((item) => (
                  <button key={item} type="button" onClick={() => consultar(null, item)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                    {item}
                  </button>
                ))}
              </nav>
            </section>
            <section aria-live="polite" className="space-y-3">
              {historial.length ? (
                historial.map((m) => <Respuesta key={m.id} mensaje={m} />)
              ) : (
                <article className="rounded-2xl bg-slate-50 p-5">
                  <section className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                      <Sparkles size={15} aria-hidden="true" />
                    </span>
                    <section className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Resumen operativo</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Detecto alertas y relaciones entre los registros guardados en AiDEN. No invento información que no exista en el sistema: cada respuesta dice de qué módulo sale. También puedes escribir el código de un lote, por ejemplo LT-2026-011.</p>
                    </section>
                  </section>
                </article>
              )}
              <div ref={final} />
            </section>
            <form onSubmit={consultar} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <MessageCircle size={18} className="ml-2 mt-2.5 shrink-0 text-slate-400" aria-hidden="true" />
              <label htmlFor="consulta-ia" className="sr-only">
                Pregunta sobre la operación
              </label>
              <input id="consulta-ia" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Pregunta sobre la operación..." autoComplete="off" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none" />
              <button type="submit" disabled={!consulta.trim()} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-45">
                Consultar
              </button>
            </form>
          </section>
        </article>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section className="flex items-center gap-2">
              <Lightbulb size={17} className="text-emerald-700" aria-hidden="true" />
              <h2 className="font-semibold text-slate-900">Recomendaciones</h2>
            </section>
            <span className="text-[11px] font-medium text-slate-500">En vivo</span>
          </header>
          <section className="mt-4 space-y-2">
            {recomendaciones.map((item) => (
              <Link key={item.id} to={item.ruta} className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-emerald-100 hover:bg-emerald-50/40">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle size={14} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-slate-700">{item.titulo}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.detalle}</span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    Abrir registro <ArrowRight size={11} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
            {!recomendaciones.length && <p className="rounded-xl border border-slate-100 p-3 text-sm text-slate-600">No hay alertas prioritarias con los datos actuales.</p>}
          </section>
        </aside>
      </section>
    </article>
  );
}

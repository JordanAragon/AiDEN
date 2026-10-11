import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Clock3, Plus, Sprout, Thermometer } from "lucide-react";
import { Boton } from "../ui/Boton";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import CifraRodante from "../ui/CifraRodante";
import LienzoVivo from "../vivo/LienzoVivo";
import { diferida } from "../../utilidades/cargaDiferida";
import Insignia from "../ui/Insignia";
import PilaAvatares from "../ui/PilaAvatares";
import TiempoRelativo from "../ui/TiempoRelativo";
import MapaVivero from "./MapaVivero";
import EtiquetaLote from "../lote/EtiquetaLote";
import LineaTiempo from "../lote/LineaTiempo";
import ModalTarea from "../formularios/ModalTarea";
import ModalLote from "../formularios/ModalLote";
import { useDatos } from "../../datos/almacen";
import { ETAPAS } from "../../datos/catalogos";
import { alertas as calcularAlertas, cargaPorPersona, evaluarLectura, lotesActivos, tareaVencida, ultimasLecturas } from "../../datos/selectores";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { aFecha, hoyISO, numero, plural } from "../../utilidades/formato";

const EscenaPulso = diferida(() => import("../vivo/escenas/EscenaPulso"));

function accionRapida(alerta, datos) {
  if (alerta.tipo === "Ambiental") {
    return { texto: "Asignar revisión", tarea: { titulo: `Revisar condiciones en ${alerta.zona}`, modulo: "Ambiental", prioridad: "Alta", fecha: hoyISO(), descripcion: `${alerta.detalle} Verificar ventilación, riego y sombra.` } };
  }
  if (alerta.tipo === "Calidad") {
    const incidencia = datos.calidad.find((i) => `cal-${i.id}` === alerta.id);
    return { texto: "Asignar acción", tarea: { titulo: `Atender ${incidencia?.codigo}`, lote: incidencia?.lote, modulo: "Calidad", prioridad: "Alta", fecha: hoyISO(), responsableId: incidencia?.responsableId, descripcion: incidencia?.descripcion } };
  }
  if (alerta.tipo === "Inventario") return { texto: "Registrar entrada", ruta: `${alerta.ruta}&accion=entrada` };
  return { texto: "Reasignar", ruta: alerta.ruta };
}

export default function DashboardSupervisorContenido() {
  const datos = useDatos();
  const sesion = useSesion();
  const [tareaInicial, setTareaInicial] = useState(null);
  const [nuevoLote, setNuevoLote] = useState(false);
  const [vistaOperativa, setVistaOperativa] = useState("lotes");
  const [mostrarTodasAtenciones, setMostrarTodasAtenciones] = useState(false);
  const [mostrarTodaCarga, setMostrarTodaCarga] = useState(false);
  useTitulo("Centro de supervisión");

  const hoy = hoyISO();
  const activos = lotesActivos(datos.lotes);
  const lista = calcularAlertas(datos, sesion);
  const carga = cargaPorPersona(datos).filter((c) => c.persona.cargo === "Operario");
  const maximo = Math.max(1, ...carga.map((c) => c.abiertas));
  const abiertas = datos.tareas.filter((t) => t.estado !== "Completada");
  const vencidas = abiertas.filter((t) => tareaVencida(t, hoy)).length;
  const completadasHoy = datos.tareas.filter((t) => t.estado === "Completada" && String(t.completada || "").slice(0, 10) === hoy).length;
  const bajoMinimo = datos.inventario.filter((i) => Number(i.stock) <= Number(i.minimo)).length;
  const lecturas = ultimasLecturas(datos.ambiental);
  const cfg = datos.configuracion;
  const recientes = [...datos.trazabilidad].sort((a, b) => aFecha(b.fecha) - aFecha(a.fecha)).slice(0, 5);

  return (
    <article className="aiden-rol-supervisor aiden-supervisor-vista space-y-7">
      <EncabezadoPagina
        rotulo="AiDEN / coordinación"
        titulo="Centro de supervisión"
        descripcion="Coordina la ejecución diaria: asigna trabajo, detecta bloqueos, valida incidencias y mantiene la operación en movimiento."
        acciones={
          <>
            <Boton variante="secundario" icono={Plus} onClick={() => setNuevoLote(true)} className="!px-3">
              Nuevo lote
            </Boton>
            <Boton variante="primario" icono={ClipboardList} onClick={() => setTareaInicial({})}>
              Asignar trabajo
            </Boton>
          </>
        }
      />

      <section aria-label="Resumen del estado de la operación" aria-live="polite" data-vista="supervisor" className="aiden-supervisor-pulso relative isolate overflow-hidden rounded-[28px] bg-[#0b2b1b] text-white shadow-[0_24px_70px_rgba(11,43,27,0.16)]">
        <LienzoVivo escena={EscenaPulso} datos={{ riesgos: lista.length }} />
        <section className="relative grid lg:grid-cols-[1.15fr_.85fr]">
          <section className="p-6 sm:p-8 lg:p-10">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {lista.length ? plural(lista.length, "asunto requiere atención.", "asuntos requieren atención.") : "La operación está sin alertas."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              {lista.length ? "Prioriza lo que puede detener producción, comprometer una condición ambiental o dejar una incidencia sin respuesta." : "No hay bloqueos detectados con los datos actuales. La supervisión puede concentrarse en el avance y la ejecución del equipo."}
            </p>
            <section className="mt-6 flex flex-wrap items-center gap-2">
              <Link to={lista.length ? lista[0].ruta : "/produccion"} className="aiden-supervisor-cta inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#0b2b1b] transition hover:bg-emerald-100">
                {lista.length ? "Revisar atención" : "Abrir producción"}
              </Link>
              <Link to="/personal?vista=tareas" className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5">
                Ver equipo
              </Link>
            </section>
          </section>
          <dl className="aiden-pulso-cifras grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
            {[
              { valor: abiertas.length, nombre: abiertas.length === 1 ? "tarea abierta" : "tareas abiertas", detalle: `${vencidas ? plural(vencidas, "vencida", "vencidas") : "sin vencidas"} · ${plural(completadasHoy, "completada hoy", "completadas hoy")}` },
              { valor: activos.length, nombre: activos.length === 1 ? "lote activo" : "lotes activos", detalle: `${activos.filter((l) => l.etapa === "Cosecha").length} en cosecha · ${numero(activos.reduce((s, l) => s + Number(l.cantidad || 0), 0))} plantas` },
              { valor: lista.length, nombre: lista.length === 1 ? "riesgo abierto" : "riesgos abiertos", detalle: "operación, ambiente y calidad" },
              { valor: bajoMinimo, nombre: bajoMinimo === 1 ? "insumo por reponer" : "insumos por reponer", detalle: bajoMinimo ? "en o bajo el mínimo" : "stock en rango" },
            ].map((cifra, i) => (
              <div key={cifra.nombre} className={`flex flex-col justify-end border-white/10 px-5 py-4 sm:min-h-32 sm:p-6 ${i > 0 ? "border-t" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 === 0 ? "sm:border-r" : ""}`}>
                <dt className="sr-only">{cifra.nombre}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    <CifraRodante valor={cifra.valor} desdeCero />
                  </span>
                  <span className="text-sm font-medium text-white/85">{cifra.nombre}</span>
                </dd>
                <dd className="mt-1 text-xs text-white/60">{cifra.detalle}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>
      <section className="aiden-supervisor-grid grid items-start gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <article className="aiden-supervisor-superficie rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between gap-4">
            <section>
              <h2 className="font-semibold text-slate-900">Carga de trabajo</h2>
              <p className="mt-1 text-xs text-slate-500">Tareas pendientes por responsable</p>
            </section>
            <div className="flex shrink-0 items-center gap-3">
              <PilaAvatares etiqueta="Operarios con tareas" personas={carga.map(({ persona, abiertas: n, vencidas: v }) => ({ id: persona.id, nombre: persona.nombre, detalle: `${plural(n, "tarea abierta", "tareas abiertas")}${v ? ` · ${plural(v, "vencida", "vencidas")}` : ""}`, to: `/personal?persona=${persona.id}` }))} />
              <Link to="/personal?vista=tareas" className="text-xs font-semibold text-emerald-700 hover:underline">
                Ver todo
              </Link>
            </div>
          </header>
          <section className="mt-3 space-y-1.5">
            {(mostrarTodaCarga ? carga : carga.slice(0, 4)).map(({ persona, abiertas: n, vencidas: v, lotes }) => (
              <Link key={persona.id} to={`/personal?persona=${persona.id}`} className="group block rounded-xl border border-transparent px-2.5 py-2 transition hover:border-slate-100 hover:bg-slate-50">
                <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <section className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate text-xs font-semibold text-slate-700 group-hover:text-emerald-700">{persona.nombre}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{plural(lotes, "lote", "lotes")}</span>
                    </div>
                    <section className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full bg-red-500" style={{ width: `${(v / maximo) * 100}%` }} />
                      <span className="block h-full bg-emerald-500" style={{ width: `${((n - v) / maximo) * 100}%` }} />
                    </section>
                  </section>
                  <span className="text-right">
                    <span className="block text-sm font-bold leading-none text-slate-800">{n}</span>
                    <span className="mt-1 block text-[10px] font-medium text-slate-400">{v ? `${v} vencida${v === 1 ? "" : "s"}` : "pendientes"}</span>
                  </span>
                </section>
              </Link>
            ))}
            {!carga.length && <p className="text-sm text-slate-500">Aún no hay tareas asignadas.</p>}
            {carga.length > 4 && (
              <button type="button" onClick={() => setMostrarTodaCarga((valor) => !valor)} className="w-full pt-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                {mostrarTodaCarga ? "Mostrar menos" : `Ver todo · ${carga.length} responsables`}
              </button>
            )}
          </section>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-start justify-between gap-3">
            <section>
              <h2 className="font-semibold text-slate-900">Atención inmediata</h2>
              <p className="mt-1 text-xs text-slate-500">Eventos que necesitan intervención del supervisor</p>
            </section>
            {lista.length > 2 && (
              <button type="button" onClick={() => setMostrarTodasAtenciones((valor) => !valor)} className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline">
                {mostrarTodasAtenciones ? "Mostrar menos" : `Ver todo · ${lista.length}`}
              </button>
            )}
          </header>
          <section className="mt-3 space-y-2">
            {lista.slice(0, mostrarTodasAtenciones ? lista.length : 2).map((alerta) => {
              const accion = accionRapida(alerta, datos);
              return (
                <article key={alerta.id} className={`aiden-supervisor-alerta rounded-xl border bg-slate-50 px-3 py-2.5 ${alerta.severidad === "critico" ? "border-red-100" : "border-slate-100"}`}>
                  <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <section className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Insignia tono={alerta.severidad === "critico" ? "critico" : "alerta"}>{alerta.tipo}</Insignia>
                        {alerta.lote && <EtiquetaLote codigo={alerta.lote} />}
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-4 text-slate-800">{alerta.titulo}</p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-slate-500">{alerta.detalle}</p>
                    </section>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold sm:shrink-0 sm:justify-end sm:pt-0.5">
                      <Link to={alerta.ruta} className="text-slate-500 hover:text-emerald-700">
                        Ver registro
                      </Link>
                      {accion.tarea ? (
                        <button type="button" onClick={() => setTareaInicial(accion.tarea)} className="text-emerald-700 hover:underline">
                          {accion.texto}
                        </button>
                      ) : (
                        <Link to={accion.ruta} className="text-emerald-700 hover:underline">
                          {accion.texto}
                        </Link>
                      )}
                    </div>
                  </section>
                </article>
              );
            })}
            {!lista.length && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">No hay alertas que requieran intervención.</p>}
          </section>
        </article>
      </section>

      <MapaVivero datos={datos} />

      <section className="aiden-supervisor-operacion overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between">
          <section>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Consulta sin recorrer toda la página</h2>
            <p className="mt-1 text-xs text-slate-500">Cambia de contexto según lo que necesites revisar. Los datos siguen siendo los mismos.</p>
          </section>
          <nav className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Vistas operativas">
            {[
              ["lotes", "Lotes", Sprout],
              ["ambiente", "Ambiente", Thermometer],
              ["actividad", "Actividad", Clock3],
            ].map(([id, label, Icono]) => {
              const activo = vistaOperativa === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVistaOperativa(id)}
                  aria-pressed={activo}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${activo ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Icono size={13} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>
        </header>

        <section className="p-5 sm:p-6">
          {vistaOperativa === "lotes" && (
            <section>
              <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <section>
                  <h3 className="font-semibold text-slate-900">Lotes por etapa</h3>
                  <p className="mt-1 text-xs text-slate-500">Distribución actual de la producción.</p>
                </section>
                <Link to="/produccion" className="text-xs font-semibold text-emerald-700 hover:underline">Abrir producción</Link>
              </header>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {ETAPAS.map((etapa) => {
                  const enEtapa = activos.filter((l) => l.etapa === etapa);
                  return (
                    <section key={etapa} aria-label={etapa} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <h4 className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        {etapa}
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{enEtapa.length}</span>
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {enEtapa.slice(0, 3).map((lote) => (
                          <li key={lote.id} className="rounded-xl border border-slate-200 bg-white p-3">
                            <EtiquetaLote codigo={lote.lote} />
                            <p className="mt-1 text-sm font-semibold text-slate-800">{lote.cultivo}</p>
                            <p className="text-[11px] text-slate-500">{numero(lote.cantidad)} plantas · {lote.ubicacion}</p>
                          </li>
                        ))}
                        {!enEtapa.length && <li className="py-3 text-center text-xs text-slate-500">Sin lotes</li>}
                        {enEtapa.length > 3 && <li className="text-center text-[11px] font-semibold text-emerald-700">+{enEtapa.length - 3} más en producción</li>}
                      </ul>
                    </section>
                  );
                })}
              </section>
            </section>
          )}

          {vistaOperativa === "ambiente" && (
            <section>
              <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <section>
                  <h3 className="font-semibold text-slate-900">Ambiente por zona</h3>
                  <p className="mt-1 text-xs text-slate-500">Última lectura frente a los rangos configurados.</p>
                </section>
                <Link to="/ambiental" className="text-xs font-semibold text-emerald-700 hover:underline">Abrir ambiental</Link>
              </header>
              <ul className="grid gap-2 sm:grid-cols-2">
                {datos.zonas.map((zona) => {
                  const lectura = lecturas.get(zona.nombre);
                  const e = evaluarLectura(lectura, cfg);
                  return (
                    <li key={zona.id}>
                      <Link to={`/ambiental?zona=${encodeURIComponent(zona.nombre)}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-emerald-100 hover:bg-emerald-50/30">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-800">{zona.nombre}</span>
                          <span className="block text-[11px] text-slate-500">{lectura ? <>Actualizada <TiempoRelativo fecha={lectura.fecha} /></> : "Sin lecturas"}</span>
                        </span>
                        {lectura && (
                          <span className="flex shrink-0 items-center gap-2">
                            <span className={`text-xs font-semibold ${e.fuera ? "text-red-600" : "text-slate-800"}`}>{numero(lectura.temperatura)} °C · {numero(lectura.humedad)} %</span>
                            <Insignia tono={e.fuera ? "critico" : "exito"}>{e.fuera ? "Atención" : "Estable"}</Insignia>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {vistaOperativa === "actividad" && (
            <section>
              <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <section>
                  <h3 className="font-semibold text-slate-900">Actividad reciente</h3>
                  <p className="mt-1 text-xs text-slate-500">Los últimos movimientos registrados en los lotes.</p>
                </section>
                <Link to="/trazabilidad" className="text-xs font-semibold text-emerald-700 hover:underline">Ver trazabilidad</Link>
              </header>
              {recientes.length ? (
                <LineaTiempo eventos={recientes} mostrarLote />
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">Todavía no hay actividad registrada.</p>
              )}
            </section>
          )}
        </section>
      </section>

      <ModalTarea abierto={Boolean(tareaInicial)} onCerrar={() => setTareaInicial(null)} inicial={tareaInicial || undefined} />
      <ModalLote abierto={nuevoLote} onCerrar={() => setNuevoLote(false)} />
    </article>
  );
}

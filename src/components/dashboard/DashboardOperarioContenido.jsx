import { useId, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Droplets, FlagTriangleRight, ListChecks, PlayCircle, RotateCcw, Sprout, Thermometer } from "lucide-react";
import { Link } from "react-router-dom";
import { Boton } from "../ui/Boton";
import { AreaTexto } from "../ui/Campo";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Modal from "../ui/Modal";
import AlertaFormulario from "../ui/AlertaFormulario";
import EtiquetaLote from "../lote/EtiquetaLote";
import PasosEtapa from "../lote/PasosEtapa";
import ModalEvento from "../formularios/ModalEvento";
import ModalIncidencia from "../formularios/ModalIncidencia";
import ModalLectura from "../formularios/ModalLectura";
import { useDatos } from "../../datos/almacen";
import { cambiarEstadoTarea } from "../../datos/acciones";
import { estadoIncidencia, evaluarLectura, lotesActivos, lotesVisibles, ordenarTareas, tareasVisibles, ultimasLecturas, zonasVisibles } from "../../datos/selectores";
import { useAccion, useEnvio } from "../../contexto/retroalimentacion";
import { useFichaLote } from "../../contexto/ficha";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { fechaCorta, haceTiempo, hoyISO, numero, plural, vencimiento } from "../../utilidades/formato";

function ModalCompletar({ tarea, onCerrar, onReportar }) {
  const id = useId();
  const sesion = useSesion();
  const [nota, setNota] = useState("");
  const { error, enviar } = useEnvio(onCerrar);
  return (
    <Modal
      abierto={Boolean(tarea)}
      onCerrar={onCerrar}
      titulo="Marcar tarea como hecha"
      descripcion={tarea?.titulo}
      ancho="sm"
      pie={
        <>
          <Boton variante="contorno" icono={FlagTriangleRight} onClick={onReportar} className="mr-auto">
            Hubo un problema
          </Boton>
          <Boton variante="primario" type="submit" form={id} icono={CheckCircle2}>
            Marcar hecha
          </Boton>
        </>
      }
    >
      <form
        id={id}
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar(() => cambiarEstadoTarea(tarea.id, "Completada", sesion, nota), {
            titulo: "Tarea completada",
            detalle: tarea?.lote ? `Quedó en la historia de ${tarea.lote}.` : "Supervisión ya ve el avance.",
          });
        }}
      >
        <AlertaFormulario mensaje={error} />
        <AreaTexto etiqueta="Nota para supervisión" opcional value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Se usaron 20 litros; mesa 3 con goteros tapados" />
      </form>
    </Modal>
  );
}

function FilaTarea({ tarea, onCompletar }) {
  const sesion = useSesion();
  const ejecutar = useAccion();
  const hecha = tarea.estado === "Completada";
  const v = vencimiento(tarea.fecha);
  return (
    <li className="flex items-start gap-3 py-3">
      <button
        type="button"
        onClick={() => (hecha ? ejecutar(() => cambiarEstadoTarea(tarea.id, "Pendiente", sesion), "Tarea reabierta") : onCompletar(tarea))}
        className="mt-0.5 shrink-0 rounded-full"
        aria-label={hecha ? `Reabrir ${tarea.titulo}` : `Marcar hecha ${tarea.titulo}`}
      >
        {hecha ? <CheckCircle2 size={18} className="text-emerald-600" /> : <span className={`block h-[18px] w-[18px] rounded-full border-2 ${tarea.prioridad === "Alta" ? "border-red-400" : "border-slate-300"}`} />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${hecha ? "text-slate-500 line-through" : "text-slate-700"}`}>{tarea.titulo}</span>
        {!hecha && tarea.descripcion && <span className="mt-0.5 block text-xs text-slate-500">{tarea.descripcion}</span>}
        {hecha && tarea.nota && <span className="mt-0.5 block text-xs text-slate-500">Nota: {tarea.nota}</span>}
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          <span>{tarea.modulo}</span>
          {tarea.lote && (
            <>
              <span aria-hidden="true">·</span>
              <EtiquetaLote codigo={tarea.lote} />
            </>
          )}
          {!hecha && <span className={v.tono === "critico" ? "font-semibold text-red-600" : v.tono === "alerta" ? "font-semibold text-amber-700" : ""}>· {v.texto}</span>}
          <span className={tarea.prioridad === "Alta" ? "font-semibold text-red-600" : ""}>· {tarea.prioridad}</span>
          {tarea.estado === "En curso" && <span className="font-semibold text-sky-700">· En curso</span>}
        </span>
      </span>
      {!hecha && (
        <span className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
          {tarea.estado === "Pendiente" && (
            <Boton tamano="sm" variante="contorno" icono={PlayCircle} onClick={() => ejecutar(() => cambiarEstadoTarea(tarea.id, "En curso", sesion), "Tarea en curso")}>
              Empezar
            </Boton>
          )}
          <Boton tamano="sm" variante="suave" icono={CheckCircle2} onClick={() => onCompletar(tarea)}>
            Hecha
          </Boton>
        </span>
      )}
      {hecha && (
        <button type="button" onClick={() => ejecutar(() => cambiarEstadoTarea(tarea.id, "Pendiente", sesion), "Tarea reabierta")} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`Deshacer ${tarea.titulo}`} title="Deshacer">
          <RotateCcw size={14} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

function Grupo({ titulo, tareas, onCompletar, critico = false }) {
  if (!tareas.length) return null;
  return (
    <section aria-label={titulo}>
      <h3 className={`pt-3 text-[11px] font-bold uppercase tracking-wider ${critico ? "text-red-600" : "text-slate-500"}`}>
        {titulo} · {tareas.length}
      </h3>
      <ul className="divide-y divide-slate-100">
        {tareas.map((t) => (
          <FilaTarea key={t.id} tarea={t} onCompletar={onCompletar} />
        ))}
      </ul>
    </section>
  );
}

export default function DashboardOperarioContenido() {
  const datos = useDatos();
  const sesion = useSesion();
  const { abrirLote } = useFichaLote();
  const [modal, setModal] = useState(null);
  const [completar, setCompletar] = useState(null);
  const nombre = sesion?.name || "";
  useTitulo("Mi jornada");

  const hoy = hoyISO();
  const propia = { ...sesion, role: "operario" };
  const tareas = ordenarTareas(tareasVisibles(datos, propia));
  const vencidas = tareas.filter((t) => t.estado !== "Completada" && t.fecha && t.fecha < hoy);
  const deHoy = tareas.filter((t) => t.estado !== "Completada" && t.fecha === hoy);
  const proximas = tareas.filter((t) => t.estado !== "Completada" && (!t.fecha || t.fecha > hoy));
  const hechas = tareas.filter((t) => t.estado === "Completada" && String(t.completada || "").slice(0, 10) === hoy);
  const pendientes = vencidas.length + deHoy.length + proximas.length;
  const urgentes = tareas.filter((t) => t.estado !== "Completada" && (t.prioridad === "Alta" || (t.fecha && t.fecha < hoy)));
  const misLotes = lotesActivos(lotesVisibles(datos, propia));
  const codigos = new Set(misLotes.map((l) => l.lote));
  const lecturas = ultimasLecturas(datos.ambiental);
  const cfg = datos.configuracion;
  const zonas = zonasVisibles(datos, propia);
  const zonasAlerta = zonas.filter((z) => evaluarLectura(lecturas.get(z), cfg).fuera);
  const incidencias = datos.calidad.filter((i) => codigos.has(i.lote) && estadoIncidencia(i) !== "Cerrada");

  return (
    <article className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / ejecución"
        titulo={`Mi jornada, ${nombre}`}
        descripcion="Tu vista se limita al trabajo que tienes asignado: tareas, lotes, condiciones y novedades que afectan tu jornada."
        acciones={
          <>
            <Boton variante="secundario" icono={ListChecks} onClick={() => setModal({ tipo: "evento" })} className="!px-3 hover:border-emerald-200 hover:text-emerald-700">
              Registrar actividad
            </Boton>
            <Boton variante="secundario" icono={FlagTriangleRight} onClick={() => setModal({ tipo: "incidencia" })} className="!px-3 hover:border-emerald-200 hover:text-emerald-700">
              Reportar problema
            </Boton>
            <Boton variante="secundario" icono={Thermometer} onClick={() => setModal({ tipo: "lectura" })} className="!px-3 hover:border-emerald-200 hover:text-emerald-700">
              Tomar lectura
            </Boton>
          </>
        }
      />

      <Cifras
        items={[
          { icono: ListChecks, etiqueta: "Mis tareas", valor: pendientes, detalle: `${plural(hechas.length, "hecha", "hechas")} hoy`, tono: pendientes ? "alerta" : "exito" },
          { icono: Sprout, etiqueta: "Lotes a cargo", valor: misLotes.length, detalle: "Asignados a ti", to: "/produccion" },
          { icono: AlertTriangle, etiqueta: "Prioridades", valor: urgentes.length, detalle: "Alta prioridad o vencidas", tono: urgentes.length ? "critico" : "exito" },
          { icono: Droplets, etiqueta: "Alertas de campo", valor: zonasAlerta.length, detalle: `Según ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax}%`, tono: zonasAlerta.length ? "alerta" : "exito", to: "/ambiental" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="font-semibold text-slate-900">Lo que tengo que hacer</h2>
              <p className="mt-1 text-xs text-slate-500">Completa una tarea para que supervisión vea el avance.</p>
            </section>
            <Clock3 size={18} className="text-emerald-700" aria-hidden="true" />
          </header>
          <section className="mt-2">
            <Grupo titulo="Vencidas" critico tareas={vencidas} onCompletar={setCompletar} />
            <Grupo titulo="Para hoy" tareas={deHoy} onCompletar={setCompletar} />
            <Grupo titulo="Próximas" tareas={proximas} onCompletar={setCompletar} />
            <Grupo titulo="Hechas hoy" tareas={hechas} onCompletar={setCompletar} />
            {!tareas.length && <p className="py-8 text-center text-sm text-slate-500">No tienes tareas asignadas. Cuando supervisión te asigne trabajo aparecerá aquí.</p>}
            {tareas.length > 0 && !pendientes && !hechas.length && <p className="py-8 text-center text-sm text-slate-500">Todo al día. Registra lo que hagas en campo para que quede en la historia del lote.</p>}
          </section>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Mis lotes</h2>
            <p className="mt-1 text-xs text-slate-500">Solo lotes asignados a tu usuario</p>
          </header>
          <section className="mt-4 space-y-2">
            {misLotes.map((lote) => {
              const lectura = lecturas.get(lote.ubicacion);
              const e = evaluarLectura(lectura, cfg);
              return (
                <button key={lote.id} type="button" onClick={() => abrirLote(lote.lote)} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-emerald-200">
                  <section className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <EtiquetaLote codigo={lote.lote} interactiva={false} />
                      <span className="mt-1 block text-sm font-semibold text-slate-800">{lote.cultivo}</span>
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{lote.etapa}</span>
                  </section>
                  <div className="mt-3">
                    <PasosEtapa etapa={lote.etapa} compacto mostrarEtiqueta={false} />
                  </div>
                  <section className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
                    <span>
                      {numero(lote.cantidad)} plantas · {lote.ubicacion}
                    </span>
                    {lectura && (
                      <span className={e.fuera ? "font-semibold text-red-600" : ""}>
                        {numero(lectura.temperatura)} °C · {numero(lectura.humedad)} % {haceTiempo(lectura.fecha)}
                      </span>
                    )}
                  </section>
                </button>
              );
            })}
            {!misLotes.length && <p className="py-8 text-center text-sm text-slate-500">No tienes lotes asignados actualmente.</p>}
          </section>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <header className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
            <h2 className="font-semibold text-amber-900">Atención</h2>
          </header>
          {incidencias.length || zonasAlerta.length ? (
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900/80">
              {incidencias.map((i) => (
                <li key={i.id}>
                  <Link to={`/calidad?incidencia=${i.id}`} className="hover:underline">
                    {i.codigo} en {i.lote}: {i.descripcion} ({estadoIncidencia(i).toLowerCase()}, prioridad {i.prioridad.toLowerCase()})
                  </Link>
                </li>
              ))}
              {zonasAlerta.map((z) => (
                <li key={z}>
                  <Link to={`/ambiental?zona=${encodeURIComponent(z)}`} className="hover:underline">
                    {z} está fuera del rango ambiental en la última lectura.
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-amber-900/80">No hay incidencias abiertas ni zonas fuera de rango en tus lotes.</p>
          )}
          <Link to="/calidad" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-900">
            Revisar calidad
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </article>
        <article className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Tu responsabilidad</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Ejecuta las tareas asignadas, registra lo ocurrido en campo y deja evidencia para que supervisión pueda decidir.
            {hechas.length ? ` Hoy llevas ${plural(hechas.length, "tarea completada", "tareas completadas")}.` : ""}
          </p>
          {tareas.some((t) => t.estado === "Completada") && (
            <p className="mt-2 text-xs text-white/60">Última tarea completada: {fechaCorta([...tareas].filter((t) => t.completada).sort((a, b) => (a.completada < b.completada ? 1 : -1))[0]?.completada)}.</p>
          )}
        </article>
      </section>

      <ModalEvento abierto={modal?.tipo === "evento"} onCerrar={() => setModal(null)} />
      <ModalLectura abierto={modal?.tipo === "lectura"} onCerrar={() => setModal(null)} />
      <ModalIncidencia abierto={modal?.tipo === "incidencia"} onCerrar={() => setModal(null)} inicial={{ lote: modal?.lote }} />
      <ModalCompletar
        key={completar?.id || "ninguna"}
        tarea={completar}
        onCerrar={() => setCompletar(null)}
        onReportar={() => {
          const lote = completar?.lote;
          setCompletar(null);
          setModal({ tipo: "incidencia", lote });
        }}
      />
    </article>
  );
}

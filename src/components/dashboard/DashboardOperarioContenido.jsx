import { useEffect, useId, useState } from "react";
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
import { haceTiempo, hoyISO, numero, plural, vencimiento } from "../../utilidades/formato";

function ModalCompletar({ tarea, onCerrar, onReportar, onHecha }) {
  const id = useId();
  const sesion = useSesion();
  const [nota, setNota] = useState("");
  const { error, enviar } = useEnvio(() => {
    onHecha?.(tarea?.id);
    onCerrar();
  });
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

function FilaTarea({ tarea, onCompletar, recien = false }) {
  const sesion = useSesion();
  const ejecutar = useAccion();
  const hecha = tarea.estado === "Completada";
  const v = vencimiento(tarea.fecha);
  return (
    <li className={`flex flex-wrap items-start gap-x-3 gap-y-3 py-4 ${recien ? "aiden-tarea-recien" : ""}`}>
      <span className={`mt-0.5 shrink-0 ${hecha ? "aiden-tarea-check" : ""}`} aria-hidden="true">
        {hecha ? <CheckCircle2 size={20} className="text-verde-500" /> : <span className={`block h-5 w-5 rounded-full border-2 ${tarea.prioridad === "Alta" ? "border-red-500" : "border-slate-300"}`} />}
      </span>
      <span className="min-w-0 flex-1 basis-56">
        <span className={`block text-[15px] font-semibold leading-6 ${hecha ? "text-slate-500 line-through" : "text-slate-900"}`}>{tarea.titulo}</span>
        {!hecha && tarea.descripcion && <span className="mt-0.5 block text-sm leading-6 text-slate-600">{tarea.descripcion}</span>}
        {hecha && tarea.nota && <span className="mt-0.5 block text-sm text-slate-600">Nota: {tarea.nota}</span>}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
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
        <span className="flex w-full shrink-0 gap-2 pl-8 sm:w-auto sm:pl-0">
          {tarea.estado === "Pendiente" && (
            <Boton variante="contorno" icono={PlayCircle} aria-label={`Empezar, ${tarea.titulo}`} onClick={() => ejecutar(() => cambiarEstadoTarea(tarea.id, "En curso", sesion), "Tarea en curso")} className="min-h-11 flex-1 sm:flex-none">
              Empezar
            </Boton>
          )}
          <Boton variante="primario" icono={CheckCircle2} aria-label={`Hecha, ${tarea.titulo}`} onClick={() => onCompletar(tarea)} className="min-h-11 flex-1 sm:flex-none">
            Hecha
          </Boton>
        </span>
      )}
      {hecha && (
        <button type="button" onClick={() => ejecutar(() => cambiarEstadoTarea(tarea.id, "Pendiente", sesion), "Tarea reabierta")} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100" aria-label={`Deshacer, ${tarea.titulo}`}>
          <RotateCcw size={15} aria-hidden="true" />
          Deshacer
        </button>
      )}
    </li>
  );
}

function Grupo({ titulo, tareas, onCompletar, critico = false, recien }) {
  if (!tareas.length) return null;
  return (
    <section aria-label={titulo}>
      <h3 className={`pt-4 text-xs font-bold uppercase tracking-wider ${critico ? "text-red-700" : "text-slate-600"}`}>
        {titulo} · {tareas.length}
      </h3>
      <ul className="divide-y divide-slate-100">
        {tareas.map((t) => (
          <FilaTarea key={t.id} tarea={t} onCompletar={onCompletar} recien={t.id === recien} />
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
  const [recien, setRecien] = useState(null);
  const nombre = sesion?.name || "";

  // La tarea recién hecha celebra un instante (check que se dibuja y un anillo lima) y vuelve a la calma.
  useEffect(() => {
    if (!recien) return undefined;
    const espera = window.setTimeout(() => setRecien(null), 1800);
    return () => window.clearTimeout(espera);
  }, [recien]);
  const marcarHecha = (id) => {
    setRecien(id);
    try {
      navigator.vibrate?.(8);
    } catch {
      // Sin vibración disponible: la confirmación visual basta.
    }
  };
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
    <article className="aiden-rol-operario aiden-operario-vista flex flex-col gap-7 pb-24 lg:pb-0">
      <EncabezadoPagina rotulo="AiDEN / ejecución" titulo={`Mi jornada, ${nombre}`} descripcion="Tus tareas, tus lotes y lo que pasa en tus zonas hoy." />

      {/* En el celular las acciones van abajo, al alcance del pulgar; en escritorio, aquí. */}
      <section
        className="aiden-operario-acciones fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t border-slate-200 bg-aiden-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:z-auto lg:order-1 lg:flex lg:flex-wrap lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        aria-label="Acciones rápidas"
      >
        <Boton variante="primario" icono={ListChecks} aria-label="Registrar actividad" onClick={() => setModal({ tipo: "evento" })} className="!min-h-12 w-full !px-2 text-xs sm:w-auto sm:flex-1 sm:!px-3">
          <span className="sm:hidden">Actividad</span>
          <span className="hidden sm:inline">Registrar actividad</span>
        </Boton>
        <Boton variante="secundario" icono={FlagTriangleRight} aria-label="Reportar problema" onClick={() => setModal({ tipo: "incidencia" })} className="!min-h-12 w-full !px-2 text-xs sm:w-auto sm:flex-1 sm:!px-3">
          <span className="sm:hidden">Problema</span>
          <span className="hidden sm:inline">Reportar problema</span>
        </Boton>
        <Boton variante="secundario" icono={Thermometer} aria-label="Tomar lectura" onClick={() => setModal({ tipo: "lectura" })} className="!min-h-12 w-full !px-2 text-xs sm:w-auto sm:flex-1 sm:!px-3">
          <span className="sm:hidden">Lectura</span>
          <span className="hidden sm:inline">Tomar lectura</span>
        </Boton>
      </section>

      <Cifras
        className="order-3 lg:order-2"
        items={[
          { icono: ListChecks, etiqueta: "Mis tareas", valor: pendientes, detalle: `${plural(hechas.length, "hecha", "hechas")} hoy`, tono: pendientes ? "alerta" : "exito" },
          { icono: Sprout, etiqueta: "Lotes a cargo", valor: misLotes.length, detalle: "Asignados a ti", to: "/produccion" },
          { icono: AlertTriangle, etiqueta: "Prioridades", valor: urgentes.length, detalle: "Alta prioridad o vencidas", tono: urgentes.length ? "critico" : "exito" },
          { icono: Droplets, etiqueta: "Alertas de campo", valor: zonasAlerta.length, detalle: `Según ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax}%`, tono: zonasAlerta.length ? "alerta" : "exito", to: "/ambiental" },
        ]}
      />

      <section className="order-2 grid gap-4 lg:order-3 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Lo que tengo que hacer</h2>
              <p className="mt-1 text-sm text-slate-600">Marca cada tarea al terminarla: queda en la historia del lote.</p>
            </section>
            <Clock3 size={18} className="text-emerald-700" aria-hidden="true" />
          </header>
          <section className="mt-2">
            <Grupo titulo="Vencidas" critico tareas={vencidas} onCompletar={setCompletar} />
            <Grupo titulo="Para hoy" tareas={deHoy} onCompletar={setCompletar} />
            <Grupo titulo="Próximas" tareas={proximas} onCompletar={setCompletar} />
            <Grupo titulo="Hechas hoy" tareas={hechas} onCompletar={setCompletar} recien={recien} />
            {!tareas.length && <p className="py-8 text-center text-sm text-slate-500">No tienes tareas asignadas. Cuando supervisión te asigne trabajo aparecerá aquí.</p>}
            {tareas.length > 0 && !pendientes && !hechas.length && <p className="py-8 text-center text-sm text-slate-500">Todo al día. Registra lo que hagas en campo para que quede en la historia del lote.</p>}
          </section>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Mis lotes</h2>
            <p className="mt-1 text-xs text-slate-500">Lotes bajo tu responsabilidad</p>
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
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${e.fuera ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {e.fuera ? "Atención" : lote.etapa}
                    </span>
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

      <section className="order-4 grid gap-4">
        <article className={`aiden-operario-superficie rounded-[22px] border p-4 transition duration-200 hover:shadow-[0_14px_36px_rgba(11,47,32,0.06)] ${incidencias.length || zonasAlerta.length ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <header className="flex items-center gap-2">
            <AlertTriangle size={16} className={incidencias.length || zonasAlerta.length ? "text-amber-700" : "text-emerald-700"} aria-hidden="true" />
            <h2 className={`font-semibold ${incidencias.length || zonasAlerta.length ? "text-amber-900" : "text-slate-900"}`}>
              {incidencias.length || zonasAlerta.length ? "Atención" : "Sin novedades"}
            </h2>
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
            <p className="mt-2 text-sm leading-6 text-slate-600">No hay incidencias abiertas ni zonas fuera de rango en tus lotes.</p>
          )}
          <Link to="/calidad" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-900">
            Revisar calidad
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <ModalEvento abierto={modal?.tipo === "evento"} onCerrar={() => setModal(null)} />
      <ModalLectura abierto={modal?.tipo === "lectura"} onCerrar={() => setModal(null)} />
      <ModalIncidencia abierto={modal?.tipo === "incidencia"} onCerrar={() => setModal(null)} inicial={{ lote: modal?.lote }} />
      <ModalCompletar
        key={completar?.id || "ninguna"}
        tarea={completar}
        onCerrar={() => setCompletar(null)}
        onHecha={marcarHecha}
        onReportar={() => {
          const lote = completar?.lote;
          setCompletar(null);
          setModal({ tipo: "incidencia", lote });
        }}
      />
    </article>
  );
}

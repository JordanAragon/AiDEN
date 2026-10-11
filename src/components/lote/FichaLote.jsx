import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, ClipboardList, FilePenLine, FlagTriangleRight, History, ListPlus, PackageCheck, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import Insignia from "../ui/Insignia";
import Pestanas from "../ui/Pestanas";
import { TONO_ESTADO_TAREA, TONO_INCIDENCIA, TONO_PRIORIDAD } from "../ui/tonos";
import PasosEtapa from "./PasosEtapa";
import LineaTiempo from "./LineaTiempo";
import ModalTarea from "../formularios/ModalTarea";
import ModalIncidencia from "../formularios/ModalIncidencia";
import ModalEvento from "../formularios/ModalEvento";
import ModalLote, { ModalCerrarLote } from "../formularios/ModalLote";
import { useDatos } from "../../datos/almacen";
import { ETAPAS } from "../../datos/catalogos";
import { esGestor, estadoIncidencia, evaluarLectura, nombrePersona, resumenLote, ultimasLecturas } from "../../datos/selectores";
import { useAvanzarEtapa } from "../../hooks/useAvanzarEtapa";
import { useSesion } from "../../hooks/useSesion";
import { dinero, dineroOGuion, fechaCorta, haceTiempo, numero, vencimiento } from "../../utilidades/formato";

function Info({ etiqueta, valor, detalle, alerta = false }) {
  return (
    <section className={`rounded-xl p-3 ${alerta ? "bg-red-50" : "bg-slate-50"}`}>
      <p className={`text-[11px] ${alerta ? "text-red-700" : "text-slate-500"}`}>{etiqueta}</p>
      <p className={`mt-1 text-xs font-semibold ${alerta ? "text-red-600" : "text-slate-800"}`}>{valor}</p>
      {detalle && <p className={`mt-0.5 text-[11px] ${alerta ? "text-red-700" : "text-slate-500"}`}>{detalle}</p>}
    </section>
  );
}

function Tarjeta({ children }) {
  return <li className="rounded-xl border border-slate-200 bg-white p-3">{children}</li>;
}

function Contenido({ lote, datos, sesion, onAccion }) {
  const [pestana, setPestana] = useState("historia");
  const avanzar = useAvanzarEtapa();
  const r = useMemo(() => resumenLote(lote, datos), [lote, datos]);
  const gestor = esGestor(sesion);
  const cerrado = lote.estado === "Cerrado";
  const propio = sesion?.personaId === lote.responsableId;
  const puedeOperar = !cerrado && (gestor || propio);
  const lectura = ultimasLecturas(datos.ambiental).get(lote.ubicacion);
  const zona = evaluarLectura(lectura, datos.configuracion);
  const fechas = useMemo(() => {
    const mapa = { [ETAPAS[0]]: lote.fecha };
    for (const evento of [...r.eventos].reverse()) {
      if (evento.evento !== "Cambio de etapa") continue;
      const destino = ETAPAS.find((etapa) => evento.detalle.includes(`a ${etapa}`));
      if (destino) mapa[destino] = evento.fecha;
    }
    return mapa;
  }, [lote.fecha, r.eventos]);
  const costos = datos.costos.filter((c) => c.lote === lote.lote).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const salida = r.diasParaSalida;

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-2xl font-bold text-slate-950">{lote.cultivo}</p>
          {cerrado ? <Insignia>{`Cerrado · ${lote.motivoCierre || ""}`}</Insignia> : <Insignia tono="exito">{lote.etapa}</Insignia>}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {lote.ubicacion} · responsable {nombrePersona(datos.personas, lote.responsableId)}
        </p>
        {lote.notas && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{lote.notas}</p>}
        <div className="mt-5">
          <PasosEtapa etapa={lote.etapa} fechas={fechas} cerrado={cerrado} />
        </div>
        <section className="mt-5 grid grid-cols-2 gap-3">
          <Info etiqueta="Plantas vivas" valor={`${numero(r.plantas)} de ${numero(r.inicial)}`} detalle={`${numero(r.supervivencia)} % de supervivencia`} />
          <Info
            etiqueta={cerrado ? "Cierre" : "Salida estimada"}
            valor={cerrado ? fechaCorta(lote.cierre) : lote.fechaEstimada ? fechaCorta(lote.fechaEstimada) : "Sin fecha"}
            detalle={cerrado ? lote.motivoCierre : salida === null ? `${r.dias} días en vivero` : salida < 0 ? `Atrasada ${-salida} días` : `En ${salida} días · ${r.dias} en vivero`}
            alerta={!cerrado && salida !== null && salida < 0}
          />
          <Info
            etiqueta="Costo por planta"
            valor={dineroOGuion(r.costoPlanta)}
            detalle={r.costoPlanta === null ? `Sin plantas vivas · ${dinero(r.gasto)} acumulados` : `${dinero(r.gasto)} acumulados`}
          />
          <Info
            etiqueta="Incidencias abiertas"
            valor={r.incidenciasAbiertas.length || "Ninguna"}
            detalle={r.incidenciasAbiertas.map((i) => i.codigo).join(", ") || undefined}
            alerta={r.incidenciasAbiertas.some((i) => i.prioridad === "Alta")}
          />
        </section>
        {!cerrado && (
          <p className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs ${zona.fuera ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}>
            <span>
              <span className="font-semibold">{lote.ubicacion}:</span>{" "}
              {lectura ? `${numero(lectura.temperatura)} °C y ${numero(lectura.humedad)} % ${haceTiempo(lectura.fecha)}.` : "sin lecturas registradas."}
              {zona.fuera && " Fuera del rango configurado."}
            </span>
            <Link to={`/ambiental?zona=${encodeURIComponent(lote.ubicacion)}`} className="font-semibold text-emerald-700 hover:underline">
              Ver zona
            </Link>
          </p>
        )}
        <section className="mt-5 flex flex-wrap gap-2">
          {gestor && !cerrado && lote.etapa !== "Cosecha" && (
            <Boton variante="primario" tamano="sm" onClick={() => avanzar(lote)}>
              Avanzar de etapa
            </Boton>
          )}
          {gestor && !cerrado && lote.etapa === "Cosecha" && (
            <Boton variante="primario" tamano="sm" icono={PackageCheck} onClick={() => onAccion("cerrar")}>
              Cerrar lote
            </Boton>
          )}
          {gestor && !cerrado && lote.etapa !== "Cosecha" && (
            <Boton variante="contorno" tamano="sm" icono={Trash2} onClick={() => onAccion("cerrar")}>
              Descartar lote
            </Boton>
          )}
          {gestor && !cerrado && (
            <Boton variante="contorno" tamano="sm" icono={ClipboardList} onClick={() => onAccion("tarea")}>
              Crear tarea
            </Boton>
          )}
          {puedeOperar && (
            <Boton variante="contorno" tamano="sm" icono={ListPlus} onClick={() => onAccion("evento")}>
              Registrar actividad
            </Boton>
          )}
          {puedeOperar && (
            <Boton variante="contorno" tamano="sm" icono={FlagTriangleRight} onClick={() => onAccion("incidencia")}>
              Reportar incidencia
            </Boton>
          )}
          {gestor && !cerrado && (
            <Boton variante="contorno" tamano="sm" icono={FilePenLine} onClick={() => onAccion("editar")}>
              Editar
            </Boton>
          )}
        </section>
      </section>

      <aside className="aiden-ficha-seguimiento min-w-0 rounded-2xl bg-slate-50 p-4">
        <header className="flex items-center gap-2">
          <History size={16} className="text-emerald-700" aria-hidden="true" />
          <h3 className="font-semibold text-slate-900">Seguimiento del lote</h3>
        </header>
        <div className="mt-3">
          <Pestanas
            etiqueta="Seguimiento del lote"
            activa={pestana}
            onCambio={setPestana}
            pestanas={[
              { id: "historia", etiqueta: "Historia", cuenta: r.eventos.length },
              { id: "tareas", etiqueta: "Tareas", cuenta: r.tareasAbiertas.length },
              { id: "calidad", etiqueta: "Incidencias", cuenta: r.incidencias.length },
              ...(gestor ? [{ id: "costos", etiqueta: "Costos", cuenta: costos.length }] : []),
            ]}
          />
        </div>
        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`pestana-${pestana}`} tabIndex={0} className="mt-3 max-h-[46vh] overflow-y-auto rounded-xl pr-1 outline-offset-2">
          <ul className="space-y-2">
            {pestana === "historia" && r.eventos.length > 0 && (
              <li>
                <LineaTiempo eventos={r.eventos} limite={20} inicio={`Aquí empezó ${lote.lote}: registrado el ${fechaCorta(lote.fecha)}.`} />
              </li>
            )}
            {pestana === "tareas" &&
              r.tareas.map((t) => (
                <Tarjeta key={t.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${t.estado === "Completada" ? "text-slate-500 line-through" : "text-slate-800"}`}>{t.titulo}</p>
                    <Insignia tono={TONO_ESTADO_TAREA[t.estado]}>{t.estado}</Insignia>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {nombrePersona(datos.personas, t.responsableId)} · {t.estado === "Completada" ? `completada ${fechaCorta(t.completada)}` : vencimiento(t.fecha).texto}
                  </p>
                </Tarjeta>
              ))}
            {pestana === "calidad" &&
              r.incidencias.map((i) => (
                <Tarjeta key={i.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/calidad?incidencia=${i.id}`} className="font-mono text-[10px] font-bold text-emerald-700 hover:underline">
                      {i.codigo}
                    </Link>
                    <Insignia tono={TONO_PRIORIDAD[i.prioridad]}>{i.prioridad}</Insignia>
                    <Insignia tono={TONO_INCIDENCIA[estadoIncidencia(i)]}>{estadoIncidencia(i)}</Insignia>
                  </div>
                  <p className="mt-1 text-sm text-slate-800">{i.descripcion}</p>
                  {i.accion && <p className="mt-1 text-[11px] text-slate-500">Acción: {i.accion}</p>}
                </Tarjeta>
              ))}
            {pestana === "costos" &&
              costos.map((c) => (
                <Tarjeta key={c.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="min-w-0 text-sm text-slate-800">{c.concepto}</p>
                    <p className={`shrink-0 text-sm font-bold ${c.tipo === "ingreso" ? "text-emerald-700" : "text-slate-800"}`}>
                      {c.tipo === "ingreso" ? "+" : "−"}
                      {dinero(c.valor)}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {fechaCorta(c.fecha)} · {c.categoria}
                  </p>
                </Tarjeta>
              ))}
            {((pestana === "historia" && !r.eventos.length) ||
              (pestana === "tareas" && !r.tareas.length) ||
              (pestana === "calidad" && !r.incidencias.length) ||
              (pestana === "costos" && !costos.length)) && <li className="px-1 py-4 text-xs text-slate-500">Todavía no hay registros.</li>}
          </ul>
        </div>
        {pestana === "costos" && costos.length > 0 && (
          <p className="mt-3 text-xs text-slate-600">
            Gastos {dinero(r.gasto)} · Ingresos {dinero(r.ingreso)} · <span className={`font-semibold ${r.resultado < 0 ? "text-red-600" : "text-emerald-700"}`}>Resultado {dinero(r.resultado)}</span>
          </p>
        )}
        <Link to={`/trazabilidad?lote=${encodeURIComponent(lote.lote)}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
          Ver trazabilidad completa <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </aside>
    </section>
  );
}

export default function FichaLote({ codigo, lista = [], onIr, onCerrar }) {
  const datos = useDatos();
  const sesion = useSesion();
  const [modal, setModal] = useState(null);
  const lote = datos.lotes.find((item) => item.lote === codigo);
  const posicion = lista.indexOf(codigo);
  const anterior = posicion > 0 ? lista[posicion - 1] : null;
  const siguiente = posicion >= 0 && posicion < lista.length - 1 ? lista[posicion + 1] : null;

  // J / K recorren los lotes de la lista, como en Linear. No mientras se escribe ni con otro formulario encima.
  useEffect(() => {
    if (!codigo || modal) return undefined;
    const alTeclear = (evento) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const objetivo = evento.target;
      if (objetivo instanceof HTMLElement && (objetivo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(objetivo.tagName))) return;
      const tecla = evento.key.toLowerCase();
      if (tecla === "j" && siguiente) {
        evento.preventDefault();
        onIr?.(siguiente);
      } else if (tecla === "k" && anterior) {
        evento.preventDefault();
        onIr?.(anterior);
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [codigo, modal, anterior, siguiente, onIr]);

  const navegacion =
    lista.length > 1 && posicion >= 0 ? (
      <span className="aiden-ficha-navegacion">
        <span className="text-[11px] font-semibold tabular-nums text-slate-500" aria-live="polite">
          {posicion + 1} de {lista.length}
        </span>
        <button
          type="button"
          onClick={() => anterior && onIr?.(anterior)}
          disabled={!anterior}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-35"
          aria-label={anterior ? `Lote anterior, ${anterior}` : "No hay lote anterior"}
          aria-keyshortcuts="K"
          title="Lote anterior (K)"
        >
          <ChevronUp size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => siguiente && onIr?.(siguiente)}
          disabled={!siguiente}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-35"
          aria-label={siguiente ? `Lote siguiente, ${siguiente}` : "No hay lote siguiente"}
          aria-keyshortcuts="J"
          title="Lote siguiente (J)"
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </span>
    ) : null;

  return (
    <>
      <Modal abierto={Boolean(codigo)} onCerrar={onCerrar} variante="panel" titulo={`Lote ${codigo || ""}`} accionesEncabezado={navegacion}>
        {lote ? (
          <div key={lote.lote} className="aiden-ficha-cambio">
            <Contenido lote={lote} datos={datos} sesion={sesion} onAccion={setModal} />
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">No encontramos el lote {codigo}. Puede que el registro ya no esté disponible.</p>
        )}
      </Modal>
      {lote && (
        <>
          <ModalTarea abierto={modal === "tarea"} onCerrar={() => setModal(null)} inicial={{ lote: lote.lote, responsableId: lote.responsableId }} />
          <ModalIncidencia abierto={modal === "incidencia"} onCerrar={() => setModal(null)} inicial={{ lote: lote.lote }} />
          <ModalEvento abierto={modal === "evento"} onCerrar={() => setModal(null)} inicial={{ lote: lote.lote }} />
          <ModalLote abierto={modal === "editar"} onCerrar={() => setModal(null)} lote={lote} />
          <ModalCerrarLote abierto={modal === "cerrar"} onCerrar={() => setModal(null)} lote={lote} />
        </>
      )}
    </>
  );
}

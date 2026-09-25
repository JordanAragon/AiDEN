import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardPlus, Plus, RotateCcw, SearchCheck } from "lucide-react";
import { Boton } from "../ui/Boton";
import { AreaTexto, Seleccion } from "../ui/Campo";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Modal from "../ui/Modal";
import AlertaFormulario from "../ui/AlertaFormulario";
import { Buscador, Segmentos } from "../ui/Filtros";
import { TONO_ESTADO_TAREA, TONO_INCIDENCIA, TONO_PRIORIDAD } from "../ui/tonos";
import EtiquetaLote from "../lote/EtiquetaLote";
import ModalIncidencia from "../formularios/ModalIncidencia";
import ModalTarea from "../formularios/ModalTarea";
import { useDatos } from "../../datos/almacen";
import { PRIORIDADES } from "../../datos/catalogos";
import { actualizarIncidencia } from "../../datos/acciones";
import { esGestor, estadoIncidencia, incidenciasVisibles, nombrePersona, personasActivas } from "../../datos/selectores";
import { useAviso, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { coincide, diasEntre, fechaCorta, hoyISO, numero, plural, vencimiento } from "../../utilidades/formato";

const PESO = { Alta: 0, Media: 1, Baja: 2 };

function DetalleIncidencia({ incidencia, onCerrar, onTarea }) {
  const datos = useDatos();
  const sesion = useSesion();
  const gestor = esGestor(sesion);
  const estado = estadoIncidencia(incidencia);
  const [f, setF] = useState(() => ({ accion: incidencia.accion || "", responsableId: incidencia.responsableId, prioridad: incidencia.prioridad }));
  const { error, enviar } = useEnvio();
  const lote = datos.lotes.find((l) => l.lote === incidencia.lote);
  const tareas = datos.tareas.filter((t) => t.lote === incidencia.lote && (t.modulo === "Calidad" || t.titulo.includes(incidencia.codigo)));
  const personas = personasActivas(datos.personas, ["Operario", "Supervisor"]);
  const cambios = f.accion.trim() !== (incidencia.accion || "") || f.responsableId !== incidencia.responsableId || f.prioridad !== incidencia.prioridad;
  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.value }));
  const dias = diasEntre(incidencia.fecha, estado === "Cerrada" && incidencia.cierre ? incidencia.cierre : hoyISO());

  const mover = (nuevo, mensaje) => enviar(() => actualizarIncidencia(incidencia.id, { ...f, estado: nuevo }, sesion), mensaje);

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      variante="panel"
      titulo={incidencia.descripcion}
      encabezado={
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-600">{incidencia.codigo}</span>
          <Insignia tono={TONO_PRIORIDAD[incidencia.prioridad]}>{`Prioridad ${incidencia.prioridad.toLowerCase()}`}</Insignia>
          <Insignia tono={TONO_INCIDENCIA[estado]}>{estado}</Insignia>
        </div>
      }
      pie={
        gestor ? (
          <>
            {estado !== "Cerrada" && (
              <Boton variante="fantasma" icono={ClipboardPlus} onClick={() => onTarea(incidencia)} className="mr-auto">
                Asignar tarea
              </Boton>
            )}
            {cambios && estado !== "Cerrada" && (
              <Boton variante="secundario" onClick={() => enviar(() => actualizarIncidencia(incidencia.id, f, sesion), "Cambios guardados")}>
                Guardar cambios
              </Boton>
            )}
            {estado === "Abierta" && (
              <Boton variante="secundario" icono={SearchCheck} onClick={() => mover("En revisión", `${incidencia.codigo} en revisión`)}>
                Pasar a revisión
              </Boton>
            )}
            {estado !== "Cerrada" && (
              <Boton variante="primario" icono={CheckCircle2} onClick={() => mover("Cerrada", { titulo: `${incidencia.codigo} cerrada`, detalle: "La acción correctiva quedó en la trazabilidad del lote." })}>
                Cerrar incidencia
              </Boton>
            )}
            {estado === "Cerrada" && (
              <Boton variante="secundario" icono={RotateCcw} onClick={() => mover("Abierta", `${incidencia.codigo} reabierta`)}>
                Reabrir
              </Boton>
            )}
          </>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <AlertaFormulario mensaje={error} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Lote</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <EtiquetaLote codigo={incidencia.lote} />
              <span className="text-slate-600">{lote?.cultivo}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Zona</dt>
            <dd className="mt-1 text-slate-900">{lote?.ubicacion || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Reportada</dt>
            <dd className="mt-1 text-slate-900">
              {fechaCorta(incidencia.fecha)} · {nombrePersona(datos.personas, incidencia.reportadoPor || incidencia.responsableId)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{estado === "Cerrada" ? "Tiempo de cierre" : "Abierta hace"}</dt>
            <dd className={`tabular-nums mt-1 ${estado !== "Cerrada" && dias > 3 ? "font-semibold text-red-600" : "text-slate-900"}`}>{plural(dias, "día")}</dd>
          </div>
        </dl>

        {gestor && estado !== "Cerrada" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Seleccion etiqueta="Responsable" value={f.responsableId} onChange={cambiar("responsableId")}>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Seleccion>
              <Seleccion etiqueta="Prioridad" value={f.prioridad} onChange={cambiar("prioridad")}>
                {PRIORIDADES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Seleccion>
            </div>
            <AreaTexto
              etiqueta="Acción correctiva"
              value={f.accion}
              onChange={cambiar("accion")}
              rows={4}
              placeholder="Qué se hizo o se hará para corregirlo. Es obligatoria para cerrar."
              ayuda="Al cerrar, este texto queda en la historia del lote."
            />
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Responsable</p>
              <p className="mt-1 text-slate-900">{nombrePersona(datos.personas, incidencia.responsableId)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Acción correctiva</p>
              <p className="mt-1 text-slate-900">{incidencia.accion || "Todavía sin acción documentada."}</p>
            </div>
            {!gestor && <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">Supervisión gestiona el seguimiento y el cierre.</p>}
          </div>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Tareas relacionadas</h3>
          {tareas.length ? (
            <ul className="divide-y divide-slate-100">
              {tareas.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0 text-sm">
                    <span className="text-slate-900">{t.titulo}</span>
                    <span className="block text-xs text-slate-500">
                      {nombrePersona(datos.personas, t.responsableId)} · {t.estado === "Completada" ? "completada" : vencimiento(t.fecha).texto}
                    </span>
                  </span>
                  <Insignia tono={TONO_ESTADO_TAREA[t.estado]}>{t.estado}</Insignia>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin tareas de calidad para este lote.</p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function TarjetaIncidencia({ incidencia, onDetalle }) {
  const datos = useDatos();
  const sesion = useSesion();
  const aviso = useAviso();
  const gestor = esGestor(sesion);
  const estado = estadoIncidencia(incidencia);
  const [accion, setAccion] = useState(incidencia.accion || "");
  const [error, setError] = useState("");
  const lote = datos.lotes.find((l) => l.lote === incidencia.lote);
  const dias = diasEntre(incidencia.fecha, estado === "Cerrada" && incidencia.cierre ? incidencia.cierre : hoyISO());
  const cambiada = accion.trim() !== (incidencia.accion || "");

  const guardar = (cambios, mensaje) => {
    try {
      actualizarIncidencia(incidencia.id, cambios, sesion);
      setError("");
      aviso({ tipo: "exito", ...mensaje });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <section className="min-w-0">
          <p className="font-mono text-[10px] text-emerald-700">
            {incidencia.codigo} · <EtiquetaLote codigo={incidencia.lote} className="!font-normal" />
            {lote ? <span className="font-sans text-slate-500"> · {lote.cultivo}</span> : null}
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">{incidencia.descripcion}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {nombrePersona(datos.personas, incidencia.responsableId)} · {fechaCorta(incidencia.fecha)} ·{" "}
            <span className={estado !== "Cerrada" && dias > 3 ? "font-semibold text-red-600" : ""}>{estado === "Cerrada" ? `cerrada en ${plural(dias, "día")}` : dias === 0 ? "reportada hoy" : `abierta hace ${plural(dias, "día")}`}</span>
          </p>
        </section>
        <section className="flex items-center gap-2">
          <Insignia tono={TONO_PRIORIDAD[incidencia.prioridad]}>{incidencia.prioridad}</Insignia>
          {gestor ? (
            <select
              value={estado}
              onChange={(event) => guardar({ estado: event.target.value, accion }, { titulo: `${incidencia.codigo}: ${event.target.value.toLowerCase()}`, detalle: event.target.value === "Cerrada" ? "La acción correctiva quedó en la trazabilidad del lote." : undefined })}
              aria-label={`Estado de ${incidencia.codigo}`}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700"
            >
              <option>Abierta</option>
              <option>En revisión</option>
              <option>Cerrada</option>
            </select>
          ) : (
            <Insignia tono={TONO_INCIDENCIA[estado]}>{estado}</Insignia>
          )}
        </section>
      </header>
      <section className="mt-4">
        {gestor && estado !== "Cerrada" ? (
          <label className="block text-sm font-medium text-slate-600">
            Acción correctiva
            <span className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                value={accion}
                onChange={(event) => {
                  setAccion(event.target.value);
                  setError("");
                }}
                placeholder="Qué se hará para corregir... Es obligatoria para cerrar."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500"
              />
              {cambiada && (
                <Boton variante="suave" onClick={() => guardar({ accion }, { titulo: "Acción correctiva guardada" })}>
                  Guardar acción
                </Boton>
              )}
            </span>
          </label>
        ) : (
          <section className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{estado === "Cerrada" ? "Acción aplicada" : "Acción definida"}</p>
            <p className="mt-1 text-sm text-slate-700">{incidencia.accion || "Pendiente de definir por supervisión."}</p>
          </section>
        )}
        {error && (
          <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        <button type="button" onClick={() => onDetalle(incidencia.id)} className="mt-3 text-xs font-semibold text-emerald-700 hover:underline">
          Ver detalle y tareas relacionadas
        </button>
      </section>
    </article>
  );
}

export default function CalidadOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const [parametros, setParametros] = useSearchParams();
  const [estado, setEstado] = useState("Todas");
  const [prioridad, setPrioridad] = useState("Todas");
  const [consulta, setConsulta] = useState("");
  const [modal, setModal] = useState(null);
  useTitulo("Calidad");

  const visibles = incidenciasVisibles(datos, sesion);
  const seleccionada = visibles.find((i) => i.id === parametros.get("incidencia"));
  const cuenta = (e) => visibles.filter((i) => estadoIncidencia(i) === e).length;
  const filtradas = visibles
    .filter((i) => (estado === "Todas" || estadoIncidencia(i) === estado) && (prioridad === "Todas" || i.prioridad === prioridad) && coincide(`${i.codigo} ${i.descripcion} ${i.lote} ${i.accion} ${nombrePersona(datos.personas, i.responsableId)}`, consulta))
    .sort((a, b) => (estadoIncidencia(a) === "Cerrada") - (estadoIncidencia(b) === "Cerrada") || PESO[a.prioridad] - PESO[b.prioridad] || (a.fecha < b.fecha ? 1 : -1));
  const cerradas = visibles.filter((i) => estadoIncidencia(i) === "Cerrada" && i.cierre);
  const promedio = cerradas.length ? cerradas.reduce((s, i) => s + diasEntre(i.fecha, i.cierre), 0) / cerradas.length : null;
  const altas = visibles.filter((i) => estadoIncidencia(i) !== "Cerrada" && i.prioridad === "Alta").length;

  const abrir = (id) => {
    const siguiente = new URLSearchParams(parametros);
    if (id) siguiente.set("incidencia", id);
    else siguiente.delete("incidencia");
    setParametros(siguiente, { replace: true });
  };

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / seguimiento"
        titulo="Calidad"
        descripcion="Registra desviaciones y conserva la respuesta aplicada a cada incidencia. Solo se cierran con la acción correctiva documentada."
        acciones={
          <Boton variante="primario" icono={Plus} onClick={() => setModal({ tipo: "incidencia" })}>
            Nueva incidencia
          </Boton>
        }
      />

      <Cifras
        items={[
          { icono: ClipboardCheck, etiqueta: "Incidencias", valor: visibles.length, detalle: "Registros visibles", onClick: () => setEstado("Todas"), activo: estado === "Todas" },
          { icono: AlertCircle, etiqueta: "Abiertas", valor: cuenta("Abierta"), detalle: `${cuenta("En revisión")} más en revisión`, tono: "alerta", onClick: () => setEstado("Abierta"), activo: estado === "Abierta" },
          { icono: AlertTriangle, etiqueta: "Alta prioridad", valor: altas, detalle: "Requieren respuesta", tono: "critico", onClick: () => setPrioridad(prioridad === "Alta" ? "Todas" : "Alta"), activo: prioridad === "Alta" },
          { icono: CheckCircle2, etiqueta: "Resueltas", valor: cuenta("Cerrada"), detalle: promedio === null ? "Cerradas" : `Cierre medio en ${numero(Math.round(promedio * 10) / 10)} días`, onClick: () => setEstado("Cerrada"), activo: estado === "Cerrada" },
        ]}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex flex-wrap items-center gap-2">
          <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar incidencias" placeholder="Buscar incidencia, lote o responsable..." className="min-w-56 flex-1" />
          <Segmentos
            etiqueta="Estado"
            valor={estado}
            onCambio={setEstado}
            opciones={["Todas", "Abierta", "En revisión", "Cerrada"].map((e) => ({ valor: e, etiqueta: e, cuenta: e === "Todas" ? undefined : cuenta(e) }))}
          />
          <Segmentos etiqueta="Prioridad" valor={prioridad} onCambio={setPrioridad} opciones={["Todas", ...PRIORIDADES].map((p) => ({ valor: p, etiqueta: p === "Todas" ? "Toda prioridad" : p }))} />
        </header>
        <section className="mt-4 space-y-3">
          {filtradas.map((i) => (
            <TarjetaIncidencia key={`${i.id}-${estadoIncidencia(i)}-${i.accion}`} incidencia={i} onDetalle={abrir} />
          ))}
          {!filtradas.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              {visibles.length ? "No hay incidencias visibles para tu rol y filtros actuales." : "Sin incidencias registradas. Cuando alguien reporte un problema en un lote aparecerá aquí."}
            </p>
          )}
        </section>
      </section>

      {seleccionada && (
        <DetalleIncidencia
          key={`${seleccionada.id}-${estadoIncidencia(seleccionada)}`}
          incidencia={seleccionada}
          onCerrar={() => abrir(null)}
          onTarea={(i) =>
            setModal({
              tipo: "tarea",
              inicial: { titulo: `Acción correctiva ${i.codigo}`, lote: i.lote, modulo: "Calidad", prioridad: i.prioridad, fecha: hoyISO(), responsableId: i.responsableId, descripcion: i.accion || i.descripcion },
            })
          }
        />
      )}
      <ModalIncidencia abierto={modal?.tipo === "incidencia"} onCerrar={() => setModal(null)} />
      <ModalTarea abierto={modal?.tipo === "tarea"} onCerrar={() => setModal(null)} inicial={modal?.inicial} />
    </section>
  );
}

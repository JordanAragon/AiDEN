import { useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ClipboardList, ClipboardPlus, FilePenLine, ListTodo, Phone, Plus, Trash2, Users } from "lucide-react";
import { Boton, BotonIcono } from "../ui/Boton";
import { Entrada, Seleccion } from "../ui/Campo";
import Avatar from "../ui/Avatar";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Modal from "../ui/Modal";
import EstadoVacio from "../ui/EstadoVacio";
import Pestanas from "../ui/Pestanas";
import { FILA_ENCABEZADO, TH, TR } from "../ui/tabla";
import AlertaFormulario from "../ui/AlertaFormulario";
import { Buscador, Segmentos } from "../ui/Filtros";
import { TONO_ESTADO_TAREA, TONO_PRIORIDAD } from "../ui/tonos";
import EtiquetaLote from "../lote/EtiquetaLote";
import ModalTarea from "../formularios/ModalTarea";
import { useDatos } from "../../datos/almacen";
import { CARGO_A_ROL, DEPARTAMENTOS, ROLES } from "../../datos/catalogos";
import { cambiarEstadoPersona, cambiarEstadoTarea, cambiarRolUsuario, crearPersona, editarPersona, eliminarTarea, marcarCuentaRevisada } from "../../datos/acciones";
import { lotesActivos, nombrePersona, ordenarTareas, tareaVencida } from "../../datos/selectores";
import { useAccion, useConfirmar, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion, useUsuarios } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { coincide, fechaCorta, hoyISO, plural, vencimiento } from "../../utilidades/formato";

const CARGOS = Object.keys(CARGO_A_ROL);

function FormularioPersona({ id, persona, onListo }) {
  const sesion = useSesion();
  const [f, setF] = useState(() => (persona ? { ...persona } : { nombre: "", cargo: "Operario", departamento: "Producción", contacto: "" }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.value }));
  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(() => (persona ? editarPersona(persona.id, f, sesion) : crearPersona(f, sesion)), persona ? "Datos actualizados" : (n) => `${n.nombre} agregado al equipo`);
      }}
    >
      <AlertaFormulario mensaje={error} />
      <Entrada etiqueta="Nombre y apellido" value={f.nombre} onChange={cambiar("nombre")} data-autofocus autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Cargo" value={f.cargo} onChange={cambiar("cargo")} ayuda={persona ? "Si tiene cuenta, el acceso se cambia en Accesos." : undefined}>
          {CARGOS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Área" value={f.departamento} onChange={cambiar("departamento")}>
          {DEPARTAMENTOS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Seleccion>
      </div>
      <Entrada etiqueta="Teléfono" opcional type="tel" inputMode="tel" value={f.contacto} onChange={cambiar("contacto")} placeholder="310 555 0101" />
    </form>
  );
}

function PanelPersona({ persona, onCerrar, onEditar, onTarea }) {
  const datos = useDatos();
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const tareas = ordenarTareas(datos.tareas.filter((t) => t.responsableId === persona.id));
  const abiertas = tareas.filter((t) => t.estado !== "Completada");
  const lotes = lotesActivos(datos.lotes).filter((l) => l.responsableId === persona.id);
  const cuenta = usuarios.find((u) => u.personaId === persona.id);
  const inactivo = persona.estado === "Inactivo";

  const alternarEstado = async () => {
    if (!inactivo) {
      const ok = await confirmar({
        titulo: `Desactivar a ${persona.nombre}`,
        mensaje: "Deja de aparecer para asignar tareas y lotes. Su historial se conserva y puedes reactivarlo cuando quieras.",
        confirmar: "Desactivar",
        peligro: true,
      });
      if (!ok) return;
    }
    ejecutar(() => cambiarEstadoPersona(persona.id, inactivo ? "Activo" : "Inactivo", sesion), inactivo ? `${persona.nombre} reactivado` : `${persona.nombre} desactivado`);
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      variante="panel"
      titulo={persona.nombre}
      descripcion={`${persona.cargo} · ${persona.departamento}`}
      pie={
        <>
          <Boton variante="fantasma" onClick={alternarEstado} className={`mr-auto ${inactivo ? "" : "!text-red-600"}`}>
            {inactivo ? "Reactivar" : "Desactivar"}
          </Boton>
          <Boton variante="secundario" icono={FilePenLine} onClick={onEditar}>
            Editar
          </Boton>
          {!inactivo && (
            <Boton variante="primario" icono={ClipboardPlus} onClick={onTarea}>
              Asignar tarea
            </Boton>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar nombre={persona.nombre} tamano="lg" />
          <div className="min-w-0 text-sm">
            {inactivo && <Insignia className="mb-1">Inactivo</Insignia>}
            <p className="flex items-center gap-1.5 text-slate-600">
              <Phone size={14} aria-hidden="true" />
              {persona.contacto || "Sin teléfono"}
            </p>
            <p className="mt-0.5 text-slate-500">{cuenta ? `Cuenta: ${cuenta.email} (${ROLES[cuenta.role]})` : "Sin cuenta en AiDEN"}</p>
          </div>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Lotes a cargo</h3>
          {lotes.length ? (
            <div className="flex flex-wrap gap-2">
              {lotes.map((l) => (
                <EtiquetaLote key={l.id} codigo={l.lote} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Ninguno.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            Tareas abiertas <span className="tabular-nums font-normal text-slate-500">{abiertas.length}</span>
          </h3>
          {abiertas.length ? (
            <ul className="divide-y divide-slate-100">
              {abiertas.map((t) => {
                const v = vencimiento(t.fecha);
                return (
                  <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
                    <span className="min-w-0 text-sm">
                      <span className="text-slate-900">{t.titulo}</span>
                      <span className={`block text-xs ${v.tono === "critico" ? "font-semibold text-red-600" : "text-slate-500"}`}>
                        {v.texto}
                        {t.lote ? ` · ${t.lote}` : ""}
                      </span>
                    </span>
                    <Insignia tono={TONO_ESTADO_TAREA[t.estado]}>{t.estado}</Insignia>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin tareas abiertas.</p>
          )}
          {tareas.length > abiertas.length && <p className="mt-2 text-xs text-slate-500">{plural(tareas.length - abiertas.length, "tarea completada", "tareas completadas")} en total.</p>}
        </section>
      </div>
    </Modal>
  );
}

function VistaTareas({ filtroInicial, onEditar }) {
  const datos = useDatos();
  const sesion = useSesion();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const [estado, setEstado] = useState(filtroInicial === "vencidas" ? "Vencidas" : "Abiertas");
  const [responsable, setResponsable] = useState("");
  const [consulta, setConsulta] = useState("");
  const hoy = hoyISO();
  const pasa = {
    Abiertas: (t) => t.estado !== "Completada",
    Vencidas: (t) => tareaVencida(t, hoy),
    Completadas: (t) => t.estado === "Completada",
    Todas: () => true,
  };
  const tareas = ordenarTareas(
    datos.tareas.filter(
      (t) => pasa[estado](t) && (!responsable || t.responsableId === responsable) && coincide(`${t.titulo} ${t.descripcion} ${t.lote} ${t.modulo} ${nombrePersona(datos.personas, t.responsableId)}`, consulta),
    ),
  );
  const cuenta = (e) => datos.tareas.filter(pasa[e]).length;

  const borrar = async (t) => {
    const ok = await confirmar({ titulo: "Eliminar tarea", mensaje: `“${t.titulo}” desaparece de la jornada de ${nombrePersona(datos.personas, t.responsableId)}. Esta acción no se puede deshacer.`, confirmar: "Eliminar", peligro: true });
    if (ok) ejecutar(() => eliminarTarea(t.id, sesion), "Tarea eliminada");
  };

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:flex-wrap lg:items-center">
        <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar tareas" placeholder="Tarea, lote, área o persona" className="lg:max-w-xs lg:flex-1" />
        <Segmentos etiqueta="Estado" valor={estado} onCambio={setEstado} opciones={Object.keys(pasa).map((e) => ({ valor: e, etiqueta: e, cuenta: cuenta(e) }))} />
        <select value={responsable} onChange={(e) => setResponsable(e.target.value)} aria-label="Filtrar por responsable" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 lg:ml-auto lg:w-52">
          <option value="">Todo el equipo</option>
          {datos.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      {tareas.length ? (
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[880px]">
            <caption className="sr-only">Tareas del equipo</caption>
            <thead>
              <tr className={FILA_ENCABEZADO}>
                <th className={TH}>Tarea</th>
                <th className={TH}>Responsable</th>
                <th className={TH}>Lote</th>
                <th className={TH}>Fecha límite</th>
                <th className={TH}>Prioridad</th>
                <th className={TH}>Estado</th>
                <th className={TH}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((t) => {
                const v = vencimiento(t.fecha);
                const hecha = t.estado === "Completada";
                return (
                  <tr key={t.id} className={TR}>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[320px]">
                      <span className={`font-medium ${hecha ? "text-slate-500 line-through" : "text-slate-900"}`}>{t.titulo}</span>
                      <span className="block truncate text-xs text-slate-500">{hecha && t.nota ? `Nota: ${t.nota}` : `${t.modulo}${t.descripcion ? ` · ${t.descripcion}` : ""}`}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{nombrePersona(datos.personas, t.responsableId)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.lote ? <EtiquetaLote codigo={t.lote} /> : <span className="text-slate-500">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      <span className="tabular-nums">{fechaCorta(t.fecha)}</span>
                      {!hecha && <span className={`block text-xs ${v.tono === "critico" ? "font-semibold text-red-600" : v.tono === "alerta" ? "text-amber-700" : "text-slate-500"}`}>{v.texto}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <Insignia tono={TONO_PRIORIDAD[t.prioridad]}>{t.prioridad}</Insignia>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <select
                        value={t.estado}
                        onChange={(e) => ejecutar(() => cambiarEstadoTarea(t.id, e.target.value, sesion), `Tarea: ${e.target.value.toLowerCase()}`)}
                        aria-label={`Estado de ${t.titulo}`}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        <option>Pendiente</option>
                        <option>En curso</option>
                        <option>Completada</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex justify-end gap-1">
                        {!hecha && <BotonIcono icono={CheckCircle2} etiqueta={`Completar ${t.titulo}`} tamano="sm" onClick={() => ejecutar(() => cambiarEstadoTarea(t.id, "Completada", sesion), "Tarea completada")} />}
                        <BotonIcono icono={FilePenLine} etiqueta={`Editar ${t.titulo}`} tamano="sm" onClick={() => onEditar(t)} />
                        <BotonIcono icono={Trash2} etiqueta={`Eliminar ${t.titulo}`} tamano="sm" onClick={() => borrar(t)} className="hover:!bg-red-50 hover:!text-red-600" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EstadoVacio icono={ClipboardList} titulo={estado === "Vencidas" && !consulta && !responsable ? "No hay tareas vencidas" : "Ninguna tarea con estos filtros"} texto={estado === "Vencidas" ? "El equipo va al día." : "Cambia el estado, la persona o la búsqueda."} />
      )}
    </>
  );
}

function VistaAccesos() {
  const datos = useDatos();
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();

  const cambiarRol = async (u, rol) => {
    const ok = await confirmar({
      titulo: `Cambiar el rol de ${u.name}`,
      mensaje: `Pasará de ${ROLES[u.role]} a ${ROLES[rol]}. Verá los módulos de ese rol la próxima vez que cargue una vista.`,
      confirmar: "Cambiar rol",
    });
    if (ok) ejecutar(() => cambiarRolUsuario(u.id, rol, sesion), `${u.name} ahora es ${ROLES[rol].toLowerCase()}`);
  };

  return (
    <>
      <p className="border-b border-slate-200 px-5 py-3 text-sm text-slate-500">
        Las cuentas se guardan en este navegador: es una demostración sin servidor. Las cuentas creadas desde el registro entran como operario hasta que administración confirme su rol.
      </p>
      <div className="overflow-x-auto" tabIndex={0}>
        <table className="w-full min-w-[760px]">
          <caption className="sr-only">Cuentas con acceso</caption>
          <thead>
              <tr className={FILA_ENCABEZADO}>
              <th className={TH}>Persona</th>
              <th className={TH}>Correo</th>
              <th className={TH}>Rol</th>
              <th className={TH}>Creada</th>
              <th className={TH}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const propia = u.id === sesion.id;
              return (
                <tr key={u.id} className={TR}>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <span className="flex items-center gap-2.5">
                      <Avatar nombre={u.name} tamano="sm" />
                      <span>
                        <span className="block font-medium text-slate-900">{u.name}</span>
                        <span className="block text-xs text-slate-500">{datos.personas.some((p) => p.id === u.personaId) ? "Con ficha en Equipo" : "Sin ficha en Equipo"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <select value={u.role} disabled={propia} onChange={(e) => cambiarRol(u, e.target.value)} aria-label={`Rol de ${u.name}`} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700" title={propia ? "No puedes cambiar tu propio rol" : undefined}>
                      {Object.entries(ROLES).map(([valor, texto]) => (
                        <option key={valor} value={valor}>
                          {texto}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">{u.creado ? fechaCorta(u.creado) : "Cuenta demo"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {u.revisado ? (
                      <Insignia tono="exito">Confirmada</Insignia>
                    ) : (
                      <Boton tamano="sm" variante="suave" onClick={() => ejecutar(() => marcarCuentaRevisada(u.id, sesion), `Cuenta de ${u.name} confirmada como ${ROLES[u.role].toLowerCase()}`)}>
                        Confirmar como {ROLES[u.role].toLowerCase()}
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Equipo({ onPersona, onAsignar, onNueva }) {
  const datos = useDatos();
  const [consulta, setConsulta] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [estado, setEstado] = useState("Activo");
  const personas = datos.personas.filter(
    (p) => (p.estado || "Activo") === estado && (filtro === "Todos" || p.cargo === filtro) && coincide(`${p.nombre} ${p.cargo} ${p.departamento} ${p.contacto}`, consulta),
  );
  const inactivos = datos.personas.filter((p) => p.estado === "Inactivo").length;
  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar colaborador" placeholder="Buscar colaborador..." className="min-w-56 flex-1" />
        <Segmentos etiqueta="Cargo" valor={filtro} onCambio={setFiltro} opciones={["Todos", "Supervisor", "Operario", "Administrador"].map((v) => ({ valor: v, etiqueta: v }))} />
        {inactivos > 0 && (
          <Segmentos
            etiqueta="Estado"
            valor={estado}
            onCambio={setEstado}
            opciones={[
              { valor: "Activo", etiqueta: "Activos" },
              { valor: "Inactivo", etiqueta: "Inactivos", cuenta: inactivos },
            ]}
          />
        )}
        <button type="button" onClick={onNueva} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-200">
          <Plus size={14} aria-hidden="true" />
          Nuevo colaborador
        </button>
      </header>
      <section className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {personas.map((p) => {
          const propias = datos.tareas.filter((t) => t.responsableId === p.id);
          const abiertas = propias.filter((t) => t.estado !== "Completada");
          const vencidas = abiertas.filter((t) => tareaVencida(t)).length;
          const lotes = datos.lotes.filter((l) => l.responsableId === p.id && l.estado !== "Cerrado").length;
          return (
            <article key={p.id} className="rounded-2xl border border-slate-200 p-4">
              <header className="flex items-start justify-between gap-3">
                <section className="min-w-0">
                  <p className="font-semibold text-slate-900">{p.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {p.cargo} · {p.departamento}
                  </p>
                </section>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${p.estado === "Inactivo" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{p.estado || "Activo"}</span>
              </header>
              <section className="mt-4 grid grid-cols-3 gap-2">
                <Celda etiqueta="Tareas" valor={propias.length} />
                <Celda etiqueta="Pendientes" valor={abiertas.length} alerta={vencidas > 0} detalle={vencidas ? `${vencidas} vencida${vencidas === 1 ? "" : "s"}` : undefined} />
                <Celda etiqueta="Lotes" valor={lotes} />
              </section>
              <footer className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button type="button" onClick={() => onPersona(p.id)} className="text-xs font-semibold text-emerald-700 hover:underline">
                  Ver perfil
                </button>
                {p.estado !== "Inactivo" && (
                  <button type="button" onClick={() => onAsignar(p.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700">
                    <Plus size={13} aria-hidden="true" />
                    Asignar
                  </button>
                )}
              </footer>
            </article>
          );
        })}
        {!personas.length && <p className="p-10 text-center text-sm text-slate-500 sm:col-span-2 xl:col-span-3">No hay colaboradores que coincidan con el filtro.</p>}
      </section>
    </>
  );
}

function Celda({ etiqueta, valor, alerta = false, detalle }) {
  return (
    <section className={`rounded-xl p-2.5 ${alerta ? "bg-red-50" : "bg-slate-50"}`}>
      <p className="text-[10px] text-slate-500">{etiqueta}</p>
      <p className={`mt-1 text-sm font-bold ${alerta ? "text-red-600" : "text-slate-800"}`}>{valor}</p>
      {detalle && <p className="text-[10px] text-red-600">{detalle}</p>}
    </section>
  );
}

export default function PersonalOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const [parametros, setParametros] = useSearchParams();
  const [modal, setModal] = useState(null);
  const idForm = useId();
  useTitulo("Personal y tareas");

  const admin = sesion?.role === "admin";
  const vistaParam = parametros.get("vista");
  const vista = vistaParam === "tareas" ? "tareas" : vistaParam === "accesos" && admin ? "accesos" : "equipo";
  const persona = datos.personas.find((p) => p.id === parametros.get("persona"));
  const tareaParam = datos.tareas.find((t) => t.id === parametros.get("tarea"));

  const actualizar = (cambios) => {
    const siguiente = new URLSearchParams(parametros);
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === undefined) siguiente.delete(k);
      else siguiente.set(k, v);
    }
    setParametros(siguiente, { replace: true });
  };

  const activos = datos.personas.filter((p) => p.estado !== "Inactivo");
  const abiertas = datos.tareas.filter((t) => t.estado !== "Completada");
  const altas = abiertas.filter((t) => t.prioridad === "Alta");
  const completadas = datos.tareas.length - abiertas.length;
  const porRevisar = usuarios.filter((u) => !u.revisado).length;
  const conCarga = activos.filter((p) => p.cargo !== "Administrador");

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        icono={Users}
        rotulo="AiDEN / sistema"
        titulo="Personal y tareas"
        descripcion="Asigna trabajo, controla carga, fechas y avance por colaborador."
        acciones={
          <Boton variante="primario" icono={Plus} onClick={() => setModal({ tipo: "tarea" })}>
            Asignar tarea
          </Boton>
        }
      />

      <Cifras
        items={[
          { icono: Users, etiqueta: "Colaboradores", valor: datos.personas.length, detalle: `${activos.length} activos`, onClick: () => actualizar({ vista: null, filtro: null }), activo: vista === "equipo" },
          { icono: ListTodo, etiqueta: "Tareas pendientes", valor: abiertas.length, detalle: `${abiertas.filter((t) => t.estado === "En curso").length} en curso · ${abiertas.filter((t) => tareaVencida(t)).length} vencidas`, tono: "alerta", onClick: () => actualizar({ vista: "tareas", filtro: null }), activo: vista === "tareas" },
          { icono: AlertCircle, etiqueta: "Alta prioridad", valor: altas.length, detalle: "Sin completar", tono: "critico" },
          admin
            ? { icono: CheckCircle2, etiqueta: "Cuentas por revisar", valor: porRevisar, detalle: `${usuarios.length} cuentas · ${completadas} tareas completadas`, tono: porRevisar ? "alerta" : "exito", onClick: () => actualizar({ vista: "accesos" }), activo: vista === "accesos" }
            : { icono: CheckCircle2, etiqueta: "Completadas", valor: completadas, detalle: "Histórico de tareas" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="font-semibold text-slate-900">Carga de trabajo</h2>
              <p className="text-xs text-slate-500">Avance de tareas por persona</p>
            </section>
            <ClipboardList size={18} className="text-emerald-700" aria-hidden="true" />
          </header>
          <section className="mt-5 space-y-4">
            {conCarga.map((p) => {
              const propias = datos.tareas.filter((t) => t.responsableId === p.id);
              const hechas = propias.filter((t) => t.estado === "Completada").length;
              const pct = propias.length ? Math.round((hechas / propias.length) * 100) : 0;
              return (
                <button key={p.id} type="button" onClick={() => actualizar({ persona: p.id })} className="block w-full text-left">
                  <section className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 hover:text-emerald-700">{p.nombre}</p>
                    <span className="text-[11px] text-slate-500">
                      {hechas}/{propias.length} completadas
                    </span>
                  </section>
                  <section className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </section>
                </button>
              );
            })}
          </section>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Prioridades</p>
          <p className="mt-2 text-3xl font-bold">{altas.length}</p>
          <p className="text-sm text-white/70">tareas de alta prioridad pendientes</p>
          <section className="mt-5 space-y-2">
            {ordenarTareas(altas)
              .slice(0, 4)
              .map((t) => (
                <button key={t.id} type="button" onClick={() => setModal({ tipo: "tarea", tarea: t })} className="flex w-full items-start gap-3 rounded-xl bg-white/5 p-3 text-left hover:bg-white/10">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <span>
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <p className="mt-1 text-[11px] text-white/60">
                      {nombrePersona(datos.personas, t.responsableId)} · {vencimiento(t.fecha).texto.toLowerCase()}
                    </p>
                  </span>
                </button>
              ))}
          </section>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 pt-4">
          <Pestanas
            etiqueta="Vistas de personal"
            activa={vista}
            onCambio={(id) => actualizar({ vista: id === "equipo" ? null : id, filtro: null })}
            pestanas={[
              { id: "equipo", etiqueta: "Colaboradores", cuenta: activos.length },
              { id: "tareas", etiqueta: "Tareas", cuenta: abiertas.length },
              ...(admin ? [{ id: "accesos", etiqueta: "Accesos", cuenta: porRevisar || undefined }] : []),
            ]}
          />
          <div className="h-4" />
        </div>
        <div role="tabpanel" id={`panel-${vista}`} aria-labelledby={`pestana-${vista}`}>
          {vista === "equipo" && <Equipo onPersona={(id) => actualizar({ persona: id })} onAsignar={(id) => setModal({ tipo: "tarea", inicial: { responsableId: id } })} onNueva={() => setModal({ tipo: "persona" })} />}
          {vista === "tareas" && <VistaTareas key={parametros.get("filtro") || "todas"} filtroInicial={parametros.get("filtro")} onEditar={(t) => setModal({ tipo: "tarea", tarea: t })} />}
          {vista === "accesos" && <VistaAccesos />}
        </div>
      </section>

      {persona && (
        <PanelPersona
          persona={persona}
          onCerrar={() => actualizar({ persona: null })}
          onEditar={() => setModal({ tipo: "persona", persona })}
          onTarea={() => setModal({ tipo: "tarea", inicial: { responsableId: persona.id } })}
        />
      )}

      <Modal
        abierto={modal?.tipo === "persona"}
        onCerrar={() => setModal(null)}
        titulo={modal?.persona ? `Editar a ${modal.persona.nombre}` : "Nuevo colaborador"}
        descripcion={modal?.persona ? undefined : "Queda disponible para asignarle tareas y lotes. Para entrar a AiDEN debe crear su cuenta desde el registro."}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Boton>
            <Boton variante="primario" type="submit" form={idForm}>
              {modal?.persona ? "Guardar cambios" : "Agregar colaborador"}
            </Boton>
          </>
        }
      >
        <FormularioPersona key={modal?.persona?.id || "nueva"} id={idForm} persona={modal?.persona} onListo={() => setModal(null)} />
      </Modal>
      <ModalTarea key={modal?.tarea?.id || "nueva-tarea"} abierto={modal?.tipo === "tarea"} onCerrar={() => setModal(null)} tarea={modal?.tarea} inicial={modal?.inicial} />
      <ModalTarea abierto={Boolean(tareaParam) && !modal} onCerrar={() => actualizar({ tarea: null })} tarea={tareaParam} />
    </section>
  );
}

import { useState } from "react";

import { ClipboardPlus, FilePenLine, Phone } from "lucide-react";
import { Boton } from "../ui/Boton";
import { Entrada, Seleccion } from "../ui/Campo";
import Avatar from "../ui/Avatar";
import Insignia from "../ui/Insignia";
import Modal from "../ui/Modal";
import AlertaFormulario from "../ui/AlertaFormulario";
import { TONO_ESTADO_TAREA } from "../ui/tonos";
import EtiquetaLote from "../lote/EtiquetaLote";
import { useDatos } from "../../datos/almacen";
import { CARGO_A_ROL, DEPARTAMENTOS, ROLES } from "../../datos/catalogos";
import { cambiarEstadoPersona, crearPersona, editarPersona } from "../../datos/acciones";
import { lotesActivos, ordenarTareas } from "../../datos/selectores";
import { useConfirmar } from "../../contexto/retroalimentacion";
import { useSesion, useUsuarios } from "../../hooks/useSesion";
import { plural, vencimiento } from "../../utilidades/formato";

const CARGOS = Object.keys(CARGO_A_ROL);

export function FormularioPersona({ id, persona, onListo }) {
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

export function PanelPersona({ persona, onCerrar, onEditar, onTarea }) {
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

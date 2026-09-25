import { useId, useState } from "react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import { AreaTexto, Entrada, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { MODULOS_TAREA, PRIORIDADES } from "../../datos/catalogos";
import { crearTarea, editarTarea } from "../../datos/acciones";
import { lotesActivos, personasActivas } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { hoyISO } from "../../utilidades/formato";

function FormularioTarea({ id, tarea, inicial, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const personas = personasActivas(datos.personas, ["Operario", "Supervisor"]);
  const lotes = lotesActivos(datos.lotes);
  const loteInicial = lotes.find((l) => l.lote === (tarea?.lote ?? inicial?.lote));
  const [f, setF] = useState(() => ({
    titulo: tarea?.titulo ?? inicial?.titulo ?? "",
    responsableId: tarea?.responsableId ?? inicial?.responsableId ?? loteInicial?.responsableId ?? personas.find((p) => p.cargo === "Operario")?.id ?? "",
    prioridad: tarea?.prioridad ?? inicial?.prioridad ?? "Media",
    fecha: tarea?.fecha ?? inicial?.fecha ?? hoyISO(),
    modulo: tarea?.modulo ?? inicial?.modulo ?? "Producción",
    lote: tarea?.lote ?? inicial?.lote ?? "",
    descripcion: tarea?.descripcion ?? inicial?.descripcion ?? "",
  }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (evento) => setF((actual) => ({ ...actual, [campo]: evento.target.value }));

  return (
    <form
      id={id}
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(
          () => (tarea ? editarTarea(tarea.id, f, sesion) : crearTarea(f, sesion)),
          tarea ? "Tarea actualizada" : { titulo: "Tarea asignada", detalle: `${f.titulo} · ${personas.find((p) => p.id === f.responsableId)?.nombre || ""}` },
        );
      }}
      className="space-y-4"
    >
      <AlertaFormulario mensaje={error} />
      <Entrada etiqueta="Qué hay que hacer" value={f.titulo} onChange={cambiar("titulo")} placeholder="Ej. Deshoje del tercio inferior" required data-autofocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Responsable" value={f.responsableId} onChange={cambiar("responsableId")}>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {p.cargo}
            </option>
          ))}
        </Seleccion>
        <Entrada etiqueta="Fecha límite" type="date" value={f.fecha} onChange={cambiar("fecha")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Prioridad" value={f.prioridad} onChange={cambiar("prioridad")}>
          {PRIORIDADES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Área" value={f.modulo} onChange={cambiar("modulo")}>
          {MODULOS_TAREA.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Seleccion>
      </div>
      <Seleccion etiqueta="Lote relacionado" opcional value={f.lote} onChange={cambiar("lote")} ayuda="Al completarla, la tarea queda registrada en la historia del lote.">
        <option value="">Sin lote</option>
        {lotes.map((l) => (
          <option key={l.id} value={l.lote}>
            {l.lote} · {l.cultivo}
          </option>
        ))}
      </Seleccion>
      <AreaTexto etiqueta="Instrucciones" opcional value={f.descripcion} onChange={cambiar("descripcion")} placeholder="Dosis, cantidad, zona o criterio de terminado" />
    </form>
  );
}

export default function ModalTarea({ abierto, onCerrar, tarea, inicial }) {
  const id = useId();
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tarea ? "Editar tarea" : "Asignar tarea"}
      descripcion={tarea ? undefined : "La persona asignada la verá en su jornada."}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id}>
            {tarea ? "Guardar cambios" : "Asignar tarea"}
          </Boton>
        </>
      }
    >
      <FormularioTarea id={id} tarea={tarea} inicial={inicial} onListo={onCerrar} />
    </Modal>
  );
}

import { useId, useState } from "react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import { AreaTexto, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { PRIORIDADES } from "../../datos/catalogos";
import { crearIncidencia } from "../../datos/acciones";
import { lotesActivos, lotesVisibles, personasActivas } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";

const AYUDA_PRIORIDAD = {
  Alta: "Afecta la sanidad o el despacho. Supervisión la verá como alerta.",
  Media: "Hay que corregirla esta semana.",
  Baja: "Mejora o daño menor sin riesgo para las plantas.",
};

function FormularioIncidencia({ id, inicial, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const operario = sesion?.role === "operario";
  const lotes = lotesActivos(lotesVisibles(datos, sesion));
  const personas = personasActivas(datos.personas, ["Operario", "Supervisor"]);
  const [f, setF] = useState(() => {
    const lote = lotes.find((l) => l.lote === inicial?.lote) || lotes[0];
    return {
      lote: lote?.lote || "",
      prioridad: inicial?.prioridad || "Media",
      descripcion: inicial?.descripcion || "",
      responsableId: lote?.responsableId || personas[0]?.id || "",
    };
  });
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (evento) => setF((actual) => ({ ...actual, [campo]: evento.target.value }));

  if (!lotes.length) {
    return <p className="text-sm text-slate-600">{operario ? "No tienes lotes activos asignados. Si ves un problema en otro lote, avísale a supervisión." : "No hay lotes activos para reportar una incidencia."}</p>;
  }

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(() => crearIncidencia(f, sesion), (nueva) => ({ titulo: `Incidencia ${nueva.codigo} registrada`, detalle: operario ? "Supervisión ya puede verla." : undefined }));
      }}
    >
      <AlertaFormulario mensaje={error} />
      <Seleccion
        etiqueta="Lote afectado"
        value={f.lote}
        onChange={(evento) => {
          const lote = lotes.find((l) => l.lote === evento.target.value);
          setF((actual) => ({ ...actual, lote: evento.target.value, responsableId: lote?.responsableId || actual.responsableId }));
        }}
      >
        {lotes.map((l) => (
          <option key={l.id} value={l.lote}>
            {l.lote} · {l.cultivo} · {l.ubicacion}
          </option>
        ))}
      </Seleccion>
      <AreaTexto
        etiqueta="Qué observaste"
        value={f.descripcion}
        onChange={cambiar("descripcion")}
        placeholder="Ej. Manchas cafés en hojas de 2 bandejas de la mesa 4"
        data-autofocus
      />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-600">Prioridad</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRIORIDADES.map((p) => (
            <label
              key={p}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-500 ${
                f.prioridad === p ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input type="radio" name="prioridad" value={p} checked={f.prioridad === p} onChange={cambiar("prioridad")} className="sr-only" />
              {p}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{AYUDA_PRIORIDAD[f.prioridad]}</p>
      </fieldset>
      {!operario && (
        <Seleccion etiqueta="Responsable de resolverla" value={f.responsableId} onChange={cambiar("responsableId")}>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Seleccion>
      )}
    </form>
  );
}

export default function ModalIncidencia({ abierto, onCerrar, inicial }) {
  const id = useId();
  const datos = useDatos();
  const sesion = useSesion();
  const hayLotes = lotesActivos(lotesVisibles(datos, sesion)).length > 0;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Reportar incidencia"
      descripcion="Queda en Calidad y en la historia del lote."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id} disabled={!hayLotes}>
            Reportar incidencia
          </Boton>
        </>
      }
    >
      <FormularioIncidencia id={id} inicial={inicial} onListo={onCerrar} />
    </Modal>
  );
}

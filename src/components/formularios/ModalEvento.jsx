import { useId, useState } from "react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import { AreaTexto, Entrada, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { EVENTOS_MANUALES } from "../../datos/catalogos";
import { registrarEvento } from "../../datos/acciones";
import { lotesActivos, lotesVisibles } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { ahoraLocal } from "../../utilidades/formato";

const EJEMPLOS = {
  Riego: "Riego por goteo de 12 minutos en mesas 1 a 4",
  Fertilización: "NPK foliar, 3 ml por litro, 20 litros de mezcla",
  "Aplicación fitosanitaria": "Fungicida preventivo en todas las bandejas",
  Trasplante: "120 plántulas pasadas a bolsa 17×23",
  Inspección: "Revisión de 20 plantas: sin plagas visibles",
  Observación: "Plantas con buen color; 4 bandejas con menor altura",
};

function FormularioEvento({ id, inicial, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const lotes = lotesActivos(lotesVisibles(datos, sesion));
  const [f, setF] = useState(() => ({
    lote: lotes.find((l) => l.lote === inicial?.lote)?.lote || lotes[0]?.lote || "",
    evento: inicial?.evento || "Riego",
    fecha: ahoraLocal(),
    detalle: "",
  }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (evento) => setF((actual) => ({ ...actual, [campo]: evento.target.value }));

  if (!lotes.length) return <p className="text-sm text-slate-600">No tienes lotes activos para registrar actividades.</p>;

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(() => registrarEvento(f, sesion), { titulo: `${f.evento} registrado`, detalle: `Quedó en la historia de ${f.lote}.` });
      }}
    >
      <AlertaFormulario mensaje={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Lote" value={f.lote} onChange={cambiar("lote")}>
          {lotes.map((l) => (
            <option key={l.id} value={l.lote}>
              {l.lote} · {l.cultivo}
            </option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Actividad" value={f.evento} onChange={cambiar("evento")}>
          {EVENTOS_MANUALES.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </Seleccion>
      </div>
      <AreaTexto etiqueta="Qué se hizo" value={f.detalle} onChange={cambiar("detalle")} placeholder={`Ej. ${EJEMPLOS[f.evento]}`} data-autofocus />
      <Entrada etiqueta="Fecha y hora" type="datetime-local" value={f.fecha} max={ahoraLocal()} onChange={cambiar("fecha")} />
    </form>
  );
}

export default function ModalEvento({ abierto, onCerrar, inicial }) {
  const id = useId();
  const datos = useDatos();
  const sesion = useSesion();
  const hayLotes = lotesActivos(lotesVisibles(datos, sesion)).length > 0;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Registrar actividad"
      descripcion="Lo que se hace en campo queda en la trazabilidad del lote."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id} disabled={!hayLotes}>
            Registrar actividad
          </Boton>
        </>
      }
    >
      <FormularioEvento id={id} inicial={inicial} onListo={onCerrar} />
    </Modal>
  );
}

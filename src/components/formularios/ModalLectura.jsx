import { useId, useState } from "react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import { Entrada, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { registrarLectura } from "../../datos/acciones";
import { describirLectura, evaluarLectura, zonasVisibles } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { ahoraLocal } from "../../utilidades/formato";

function FormularioLectura({ id, inicial, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const zonas = zonasVisibles(datos, sesion);
  const cfg = datos.configuracion;
  const [f, setF] = useState(() => ({
    zona: zonas.includes(inicial?.zona) ? inicial.zona : zonas[0] || "",
    temperatura: "",
    humedad: "",
    iluminacion: "",
    fecha: ahoraLocal(),
  }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (evento) => setF((actual) => ({ ...actual, [campo]: evento.target.value }));
  const completa = f.temperatura !== "" && f.humedad !== "";
  const prevista = completa ? evaluarLectura(f, cfg) : null;

  if (!zonas.length) return <p className="text-sm text-slate-600">No tienes zonas asignadas. Las zonas salen de los lotes que tienes a cargo.</p>;

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(
          () => registrarLectura(f, sesion, sesion?.role === "operario" ? zonas : null),
          (nueva) => {
            const e = evaluarLectura(nueva, cfg);
            return e.fuera
              ? { titulo: `Lectura guardada: ${nueva.zona} en alerta`, detalle: `${describirLectura(nueva, cfg)}. Supervisión verá la alerta.` }
              : { titulo: "Lectura guardada", detalle: `${nueva.zona} está dentro de rango.` };
          },
        );
      }}
    >
      <AlertaFormulario mensaje={error} />
      <Seleccion etiqueta="Zona" value={f.zona} onChange={cambiar("zona")}>
        {zonas.map((z) => (
          <option key={z}>{z}</option>
        ))}
      </Seleccion>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Entrada etiqueta="Temperatura (°C)" type="number" inputMode="decimal" step="0.1" value={f.temperatura} onChange={cambiar("temperatura")} placeholder={`${cfg.tempMin}–${cfg.tempMax}`} data-autofocus />
        <Entrada etiqueta="Humedad (%)" type="number" inputMode="numeric" value={f.humedad} onChange={cambiar("humedad")} placeholder={`${cfg.humMin}–${cfg.humMax}`} />
        <Entrada etiqueta="Luz (lux)" opcional type="number" inputMode="numeric" value={f.iluminacion} onChange={cambiar("iluminacion")} className="col-span-2 sm:col-span-1" />
      </div>
      <Entrada etiqueta="Fecha y hora" type="datetime-local" value={f.fecha} max={ahoraLocal()} onChange={cambiar("fecha")} />
      {prevista && (
        <p className={`rounded-xl px-3.5 py-3 text-sm ${prevista.fuera ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`} role="status">
          {prevista.fuera
            ? `Con estos valores, ${f.zona} quedará en alerta: ${describirLectura(f, cfg)}.`
            : `Dentro del rango configurado (${cfg.tempMin}–${cfg.tempMax} °C, ${cfg.humMin}–${cfg.humMax} %).`}
        </p>
      )}
    </form>
  );
}

export default function ModalLectura({ abierto, onCerrar, inicial }) {
  const id = useId();
  const datos = useDatos();
  const sesion = useSesion();
  const hayZonas = zonasVisibles(datos, sesion).length > 0;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Registrar lectura ambiental"
      descripcion="Se compara contra los umbrales definidos en Configuración."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id} disabled={!hayZonas}>
            Guardar lectura
          </Boton>
        </>
      }
    >
      <FormularioLectura id={id} inicial={inicial} onListo={onCerrar} />
    </Modal>
  );
}

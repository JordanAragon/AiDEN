import { useId, useState } from "react";
import Modal from "../ui/Modal";
import { Boton } from "../ui/Boton";
import { AreaTexto, Entrada, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { ETAPAS } from "../../datos/catalogos";
import { cerrarLote, crearLote, editarLote, sugerirCodigoLote } from "../../datos/acciones";
import { personasActivas } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { hoyISO, numero, sumarDias } from "../../utilidades/formato";

function FormularioLote({ id, lote, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const responsables = personasActivas(datos.personas, ["Operario", "Supervisor"]);
  const [f, setF] = useState(() =>
    lote
      ? { ...lote, cantidad: String(lote.cantidad), notas: lote.notas || "" }
      : {
          lote: sugerirCodigoLote(),
          cultivo: "",
          cantidad: "",
          etapa: "Germinación",
          responsableId: responsables.find((p) => p.cargo === "Operario")?.id || "",
          ubicacion: datos.zonas[0]?.nombre || "",
          fecha: hoyISO(),
          fechaEstimada: sumarDias(hoyISO(), 45),
          notas: "",
        },
  );
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (evento) => setF((actual) => ({ ...actual, [campo]: evento.target.value }));

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(
          () =>
            lote
              ? editarLote(lote.lote, { cultivo: f.cultivo, cantidad: f.cantidad, responsableId: f.responsableId, ubicacion: f.ubicacion, fechaEstimada: f.fechaEstimada, notas: f.notas }, sesion)
              : crearLote(f, sesion),
          lote ? `Lote ${lote.lote} actualizado` : (nuevo) => ({ titulo: `Lote ${nuevo.lote} creado`, detalle: `${numero(nuevo.cantidad)} plantas de ${nuevo.cultivo} en ${nuevo.ubicacion}.` }),
        );
      }}
    >
      <AlertaFormulario mensaje={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada etiqueta="Código" value={f.lote} onChange={cambiar("lote")} readOnly={Boolean(lote)} ayuda={lote ? "El código no cambia: identifica la historia del lote." : "Sugerido según el último lote del año."} className="font-mono" />
        <Entrada etiqueta="Cultivo y variedad" value={f.cultivo} onChange={cambiar("cultivo")} placeholder="Ej. Tomate chonto" data-autofocus />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada
          etiqueta={lote ? "Plantas vivas" : "Plantas sembradas"}
          type="number"
          min={lote ? 0 : 1}
          max={lote?.cantidadInicial}
          inputMode="numeric"
          value={f.cantidad}
          onChange={cambiar("cantidad")}
          ayuda={lote ? `Se sembraron ${numero(lote.cantidadInicial)}. Si bajas la tabular-nums, se registra la pérdida.` : undefined}
        />
        {lote ? (
          <Entrada etiqueta="Etapa actual" value={lote.etapa} readOnly ayuda="Se cambia con “Avanzar etapa”." />
        ) : (
          <Seleccion etiqueta="Etapa inicial" value={f.etapa} onChange={cambiar("etapa")}>
            {ETAPAS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Seleccion>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Zona" value={f.ubicacion} onChange={cambiar("ubicacion")}>
          {datos.zonas.map((z) => (
            <option key={z.id}>{z.nombre}</option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Responsable" value={f.responsableId} onChange={cambiar("responsableId")}>
          {responsables.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Seleccion>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada etiqueta="Fecha de siembra" type="date" value={f.fecha} onChange={cambiar("fecha")} readOnly={Boolean(lote)} />
        <Entrada etiqueta="Salida estimada" opcional type="date" value={f.fechaEstimada} min={f.fecha} onChange={cambiar("fechaEstimada")} />
      </div>
      <AreaTexto etiqueta="Notas" opcional value={f.notas} onChange={cambiar("notas")} placeholder="Cliente, pedido o condición especial" />
    </form>
  );
}

export default function ModalLote({ abierto, onCerrar, lote }) {
  const id = useId();
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={lote ? `Editar ${lote.lote}` : "Nuevo lote"}
      descripcion={lote ? undefined : "El lote queda registrado en producción y abre su trazabilidad."}
      ancho="lg"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id}>
            {lote ? "Guardar cambios" : "Crear lote"}
          </Boton>
        </>
      }
    >
      <FormularioLote id={id} lote={lote} onListo={onCerrar} />
    </Modal>
  );
}

function FormularioCierre({ id, lote, onListo }) {
  const sesion = useSesion();
  const [motivo, setMotivo] = useState(lote.etapa === "Cosecha" ? "Despachado" : "Descartado");
  const [detalle, setDetalle] = useState("");
  const { error, enviar } = useEnvio(onListo);
  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar(() => cerrarLote(lote.lote, { motivo, detalle }, sesion), `Lote ${lote.lote} cerrado`);
      }}
    >
      <AlertaFormulario mensaje={error} />
      <p className="text-sm text-slate-600">
        {lote.lote} saldrá de la producción activa con {numero(lote.cantidad)} plantas. Su historia, costos e incidencias se conservan para reportes.
      </p>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-1.5 text-sm font-medium text-slate-600">Motivo</legend>
        {[
          ["Despachado", "Se vendió o entregó."],
          ["Descartado", "Se perdió o se retiró."],
        ].map(([valor, texto]) => (
          <label
            key={valor}
            className={`cursor-pointer rounded-xl border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-500 ${motivo === valor ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <input type="radio" name="motivo" value={valor} checked={motivo === valor} onChange={() => setMotivo(valor)} className="sr-only" />
            <span className="block text-sm font-semibold text-slate-900">{valor}</span>
            <span className="block text-xs text-slate-500">{texto}</span>
          </label>
        ))}
      </fieldset>
      <AreaTexto etiqueta="Detalle" opcional value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder={motivo === "Despachado" ? "Cliente o destino del despacho" : "Causa del descarte"} />
    </form>
  );
}

export function ModalCerrarLote({ abierto, onCerrar, lote }) {
  const id = useId();
  if (!lote) return null;
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={`Cerrar ${lote.lote}`}
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id}>
            Cerrar lote
          </Boton>
        </>
      }
    >
      <FormularioCierre id={id} lote={lote} onListo={onCerrar} />
    </Modal>
  );
}

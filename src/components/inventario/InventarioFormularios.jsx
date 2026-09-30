import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Casilla, Entrada, Seleccion } from "../ui/Campo";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { CATEGORIAS_INSUMO, UNIDADES } from "../../datos/catalogos";
import { crearInsumo, editarInsumo, registrarMovimiento } from "../../datos/acciones";
import { lotesActivos } from "../../datos/selectores";
import { useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { dinero, hoyISO, numero } from "../../utilidades/formato";

export function FormularioMovimiento({ id, inicial, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const lotes = lotesActivos(datos.lotes);
  const [f, setF] = useState(() => ({
    itemId: inicial?.itemId || datos.inventario[0]?.id || "",
    tipo: inicial?.tipo || "entrada",
    cantidad: "",
    fecha: hoyISO(),
    lote: "",
    motivo: "",
    cargarCosto: true,
  }));
  const { error, enviar } = useEnvio(onListo);
  const insumo = datos.inventario.find((i) => i.id === f.itemId);
  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const cantidad = Number(f.cantidad) || 0;
  const valor = cantidad * Number(insumo?.precio || 0);
  const quedaria = insumo ? Number(insumo.stock) + (f.tipo === "entrada" ? cantidad : -cantidad) : 0;

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(() => registrarMovimiento(f, sesion), (m) => ({
          titulo: `${m.tipo === "entrada" ? "Entrada" : "Salida"} registrada`,
          detalle: `${numero(m.cantidad)} ${insumo?.unidad} de ${m.item}. Quedan ${numero(quedaria)}.`,
        }));
      }}
    >
      <AlertaFormulario mensaje={error} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-600">Tipo de movimiento</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["entrada", "Entrada", "Compra o devolución", ArrowDownToLine],
            ["salida", "Salida", "Uso en un lote o pérdida", ArrowUpFromLine],
          ].map(([valorTipo, texto, ayuda, Icono]) => (
            <label
              key={valorTipo}
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-500 ${f.tipo === valorTipo ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <input type="radio" name="tipo" value={valorTipo} checked={f.tipo === valorTipo} onChange={cambiar("tipo")} className="sr-only" />
              <Icono size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-slate-900">{texto}</span>
                <span className="block text-xs text-slate-500">{ayuda}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Seleccion etiqueta="Insumo" value={f.itemId} onChange={cambiar("itemId")}>
        {datos.inventario.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre} · {numero(i.stock)} {i.unidad}
          </option>
        ))}
      </Seleccion>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada
          etiqueta={`Cantidad${insumo ? ` (${insumo.unidad})` : ""}`}
          type="number"
          min="1"
          max={f.tipo === "salida" ? insumo?.stock : undefined}
          inputMode="numeric"
          value={f.cantidad}
          onChange={cambiar("cantidad")}
          data-autofocus
          ayuda={insumo ? `Disponible: ${numero(insumo.stock)}${cantidad ? ` · quedarían ${numero(quedaria)}` : ""}` : undefined}
          error={f.tipo === "salida" && insumo && cantidad > Number(insumo.stock) ? `Solo hay ${numero(insumo.stock)} ${insumo.unidad}.` : undefined}
        />
        <Entrada etiqueta="Fecha" type="date" value={f.fecha} max={hoyISO()} onChange={cambiar("fecha")} />
      </div>
      {f.tipo === "salida" && (
        <Seleccion etiqueta="Lote que lo usa" opcional value={f.lote} onChange={cambiar("lote")} ayuda="Queda en la trazabilidad del lote.">
          <option value="">Sin lote (pérdida o uso general)</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.lote}>
              {l.lote} · {l.cultivo}
            </option>
          ))}
        </Seleccion>
      )}
      <Entrada etiqueta="Motivo o proveedor" opcional value={f.motivo} onChange={cambiar("motivo")} placeholder={f.tipo === "entrada" ? "Ej. Compra Agroinsumos del Cauca" : "Ej. Fertilización semana 3"} />
      {f.tipo === "salida" && f.lote && (
        <Casilla
          etiqueta={`Cargar ${dinero(valor)} al costo de ${f.lote}`}
          descripcion={`${numero(cantidad)} × ${dinero(insumo?.precio)} por ${insumo?.unidad}. Aparecerá en Costos y en el costo por planta.`}
          checked={f.cargarCosto}
          onChange={cambiar("cargarCosto")}
        />
      )}
    </form>
  );
}

export function FormularioInsumo({ id, insumo, onListo }) {
  const sesion = useSesion();
  const [f, setF] = useState(() => (insumo ? { ...insumo } : { nombre: "", categoria: CATEGORIAS_INSUMO[0], unidad: UNIDADES[0], minimo: "", precio: "", stock: "0" }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.value }));
  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(() => (insumo ? editarInsumo(insumo.id, f, sesion) : crearInsumo(f, sesion)), insumo ? "Insumo actualizado" : (n) => `${n.nombre} agregado al inventario`);
      }}
    >
      <AlertaFormulario mensaje={error} />
      <Entrada etiqueta="Nombre" value={f.nombre} onChange={cambiar("nombre")} placeholder="Ej. Bandeja de 72 alveolos" data-autofocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Categoría" value={f.categoria} onChange={cambiar("categoria")}>
          {CATEGORIAS_INSUMO.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Seleccion>
        <Seleccion etiqueta="Unidad" value={f.unidad} onChange={cambiar("unidad")}>
          {UNIDADES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </Seleccion>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Entrada etiqueta="Stock mínimo" type="number" min="0" inputMode="numeric" value={f.minimo} onChange={cambiar("minimo")} ayuda="Por debajo, se alerta." />
        <Entrada etiqueta="Precio unitario (COP)" type="number" min="0" inputMode="numeric" value={f.precio} onChange={cambiar("precio")} />
        {insumo ? (
          <Entrada etiqueta="Stock actual" value={`${numero(insumo.stock)} ${insumo.unidad}`} readOnly ayuda="Cambia con movimientos." />
        ) : (
          <Entrada etiqueta="Stock inicial" type="number" min="0" inputMode="numeric" value={f.stock} onChange={cambiar("stock")} />
        )}
      </div>
    </form>
  );
}

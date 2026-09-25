import { useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, CircleDollarSign, Download, FilePenLine, History, Package, Plus, Trash2, X } from "lucide-react";
import { Boton, BotonIcono } from "../ui/Boton";
import { Casilla, Entrada, Seleccion } from "../ui/Campo";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Modal from "../ui/Modal";
import Pestanas from "../ui/Pestanas";
import AlertaFormulario from "../ui/AlertaFormulario";
import { Buscador, Segmentos } from "../ui/Filtros";
import { FILA_ENCABEZADO, TD, TH, TR } from "../ui/tabla";
import EtiquetaLote from "../lote/EtiquetaLote";
import { useDatos } from "../../datos/almacen";
import { CATEGORIAS_INSUMO, UNIDADES } from "../../datos/catalogos";
import { crearInsumo, editarInsumo, eliminarInsumo, registrarMovimiento } from "../../datos/acciones";
import { lotesActivos, nombrePersona } from "../../datos/selectores";
import { useAccion, useConfirmar, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { coincide, dinero, fechaCorta, hoyISO, numero, plural } from "../../utilidades/formato";
import { descargarCSV } from "../../utilidades/exportar";

const bajo = (i) => Number(i.stock) <= Number(i.minimo);

function BarraStock({ insumo }) {
  const tope = Math.max(Number(insumo.minimo) * 3, Number(insumo.stock), 1);
  const pct = Math.min(100, (Number(insumo.stock) / tope) * 100);
  return (
    <section className="h-2 rounded-full bg-slate-100" aria-hidden="true">
      <span className={`block h-full rounded-full transition-[width] duration-500 ease-out ${bajo(insumo) ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
    </section>
  );
}

function FormularioMovimiento({ id, inicial, onListo }) {
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

function FormularioInsumo({ id, insumo, onListo }) {
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

function ModalFormulario({ abierto, onCerrar, titulo, descripcion, boton, children }) {
  const id = useId();
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={descripcion}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" type="submit" form={id}>
            {boton}
          </Boton>
        </>
      }
    >
      {children(id)}
    </Modal>
  );
}

export default function InventarioOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const [parametros, setParametros] = useSearchParams();
  const [vista, setVista] = useState("existencias");
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [tipoMov, setTipoMov] = useState("todos");
  const [modal, setModal] = useState(null);
  useTitulo("Inventario");

  const actualizar = (cambios) => {
    const siguiente = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === undefined || valor === "") siguiente.delete(clave);
      else siguiente.set(clave, valor);
    }
    setParametros(siguiente, { replace: true });
  };

  const soloBajo = parametros.get("filtro") === "bajo";
  const insumoParam = datos.inventario.find((i) => i.id === parametros.get("insumo"));
  const entradaDesdeAlerta = parametros.get("accion") === "entrada" && insumoParam;
  const detalle = !entradaDesdeAlerta ? insumoParam : null;
  const categorias = [...new Set(datos.inventario.map((i) => i.categoria))];

  const inventario = datos.inventario.filter((i) => (!soloBajo || bajo(i)) && (categoria === "Todos" || i.categoria === categoria) && coincide(`${i.nombre} ${i.id} ${i.categoria}`, consulta));
  const movimientos = [...datos.movimientos]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .filter((m) => (tipoMov === "todos" || m.tipo === tipoMov) && coincide(`${m.item} ${m.lote} ${m.motivo}`, consulta));
  const bajos = datos.inventario.filter(bajo);
  const valorBodega = datos.inventario.reduce((s, i) => s + Number(i.stock) * Number(i.precio || 0), 0);
  const mes = hoyISO().slice(0, 7);
  const salidasMes = datos.movimientos.filter((m) => m.tipo === "salida" && String(m.fecha).startsWith(mes));

  const borrar = async (insumo) => {
    const ok = await confirmar({
      titulo: `Eliminar ${insumo.nombre}`,
      mensaje: `Se quita del inventario con ${numero(insumo.stock)} ${insumo.unidad} en existencia. Sus movimientos pasados se conservan en el historial.`,
      confirmar: "Eliminar insumo",
      peligro: true,
    });
    if (ok && ejecutar(() => eliminarInsumo(insumo.id, sesion), `${insumo.nombre} eliminado`)) actualizar({ insumo: null });
  };

  const exportar = () =>
    ejecutar(
      () =>
        vista === "existencias"
          ? descargarCSV("aiden-inventario", inventario.map((i) => ({ Código: i.id, Insumo: i.nombre, Categoría: i.categoria, Stock: i.stock, Unidad: i.unidad, Mínimo: i.minimo, "Precio unitario": i.precio, Valor: Number(i.stock) * Number(i.precio || 0), Estado: bajo(i) ? "Bajo mínimo" : "Suficiente" })))
          : descargarCSV("aiden-movimientos", movimientos.map((m) => ({ Fecha: m.fecha, Insumo: m.item, Tipo: m.tipo, Cantidad: m.cantidad, Lote: m.lote, Motivo: m.motivo, Valor: m.valor, Responsable: nombrePersona(datos.personas, m.responsableId, "") }))),
      (n) => plural(n, "fila exportada", "filas exportadas"),
    );

  const historial = detalle ? datos.movimientos.filter((m) => m.itemId === detalle.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) : [];
  const consumoPorLote = historial.filter((m) => m.tipo === "salida" && m.lote).reduce((mapa, m) => mapa.set(m.lote, (mapa.get(m.lote) || 0) + Number(m.cantidad)), new Map());
  const cerrarMovimiento = () => {
    setModal(null);
    if (entradaDesdeAlerta) actualizar({ accion: null, insumo: null });
  };

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / operación"
        titulo="Inventario"
        descripcion="Control de stock con entradas, salidas, alertas de reposición e historial de movimientos. Las salidas hacia un lote quedan en su trazabilidad y pueden cargarse a su costo."
        acciones={
          <>
            <Boton variante="secundario" icono={History} onClick={() => setModal({ tipo: "movimiento" })} disabled={!datos.inventario.length}>
              Movimiento
            </Boton>
            <Boton variante="primario" icono={Plus} onClick={() => setModal({ tipo: "insumo" })}>
              Nuevo insumo
            </Boton>
          </>
        }
      />

      <Cifras
        items={[
          { icono: Package, etiqueta: "Artículos", valor: datos.inventario.length, detalle: plural(categorias.length, "categoría", "categorías") },
          { icono: AlertTriangle, etiqueta: "Bajo mínimo", valor: bajos.length, detalle: bajos.length ? (soloBajo ? "Filtrando la tabla" : "Toca para filtrar la tabla") : "Stock suficiente", tono: "alerta", onClick: () => actualizar({ filtro: soloBajo ? null : "bajo" }), activo: soloBajo },
          { icono: CircleDollarSign, etiqueta: "Valor en stock", valor: dinero(valorBodega), detalle: "Existencia × precio", tono: "info" },
          { icono: History, etiqueta: "Movimientos", valor: datos.movimientos.length, detalle: `${plural(salidasMes.length, "salida", "salidas")} este mes · ${dinero(salidasMes.reduce((s, m) => s + Number(m.valor || 0), 0))}` },
        ]}
      />

      {bajos.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <header className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-700" aria-hidden="true" />
            <h2 className="font-semibold text-amber-900">Cola de reposición</h2>
          </header>
          <section className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {bajos.map((i) => (
              <button key={i.id} type="button" onClick={() => setModal({ tipo: "movimiento", itemId: i.id, mov: "entrada" })} className="flex items-center justify-between rounded-xl border border-amber-200 bg-white/70 p-3 text-left hover:bg-white">
                <span>
                  <strong className="block text-sm text-slate-800">{i.nombre}</strong>
                  <small className="text-xs text-slate-600">
                    {numero(i.stock)} / mínimo {numero(i.minimo)} {i.unidad}
                  </small>
                </span>
                <span className="text-xs font-bold text-amber-700">Reponer</span>
              </button>
            ))}
          </section>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Pestanas
            etiqueta="Vista de inventario"
            activa={vista}
            onCambio={setVista}
            pestanas={[
              { id: "existencias", etiqueta: "Existencias", cuenta: datos.inventario.length },
              { id: "movimientos", etiqueta: "Movimientos", cuenta: datos.movimientos.length },
            ]}
          />
          <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar en inventario" placeholder={vista === "existencias" ? "Buscar insumo o código..." : "Buscar insumo, lote o motivo..."} className="min-w-56 flex-1" />
          {vista === "existencias" ? (
            <Segmentos etiqueta="Categoría" valor={categoria} onCambio={setCategoria} opciones={["Todos", ...categorias].map((c) => ({ valor: c, etiqueta: c }))} />
          ) : (
            <Segmentos
              etiqueta="Tipo de movimiento"
              valor={tipoMov}
              onCambio={setTipoMov}
              opciones={[
                { valor: "todos", etiqueta: "Todos" },
                { valor: "entrada", etiqueta: "Entradas" },
                { valor: "salida", etiqueta: "Salidas" },
              ]}
            />
          )}
          <Boton variante="contorno" tamano="sm" icono={Download} onClick={exportar} disabled={vista === "existencias" ? !inventario.length : !movimientos.length}>
            CSV
          </Boton>
          {soloBajo && vista === "existencias" && (
            <button type="button" onClick={() => actualizar({ filtro: null })} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              Solo bajo mínimo <X size={12} aria-hidden="true" />
              <span className="sr-only">Quitar filtro</span>
            </button>
          )}
        </header>
        <section role="tabpanel" id={`panel-${vista}`} aria-labelledby={`pestana-${vista}`} className="overflow-x-auto" tabIndex={0}>
          {vista === "existencias" ? (
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className={FILA_ENCABEZADO}>
                  {["Insumo", "Categoría", "Stock", "Nivel", "Mínimo", "Valor", "Acciones"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventario.map((i) => (
                  <tr key={i.id} className={TR}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => actualizar({ insumo: i.id, accion: null })} className="text-left">
                        <p className="text-sm font-semibold text-slate-800 hover:text-emerald-700">{i.nombre}</p>
                        <p className="font-mono text-[10px] text-slate-500">{i.id}</p>
                      </button>
                    </td>
                    <td className={TD}>{i.categoria}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">
                      {numero(i.stock)} <span className="font-normal text-slate-500">{i.unidad}</span>
                    </td>
                    <td className="w-44 px-4 py-3">
                      <BarraStock insumo={i} />
                    </td>
                    <td className={TD}>{numero(i.minimo)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{dinero(Number(i.stock) * Number(i.precio || 0))}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setModal({ tipo: "movimiento", itemId: i.id })} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                        <ArrowLeftRight size={13} aria-hidden="true" />
                        Mover
                      </button>
                    </td>
                  </tr>
                ))}
                {!inventario.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      {datos.inventario.length ? "Ningún insumo coincide con los filtros." : "El inventario está vacío. Agrega el primer insumo con “Nuevo insumo”."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className={FILA_ENCABEZADO}>
                  {["Fecha", "Insumo", "Tipo", "Cantidad", "Lote", "Motivo", "Valor"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className={TR}>
                    <td className={`${TD} whitespace-nowrap`}>{fechaCorta(m.fecha)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{m.item}</td>
                    <td className="px-4 py-3">
                      <Insignia tono={m.tipo === "entrada" ? "exito" : "neutral"}>{m.tipo === "entrada" ? "entrada" : "salida"}</Insignia>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {m.tipo === "entrada" ? "+" : "−"}
                      {numero(m.cantidad)}
                    </td>
                    <td className="px-4 py-3">{m.lote ? <EtiquetaLote codigo={m.lote} /> : <span className="text-xs text-slate-500">—</span>}</td>
                    <td className={`${TD} max-w-[240px] truncate`}>{m.motivo}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{dinero(m.valor)}</td>
                  </tr>
                ))}
                {!movimientos.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      Sin movimientos para estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </section>

      <Modal
        abierto={Boolean(detalle)}
        onCerrar={() => actualizar({ insumo: null })}
        variante="panel"
        titulo={detalle?.nombre}
        descripcion={detalle ? `${detalle.categoria} · ${detalle.id}` : undefined}
        pie={
          detalle && (
            <>
              <BotonIcono icono={Trash2} etiqueta="Eliminar insumo" onClick={() => borrar(detalle)} className="mr-auto hover:!bg-red-50 hover:!text-red-600" />
              <Boton variante="contorno" icono={FilePenLine} onClick={() => setModal({ tipo: "insumo", insumo: detalle })}>
                Editar
              </Boton>
              <Boton variante="contorno" icono={ArrowUpFromLine} onClick={() => setModal({ tipo: "movimiento", itemId: detalle.id, mov: "salida" })} disabled={Number(detalle.stock) <= 0}>
                Salida
              </Boton>
              <Boton variante="primario" icono={ArrowDownToLine} onClick={() => setModal({ tipo: "movimiento", itemId: detalle.id, mov: "entrada" })}>
                Entrada
              </Boton>
            </>
          )
        }
      >
        {detalle && (
          <div className="space-y-5">
            <section className="grid grid-cols-3 gap-3">
              {[
                ["Stock", `${numero(detalle.stock)} ${detalle.unidad}`, bajo(detalle)],
                ["Mínimo", `${numero(detalle.minimo)} ${detalle.unidad}`, false],
                ["Valor", dinero(Number(detalle.stock) * Number(detalle.precio || 0)), false],
              ].map(([k, v, alerta]) => (
                <section key={k} className={`rounded-xl p-3 ${alerta ? "bg-amber-50" : "bg-slate-50"}`}>
                  <p className="text-[10px] text-slate-500">{k}</p>
                  <p className={`mt-1 text-xs font-semibold ${alerta ? "text-amber-700" : "text-slate-800"}`}>{v}</p>
                </section>
              ))}
            </section>
            {bajo(detalle) && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">Está en o por debajo del mínimo. Registra una entrada cuando llegue la compra.</p>}
            {consumoPorLote.size > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-900">Consumo por lote</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {[...consumoPorLote].map(([lote, cantidad]) => (
                    <li key={lote} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <EtiquetaLote codigo={lote} />
                      {numero(cantidad)} {detalle.unidad}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="text-sm font-semibold text-slate-900">Historial de movimientos</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {historial.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 py-2.5">
                    <span className="min-w-0 text-sm">
                      <span className="text-slate-800">{m.motivo}</span>
                      <span className="block text-[11px] text-slate-500">
                        {fechaCorta(m.fecha)}
                        {m.lote ? ` · ${m.lote}` : ""} · {nombrePersona(datos.personas, m.responsableId, "Sin registro")}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-bold ${m.tipo === "entrada" ? "text-emerald-700" : "text-slate-800"}`}>
                      {m.tipo === "entrada" ? "+" : "−"}
                      {numero(m.cantidad)}
                    </span>
                  </li>
                ))}
                {!historial.length && <li className="py-4 text-sm text-slate-500">Sin movimientos registrados.</li>}
              </ul>
            </section>
          </div>
        )}
      </Modal>

      <ModalFormulario abierto={modal?.tipo === "movimiento" || Boolean(entradaDesdeAlerta)} onCerrar={cerrarMovimiento} titulo="Registrar movimiento" descripcion="El stock se actualiza al guardar." boton="Guardar movimiento">
        {(id) => <FormularioMovimiento id={id} inicial={entradaDesdeAlerta ? { itemId: insumoParam.id, tipo: "entrada" } : { itemId: modal?.itemId, tipo: modal?.mov }} onListo={cerrarMovimiento} />}
      </ModalFormulario>

      <ModalFormulario abierto={modal?.tipo === "insumo"} onCerrar={() => setModal(null)} titulo={modal?.insumo ? `Editar ${modal.insumo.nombre}` : "Nuevo insumo"} boton={modal?.insumo ? "Guardar cambios" : "Agregar insumo"}>
        {(id) => <FormularioInsumo id={id} insumo={modal?.insumo} onListo={() => setModal(null)} />}
      </ModalFormulario>
    </section>
  );
}

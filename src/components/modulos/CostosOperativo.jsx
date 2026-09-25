import { useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CircleDollarSign, Download, FilePenLine, Plus, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { Boton, BotonIcono } from "../ui/Boton";
import { Entrada, Seleccion } from "../ui/Campo";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import { Selector } from "../ui/Campo";
import { FILA_ENCABEZADO, TD, TH, TR } from "../ui/tabla";
import Modal from "../ui/Modal";
import AlertaFormulario from "../ui/AlertaFormulario";
import { Buscador, Segmentos } from "../ui/Filtros";
import EtiquetaLote from "../lote/EtiquetaLote";
import { useDatos } from "../../datos/almacen";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "../../datos/catalogos";
import { crearCosto, editarCosto, eliminarCosto } from "../../datos/acciones";
import { costosPorLote, lotesActivos, resumenLote } from "../../datos/selectores";
import { useAccion, useConfirmar, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { useColoresGrafica } from "../../hooks/useColoresGrafica";
import { coincide, dinero, dineroCorto, fechaCorta, hoyISO, plural, sumarDias } from "../../utilidades/formato";
import { descargarCSV } from "../../utilidades/exportar";

const PERIODOS = [
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "90", etiqueta: "90 días" },
  { valor: "todo", etiqueta: "Todo" },
];

function enPeriodo(fecha, periodo) {
  if (periodo === "todo") return true;
  if (periodo === "mes") return String(fecha).slice(0, 7) === hoyISO().slice(0, 7);
  return fecha >= sumarDias(hoyISO(), -90);
}

function FormularioCosto({ id, costo, onListo }) {
  const datos = useDatos();
  const sesion = useSesion();
  const [f, setF] = useState(() => (costo ? { ...costo, valor: String(costo.valor) } : { tipo: "gasto", concepto: "", categoria: CATEGORIAS_GASTO[0], valor: "", fecha: hoyISO(), lote: "" }));
  const { error, enviar } = useEnvio(onListo);
  const cambiar = (campo) => (e) => setF((a) => ({ ...a, [campo]: e.target.value }));
  const categorias = f.tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(() => (costo ? editarCosto(costo.id, f, sesion) : crearCosto(f, sesion)), costo ? "Movimiento actualizado" : (n) => `${n.tipo === "ingreso" ? "Ingreso" : "Gasto"} de ${dinero(n.valor)} registrado`);
      }}
    >
      <AlertaFormulario mensaje={error} />
      {costo?.origen === "inventario" && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Este gasto se generó desde una salida de inventario. Editarlo no cambia el stock.</p>}
      <Segmentos
        etiqueta="Tipo"
        valor={f.tipo}
        onCambio={(tipo) => setF((a) => ({ ...a, tipo, categoria: (tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO)[0] }))}
        opciones={[
          { valor: "gasto", etiqueta: "Gasto" },
          { valor: "ingreso", etiqueta: "Ingreso" },
        ]}
      />
      <Entrada etiqueta="Concepto" value={f.concepto} onChange={cambiar("concepto")} placeholder={f.tipo === "ingreso" ? "Ej. Venta de 400 plántulas a Finca La Esperanza" : "Ej. Jornales de trasplante"} data-autofocus />
      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion etiqueta="Categoría" value={categorias.includes(f.categoria) ? f.categoria : categorias[0]} onChange={cambiar("categoria")}>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Seleccion>
        <Entrada etiqueta="Valor (COP)" type="number" min="1" inputMode="numeric" value={f.valor} onChange={cambiar("valor")} ayuda={Number(f.valor) > 0 ? dinero(Number(f.valor)) : undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada etiqueta="Fecha" type="date" value={f.fecha} max={hoyISO()} onChange={cambiar("fecha")} />
        <Seleccion etiqueta="Lote" opcional value={f.lote} onChange={cambiar("lote")} ayuda="Suma al costo por planta del lote.">
          <option value="">Gasto general del vivero</option>
          {datos.lotes.map((l) => (
            <option key={l.id} value={l.lote}>
              {l.lote} · {l.cultivo}
              {l.estado === "Cerrado" ? " (cerrado)" : ""}
            </option>
          ))}
        </Seleccion>
      </div>
    </form>
  );
}

export default function CostosOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const colores = useColoresGrafica();
  const idForm = useId();
  const [periodo, setPeriodo] = useState("todo");
  const [tipo, setTipo] = useState("todos");
  const [lote, setLote] = useState("");
  const [consulta, setConsulta] = useState("");
  const [modal, setModal] = useState(null);
  useTitulo("Costos");

  const delPeriodo = datos.costos.filter((c) => enPeriodo(c.fecha, periodo));
  const gastosLista = delPeriodo.filter((c) => c.tipo !== "ingreso");
  const ingresosLista = delPeriodo.filter((c) => c.tipo === "ingreso");
  const gastos = gastosLista.reduce((s, c) => s + Number(c.valor), 0);
  const ingresos = ingresosLista.reduce((s, c) => s + Number(c.valor), 0);
  const activos = lotesActivos(datos.lotes).map((l) => resumenLote(l, datos));
  const plantas = activos.reduce((s, r) => s + r.plantas, 0);
  const costoPlanta = plantas ? activos.reduce((s, r) => s + r.gasto, 0) / plantas : 0;
  const categorias = Object.entries(gastosLista.reduce((m, c) => ({ ...m, [c.categoria]: (m[c.categoria] || 0) + Number(c.valor) }), {}))
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
  const porLote = [...costosPorLote(datos.costos)]
    .map(([codigo, v]) => {
      const l = datos.lotes.find((x) => x.lote === codigo);
      return { codigo, ...v, costoPlanta: l && Number(l.cantidad) ? v.gasto / Number(l.cantidad) : 0, cerrado: l?.estado === "Cerrado" };
    })
    .sort((a, b) => b.gasto - a.gasto);
  const movimientos = delPeriodo
    .filter((c) => (tipo === "todos" || (tipo === "ingreso" ? c.tipo === "ingreso" : c.tipo !== "ingreso")) && (!lote || c.lote === lote) && coincide(`${c.concepto} ${c.categoria} ${c.lote}`, consulta))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  const nombrePeriodo = PERIODOS.find((p) => p.valor === periodo).etiqueta.toLowerCase();

  const borrar = async (c) => {
    const ok = await confirmar({
      titulo: "Eliminar movimiento",
      mensaje: `Se elimina “${c.concepto}” por ${dinero(c.valor)}.${c.lote ? ` El costo de ${c.lote} se recalcula.` : ""}${c.origen === "inventario" ? " No devuelve el stock al inventario." : ""}`,
      confirmar: "Eliminar",
      peligro: true,
    });
    if (ok) ejecutar(() => eliminarCosto(c.id, sesion), "Movimiento eliminado");
  };

  const exportar = () =>
    ejecutar(
      () => descargarCSV(`aiden-costos-${periodo}`, movimientos.map((c) => ({ Fecha: c.fecha, Tipo: c.tipo, Concepto: c.concepto, Categoría: c.categoria, Lote: c.lote, Valor: c.valor, Origen: c.origen === "inventario" ? "Inventario" : "Manual" }))),
      (n) => plural(n, "movimiento exportado", "movimientos exportados"),
    );

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / seguimiento"
        titulo="Costos"
        descripcion="Registra movimientos y convierte cada gasto en información por lote y por planta."
        acciones={
          <>
            <Boton variante="fantasma" icono={Download} onClick={exportar} disabled={!movimientos.length}>
              Exportar
            </Boton>
            <Boton variante="primario" icono={Plus} onClick={() => setModal({})}>
              Nuevo movimiento
            </Boton>
          </>
        }
      />

      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Periodo</span>
        <Segmentos etiqueta="Periodo" valor={periodo} onCambio={setPeriodo} opciones={PERIODOS} />
      </section>

      <Cifras
        items={[
          { icono: TrendingDown, etiqueta: "Gastos", valor: dinero(gastos), detalle: `${plural(gastosLista.length, "movimiento")} · ${nombrePeriodo}`, tono: "critico" },
          { icono: TrendingUp, etiqueta: "Ingresos", valor: dinero(ingresos), detalle: `${plural(ingresosLista.length, "movimiento")} · ${nombrePeriodo}` },
          { icono: CircleDollarSign, etiqueta: "Balance", valor: dinero(ingresos - gastos), detalle: ingresos - gastos < 0 ? "Gastos superiores a ingresos" : "Ingresos cubren los gastos", tono: ingresos - gastos < 0 ? "critico" : "exito" },
          { icono: BarChart3, etiqueta: "Costo/planta ponderado", valor: dinero(costoPlanta), detalle: `${plantas.toLocaleString("es-CO")} plantas con gastos asociados`, tono: "info" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Gasto por categoría</h2>
            <p className="text-xs text-slate-500">Solo se incluyen gastos registrados · {nombrePeriodo}</p>
          </header>
          {categorias.length ? (
            <div className="mt-4 h-56" role="img" aria-label={`Gasto por categoría: ${categorias.map((c) => `${c.categoria} ${dinero(c.total)}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorias}>
                  <CartesianGrid vertical={false} stroke={colores.rejilla} className="aiden-chart-grid" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: colores.eje }} axisLine={false} tickLine={false} className="aiden-chart-axis" />
                  <YAxis tick={{ fontSize: 10, fill: colores.eje }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => dineroCorto(v)} className="aiden-chart-axis" />
                  <Tooltip wrapperClassName="aiden-tooltip" cursor={{ fill: colores.rejilla, opacity: 0.5 }} contentStyle={{ background: colores.superficie, border: `1px solid ${colores.rejilla}`, borderRadius: 12, fontSize: 12, color: colores.tinta }} itemStyle={{ color: colores.tinta }} labelStyle={{ color: colores.tinta, fontWeight: 600 }} formatter={(v) => [dinero(v), "Gasto"]} />
                  <Bar dataKey="total" fill={colores.verde} radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">Sin gastos en este periodo.</p>
          )}
        </section>
        <section className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Resultado por lote</p>
          <p className="mt-1 text-xs text-white/60">Acumulado desde la siembra. Toca un lote para ver sus movimientos.</p>
          <ul className="mt-4 space-y-2">
            {porLote.map((r) => (
              <li key={r.codigo}>
                <button type="button" onClick={() => setLote(lote === r.codigo ? "" : r.codigo)} aria-pressed={lote === r.codigo} className={`w-full rounded-xl border p-3 text-left hover:bg-white/10 ${lote === r.codigo ? "border-emerald-300/60 bg-white/10" : "border-white/10 bg-white/5"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-emerald-300">{r.codigo}</span>
                    <span className={`text-sm font-bold ${r.resultado < 0 ? "text-red-300" : "text-emerald-300"}`}>{dinero(r.resultado)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-white/70">
                    Gastos {dinero(r.gasto)}
                    {r.ingreso ? ` · ingresos ${dinero(r.ingreso)}` : ""}
                    {!r.cerrado && r.costoPlanta ? ` · ${dinero(r.costoPlanta)} por planta` : ""}
                  </span>
                </button>
              </li>
            ))}
            {!porLote.length && <li className="text-sm text-white/60">Asocia movimientos a lotes para calcular resultado.</li>}
          </ul>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <section>
            <h2 className="font-semibold text-slate-900">Movimientos</h2>
            <p className="text-xs text-slate-500">Fuente de todos los cálculos anteriores</p>
          </section>
          <section className="flex flex-wrap items-center gap-2">
            <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar movimientos" placeholder="Concepto, categoría o lote" />
            <Selector value={lote} onChange={(e) => setLote(e.target.value)} aria-label="Filtrar por lote" className="!py-2">
              <option value="">Todos los lotes</option>
              {datos.lotes.map((l) => (
                <option key={l.id} value={l.lote}>
                  {l.lote}
                </option>
              ))}
            </Selector>
            <Segmentos
              etiqueta="Tipo"
              valor={tipo}
              onCambio={setTipo}
              opciones={[
                { valor: "todos", etiqueta: "Todos" },
                { valor: "gasto", etiqueta: "gasto" },
                { valor: "ingreso", etiqueta: "ingreso" },
              ]}
            />
            {lote && (
              <button type="button" onClick={() => setLote("")} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {lote} <X size={12} aria-hidden="true" />
                <span className="sr-only">Quitar filtro de lote</span>
              </button>
            )}
          </section>
        </header>
        <section className="overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className={FILA_ENCABEZADO}>
                {["Fecha", "Concepto", "Categoría", "Lote", "Tipo", "Valor", "Acciones"].map((h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((c) => (
                <tr key={c.id} className={TR}>
                  <td className={`${TD} whitespace-nowrap`}>{fechaCorta(c.fecha)}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {c.concepto}
                    {c.origen === "inventario" && <Insignia className="ml-2">inventario</Insignia>}
                  </td>
                  <td className={TD}>{c.categoria}</td>
                  <td className="px-4 py-3">{c.lote ? <EtiquetaLote codigo={c.lote} /> : <span className="text-xs text-slate-500">General</span>}</td>
                  <td className="px-4 py-3">
                    <Insignia tono={c.tipo === "ingreso" ? "exito" : "critico"}>{c.tipo === "ingreso" ? "ingreso" : "gasto"}</Insignia>
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold ${c.tipo === "ingreso" ? "text-emerald-700" : "text-red-600"}`}>
                    {c.tipo === "ingreso" ? "+" : "-"}
                    {dinero(c.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex gap-1">
                      <BotonIcono icono={FilePenLine} etiqueta={`Editar ${c.concepto}`} tamano="sm" onClick={() => setModal({ costo: c })} />
                      <BotonIcono icono={Trash2} etiqueta={`Eliminar ${c.concepto}`} tamano="sm" onClick={() => borrar(c)} className="hover:!bg-red-50 hover:!text-red-600" />
                    </span>
                  </td>
                </tr>
              ))}
              {!movimientos.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    {datos.costos.length ? "Ningún movimiento con estos filtros." : "Sin movimientos. Registra el primer gasto o ingreso."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </section>

      <Modal
        abierto={Boolean(modal)}
        onCerrar={() => setModal(null)}
        titulo={modal?.costo ? "Editar movimiento" : "Nuevo movimiento"}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModal(null)}>
              Cancelar
            </Boton>
            <Boton variante="primario" type="submit" form={idForm}>
              {modal?.costo ? "Guardar cambios" : "Registrar"}
            </Boton>
          </>
        }
      >
        <FormularioCosto key={modal?.costo?.id || "nuevo"} id={idForm} costo={modal?.costo} onListo={() => setModal(null)} />
      </Modal>
    </section>
  );
}

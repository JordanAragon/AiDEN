import { useMemo, useState } from "react";
import { BarChart3, CircleDollarSign, Download, FileSpreadsheet, History, Pencil, Plus, Printer, TrendingDown, TrendingUp, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const KEY = "aiden-costos";
const PROD_KEY = "aiden-produccion";
const CENTER_KEY = "aiden-centros-costo";
const CLOSE_KEY = "aiden-cierres-costos";
const DEFAULT_CENTERS = ["Producción café", "Producción tomate", "Calidad fitosanitaria", "Inventario", "Ambiental"];
const seed = [
  { id: "CST-001", lote: "LT-2024-089", concepto: "Sustrato y fertilización", categoria: "Insumos", valor: 318000, fecha: "2026-09-03", tipo: "gasto" },
  { id: "CST-002", lote: "LT-2024-091", concepto: "Material de siembra", categoria: "Insumos", valor: 241000, fecha: "2026-09-04", tipo: "gasto" },
  { id: "CST-003", lote: "LT-2024-094", concepto: "Jornada de adecuación", categoria: "Mano de obra", valor: 184000, fecha: "2026-09-08", tipo: "gasto" },
  { id: "CST-004", lote: "LT-2024-089", concepto: "Venta de plantas", categoria: "Ingresos", valor: 720000, fecha: "2026-09-10", tipo: "ingreso" },
];
const read = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const uid = () => `CST-${Date.now().toString(36).toUpperCase()}`;
const money = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value) || 0);
function Modal({ onClose, children }) { return <section className="aiden-modal-fondo fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"><article className="aiden-modal-entrada w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Nuevo movimiento</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={16} /></button></header><section className="p-5">{children}</section></article></section>; }
function Input({ label, ...props }) { return <label className="block text-sm font-medium text-slate-600">{label}<input {...props} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>; }
function Select({ label, children, ...props }) { return <label className="block text-sm font-medium text-slate-600">{label}<select {...props} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{children}</select></label>; }
function Kpi({ label, value, detail, icon: Icon, tone = "green" }) { const tones = { green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-700" }; return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span><p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="text-xs font-medium text-slate-600">{label}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></article>; }

export default function CostosOperativo() {
  const [rows, setRows] = useState(() => read(KEY, seed));
  const [lotes] = useState(() => read(PROD_KEY, []));
  const [filtro, setFiltro] = useState("Todos");
  const [centroFiltro, setCentroFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [closures, setClosures] = useState(() => read(CLOSE_KEY, []));
  const centros = useMemo(() => {
    const stored = read(CENTER_KEY, DEFAULT_CENTERS);
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_CENTERS;
  }, []);
  const periodRows = rows.filter((r) => String(r.fecha || "").startsWith(mes));
  const gastos = periodRows.filter((r) => r.tipo === "gasto");
  const ingresos = periodRows.filter((r) => r.tipo === "ingreso");
  const totalGastos = gastos.reduce((a, r) => a + Number(r.valor || 0), 0);
  const totalIngresos = ingresos.reduce((a, r) => a + Number(r.valor || 0), 0);
  const balance = totalIngresos - totalGastos;
  const porLote = useMemo(() => lotes.map((l) => {
    const gasto = rows.filter((r) => r.lote === l.lote && r.tipo === "gasto").reduce((a, r) => a + Number(r.valor || 0), 0);
    const ingreso = rows.filter((r) => r.lote === l.lote && r.tipo === "ingreso").reduce((a, r) => a + Number(r.valor || 0), 0);
    return { lote: l.lote, gasto, ingreso, plantas: Number(l.cantidad || 0), costoPlanta: l.cantidad ? gasto / Number(l.cantidad) : 0, resultado: ingreso - gasto };
  }).filter((r) => r.gasto || r.ingreso), [lotes, rows]);
  const gastosAsociados = porLote.reduce((sum, row) => sum + (row.gasto > 0 ? row.gasto : 0), 0);
  const plantasConCostos = porLote.reduce((sum, row) => sum + (row.gasto > 0 ? row.plantas : 0), 0);
  const costoPlantaPonderado = plantasConCostos ? gastosAsociados / plantasConCostos : 0;
  const categorias = Object.entries(gastos.reduce((a, r) => { a[r.categoria] = (a[r.categoria] || 0) + Number(r.valor || 0); return a; }, {})).map(([categoria, total]) => ({ categoria, total }));
  const filtered = periodRows.filter((r) =>
    (filtro === "Todos" || r.tipo === filtro) &&
    (centroFiltro === "Todos" || (r.centroCosto || "Sin centro") === centroFiltro) &&
    (estadoFiltro === "Todos" || (r.estado || "Por validar") === estadoFiltro),
  );
  const save = (data) => { setRows(data); write(KEY, data); window.dispatchEvent(new Event("aiden-data-change")); };
  const add = (f) => {
    const valor = Number(f.valor);
    if (!f.concepto.trim() || !Number.isFinite(valor) || valor <= 0) return;
    const record = {
      ...f,
      id: editing?.id || uid(),
      valor,
      estado: f.estado || "Por validar",
      centroCosto: f.centroCosto || "Sin centro",
      origen: f.origen || (f.tipo === "ingreso" ? "Ingreso" : "Operación"),
      documento: f.documento || "",
      responsable: f.responsable || "",
    };
    const next = editing ? rows.map((row) => row.id === editing.id ? record : row) : [record, ...rows];
    save(next);
    setModal(false);
    setEditing(null);
  };

  const cerrarMes = () => {
    const existe = closures.some((item) => item.mes === mes);
    if (existe) return;
    const periodRows = rows.filter((row) => String(row.fecha || "").startsWith(mes));
    const total = periodRows.reduce((sum, row) => sum + (row.tipo === "gasto" ? Number(row.valor || 0) : 0), 0);
    const ingreso = periodRows.reduce((sum, row) => sum + (row.tipo === "ingreso" ? Number(row.valor || 0) : 0), 0);
    const next = [{ mes, fechaCierre: new Date().toISOString(), gastos: total, ingresos: ingreso, movimientos: periodRows.length }, ...closures];
    write(CLOSE_KEY, next);
    setClosures(next);
    window.dispatchEvent(new Event("aiden-data-change"));
  };

  const exportarCSV = () => {
    if (!filtered.length) return;
    const headers = ["Fecha", "Origen", "Documento", "Centro de costo", "Lote", "Concepto", "Categoría", "Tipo", "Estado", "Responsable", "Valor"];
    const csv = "\ufeff" + headers.join(";") + "\n" + filtered.map((row) => [
      row.fecha, row.origen, row.documento, row.centroCosto, row.lote, row.concepto, row.categoria, row.tipo, row.estado || "Por validar", row.responsable, row.valor,
    ].map((value) => JSON.stringify(value ?? "")).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aiden-costos-" + mes + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const imprimir = () => window.print();
  const download = () => { const blob = new Blob([JSON.stringify({ gastos, ingresos, balance, porLote, costoPlantaPonderado }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "aiden-costos.json"; a.click(); URL.revokeObjectURL(url); };

  return <section className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><section><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">AiDEN / seguimiento</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Costos</h1><p className="mt-1 text-sm text-slate-500">Libro operativo por lote, centro de costo, periodo y responsable.</p></section><section className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">Periodo<input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="border-0 p-0 text-xs outline-none" /></label><button type="button" onClick={exportarCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-emerald-200"><FileSpreadsheet size={15} />Exportar Excel</button><button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600"><Printer size={15} />PDF / imprimir</button><button type="button" onClick={cerrarMes} disabled={closures.some((item) => item.mes === mes)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50"><History size={15} />Cierre mensual</button><button type="button" onClick={() => { setEditing(null); setModal(true); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={16} />Nuevo movimiento</button></section></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Gastos" value={money(totalGastos)} detail={`${gastos.length} movimientos`} icon={TrendingDown} tone="red" /><Kpi label="Ingresos" value={money(totalIngresos)} detail={`${ingresos.length} movimientos`} icon={TrendingUp} /><Kpi label="Balance" value={money(balance)} detail={balance >= 0 ? "Ingresos - gastos" : "Gastos superiores a ingresos"} icon={CircleDollarSign} tone={balance >= 0 ? "green" : "red"} /><Kpi label="Costo/planta ponderado" value={money(costoPlantaPonderado)} detail={`${plantasConCostos.toLocaleString("es-CO")} plantas con gastos asociados`} icon={BarChart3} tone="blue" /></section>
    <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><header><h2 className="font-semibold text-slate-900">Gasto por categoría</h2><p className="text-xs text-slate-400">Solo se incluyen gastos registrados</p></header><section className="mt-4 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={categorias}><CartesianGrid vertical={false} stroke="#eef2ef" /><XAxis dataKey="categoria" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip formatter={(v) => [money(v), "Gasto"]} /><Bar dataKey="total" fill="#176b45" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></section></article><article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Resultado por lote</p><section className="mt-4 space-y-3">{porLote.slice(0, 5).map((r) => <section key={r.lote} className="rounded-xl bg-white/5 p-3"><div className="flex justify-between gap-3"><span className="font-mono text-[11px] text-emerald-300">{r.lote}</span><span className={r.resultado >= 0 ? "text-emerald-300" : "text-red-300"}>{money(r.resultado)}</span></div><p className="mt-1 text-[11px] text-white/45">Costo/planta: {money(r.costoPlanta)}</p></section>)}{porLote.length === 0 && <p className="text-sm text-white/45">Asocia movimientos a lotes para calcular resultado.</p>}</section></article></section>
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><section><h2 className="font-semibold text-slate-900">Libro operativo</h2><p className="text-xs text-slate-400">{filtered.length} movimientos visibles · {closures.some((item) => item.mes === mes) ? "Mes cerrado" : "Periodo abierto"}</p></section><section className="flex flex-wrap gap-1"><select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"><option>Todos</option><option value="gasto">gasto</option><option value="ingreso">ingreso</option></select><select value={centroFiltro} onChange={(e) => setCentroFiltro(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"><option>Todos</option>{centros.map((center) => <option key={center}>{typeof center === "string" ? center : center.nombre}</option>)}</select><select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"><option>Todos</option><option>Imputado</option><option>Por validar</option></select></section></header><section className="overflow-x-auto"><table className="w-full min-w-[1080px]"><thead><tr className="bg-slate-50">{["Fecha", "Origen", "Documento", "Centro", "Lote", "Concepto", "Tipo", "Estado", "Valor", "Acciones"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{filtered.map((r) => <tr key={r.id} className="border-t border-slate-100"><td className="px-4 py-3 text-xs text-slate-500">{r.fecha}</td><td className="px-4 py-3 text-xs text-slate-500">{r.origen || "Operación"}</td><td className="px-4 py-3 font-mono text-[11px] text-slate-500">{r.documento || "—"}</td><td className="px-4 py-3 text-xs text-slate-500">{r.centroCosto || "Sin centro"}</td><td className="px-4 py-3 font-mono text-xs text-emerald-700">{r.lote || "—"}</td><td className="px-4 py-3 text-sm font-medium text-slate-800">{r.concepto}</td><td className="px-4 py-3"><span className={"rounded-full px-2 py-1 text-[10px] font-bold " + (r.tipo === "ingreso" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{r.tipo}</span></td><td className="px-4 py-3"><span className={"rounded-full px-2 py-1 text-[10px] font-bold " + ((r.estado || "Por validar") === "Imputado" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{r.estado || "Por validar"}</span></td><td className={"px-4 py-3 text-sm font-bold " + (r.tipo === "ingreso" ? "text-emerald-700" : "text-red-600")}>{r.tipo === "ingreso" ? "+" : "-"}{money(r.valor)}</td><td className="px-4 py-3"><button type="button" onClick={() => { setEditing(r); setModal(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Editar"><Pencil size={14} /></button></td></tr>)}</tbody></table></section></section>
    {modal && <Modal onClose={() => { setModal(false); setEditing(null); }}><CostForm lotes={lotes} centros={centros} initial={editing} onSubmit={add} /></Modal>}
  </section>;
}
function CostForm({ lotes, centros, initial, onSubmit }) {
  const [f, setF] = useState(() => initial || ({ tipo: "gasto", concepto: "", categoria: "Insumos", valor: "", fecha: new Date().toISOString().slice(0, 10), lote: "", centroCosto: centros?.[0] || "Sin centro", origen: "Operación", documento: "", responsable: "", estado: "Por validar" }));
  return <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}><section className="grid gap-3 sm:grid-cols-2"><Select label="Tipo" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></Select><Select label="Categoría" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}><option>Insumos</option><option>Mano de obra</option><option>Transporte</option><option>Tratamientos</option><option>Servicios</option><option>Otros</option></Select></section><Input label="Concepto" value={f.concepto} onChange={(e) => setF({ ...f, concepto: e.target.value })} required /><section className="grid gap-3 sm:grid-cols-2"><Input label="Valor COP" type="number" min="1" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} required /><Input label="Fecha" type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></section><section className="grid gap-3 sm:grid-cols-2"><Select label="Centro de costo" value={f.centroCosto} onChange={(e) => setF({ ...f, centroCosto: e.target.value })}>{(centros || []).map((center) => <option key={typeof center === "string" ? center : center.id}>{typeof center === "string" ? center : center.nombre}</option>)}<option>Sin centro</option></Select><Select label="Estado contable" value={f.estado || "Por validar"} onChange={(e) => setF({ ...f, estado: e.target.value })}><option>Imputado</option><option>Por validar</option></Select></section><section className="grid gap-3 sm:grid-cols-2"><Input label="Origen" value={f.origen || "Operación"} onChange={(e) => setF({ ...f, origen: e.target.value })} /><Input label="Documento" value={f.documento || ""} onChange={(e) => setF({ ...f, documento: e.target.value })} /></section><Select label="Lote asociado" value={f.lote} onChange={(e) => setF({ ...f, lote: e.target.value })}><option value="">Sin lote</option>{lotes.map((l) => <option key={l.id}>{l.lote}</option>)}</Select><button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">{initial ? "Guardar cambios" : "Guardar movimiento"}</button></form>;
}

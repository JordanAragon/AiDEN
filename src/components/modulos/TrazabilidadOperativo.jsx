import { useMemo, useState } from "react";
import { CalendarDays, Download, Filter, History, Plus, Sprout, X } from "lucide-react";
import { getSession } from "../../utilidades/autenticacion";

const KEY = "aiden-trazabilidad";
const LOTS = "aiden-produccion";
const seed = [
  { id: "TRZ-001", lote: "LT-2024-089", evento: "Inspección de calidad", fecha: "2026-09-13", responsable: "Laura M.", detalle: "Revisión visual del follaje." },
  { id: "TRZ-002", lote: "LT-2024-091", evento: "Cambio de etapa", fecha: "2026-09-12", responsable: "Andrés R.", detalle: "Inicio de desarrollo vegetativo." },
  { id: "TRZ-003", lote: "LT-2024-094", evento: "Riego", fecha: "2026-09-12", responsable: "Camila P.", detalle: "Riego de mantenimiento." },
];
const read = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = () => `TRZ-${Date.now().toString(36).toUpperCase()}`;

function Modal({ onClose, children }) {
  return <section className="aiden-modal-fondo fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"><article className="aiden-modal-entrada w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Registrar evento</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={16} /></button></header><section className="p-5">{children}</section></article></section>;
}
function Input({ label, ...props }) { return <label className="block text-sm font-medium text-slate-600">{label}<input {...props} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>; }
function Select({ label, children, ...props }) { return <label className="block text-sm font-medium text-slate-600">{label}<select {...props} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">{children}</select></label>; }
function Textarea({ label, ...props }) { return <label className="block text-sm font-medium text-slate-600">{label}<textarea {...props} className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>; }
function Kpi({ label, value, detail, icon: Icon }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={17} /></span><p className="mt-4 text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></article>; }

export default function TrazabilidadOperativo() {
  const session = getSession();
  const role = session?.role || "operario";
  const allLots = read(LOTS, []);
  const ownLots = role === "operario" ? allLots.filter((l) => l.responsable === session?.name) : allLots;
  const ownLotNames = new Set(ownLots.map((l) => l.lote));
  const [rows, setRows] = useState(() => read(KEY, seed));
  const [lot, setLot] = useState("Todos");
  const [kind, setKind] = useState("Todos");
  const [modal, setModal] = useState(false);
  const visibleRows = role === "operario" ? rows.filter((r) => ownLotNames.has(r.lote)) : rows;
  const types = [...new Set(visibleRows.map((r) => r.evento))];
  const filtered = useMemo(() => visibleRows.filter((r) => (lot === "Todos" || r.lote === lot) && (kind === "Todos" || r.evento === kind)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)), [visibleRows, lot, kind]);
  const add = (form) => {
    const chosenLot = form.lote;
    if (!chosenLot || !ownLotNames.has(chosenLot) || !form.evento || !form.fecha || !form.responsable || !form.detalle.trim()) return;
    const next = [{ ...form, id: uid(), fecha: form.fecha, responsable: role === "operario" ? session?.name || form.responsable : form.responsable, lote: chosenLot }, ...rows];
    setRows(next); write(KEY, next); window.dispatchEvent(new Event("aiden-data-change")); setModal(false);
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `trazabilidad-${lot.toLowerCase()}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return <section className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><section><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">AiDEN / seguimiento</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Trazabilidad</h1><p className="mt-1 text-sm text-slate-500">Reconstruye la línea de vida de un lote: qué ocurrió, cuándo y quién lo registró.</p></section><section className="flex gap-2"><button type="button" onClick={exportData} disabled={!filtered.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><Download size={15}/>Exportar</button><button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/>Nuevo evento</button></section></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Eventos" value={visibleRows.length} detail="Histórico disponible para tu rol" icon={History}/><Kpi label="Lotes trazados" value={new Set(visibleRows.map((r) => r.lote)).size} detail="Con al menos un evento" icon={Sprout}/><Kpi label="Tipos de evento" value={types.length} detail="En los registros visibles" icon={Filter}/><Kpi label="Último registro" value={filtered[0]?.fecha || "—"} detail="Resultado más reciente" icon={CalendarDays}/></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3"><section><h2 className="font-semibold text-slate-900">Filtros</h2><p className="text-xs text-slate-400">Consulta toda la historia disponible o la de un lote.</p></section><span className="text-xs text-slate-400">{filtered.length} eventos</span></header><section className="mt-4 grid gap-3 md:grid-cols-2"><Select label="Lote" value={lot} onChange={(e)=>setLot(e.target.value)}><option>Todos</option>{[...ownLotNames].map((l)=><option key={l}>{l}</option>)}</Select><Select label="Tipo de evento" value={kind} onChange={(e)=>setKind(e.target.value)}><option>Todos</option>{types.map((t)=><option key={t}>{t}</option>)}</Select></section></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><header className="mb-6"><h2 className="font-semibold text-slate-900">Línea de vida del lote</h2></header><section className="relative ml-3 border-l border-slate-200 pl-7">{filtered.map((r)=><article key={r.id} className="relative pb-7 last:pb-0"><span className="absolute -left-[36px] top-0 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-white"/></span><section className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><header className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] font-bold text-emerald-700">{r.evento}</p><time className="text-[11px] text-slate-400">{r.fecha}</time></header><p className="mt-2 text-sm font-medium text-slate-800">{r.detalle}</p><footer className="mt-2 flex gap-3 text-[11px] text-slate-400"><span>{r.lote}</span><span>·</span><span>{r.responsable}</span></footer></section></article>)}{!filtered.length && <p className="py-10 text-center text-sm text-slate-400">No hay eventos disponibles para tu rol y filtros actuales.</p>}</section></section>
    {modal && <Modal onClose={()=>setModal(false)}><form className="space-y-4" onSubmit={(e)=>{e.preventDefault(); add(Object.fromEntries(new FormData(e.currentTarget).entries()));}}><Select name="lote" label="Lote" required><option value="">Selecciona un lote</option>{ownLots.map((l)=><option key={l.id}>{l.lote}</option>)}</Select><Select name="evento" label="Tipo de evento" required><option value="">Selecciona un evento</option><option>Registro</option><option>Cambio de etapa</option><option>Riego</option><option>Inspección de calidad</option><option>Movimiento</option><option>Incidencia</option><option>Cierre de calidad</option></Select><Input name="fecha" label="Fecha" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/><Input name="responsable" label="Responsable" defaultValue={role === "operario" ? session?.name || "" : ""} required readOnly={role === "operario"}/><Textarea name="detalle" label="Detalle" required/><button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">Registrar evento</button></form></Modal>}
  </section>;
}

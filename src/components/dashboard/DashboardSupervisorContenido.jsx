import { ArrowRight, AlertTriangle, ClipboardList, Clock3, Package, Sprout, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardOperacion } from "../../hooks/useDashboardOperacion";

export default function DashboardSupervisorContenido() {
  const navigate = useNavigate();
  const data = useDashboardOperacion();
  const maxCarga = Math.max(1, ...data.carga.map((persona) => persona.total));

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">AiDEN / coordinación</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Centro de supervisión</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Coordina la ejecución diaria: asigna trabajo, detecta bloqueos, valida incidencias y mantiene la operación en movimiento.</p></section>
        <button type="button" onClick={() => navigate("/personal")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><ClipboardList size={15} />Asignar trabajo</button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Sprout} label="Lotes activos" value={data.lotesActivos.length} detail={`${data.lotesCosecha.length} en cosecha`} />
        <Kpi icon={ClipboardList} label="Trabajo pendiente" value={data.pendientes.length} detail={data.atrasadas.length ? `${data.atrasadas.length} atrasadas` : "Sin tareas vencidas"} tone={data.atrasadas.length ? "red" : "blue"} />
        <Kpi icon={AlertTriangle} label="Alertas" value={data.alertas.length} detail={`Operación, ambiente y calidad · ${data.cfg.tempMin}–${data.cfg.tempMax} °C`} tone={data.alertas.length ? "amber" : "green"} />
        <Kpi icon={Package} label="Insumos bajo mínimo" value={data.bajoMinimo.length} detail="Coordina reposición" tone="amber" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between"><section><h2 className="font-semibold text-slate-900">Carga de trabajo</h2><p className="mt-1 text-xs text-slate-400">Tareas pendientes por responsable</p></section><Users size={18} className="text-emerald-700" /></header>
          <section className="mt-5 space-y-4">
            {data.carga.map((persona) => (
              <section key={persona.nombre}><section className="mb-1 flex justify-between text-xs"><span className="font-medium text-slate-700">{persona.nombre}</span><span className="font-semibold text-slate-500">{persona.total} pendientes</span></section><section className="h-2 rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${Math.round((persona.total / maxCarga) * 100)}%` }} /></section></section>
            ))}
            {!data.carga.length && <p className="text-sm text-slate-400">Aún no hay tareas asignadas.</p>}
          </section>
          <button type="button" onClick={() => navigate("/personal")} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">Gestionar tareas<ArrowRight size={12} /></button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header><h2 className="font-semibold text-slate-900">Atención inmediata</h2><p className="mt-1 text-xs text-slate-400">Eventos que necesitan intervención del supervisor</p></header>
          <section className="mt-4 space-y-2">
            {data.alertas.slice(0, 5).map((alerta) => <button type="button" key={alerta.id || alerta.text} onClick={() => navigate(alerta.ruta)} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-amber-200"><span className="block text-sm text-slate-700">{alerta.text}</span><span className="mt-1 block text-[11px] font-semibold text-emerald-700">Abrir →</span></button>)}
            {!data.alertas.length && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">No hay alertas que requieran intervención.</p>}
          </section>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionCard icon={Sprout} title="Producción" text="Avanza lotes, revisa etapas y crea tareas de seguimiento." action="Abrir producción" onClick={() => navigate("/produccion")} />
        <ActionCard icon={Package} title="Inventario" text="Revisa consumos, niveles mínimos y reposiciones pendientes." action="Abrir inventario" onClick={() => navigate("/inventario")} />
        <ActionCard icon={Clock3} title="Seguimiento" text="Consulta trazabilidad y verifica que cada actividad quede registrada." action="Abrir trazabilidad" onClick={() => navigate("/trazabilidad")} />
      </section>
    </article>
  );
}

function Kpi({ icon: Icon, label, value, detail, tone = "green" }) {
  const map = { green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-700" };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}><Icon size={17} /></span><p className="mt-4 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-600">{label}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></article>;
}
function ActionCard({ icon: Icon, title, text, action, onClick }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon size={18} className="text-emerald-700" /><h2 className="mt-3 font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p><button type="button" onClick={onClick} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">{action}<ArrowRight size={12} /></button></article>;
}

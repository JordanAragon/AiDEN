import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const leer = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const money = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function DashboardAdminContenido() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("aiden-data-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("aiden-data-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const data = useMemo(() => {
    const usuarios = leer("aiden_users", []);
    const lotes = leer("aiden-produccion", []);
    const costos = leer("aiden-costos", []);
    const calidad = leer("aiden-calidad", []);
    const tareas = leer("aiden-tareas", []);
    const inventario = leer("aiden-inventario", []);
    const alertas = [
      ...inventario
        .filter((r) => Number(r.stock) <= Number(r.minimo))
        .map((r) => ({ tipo: "Inventario", texto: `${r.nombre} está bajo el mínimo`, ruta: "/inventario" })),
      ...calidad
        .filter((r) => (r.estado ?? r.estadoManual) !== "Cerrada" && r.prioridad === "Alta")
        .map((r) => ({ tipo: "Calidad", texto: `${r.codigo || r.id} requiere atención`, ruta: "/calidad" })),
    ];
    const ingresos = costos
      .filter((r) => r.tipo === "ingreso")
      .reduce((a, r) => a + Number(r.valor || 0), 0);
    const gastos = costos
      .filter((r) => r.tipo !== "ingreso")
      .reduce((a, r) => a + Number(r.valor || 0), 0);

    return { usuarios, lotes, calidad, tareas, inventario, alertas, ingresos, gastos };
  }, [version]);

  const roles = { admin: 0, supervisor: 0, operario: 0 };
  data.usuarios.forEach((u) => {
    if (roles[u.role] !== undefined) roles[u.role]++;
  });

  const lotesActivos = data.lotes.filter((lote) => lote.estado !== "Inactivo");
  const pendientes = data.tareas.filter((t) => t.estado !== "Completada").length;
  const lotesAtencion = lotesActivos.filter((l) => l.etapa === "Adaptación").length;
  const abiertas = data.calidad.filter((r) => (r.estado ?? r.estadoManual) !== "Cerrada").length;

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">AiDEN / control del
            sistema</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Centro de administración</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Supervisa usuarios, operación, seguridad y desempeño general. Aquí
            se toman decisiones del sistema, no se ejecutan tareas de campo.</p>
        </section>
        <section className="flex gap-2">
          <button type="button" onClick={() => navigate("/personal")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
<Users size={15} />Gestionar personal</button>
          <button type="button" onClick={() => navigate("/configuracion")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
<Settings size={15} />Configuración</button>
        </section>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Usuarios" value={data.usuarios.length || "—"}
          detail={`${roles.supervisor} supervisores · ${roles.operario} operarios`} />
        <Kpi icon={Sprout} label="Lotes activos" value={lotesActivos.length} detail={lotesAtencion ?
          `${lotesAtencion} en adaptación` : "Sin bloqueos de etapa"} tone={lotesAtencion ? "amber" : "green"} />
        <Kpi icon={CircleDollarSign} label="Balance registrado" value={money(data.ingresos - data.gastos)}
          detail={`${money(data.ingresos)} ingresos · ${money(data.gastos)} gastos`} tone="blue" />
        <Kpi icon={ShieldCheck} label="Alertas operativas" value={data.alertas.length} detail={data.alertas.length ?
          "Requieren seguimiento" : "Sin alertas registradas"} tone={data.alertas.length ? "red" : "green"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
<h2 className="font-semibold text-slate-900">Estado operativo</h2>
<p className="mt-1 text-xs text-slate-400">Indicadores de la información almacenada</p>
</header>
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Tareas abiertas" value={pendientes} onClick={() => navigate("/personal")} />
            <Stat label="Incidencias abiertas" value={abiertas} onClick={() => navigate("/calidad")} />
            <Stat label="Insumos bajo mínimo" value={data.inventario.filter((r) => Number(r.stock) <= Number(r.minimo)).length}
              onClick={() => navigate("/inventario")} />
          </section>
          <section className="mt-5 rounded-xl bg-slate-50 p-4">
<p className="text-xs font-semibold text-slate-500">Responsabilidad del administrador</p>
<p className="mt-1 text-sm leading-6 text-slate-700">Administrar usuarios, reglas, seguridad y reportes para evaluar el
  funcionamiento global de AiDEN.</p>
</section>
        </article>
        <article className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Prioridad</p>
          <h2 className="mt-2 text-lg font-semibold">Alertas que requieren decisión</h2>
          <section className="mt-4 space-y-2">
            {data.alertas.slice(0, 4).map((a) => <button type="button" key={`${a.tipo}-${a.texto}`} onClick={() =>
              navigate(a.ruta)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
<p className="text-xs font-semibold text-emerald-300">{a.tipo}</p>
<p className="mt-1 text-sm text-white/80">{a.texto}</p>
</button>)}
            {!data.alertas.length && <p className="text-sm text-white/55">No hay alertas pendientes.</p>}
          </section>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <header>
<h2 className="font-semibold text-slate-900">Distribución de acceso</h2>
<p className="mt-1 text-xs text-slate-400">Usuarios por responsabilidad</p>
</header>
          <section className="mt-5 space-y-3">
            {[["Administrador", roles.admin, "bg-emerald-700"], ["Supervisor", roles.supervisor, "bg-sky-500"], ["Operario",
              roles.operario, "bg-amber-500"]].map(([label, count, bar]) => (
              <section key={label}>
<section className="mb-1 flex justify-between text-xs">
<span className="font-medium text-slate-600">{label}</span>
<span className="font-semibold text-slate-800">{count}</span>
</section>
<section className="h-2 rounded-full bg-slate-100">
<span className={`block h-full rounded-full ${bar}`} style={{ width:
  `${Math.min(100, (count / Math.max(1, data.usuarios.length)) * 100)}%` }} />
</section>
</section>
            ))}
          </section>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center gap-2">
<ClipboardCheck size={17} className="text-emerald-700" />
<h2 className="font-semibold text-slate-900">Acciones rápidas</h2>
</header>
          <section className="mt-4 grid gap-2">
<Quick onClick={() => navigate("/reportes")}>Abrir reportes</Quick>
<Quick onClick={() => navigate("/personal")}>Administrar personal</Quick>
<Quick onClick={() => navigate("/costos")}>Revisar costos</Quick>
<Quick onClick={() => navigate("/configuracion")}>Revisar reglas</Quick>
</section>
        </article>
      </section>
    </article>
  );
}

function Kpi({ icon: Icon, label, value, detail, tone = "green" }) {
  const map = { green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red:
    "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-700" };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
<span className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}>
<Icon size={17} />
</span>
<p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
<p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
<p className="mt-1 text-[11px] text-slate-400">{detail}</p>
</article>;
}
function Stat({ label, value, onClick }) {
  return <button type="button" onClick={onClick}
    className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/30">
<p className="text-2xl font-bold text-slate-900">{value}</p>
<p className="mt-1 text-xs text-slate-500">{label}</p>
<span className="mt-3 block text-[11px] font-semibold text-emerald-700">Abrir módulo →</span>
</button>;
}
function Quick({ children, onClick }) {
  return <button type="button" onClick={onClick}
    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-700">{children}<span>→</span>
</button>;
}

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplets,
  ListChecks,
  Sprout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../utilidades/autenticacion";

const leer = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const defaults = { tempMin: 18, tempMax: 27, humMin: 55, humMax: 80 };

export default function DashboardOperarioContenido() {
  const navigate = useNavigate();
  const session = getSession();
  const nombre = session?.name || "Operario";
  const [version, setVersion] = useState(0);
  const [tareas, setTareas] = useState(() => leer("aiden-tareas"));

  useEffect(() => {
    const refresh = () => {
      setTareas(leer("aiden-tareas"));
      setVersion((v) => v + 1);
    };

    window.addEventListener("aiden-data-change", refresh);
    window.addEventListener("aiden-config-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("aiden-data-change", refresh);
      window.removeEventListener("aiden-config-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const lotes = useMemo(() => leer("aiden-produccion"), [version]);
  const ambiental = useMemo(() => leer("aiden-ambiental"), [version]);
  const calidad = useMemo(() => leer("aiden-calidad"), [version]);
  const cfg = useMemo(
    () => ({ ...defaults, ...leer("aiden-configuracion", {}) }),
    [version],
  );

  const misTareas = tareas.filter((t) => t.responsable === nombre);
  const misLotes = lotes.filter((l) => l.responsable === nombre);
  const misIncidencias = calidad.filter(
    (r) =>
      misLotes.some((l) => l.lote === r.lote) &&
      (r.estado ?? r.estadoManual) !== "Cerrada",
  );
  const pendientes = misTareas.filter((t) => t.estado !== "Completada");
  const hoy = new Date().toISOString().slice(0, 10);
  const urgentes = pendientes.filter(
    (t) => t.prioridad === "Alta" || (t.fecha && t.fecha < hoy),
  );
  const alertasAmbientales = ambiental.filter(
    (r) =>
      Number(r.temperatura) < Number(cfg.tempMin) ||
      Number(r.temperatura) > Number(cfg.tempMax) ||
      Number(r.humedad) < Number(cfg.humMin) ||
      Number(r.humedad) > Number(cfg.humMax),
  );

  const completar = (tarea) => {
    const next = tareas.map((t) =>
      t.id === tarea.id
        ? {
            ...t,
            estado:
              t.estado === "Completada" ? "Pendiente" : "Completada",
          }
        : t,
    );

    setTareas(next);
    localStorage.setItem("aiden-tareas", JSON.stringify(next));
    window.dispatchEvent(new Event("aiden-data-change"));
  };

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / ejecución
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Mi jornada, {nombre}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Tu vista se limita al trabajo que tienes asignado: tareas, lotes,
            condiciones y novedades que afectan tu jornada.
          </p>
        </section>

        <button
          type="button"
          onClick={() => navigate("/trazabilidad")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          <ListChecks size={15} />
          Registrar actividad
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={ListChecks}
          label="Mis tareas"
          value={misTareas.length}
          detail={`${pendientes.length} pendientes`}
          tone={pendientes.length ? "amber" : "green"}
        />
        <Kpi
          icon={Sprout}
          label="Lotes a cargo"
          value={misLotes.length}
          detail="Asignados a ti"
        />
        <Kpi
          icon={AlertTriangle}
          label="Prioridades"
          value={urgentes.length}
          detail="Alta prioridad o vencidas"
          tone={urgentes.length ? "red" : "green"}
        />
        <Kpi
          icon={Droplets}
          label="Alertas de campo"
          value={alertasAmbientales.length}
          detail={`Según ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax}%`}
          tone={alertasAmbientales.length ? "amber" : "green"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="font-semibold text-slate-900">
                Lo que tengo que hacer
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Completa una tarea para que supervisión vea el avance.
              </p>
            </section>
            <Clock3 size={18} className="text-emerald-700" />
          </header>

          <section className="mt-4 divide-y divide-slate-100">
            {misTareas.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => completar(t)}
                className="flex w-full items-start gap-3 py-3 text-left hover:bg-slate-50"
              >
                <span className="mt-0.5 shrink-0">
                  {t.estado === "Completada" ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <span
                      className={`block h-[18px] w-[18px] rounded-full border-2 ${
                        t.prioridad === "Alta"
                          ? "border-red-400"
                          : "border-slate-300"
                      }`}
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-medium ${
                      t.estado === "Completada"
                        ? "text-slate-400 line-through"
                        : "text-slate-700"
                    }`}
                  >
                    {t.titulo}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span>{t.modulo}</span>
                    {t.lote && <span>· {t.lote}</span>}
                    {t.fecha && <span>· vence {t.fecha}</span>}
                    <span
                      className={
                        t.prioridad === "Alta"
                          ? "font-semibold text-red-600"
                          : ""
                      }
                    >
                      · {t.prioridad}
                    </span>
                  </span>
                </span>
              </button>
            ))}

            {!misTareas.length && (
              <p className="py-8 text-center text-sm text-slate-400">
                No tienes tareas asignadas. Cuando supervisión te asigne trabajo
                aparecerá aquí.
              </p>
            )}
          </section>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Mis lotes</h2>
            <p className="mt-1 text-xs text-slate-400">
              Solo lotes asignados a tu usuario.
            </p>
          </header>

          <section className="mt-4 space-y-2">
            {misLotes.map((l) => (
              <button
                type="button"
                key={l.id}
                onClick={() => navigate("/produccion")}
                className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-emerald-200"
              >
                <section className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-mono text-[10px] font-bold text-emerald-700">
                      {l.lote}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-800">
                      {l.cultivo}
                    </span>
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                    {l.etapa}
                  </span>
                </section>
                <section className="mt-3 flex justify-between text-[11px] text-slate-400">
                  <span>{l.ubicacion}</span>
                  <span>
                    {Number(l.cantidad || 0).toLocaleString("es-CO")} plantas
                  </span>
                </section>
              </button>
            ))}

            {!misLotes.length && (
              <p className="py-8 text-center text-sm text-slate-400">
                No tienes lotes asignados actualmente.
              </p>
            )}
          </section>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <header className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <h2 className="font-semibold text-amber-900">Atención</h2>
          </header>
          <p className="mt-2 text-sm leading-6 text-amber-900/80">
            {misIncidencias.length
              ? `Hay ${misIncidencias.length} incidencia${
                  misIncidencias.length !== 1 ? "s" : ""
                } abierta${misIncidencias.length !== 1 ? "s" : ""} en tus lotes.`
              : "No hay incidencias abiertas en tus lotes."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/calidad")}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-900"
          >
            Revisar calidad <ArrowRight size={12} />
          </button>
        </article>

        <article className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            Tu responsabilidad
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Ejecuta las tareas asignadas, registra lo ocurrido en campo y deja
            evidencia para que supervisión pueda decidir.
          </p>
        </article>
      </section>
    </article>
  );
}

function Kpi({ icon: Icon, label, value, detail, tone = "green" }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

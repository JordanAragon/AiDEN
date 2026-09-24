import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  ListChecks,
  Plus,
  Search,
  Sprout,
  X,
} from "lucide-react";
import { getSession } from "../../utilidades/autenticacion";

const KEY = "aiden-produccion";
const TASK_KEY = "aiden-tareas";
const TRACE_KEY = "aiden-trazabilidad";
const seed = [
  {
    id: "LT-2024-089",
    lote: "LT-2024-089",
    cultivo: "Tomate",
    cantidad: 420,
    etapa: "Cosecha",
    responsable: "Laura M.",
    fecha: "2026-08-02",
    ubicacion: "Invernadero 1",
    estado: "Activo",
  },
  {
    id: "LT-2024-091",
    lote: "LT-2024-091",
    cultivo: "Lechuga",
    cantidad: 680,
    etapa: "Desarrollo",
    responsable: "Andrés R.",
    fecha: "2026-08-15",
    ubicacion: "Invernadero 2",
    estado: "Activo",
  },
  {
    id: "LT-2024-094",
    lote: "LT-2024-094",
    cultivo: "Cilantro",
    cantidad: 310,
    etapa: "Germinación",
    responsable: "Camila P.",
    fecha: "2026-09-03",
    ubicacion: "Área de germinación",
    estado: "Activo",
  },
  {
    id: "LT-2024-097",
    lote: "LT-2024-097",
    cultivo: "Pimentón",
    cantidad: 260,
    etapa: "Adaptación",
    responsable: "Julián G.",
    fecha: "2026-08-28",
    ubicacion: "Invernadero 1",
    estado: "Activo",
  },
];
const etapas = ["Germinación", "Adaptación", "Desarrollo", "Cosecha"];
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = (p) => `${p}-${Date.now().toString(36).toUpperCase()}`;
function Modal({ title, onClose, children, wide = false }) {
  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <article
        className={`max-h-[92vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </header>
        <section className="p-5">{children}</section>
      </article>
    </section>
  );
}
function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
function Select({ label, children, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <select
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500"
      >
        {children}
      </select>
    </label>
  );
}
function Kpi({ label, value, detail, icon: Icon, tone = "green" }) {
  const t = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${t[tone]}`}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

export default function ProduccionOperativo() {
  const session = getSession();
  const role = session?.role || "operario";
  const isOperator = role === "operario";
  const canManage = role !== "operario";
  const [lotes, setLotes] = useState(() => read(KEY, seed));
  const [tasks, setTasks] = useState(() => read(TASK_KEY, []));
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("Todas");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const visibles = isOperator
    ? lotes.filter((l) => l.responsable === session?.name)
    : lotes;
  const filtered = useMemo(
    () =>
      visibles.filter(
        (l) =>
          (stage === "Todas" || l.etapa === stage) &&
          `${l.lote} ${l.cultivo} ${l.responsable} ${l.ubicacion}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [visibles, stage, query],
  );
  const save = (data) => {
    setLotes(data);
    write(KEY, data);
    window.dispatchEvent(new Event("aiden-data-change"));
  };
  const advance = (lote) => {
    if (!canManage) return;
    const i = etapas.indexOf(lote.etapa);
    if (i < etapas.length - 1) {
      const next = etapas[i + 1];
      save(lotes.map((x) => (x.id === lote.id ? { ...x, etapa: next } : x)));
      const trace = read(TRACE_KEY, []);
      write(TRACE_KEY, [
        {
          id: uid("TRZ"),
          lote: lote.lote,
          evento: "Cambio de etapa",
          fecha: new Date().toISOString().slice(0, 10),
          responsable: session?.name || lote.responsable,
          detalle: `Lote movido de ${lote.etapa} a ${next}.`,
        },
        ...trace,
      ]);
      setSelected({ ...lote, etapa: next });
    }
  };
  const add = (f) => {
    if (!canManage) return;
    const next = {
      ...f,
      id: f.lote || uid("LT"),
      cantidad: Number(f.cantidad),
      estado: "Activo",
    };
    save([next, ...lotes]);
    const trace = read(TRACE_KEY, []);
    write(TRACE_KEY, [
      {
        id: uid("TRZ"),
        lote: next.lote,
        evento: "Registro de lote",
        fecha: f.fecha,
        responsable: session?.name || f.responsable,
        detalle: `Lote ${f.lote} creado para ${f.cultivo} (${f.cantidad} plantas).`,
      },
      ...trace,
    ]);
    setModal(false);
  };
  const createTask = (lote) => {
    if (!canManage) return;
    const all = [
      {
        id: uid("TSK"),
        titulo: `Inspección ${lote.lote}`,
        responsable: lote.responsable,
        prioridad: "Media",
        estado: "Pendiente",
        fecha: new Date().toISOString().slice(0, 10),
        modulo: "Producción",
        lote: lote.lote,
        descripcion: "Verificar estado y registrar novedad.",
      },
      ...tasks,
    ];
    setTasks(all);
    write(TASK_KEY, all);
    window.dispatchEvent(new Event("aiden-data-change"));
  };
  const myTasks = tasks.filter((t) => t.lote === selected?.lote);
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / operación
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Producción
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {isOperator
              ? "Consulta tus lotes asignados y ejecuta el seguimiento de campo."
              : "Gestiona lotes, etapas, responsables y seguimiento de la producción."}
          </p>
        </section>
        {canManage && (
          <button
            type="button"
            onClick={() => setModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={16} />
            Nuevo lote
          </button>
        )}
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={isOperator ? "Mis lotes" : "Lotes activos"}
          value={visibles.length}
          detail={`${visibles.filter((l) => l.etapa === "Cosecha").length} en cosecha`}
          icon={Sprout}
        />
        <Kpi
          label="Plantas"
          value={visibles
            .reduce((a, l) => a + Number(l.cantidad || 0), 0)
            .toLocaleString("es-CO")}
          detail="En producción"
          icon={CheckCircle2}
        />
        <Kpi
          label="Tareas"
          value={
            tasks.filter((t) => visibles.some((l) => l.lote === t.lote)).length
          }
          detail={
            isOperator ? "Relacionadas con tus lotes" : "Seguimiento de lotes"
          }
          icon={ListChecks}
          tone="blue"
        />
        <Kpi
          label="Por avanzar"
          value={visibles.filter((l) => l.etapa !== "Cosecha").length}
          detail="Con siguiente etapa"
          icon={Clock3}
          tone="amber"
        />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <section>
            <h2 className="font-semibold text-slate-900">Etapa de cada lote</h2>
            <p className="text-xs text-slate-400">
              {canManage
                ? "Avanza el ciclo desde aquí y registra automáticamente la trazabilidad."
                : "Consulta el estado del lote. Los cambios de etapa los realiza supervisión."}
            </p>
          </section>
          <section className="flex gap-1 overflow-x-auto">
            {["Todas", ...etapas].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setStage(e)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${stage === e ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                {e}
              </button>
            ))}
          </section>
        </header>
        <section className="mt-5 space-y-3">
          {filtered.map((l) => {
            const i = etapas.indexOf(l.etapa);
            const pct = Math.round(((i + 1) / etapas.length) * 100);
            return (
              <article
                key={l.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <section className="flex flex-wrap items-center gap-4">
                  <section className="min-w-48 flex-1">
                    <p className="font-mono text-[10px] font-bold text-emerald-700">
                      {l.lote}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {l.cultivo}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {l.responsable} · {l.ubicacion}
                    </p>
                  </section>
                  <section className="w-52">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-slate-400">{l.etapa}</span>
                      <span className="font-semibold text-slate-700">
                        {pct}%
                      </span>
                    </div>
                    <section className="h-2 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </section>
                  </section>
                  <section className="text-right">
                    <p className="text-sm font-bold text-slate-800">
                      {Number(l.cantidad).toLocaleString("es-CO")}
                    </p>
                    <p className="text-[11px] text-slate-400">plantas</p>
                  </section>
                  <section className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSelected(l)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                      title="Ver lote"
                    >
                      <ChevronRight size={16} />
                    </button>
                    {canManage && i < etapas.length - 1 && (
                      <button
                        type="button"
                        onClick={() => advance(l)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                      >
                        Avanzar <ArrowRight size={13} />
                      </button>
                    )}
                  </section>
                </section>
              </article>
            );
          })}
          {!filtered.length && (
            <p className="py-10 text-center text-sm text-slate-400">
              {isOperator
                ? "No tienes lotes asignados actualmente."
                : "No hay lotes que coincidan con el filtro."}
            </p>
          )}
        </section>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4">
          <section className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lote, cultivo, responsable o ubicación..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </section>
          <span className="text-xs text-slate-400">
            {filtered.length} resultados
          </span>
        </header>
      </section>
      {selected && (
        <Modal
          title={`Lote ${selected.lote}`}
          wide
          onClose={() => setSelected(null)}
        >
          <section className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <section>
              <p className="text-2xl font-bold text-slate-950">
                {selected.cultivo}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selected.ubicacion} · responsable {selected.responsable}
              </p>
              <section className="mt-5 grid gap-2 sm:grid-cols-4">
                {etapas.map((e, i) => (
                  <section
                    key={e}
                    className={`rounded-xl border p-3 ${i <= etapas.indexOf(selected.etapa) ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <p className="text-[10px] font-bold text-slate-400">
                      {i + 1}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {e}
                    </p>
                  </section>
                ))}
              </section>
              <section className="mt-5 grid grid-cols-2 gap-3">
                <Info label="Cantidad" value={`${selected.cantidad} plantas`} />
                <Info label="Fecha de inicio" value={selected.fecha} />
                <Info label="Estado" value={selected.estado} />
                <Info label="Responsable" value={selected.responsable} />
              </section>
              <section className="mt-5 flex flex-wrap gap-2">
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => advance(selected)}
                      disabled={
                        etapas.indexOf(selected.etapa) >= etapas.length - 1
                      }
                      className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Avanzar de etapa
                    </button>
                    <button
                      type="button"
                      onClick={() => createTask(selected)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-emerald-200"
                    >
                      <ListChecks size={13} className="mr-1 inline" />
                      Crear tarea
                    </button>
                  </>
                )}
              </section>
            </section>
            <aside className="rounded-2xl bg-slate-50 p-4">
              <header className="flex items-center gap-2">
                <History size={16} className="text-emerald-700" />
                <h3 className="font-semibold text-slate-900">
                  Tareas del lote
                </h3>
              </header>
              <section className="mt-3 space-y-2">
                {myTasks.map((t) => (
                  <section
                    key={t.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {t.titulo}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {t.responsable} · {t.estado}
                    </p>
                  </section>
                ))}
                {!myTasks.length && (
                  <p className="text-xs text-slate-400">
                    Todavía no hay tareas.
                  </p>
                )}
              </section>
            </aside>
          </section>
        </Modal>
      )}
      {modal && (
        <Modal title="Crear lote" onClose={() => setModal(false)}>
          <LoteForm onSubmit={add} />
        </Modal>
      )}
    </section>
  );
}
function Info({ label, value }) {
  return (
    <section className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
    </section>
  );
}
function LoteForm({ onSubmit }) {
  const [f, setF] = useState({
    lote: "",
    cultivo: "",
    cantidad: "",
    etapa: "Germinación",
    responsable: "",
    fecha: new Date().toISOString().slice(0, 10),
    ubicacion: "",
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <section className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Código de lote"
          value={f.lote}
          onChange={(e) => setF({ ...f, lote: e.target.value })}
          placeholder="LT-2026-001"
          required
        />
        <Input
          label="Cultivo"
          value={f.cultivo}
          onChange={(e) => setF({ ...f, cultivo: e.target.value })}
          placeholder="Tomate"
          required
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Cantidad de plantas"
          type="number"
          min="1"
          value={f.cantidad}
          onChange={(e) => setF({ ...f, cantidad: e.target.value })}
          required
        />
        <Select
          label="Etapa"
          value={f.etapa}
          onChange={(e) => setF({ ...f, etapa: e.target.value })}
        >
          <option>Germinación</option>
          <option>Adaptación</option>
          <option>Desarrollo</option>
          <option>Cosecha</option>
        </Select>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Responsable"
          value={f.responsable}
          onChange={(e) => setF({ ...f, responsable: e.target.value })}
          required
        />
        <Input
          label="Ubicación"
          value={f.ubicacion}
          onChange={(e) => setF({ ...f, ubicacion: e.target.value })}
          required
        />
      </section>
      <Input
        label="Fecha de inicio"
        type="date"
        value={f.fecha}
        onChange={(e) => setF({ ...f, fecha: e.target.value })}
      />
      <button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">
        Crear lote
      </button>
    </form>
  );
}

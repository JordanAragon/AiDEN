import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ListChecks,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const KEY = "aiden-personal";
const TASK_KEY = "aiden-tareas";

const seedPeople = [
  {
    id: "PER-001",
    nombre: "Laura M.",
    cargo: "Supervisor",
    contacto: "310 555 0142",
    departamento: "Producción",
    estado: "Activo",
  },
  {
    id: "PER-002",
    nombre: "Andrés R.",
    cargo: "Operario",
    contacto: "312 555 0188",
    departamento: "Producción",
    estado: "Activo",
  },
  {
    id: "PER-003",
    nombre: "Camila P.",
    cargo: "Operario",
    contacto: "314 555 0127",
    departamento: "Calidad",
    estado: "Activo",
  },
  {
    id: "PER-004",
    nombre: "Julián G.",
    cargo: "Operario",
    contacto: "316 555 0104",
    departamento: "Ambiental",
    estado: "Activo",
  },
];

const seedTasks = [
  {
    id: "TSK-001",
    titulo: "Revisar lote LT-2024-089",
    responsable: "Laura M.",
    prioridad: "Alta",
    estado: "Pendiente",
    fecha: "2026-09-15",
    modulo: "Producción",
    lote: "LT-2024-089",
    descripcion: "Validar estado antes de cosecha.",
  },
  {
    id: "TSK-002",
    titulo: "Riego Invernadero 2",
    responsable: "Andrés R.",
    prioridad: "Media",
    estado: "En curso",
    fecha: "2026-09-14",
    modulo: "Ambiental",
    lote: "LT-2024-091",
    descripcion: "Ejecutar riego y registrar lectura.",
  },
  {
    id: "TSK-003",
    titulo: "Reponer sustrato",
    responsable: "Camila P.",
    prioridad: "Alta",
    estado: "Pendiente",
    fecha: "2026-09-16",
    modulo: "Inventario",
    lote: "",
    descripcion: "Solicitar compra de 25 unidades.",
  },
];

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const uid = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

function Modal({ title, onClose, children }) {
  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {children}
      </select>
    </label>
  );
}

export default function PersonalOperativo() {
  const [people, setPeople] = useState(() => read(KEY, seedPeople));
  const [tasks, setTasks] = useState(() => read(TASK_KEY, seedTasks));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);

  const activeTasks = tasks.filter((t) => t.estado !== "Completada");
  const completed = tasks.filter((t) => t.estado === "Completada").length;
  const high = activeTasks.filter((t) => t.prioridad === "Alta").length;
  const filtered = useMemo(
    () =>
      people.filter(
        (p) =>
          (filter === "Todos" || p.cargo === filter) &&
          `${p.nombre} ${p.departamento} ${p.contacto}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [people, filter, search],
  );

  const savePeople = (data) => {
    setPeople(data);
    write(KEY, data);
    window.dispatchEvent(new Event("aiden-data-change"));
  };
  const saveTasks = (data) => {
    setTasks(data);
    write(TASK_KEY, data);
    window.dispatchEvent(new Event("aiden-data-change"));
  };
  const addPerson = (data) => {
    savePeople([{ ...data, id: uid("PER"), estado: "Activo" }, ...people]);
    setModal(null);
  };
  const addTask = (data) => {
    saveTasks([{ ...data, id: uid("TSK"), estado: "Pendiente" }, ...tasks]);
    setModal(null);
  };
  const updateTask = (task, estado) =>
    saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, estado } : t)));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section className="flex items-start gap-3">
          <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users size={20} />
          </span>
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              AiDEN / sistema
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Personal y tareas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Asigna trabajo, controla carga, fechas y avance por colaborador.
            </p>
          </section>
        </section>
        <button
          type="button"
          onClick={() => setModal("task")}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={16} />
          Asignar tarea
        </button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Colaboradores"
          value={people.length}
          detail={`${people.filter((p) => p.estado === "Activo").length} activos`}
          icon={Users}
        />
        <Kpi
          label="Tareas pendientes"
          value={activeTasks.length}
          detail={`${tasks.filter((t) => t.estado === "En curso").length} en curso`}
          icon={ListChecks}
          tone="amber"
        />
        <Kpi
          label="Alta prioridad"
          value={high}
          detail="Sin completar"
          icon={CircleAlert}
          tone="red"
        />
        <Kpi
          label="Completadas"
          value={completed}
          detail="Histórico de tareas"
          icon={CheckCircle2}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="font-semibold text-slate-900">Carga de trabajo</h2>
              <p className="text-xs text-slate-400">
                Avance de tareas por persona
              </p>
            </section>
            <UserCheck size={18} className="text-emerald-700" />
          </header>
          <section className="mt-5 space-y-4">
            {people.map((p) => {
              const own = tasks.filter((t) => t.responsable === p.nombre);
              const done = own.filter((t) => t.estado === "Completada").length;
              const pct = own.length
                ? Math.round((done / own.length) * 100)
                : 0;
              return (
                <article key={p.id}>
                  <section className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {p.nombre}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {done}/{own.length} completadas
                    </span>
                  </section>
                  <section className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </section>
                </article>
              );
            })}
          </section>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Prioridades
          </p>
          <p className="mt-2 text-3xl font-bold">{high}</p>
          <p className="text-sm text-white/60">
            tareas de alta prioridad pendientes
          </p>
          <section className="mt-5 space-y-2">
            {activeTasks
              .filter((t) => t.prioridad === "Alta")
              .slice(0, 4)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className="flex w-full items-start gap-3 rounded-xl bg-white/5 p-3 text-left hover:bg-white/10"
                >
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400" />
                  <span>
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {t.responsable} · vence {t.fecha}
                    </p>
                  </span>
                </button>
              ))}
          </section>
        </article>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <section className="relative min-w-56 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar colaborador..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </section>
          {["Todos", "Supervisor", "Operario"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === v ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setModal("person")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-200"
          >
            <Plus size={14} />
            Nuevo colaborador
          </button>
        </header>
        <section className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const own = tasks.filter((t) => t.responsable === p.nombre);
            const pending = own.filter((t) => t.estado !== "Completada");
            return (
              <article
                key={p.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <header className="flex items-start justify-between gap-3">
                  <section>
                    <p className="font-semibold text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {p.cargo} · {p.departamento}
                    </p>
                  </section>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                    {p.estado}
                  </span>
                </header>
                <section className="mt-4 grid grid-cols-3 gap-2">
                  <Mini label="Tareas" value={own.length} />
                  <Mini label="Pendientes" value={pending.length} />
                  <Mini
                    label="Alta"
                    value={pending.filter((t) => t.prioridad === "Alta").length}
                  />
                </section>
                <footer className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="text-xs font-semibold text-emerald-700"
                  >
                    Ver perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(p);
                      setModal("task");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700"
                  >
                    <Plus size={12} />
                    Asignar
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      </section>
      {selected && (
        <Modal
          title={selected.titulo ? "Detalle de tarea" : selected.nombre}
          onClose={() => setSelected(null)}
        >
          {selected.titulo ? (
            <section className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {selected.titulo}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.descripcion}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Info label="Responsable" value={selected.responsable} />
                <Info label="Fecha límite" value={selected.fecha} />
                <Info label="Módulo" value={selected.modulo} />
                <Info label="Lote" value={selected.lote || "Sin lote"} />
              </div>
              <Select
                label="Estado"
                value={selected.estado}
                onChange={(e) => {
                  updateTask(selected, e.target.value);
                  setSelected({ ...selected, estado: e.target.value });
                }}
              >
                <option>Pendiente</option>
                <option>En curso</option>
                <option>Completada</option>
              </Select>
              <button
                type="button"
                onClick={() => {
                  updateTask(selected, "Completada");
                  setSelected(null);
                }}
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
              >
                Marcar como completada
              </button>
            </section>
          ) : (
            <section className="space-y-4">
              <p className="text-sm text-slate-500">
                {selected.cargo} · {selected.departamento}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Info label="Contacto" value={selected.contacto} />
                <Info label="Estado" value={selected.estado} />
              </div>
              <h3 className="font-semibold text-slate-900">Tareas asignadas</h3>
              <section className="space-y-2">
                {tasks
                  .filter((t) => t.responsable === selected.nombre)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelected(t)}
                      className="w-full rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {t.titulo}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {t.estado} · vence {t.fecha}
                      </p>
                    </button>
                  ))}
              </section>
            </section>
          )}
        </Modal>
      )}
      {modal === "task" && (
        <Modal title="Asignar tarea" onClose={() => setModal(null)}>
          <TaskForm
            people={people}
            initialPerson={selected?.nombre}
            onSubmit={addTask}
          />
        </Modal>
      )}
      {modal === "person" && (
        <Modal title="Nuevo colaborador" onClose={() => setModal(null)}>
          <PersonForm onSubmit={addPerson} />
        </Modal>
      )}
    </section>
  );
}
function Kpi({ label, value, detail, icon: Icon, tone = "green" }) {
  const toneMap = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneMap[tone]}`}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}
function Mini({ label, value }) {
  return (
    <section className="rounded-xl bg-slate-50 p-2.5">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
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
function TaskForm({ people, initialPerson, onSubmit }) {
  const [f, setF] = useState({
    titulo: "",
    responsable: initialPerson || people[0]?.nombre || "",
    prioridad: "Media",
    fecha: new Date().toISOString().slice(0, 10),
    modulo: "Producción",
    lote: "",
    descripcion: "",
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <Input
        label="Título"
        value={f.titulo}
        onChange={(e) => setF({ ...f, titulo: e.target.value })}
        required
        placeholder="Ej. Revisar bandejas"
      />
      <section className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Responsable"
          value={f.responsable}
          onChange={(e) => setF({ ...f, responsable: e.target.value })}
        >
          {people.map((p) => (
            <option key={p.id}>{p.nombre}</option>
          ))}
        </Select>
        <Select
          label="Prioridad"
          value={f.prioridad}
          onChange={(e) => setF({ ...f, prioridad: e.target.value })}
        >
          <option>Baja</option>
          <option>Media</option>
          <option>Alta</option>
        </Select>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Fecha límite"
          type="date"
          value={f.fecha}
          onChange={(e) => setF({ ...f, fecha: e.target.value })}
        />
        <Select
          label="Módulo"
          value={f.modulo}
          onChange={(e) => setF({ ...f, modulo: e.target.value })}
        >
          <option>Producción</option>
          <option>Ambiental</option>
          <option>Inventario</option>
          <option>Calidad</option>
          <option>Trazabilidad</option>
        </Select>
      </section>
      <Input
        label="Lote relacionado"
        value={f.lote}
        onChange={(e) => setF({ ...f, lote: e.target.value })}
      />
      <label className="block text-sm font-medium text-slate-600">
        Descripción
        <textarea
          value={f.descripcion}
          onChange={(e) => setF({ ...f, descripcion: e.target.value })}
          className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
        />
      </label>
      <button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">
        Asignar tarea
      </button>
    </form>
  );
}
function PersonForm({ onSubmit }) {
  const [f, setF] = useState({
    nombre: "",
    cargo: "Operario",
    departamento: "Producción",
    contacto: "",
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <Input
        label="Nombre completo"
        value={f.nombre}
        onChange={(e) => setF({ ...f, nombre: e.target.value })}
        required
      />
      <Select
        label="Cargo"
        value={f.cargo}
        onChange={(e) => setF({ ...f, cargo: e.target.value })}
      >
        <option>Operario</option>
        <option>Supervisor</option>
        <option>Administrador</option>
      </Select>
      <Select
        label="Departamento"
        value={f.departamento}
        onChange={(e) => setF({ ...f, departamento: e.target.value })}
      >
        <option>Producción</option>
        <option>Calidad</option>
        <option>Ambiental</option>
        <option>Inventario</option>
      </Select>
      <Input
        label="Contacto"
        value={f.contacto}
        onChange={(e) => setF({ ...f, contacto: e.target.value })}
      />
      <button className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white">
        Crear colaborador
      </button>
    </form>
  );
}

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Plus,
  Search,
  X,
} from "lucide-react";
import { getSession } from "../../utilidades/autenticacion";

const KEY = "aiden-calidad";
const PEOPLE = "aiden-personal";
const LOTS = "aiden-produccion";
const TRACE = "aiden-trazabilidad";

const SEED = [
  {
    id: "INC-031",
    codigo: "INC-031",
    lote: "LT-2024-089",
    prioridad: "Alta",
    descripcion: "Hojas amarillas",
    responsable: "Laura M.",
    estado: "Abierta",
    accion: "",
    fecha: "2026-09-13",
  },
  {
    id: "INC-028",
    codigo: "INC-028",
    lote: "LT-2024-097",
    prioridad: "Media",
    descripcion: "Crecimiento irregular",
    responsable: "Andrés R.",
    estado: "En revisión",
    accion: "Revisar riego y sustrato",
    fecha: "2026-09-12",
  },
  {
    id: "INC-026",
    codigo: "INC-026",
    lote: "LT-2024-091",
    prioridad: "Baja",
    descripcion: "Bandejas deterioradas",
    responsable: "Camila P.",
    estado: "Cerrada",
    accion: "Reemplazar bandeja",
    fecha: "2026-09-10",
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

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = () => `INC-${Date.now().toString(36).toUpperCase()}`;
const traceUid = () => `TRZ-${Date.now().toString(36).toUpperCase()}`;

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <section
      className="aiden-modal-fondo fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="aiden-modal-entrada max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calidad-modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="calidad-modal-title" className="font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </header>
        <section className="p-5">{children}</section>
      </article>
    </section>
  );
}

function Kpi({ label, value, detail, icon: Icon, tone = "green" }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

export default function CalidadOperativo() {
  const session = getSession();
  const role = session?.role || "operario";
  const [rows, setRows] = useState(() => read(KEY, SEED));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [modal, setModal] = useState(false);
  const lots = read(LOTS, []);
  const people = read(PEOPLE, []);
  const ownLots = useMemo(
    () =>
      new Set(
        lots
          .filter((lot) => role !== "operario" || lot.responsable === session?.name)
          .map((lot) => lot.lote),
      ),
    [lots, role, session?.name],
  );
  const visible = role === "operario" ? rows.filter((row) => ownLots.has(row.lote)) : rows;
  const open = visible.filter((row) => (row.estado ?? row.estadoManual) !== "Cerrada");
  const high = open.filter((row) => row.prioridad === "Alta");
  const filtered = useMemo(
    () =>
      visible.filter(
        (row) =>
          (filter === "Todas" || (row.estado ?? row.estadoManual) === filter) &&
          `${row.codigo} ${row.lote} ${row.descripcion} ${row.responsable}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [visible, filter, query],
  );

  const save = (next) => {
    setRows(next);
    write(KEY, next);
    window.dispatchEvent(new Event("aiden-data-change"));
  };

  const create = (form) => {
    if (
      !form.lote ||
      !ownLots.has(form.lote) ||
      !form.descripcion?.trim() ||
      !["Alta", "Media", "Baja"].includes(form.prioridad)
    ) {
      return;
    }

    const codigo = uid();
    const nuevo = {
      ...form,
      id: codigo,
      codigo,
      estado: "Abierta",
      fecha: new Date().toISOString().slice(0, 10),
      responsable:
        role === "operario" ? session?.name || form.responsable : form.responsable,
    };
    save([nuevo, ...rows]);
    setModal(false);
  };

  const update = (row, field, value) => {
    if (role === "operario") return;
    const allowedStates = ["Abierta", "En revisión", "Cerrada"];
    if (field === "estado" && !allowedStates.includes(value)) return;

    const next = rows.map((item) =>
      item.id === row.id ? { ...item, [field]: value } : item,
    );
    save(next);

    if (field === "estado" && value === "Cerrada") {
      const trace = read(TRACE, []);
      write(TRACE, [
        {
          id: traceUid(),
          lote: row.lote,
          evento: "Cierre de calidad",
          fecha: new Date().toISOString().slice(0, 10),
          responsable: session?.name || row.responsable,
          detalle: `Se cerró ${row.codigo}: ${row.accion || "sin acción documentada"}.`,
        },
        ...trace,
      ]);
      window.dispatchEvent(new Event("aiden-data-change"));
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / seguimiento
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Calidad
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Registra desviaciones y conserva la respuesta aplicada a cada incidencia.
          </p>
        </section>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={16} />
          Nueva incidencia
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Incidencias"
          value={visible.length}
          detail="Registros visibles"
          icon={ClipboardCheck}
        />
        <Kpi
          label="Abiertas"
          value={open.length}
          detail="En seguimiento"
          icon={CircleAlert}
          tone="amber"
        />
        <Kpi
          label="Alta prioridad"
          value={high.length}
          detail="Requieren respuesta"
          icon={AlertTriangle}
          tone="red"
        />
        <Kpi
          label="Resueltas"
          value={visible.filter((row) => (row.estado ?? row.estadoManual) === "Cerrada").length}
          detail="Cerradas"
          icon={CheckCircle2}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <section className="relative min-w-56 flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar incidencia, lote o responsable..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              aria-label="Buscar incidencias"
            />
          </section>
          {["Todas", "Abierta", "En revisión", "Cerrada"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === status ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {status}
            </button>
          ))}
        </header>

        <section className="grid gap-3 p-4">
          {filtered.map((row) => {
            const state = row.estado ?? row.estadoManual;
            return (
              <article key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <section>
                    <p className="font-mono text-[10px] text-emerald-700">
                      {row.codigo} · {row.lote || "Sin lote"}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-slate-900">
                      {row.descripcion}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {row.responsable || "Sin asignar"} · {row.fecha}
                    </p>
                  </section>
                  <section className="flex gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${row.prioridad === "Alta" ? "bg-red-50 text-red-700" : row.prioridad === "Media" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {row.prioridad}
                    </span>
                    {role !== "operario" ? (
                      <select
                        value={state}
                        onChange={(event) => update(row, "estado", event.target.value)}
                        aria-label={`Estado de ${row.codigo}`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold"
                      >
                        <option>Abierta</option>
                        <option>En revisión</option>
                        <option>Cerrada</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                        {state}
                      </span>
                    )}
                  </section>
                </header>

                <section className="mt-4">
                  {role !== "operario" ? (
                    <Field label="Acción correctiva">
                      <input
                        value={row.accion || ""}
                        onChange={(event) => update(row, "accion", event.target.value)}
                        placeholder="Qué se hará para corregir..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                      />
                    </Field>
                  ) : (
                    <section className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Acción definida
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {row.accion || "Pendiente de definir por supervisión."}
                      </p>
                    </section>
                  )}
                </section>
              </article>
            );
          })}

          {!filtered.length && (
            <p className="p-10 text-center text-sm text-slate-400">
              No hay incidencias visibles para tu rol y filtros actuales.
            </p>
          )}
        </section>
      </section>

      {modal && (
        <Modal title="Nueva incidencia" onClose={() => setModal(false)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              create(Object.fromEntries(new FormData(event.currentTarget).entries()));
            }}
          >
            <Field label="Lote">
              <select
                name="lote"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {[...ownLots].map((lot) => (
                  <option key={lot}>{lot}</option>
                ))}
              </select>
            </Field>
            <Field label="Prioridad">
              <select
                name="prioridad"
                defaultValue="Media"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option>Media</option>
                <option>Alta</option>
                <option>Baja</option>
              </select>
            </Field>
            <Field label="Descripción">
              <textarea
                name="descripcion"
                required
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="Describe la desviación observada..."
              />
            </Field>
            <Field label="Responsable">
              <select
                name="responsable"
                defaultValue={role === "operario" ? session?.name || "" : people[0]?.nombre || ""}
                disabled={role === "operario"}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {people.map((person) => (
                  <option key={person.id}>{person.nombre}</option>
                ))}
                {role === "operario" &&
                  session?.name &&
                  !people.some((person) => person.nombre === session.name) && (
                    <option>{session.name}</option>
                  )}
              </select>
            </Field>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Registrar incidencia
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

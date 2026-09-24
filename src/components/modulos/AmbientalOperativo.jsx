import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  History,
  Plus,
  Thermometer,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSession } from "../../utilidades/autenticacion";

const KEY = "aiden-ambiental";
const CONFIG = "aiden-configuracion";
const LOTS = "aiden-produccion";
const DEFAULTS = { tempMin: 18, tempMax: 27, humMin: 55, humMax: 80 };

const SEED = [
  {
    id: "AMB-001",
    zona: "Invernadero 1",
    temperatura: 23.9,
    humedad: 65,
    iluminacion: 8400,
    fecha: "2026-09-14T09:30",
  },
  {
    id: "AMB-002",
    zona: "Invernadero 2",
    temperatura: 28.6,
    humedad: 71,
    iluminacion: 7900,
    fecha: "2026-09-14T09:25",
  },
  {
    id: "AMB-003",
    zona: "Área de germinación",
    temperatura: 22.4,
    humedad: 69,
    iluminacion: 6100,
    fecha: "2026-09-14T09:20",
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return `AMB-${Date.now().toString(36).toUpperCase()}`;
}

function isOutside(row, config) {
  return (
    Number(row.temperatura) < Number(config.tempMin) ||
    Number(row.temperatura) > Number(config.tempMax) ||
    Number(row.humedad) < Number(config.humMin) ||
    Number(row.humedad) > Number(config.humMax)
  );
}

function Modal({ onClose, children }) {
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
        aria-labelledby="ambiental-modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="ambiental-modal-title" className="font-semibold text-slate-900">
            Nueva lectura
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

function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
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
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

export default function AmbientalOperativo() {
  const session = getSession();
  const role = session?.role || "operario";
  const [rows, setRows] = useState(() => read(KEY, SEED));
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState(false);
  const [zone, setZone] = useState("Todas");

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener("aiden-config-change", refresh);
    window.addEventListener("aiden-data-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("aiden-config-change", refresh);
      window.removeEventListener("aiden-data-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const config = useMemo(
    () => ({ ...DEFAULTS, ...read(CONFIG, {}) }),
    [version],
  );
  const lots = read(LOTS, []);
  const permittedZones = useMemo(() => {
    if (role !== "operario") return null;
    return new Set(
      lots
        .filter((lot) => lot.responsable === session?.name)
        .map((lot) => lot.ubicacion)
        .filter(Boolean),
    );
  }, [role, session?.name, version]);
  const visibleRows =
    role === "operario" && permittedZones
      ? rows.filter((row) => permittedZones.has(row.zona))
      : rows;
  const zones = [...new Set(visibleRows.map((row) => row.zona))];
  const latest = zones.map((currentZone) =>
    visibleRows
      .filter((row) => row.zona === currentZone)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0],
  );
  const alerts = latest.filter((row) => isOutside(row, config));
  const filtered = zone === "Todas" ? latest : latest.filter((row) => row.zona === zone);

  const save = (next) => {
    setRows(next);
    write(KEY, next);
    window.dispatchEvent(new Event("aiden-data-change"));
  };

  const add = (form) => {
    const temperatura = Number(form.temperatura);
    const humedad = Number(form.humedad);
    const iluminacion = Number(form.iluminacion);
    const permitted = role !== "operario" || permittedZones?.has(form.zona);

    if (
      !form.zona ||
      !permitted ||
      !form.fecha ||
      !Number.isFinite(temperatura) ||
      !Number.isFinite(humedad) ||
      !Number.isFinite(iluminacion) ||
      temperatura < -30 ||
      temperatura > 70 ||
      humedad < 0 ||
      humedad > 100 ||
      iluminacion < 0
    ) {
      return;
    }

    save([
      {
        ...form,
        id: uid(),
        temperatura,
        humedad,
        iluminacion,
      },
      ...rows,
    ]);
    setModal(false);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / seguimiento
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Ambiental
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Monitorea temperatura, humedad e iluminación por zona para detectar
            condiciones que requieren atención.
          </p>
        </section>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={16} />
          Registrar lectura
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Zonas"
          value={zones.length}
          detail="Con lecturas visibles"
          icon={Thermometer}
        />
        <Kpi
          label="En alerta"
          value={alerts.length}
          detail={`${config.tempMin}–${config.tempMax} °C · ${config.humMin}–${config.humMax}%`}
          icon={AlertTriangle}
          tone={alerts.length ? "red" : "green"}
        />
        <Kpi
          label="Lecturas"
          value={visibleRows.length}
          detail="Histórico disponible"
          icon={History}
        />
        <Kpi
          label="Actualizado"
          value={
            latest[0]
              ? new Date(latest[0].fecha).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
          detail="Última lectura visible"
          icon={Clock3}
          tone="amber"
        />
      </section>

      <section className="flex gap-1 overflow-x-auto" aria-label="Filtrar zonas">
        {["Todas", ...zones].map((currentZone) => (
          <button
            key={currentZone}
            type="button"
            onClick={() => setZone(currentZone)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${zone === currentZone ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            {currentZone}
          </button>
        ))}
      </section>

      {alerts.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <header className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <h2 className="font-semibold text-amber-900">Atención ambiental</h2>
          </header>
          <p className="mt-1 text-xs text-amber-800">
            Las alertas se calculan con los umbrales definidos en Configuración.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row) => {
          const alert = isOutside(row, config);
          const history = visibleRows
            .filter((item) => item.zona === row.zona)
            .slice(0, 10)
            .reverse();

          return (
            <article
              key={row.zona}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <header className="flex items-start justify-between gap-3">
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">
                    Zona
                  </p>
                  <h2 className="mt-1 font-semibold text-slate-900">{row.zona}</h2>
                </section>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${alert ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {alert ? "Atención" : "Estable"}
                </span>
              </header>

              <section className="mt-5 grid grid-cols-3 gap-2">
                <Metric
                  label="Temperatura"
                  value={`${row.temperatura} °C`}
                  danger={
                    Number(row.temperatura) < config.tempMin ||
                    Number(row.temperatura) > config.tempMax
                  }
                />
                <Metric
                  label="Humedad"
                  value={`${row.humedad}%`}
                  danger={
                    Number(row.humedad) < config.humMin ||
                    Number(row.humedad) > config.humMax
                  }
                />
                <Metric
                  label="Luz"
                  value={`${Number(row.iluminacion).toLocaleString("es-CO")} lux`}
                />
              </section>

              <section className="mt-5 h-20" aria-label={`Histórico de ${row.zona}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="fecha" hide />
                    <YAxis hide />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleString("es-CO")
                      }
                    />
                    <Line
                      dataKey="temperatura"
                      stroke="#176b45"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="humedad"
                      stroke="#6b8fb3"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              <footer className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                Última lectura: {new Date(row.fecha).toLocaleString("es-CO")}
              </footer>
            </article>
          );
        })}

        {!filtered.length && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">
            No hay lecturas visibles para tu rol.
          </p>
        )}
      </section>

      {modal && (
        <Modal onClose={() => setModal(false)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              add(Object.fromEntries(new FormData(event.currentTarget).entries()));
            }}
          >
            <Input
              name="zona"
              label="Zona"
              list="aiden-zonas"
              required
              placeholder="Invernadero 1"
              defaultValue={
                role === "operario" ? [...(permittedZones || [])][0] || "" : ""
              }
            />
            <datalist id="aiden-zonas">
              {(role === "operario" ? [...(permittedZones || [])] : zones).map(
                (currentZone) => (
                  <option key={currentZone} value={currentZone} />
                ),
              )}
            </datalist>
            <section className="grid gap-2 sm:grid-cols-3">
              <Input
                name="temperatura"
                label="Temperatura °C"
                type="number"
                step="0.1"
                min="-30"
                max="70"
                required
              />
              <Input
                name="humedad"
                label="Humedad %"
                type="number"
                min="0"
                max="100"
                required
              />
              <Input
                name="iluminacion"
                label="Iluminación lux"
                type="number"
                min="0"
                required
              />
            </section>
            <Input
              name="fecha"
              label="Fecha y hora"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Guardar lectura
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <section className={`rounded-xl p-3 ${danger ? "bg-red-50" : "bg-slate-50"}`}>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${danger ? "text-red-700" : "text-slate-800"}`}>
        {value}
      </p>
    </section>
  );
}

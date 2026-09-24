import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Gauge,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";

const KEY = "aiden-configuracion";
const defaults = {
  tempMin: 18,
  tempMax: 27,
  humMin: 55,
  humMax: 80,
  notificaciones: "Activadas",
};
const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
};
const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));

export default function ConfiguracionOperativo() {
  const [rules, setRules] = useState(read);
  const [saved, setSaved] = useState(false);
  const update = (key, value) => {
    setSaved(false);
    setRules((prev) => ({ ...prev, [key]: value }));
  };
  const save = () => {
    const normalized = {
      ...rules,
      tempMin: Number(rules.tempMin),
      tempMax: Number(rules.tempMax),
      humMin: Number(rules.humMin),
      humMax: Number(rules.humMax),
    };
    write(normalized);
    setRules(normalized);
    window.dispatchEvent(new Event("aiden-config-change"));
    window.dispatchEvent(new Event("aiden-data-change"));
    setSaved(true);
  };
  const valid = rules.tempMin < rules.tempMax && rules.humMin < rules.humMax;
  const summary = useMemo(
    () => [
      {
        label: "Temperatura",
        value: `${rules.tempMin}–${rules.tempMax} °C`,
        icon: Gauge,
      },
      {
        label: "Humedad",
        value: `${rules.humMin}–${rules.humMax}%`,
        icon: Gauge,
      },
      { label: "Alertas", value: rules.notificaciones, icon: Bell },
    ],
    [rules],
  );
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            AiDEN / sistema
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Configuración
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Define reglas que sí afectan la operación. Los umbrales ambientales
            se usan para calcular las alertas del módulo Ambiental.
          </p>
        </section>
        <button
          type="button"
          onClick={save}
          disabled={!valid}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save size={16} />
          Guardar cambios
        </button>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon size={17} />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center gap-2">
            <Gauge size={18} className="text-emerald-700" />
            <section>
              <h2 className="font-semibold text-slate-900">
                Umbrales ambientales
              </h2>
              <p className="text-xs text-slate-400">
                Estos valores determinan cuándo una zona aparece en alerta.
              </p>
            </section>
          </header>
          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Temperatura mínima (°C)"
              value={rules.tempMin}
              onChange={(v) => update("tempMin", v)}
            />
            <Field
              label="Temperatura máxima (°C)"
              value={rules.tempMax}
              onChange={(v) => update("tempMax", v)}
            />
            <Field
              label="Humedad mínima (%)"
              value={rules.humMin}
              onChange={(v) => update("humMin", v)}
            />
            <Field
              label="Humedad máxima (%)"
              value={rules.humMax}
              onChange={(v) => update("humMax", v)}
            />
          </section>
          {!valid && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              Cada mínimo debe ser menor que su máximo.
            </p>
          )}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
          <header className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-300" />
            <h2 className="font-semibold">Comportamiento del sistema</h2>
          </header>
          <section className="mt-5 space-y-3 text-sm text-white/65">
            <p>Ambiental usa los umbrales guardados aquí.</p>
            <p>
              El centro de notificaciones puede mostrar alertas cuando una
              lectura los supera.
            </p>
            <p>
              La configuración queda almacenada en este navegador para la V1 y
              se comparte entre módulos mediante eventos.
            </p>
          </section>
          <label className="mt-5 block text-sm font-medium text-white/75">
            Notificaciones
            <select
              value={rules.notificaciones}
              onChange={(e) => update("notificaciones", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option className="text-slate-900">Activadas</option>
              <option className="text-slate-900">Desactivadas</option>
            </select>
          </label>
        </article>
      </section>
      {saved && (
        <section className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          Configuración guardada
        </section>
      )}
    </section>
  );
}
function Field({ label, value, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-600">
      {label}
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

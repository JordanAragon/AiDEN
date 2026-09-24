import { useEffect, useMemo, useState } from "react";
import { getSession, register, resetPassword } from "../../utilidades/autenticacion";
import { leerAuditoria, registrarAuditoria } from "../../utilidades/auditoria";
import {
  Bell,
  CheckCircle2,
  Gauge,
  Save,
  Settings,
  ShieldCheck,
  KeyRound,
  Pencil,
  Plus,
  UserPlus,
  Users,
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
const write = (data) => { localStorage.setItem(KEY, JSON.stringify(data)); window.dispatchEvent(new Event("aiden-config-change")); window.dispatchEvent(new Event("aiden-data-change")); };
const USERS_KEY = "aiden_users";
const CENTERS_KEY = "aiden-centros-costo";
const DEFAULT_CENTERS = [
  { id: "CC-001", nombre: "Producción café", modulo: "Producción", responsable: "Supervisor", estado: "Activo" },
  { id: "CC-002", nombre: "Producción tomate", modulo: "Producción", responsable: "Supervisor", estado: "Activo" },
  { id: "CC-003", nombre: "Calidad fitosanitaria", modulo: "Calidad", responsable: "Supervisor", estado: "Activo" },
  { id: "CC-004", nombre: "Inventario", modulo: "Inventario", responsable: "Administrador", estado: "Activo" },
];
const readList = (key, fallback) => { try { const raw = localStorage.getItem(key); const value = raw ? JSON.parse(raw) : fallback; return Array.isArray(value) ? value : fallback; } catch { return fallback; } };
const roleLabel = (role) => ({ admin: "Administrador", supervisor: "Supervisor", operario: "Operario" }[role] || role);

export default function ConfiguracionOperativo() {
  const [rules, setRules] = useState(read);
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState(() => readList(USERS_KEY, []));
  const [centers, setCenters] = useState(() => readList(CENTERS_KEY, DEFAULT_CENTERS));
  const [auditVersion, setAuditVersion] = useState(0);
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
  const session = getSession();
  const activeUsers = users.filter((user) => (user.status ?? "Activo") === "Activo").length;
  const activeCenters = centers.filter((center) => center.estado === "Activo").length;
  const audit = useMemo(() => leerAuditoria(20), [auditVersion]);
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Users size={17} /></span><p className="mt-4 text-2xl font-bold text-slate-950">{activeUsers}</p><p className="text-xs font-semibold text-slate-600">Usuarios activos</p><p className="mt-1 text-[11px] text-slate-400">{users.length} cuentas registradas</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={17} /></span><p className="mt-4 text-2xl font-bold text-slate-950">3</p><p className="text-xs font-semibold text-slate-600">Roles oficiales</p><p className="mt-1 text-[11px] text-slate-400">Administrador · Supervisor · Operario</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Settings size={17} /></span><p className="mt-4 text-2xl font-bold text-slate-950">{activeCenters}</p><p className="text-xs font-semibold text-slate-600">Centros de costo</p><p className="mt-1 text-[11px] text-slate-400">{centers.length} definidos</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Bell size={17} /></span><p className="mt-4 text-lg font-bold text-slate-950">{rules.notificaciones}</p><p className="text-xs font-semibold text-slate-600">Notificaciones</p><p className="mt-1 text-[11px] text-slate-400">Umbral activo</p></article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><section><h2 className="font-semibold text-slate-900">Usuarios y roles</h2><p className="text-xs text-slate-400">Alta, edición, permisos y recuperación.</p></section><button type="button" onClick={createUser} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"><UserPlus size={14} />Nuevo usuario</button></header>
          <section className="overflow-x-auto"><table className="w-full min-w-[650px]"><thead><tr className="bg-slate-50">{["Usuario","Rol","Estado","Acciones"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="text-[11px] text-slate-400">{user.email}</p></td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{roleLabel(user.role)}</span></td><td className="px-4 py-3"><button type="button" onClick={() => toggleUser(user)} className={"rounded-full px-2 py-1 text-[10px] font-bold " + ((user.status ?? "Activo") === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{user.status ?? "Activo"}</button></td><td className="px-4 py-3"><section className="flex gap-1"><button type="button" title="Editar" onClick={() => editUser(user)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={14} /></button><button type="button" title="Restablecer contraseña" onClick={() => resetUser(user)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><KeyRound size={14} /></button></section></td></tr>)}</tbody></table></section>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><section><h2 className="font-semibold text-slate-900">Centros de costo</h2><p className="text-xs text-slate-400">Estructura compartida con Costos y Reportes.</p></section><button type="button" onClick={addCenter} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-200"><Plus size={14} />Nuevo centro</button></header>
          <section className="divide-y divide-slate-100">{centers.map((center) => <article key={center.id} className="flex items-center justify-between gap-3 p-4"><section><p className="font-mono text-[10px] text-emerald-700">{center.id}</p><h3 className="text-sm font-semibold text-slate-800">{center.nombre}</h3><p className="text-[11px] text-slate-400">{center.modulo} · {center.responsable}</p></section><section className="flex items-center gap-1"><button type="button" onClick={() => editCenter(center)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Editar"><Pencil size={14} /></button><button type="button" onClick={() => toggleCenter(center)} className={"rounded-full px-2 py-1 text-[10px] font-bold " + (center.estado === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{center.estado}</button></section></article>)}</section>
        </article>
      </section>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 p-5"><section><h2 className="font-semibold text-slate-900">Parámetros y permisos</h2><p className="text-xs text-slate-400">Catálogos base y responsabilidades por rol.</p></section><button type="button" onClick={() => exportRows(users.map(({password, clave, ...u}) => ({Usuario:u.name, Correo:u.email, Rol:roleLabel(u.role), Estado:u.status ?? "Activo"})), "aiden-usuarios.csv")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><Download size={14} />Exportar usuarios</button></header>
        <section className="grid gap-3 p-4 md:grid-cols-3"><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Administrador</p><p className="mt-2 text-xs leading-5 text-slate-600">Usuarios, configuración, costos, reportes y todos los módulos.</p></article><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Supervisor</p><p className="mt-2 text-xs leading-5 text-slate-600">Producción, inventario, ambiente, calidad, trazabilidad, personal y costos.</p></article><article className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Operario</p><p className="mt-2 text-xs leading-5 text-slate-600">Producción, ambiente, calidad, trazabilidad y tareas asignadas.</p></article></section>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm" id="auditoria">
        <header className="flex items-center justify-between border-b border-slate-100 p-5"><section><h2 className="font-semibold text-slate-900">Bitácora de auditoría</h2><p className="text-xs text-slate-400">Cambios realizados desde los módulos administrativos.</p></section><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{audit.length} registros</span></header>
        <section className="divide-y divide-slate-100">{audit.slice(0, 10).map((item) => <article key={item.id} className="grid gap-2 p-4 md:grid-cols-[150px_1fr_180px]"><p className="text-xs text-slate-400">{new Date(item.fecha).toLocaleString("es-CO")}</p><section><p className="text-sm font-semibold text-slate-800">{item.accion} · {item.entidad || "Sistema"}</p><p className="mt-1 text-xs text-slate-500">{item.detalle}</p></section><p className="text-xs text-slate-500">{item.usuario || "Sistema"} · {item.modulo}</p></article>)}{!audit.length && <section className="px-5 py-10 text-center text-sm text-slate-400">Aún no hay acciones auditadas.</section>}</section>
      </article>

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

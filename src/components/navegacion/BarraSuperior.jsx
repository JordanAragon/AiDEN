import {
  Bell,
  ChevronDown,
  Command,
  LogOut,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardPath,
  getSession,
  logout,
} from "../../utilidades/autenticacion";
import {
  leerConfiguracion,
  leerDato,
  obtenerAlertasAmbientales,
} from "../../utilidades/datosOperativos";

const MODULOS = [
  { nombre: "Dashboard", ruta: "/dashboard-admin", roles: ["admin", "supervisor", "operario"] },
  { nombre: "Producción", ruta: "/produccion", roles: ["admin", "supervisor", "operario"] },
  { nombre: "Trazabilidad", ruta: "/trazabilidad", roles: ["admin", "supervisor", "operario"] },
  { nombre: "Ambiental", ruta: "/ambiental", roles: ["admin", "supervisor", "operario"] },
  { nombre: "Calidad", ruta: "/calidad", roles: ["admin", "supervisor", "operario"] },
  { nombre: "Inventario", ruta: "/inventario", roles: ["admin", "supervisor"] },
  { nombre: "Costos", ruta: "/costos", roles: ["admin", "supervisor"] },
  { nombre: "Personal", ruta: "/personal", roles: ["admin", "supervisor"] },
  { nombre: "Inteligencia", ruta: "/ia", roles: ["admin", "supervisor"] },
  { nombre: "Reportes", ruta: "/reportes", roles: ["admin", "supervisor"] },
  { nombre: "Configuración", ruta: "/configuracion", roles: ["admin"] },
];
const roleLabel = { admin: "Administrador", supervisor: "Supervisor", operario: "Operario" };
const leer = (tipo, fallback = []) => leerDato(`aiden-${tipo}`, fallback);
const CLAVE_NOTIFICACIONES = "aiden-notificaciones-leidas";

export default function BarraSuperior() {
  const navigate = useNavigate();
  const session = getSession();
  const role = session?.role || "operario";
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [search, setSearch] = useState("");
  const [notificaciones, setNotificaciones] = useState([]);
  const modulos = useMemo(() => MODULOS.filter((m) => m.roles.includes(role)), [role]);

  const refrescar = () => {
    const cfg = leerConfiguracion();
    let leidas = [];
    try {
      leidas = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES) || "[]");
    } catch {}

    const inventario = leer("inventario");
    const produccion = leer("produccion");
    const ambiental = leer("ambiental");
    const calidad = leer("calidad");
    const propios = produccion.filter((row) => row.responsable === session?.name);
    const ambientales = obtenerAlertasAmbientales(ambiental, cfg).filter(
      (alerta) => role !== "operario" || propios.some((lot) => lot.ubicacion === alerta.zona),
    );

    const source = [
      ...(role === "operario"
        ? propios
            .filter((row) => row.etapa === "Cosecha")
            .map((row) => ({ id: `lot-${row.id}`, text: `${row.lote} está listo para cosecha`, ruta: "/produccion" }))
        : produccion
            .filter((row) => row.etapa === "Cosecha")
            .map((row) => ({ id: `lot-${row.id}`, text: `${row.lote} listo para cosecha`, ruta: "/produccion" }))),
      ...(role === "admin" || role === "supervisor"
        ? inventario
            .filter((row) => Number(row.stock) <= Number(row.minimo))
            .map((row) => ({ id: `inv-${row.id}`, text: `Stock bajo: ${row.nombre}`, ruta: "/inventario" }))
        : []),
      ...calidad
        .filter(
          (row) =>
            (row.estado ?? row.estadoManual) !== "Cerrada" &&
            row.prioridad === "Alta" &&
            (role !== "operario" || propios.some((lot) => lot.lote === row.lote)),
        )
        .map((row) => ({ id: `cal-${row.id}`, text: `Incidencia alta en ${row.lote || row.codigo}`, ruta: "/calidad" })),
      ...ambientales,
    ];

    const enabled = cfg.notificaciones !== "Desactivadas";
    setNotificaciones(
      enabled
        ? source.slice(0, 8).map((n) => ({ ...n, read: leidas.includes(n.id) }))
        : [],
    );
  };

  useEffect(() => {
    refrescar();
    window.addEventListener("aiden-data-change", refrescar);
    window.addEventListener("aiden-config-change", refrescar);
    window.addEventListener("storage", refrescar);
    return () => {
      window.removeEventListener("aiden-data-change", refrescar);
      window.removeEventListener("aiden-config-change", refrescar);
      window.removeEventListener("storage", refrescar);
    };
  }, [role, session?.name]);

  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape") {
        setShowPalette(false);
        setShowNotifs(false);
        setShowProfile(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowPalette((value) => !value);
        setShowNotifs(false);
        setShowProfile(false);
        setSearch("");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const resultados = useMemo(() => {
    const value = search.trim().toLowerCase();
    return value ? modulos.filter((item) => item.nombre.toLowerCase().includes(value)) : modulos;
  }, [search, modulos]);

  const indiceRegistros = useMemo(() => {
    const disponibles = new Set(modulos.map((m) => m.nombre));
    const registros = [];
    if (disponibles.has("Producción"))
      leer("produccion").forEach((row) => registros.push({ tipo: "Producción", texto: `${row.lote} · ${row.cultivo || "sin cultivo"}`, ruta: "/produccion" }));
    if (disponibles.has("Inventario"))
      leer("inventario").forEach((row) => registros.push({ tipo: "Inventario", texto: row.nombre, ruta: "/inventario" }));
    if (disponibles.has("Trazabilidad"))
      leer("trazabilidad").forEach((row) => registros.push({ tipo: "Trazabilidad", texto: `${row.evento} · ${row.lote}`, ruta: "/trazabilidad" }));
    if (disponibles.has("Calidad"))
      leer("calidad").forEach((row) => registros.push({ tipo: "Calidad", texto: `${row.codigo || row.lote} · ${row.descripcion || ""}`.trim(), ruta: "/calidad" }));
    if (disponibles.has("Ambiental"))
      leer("ambiental").forEach((row) => registros.push({ tipo: "Ambiental", texto: row.zona, ruta: "/ambiental" }));
    if (disponibles.has("Costos"))
      leer("costos").forEach((row) => registros.push({ tipo: "Costos", texto: `${row.concepto} · ${row.lote || "sin lote"}`, ruta: "/costos" }));
    if (disponibles.has("Personal"))
      leer("personal").forEach((row) => registros.push({ tipo: "Personal", texto: row.nombre, ruta: "/personal" }));
    return registros;
  }, [modulos]);

  const resultadosRegistros = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return [];
    return indiceRegistros.filter((row) => row.texto.toLowerCase().includes(value)).slice(0, 6);
  }, [search, indiceRegistros]);

  const irAModulo = (ruta) => {
    navigate(ruta === "/dashboard-admin" ? getDashboardPath(role) : ruta);
    setSearch("");
    setShowPalette(false);
    setShowNotifs(false);
  };

  const noLeidas = notificaciones.filter((n) => !n.read).length;
  const marcarLeida = (item) => {
    setNotificaciones((xs) => xs.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    try {
      const actual = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES) || "[]");
      if (!actual.includes(item.id)) localStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify([...actual, item.id]));
    } catch {}
    navigate(item.ruta);
  };
  const marcarTodas = () => {
    setNotificaciones((xs) => xs.map((n) => ({ ...n, read: true })));
    try {
      localStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(notificaciones.map((n) => n.id)));
    } catch {}
  };
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const nombre = session?.name || "Usuario";
  const rol = roleLabel[role] || "Usuario";

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E5EDE8] bg-white px-6">
      <section className="relative">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (resultadosRegistros[0]) irAModulo(resultadosRegistros[0].ruta);
            else if (resultados[0]) irAModulo(resultados[0].ruta);
          }}
          className="relative"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setShowPalette(true)}
            className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm outline-none focus:border-emerald-500"
            placeholder="Buscar módulos, lotes, insumos..."
            aria-label="Buscar módulos y registros"
          />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:flex">
            <Command size={10} />K
          </kbd>
        </form>
        {showPalette && (
          <section className="absolute left-0 top-12 w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" role="dialog">
            <header className="flex items-center justify-between px-2 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Módulos disponibles</span>
              <button type="button" onClick={() => { setShowPalette(false); setSearch(""); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar búsqueda"><X size={13} /></button>
            </header>
            {resultados.length ? (
              resultados.slice(0, 7).map((item) => (
                <button key={item.ruta} type="button" onClick={() => irAModulo(item.ruta)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                  <span>{item.nombre}</span><span className="text-[10px] text-slate-400">Abrir</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-xs text-slate-400">No se encontró un módulo disponible para tu rol.</p>
            )}
            {resultadosRegistros.length > 0 && (
              <>
                <p className="mt-1 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Registros</p>
                {resultadosRegistros.map((item, index) => (
                  <button key={`${item.ruta}-${item.texto}-${index}`} type="button" onClick={() => irAModulo(item.ruta)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.tipo}</span>
                    <span className="truncate">{item.texto}</span>
                  </button>
                ))}
              </>
            )}
            {search.trim() && !resultados.length && !resultadosRegistros.length && <p className="px-3 py-4 text-center text-xs text-slate-400">Sin coincidencias para "{search.trim()}".</p>}
          </section>
        )}
      </section>

      <section className="flex items-center gap-3">
        <section className="relative">
          <button type="button" onClick={() => { setShowNotifs((value) => !value); setShowProfile(false); setShowPalette(false); }} className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100" aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}>
            <Bell size={18} className="text-slate-500" />
            {noLeidas > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">{noLeidas}</span>}
          </button>
          {showNotifs && (
            <section className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="dialog">
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Notificaciones</p>
                {noLeidas > 0 && <button type="button" onClick={marcarTodas} className="text-[11px] font-semibold text-emerald-700">Marcar todas</button>}
              </header>
              <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                {notificaciones.length ? notificaciones.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => marcarLeida(n)} className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${n.read ? "opacity-50" : ""}`}>
                      <span className="flex gap-3">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-emerald-500"}`} />
                        <span className="text-sm leading-5 text-slate-700">{n.text}<span className="mt-1 block text-[11px] font-semibold text-emerald-700">Ver registro</span></span>
                      </span>
                    </button>
                  </li>
                )) : <li className="px-4 py-8 text-center text-sm text-slate-400">No hay alertas pendientes.</li>}
              </ul>
            </section>
          )}
        </section>
        <section className="relative">
          <button type="button" onClick={() => { setShowProfile((value) => !value); setShowNotifs(false); }} className="flex items-center gap-2 rounded-xl py-1.5 pl-2 pr-3 hover:bg-slate-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white"><User size={14} /></span>
            <section className="hidden text-left sm:block"><p className="text-sm font-medium leading-none text-slate-800">{nombre}</p><p className="mt-0.5 text-xs text-slate-400">{rol}</p></section>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showProfile && (
            <section className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" role="dialog">
              <section className="border-b border-slate-100 px-4 py-3"><p className="text-sm font-medium text-slate-800">{nombre}</p><p className="mt-1 text-xs text-slate-400">{session?.email}</p></section>
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={14} />Cerrar sesión</button>
            </section>
          )}
        </section>
      </section>
    </header>
  );
}

import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
  Thermometer,
  Users,
  X,
} from "lucide-react";
import { getDashboardPath, getSession } from "../../utilidades/autenticacion";

const navItems = [
  { label: "Dashboard", path: "/dashboard-admin", icon: <LayoutDashboard size={18} />, roles: ["admin", "supervisor", "operario"] },
  { label: "Producción", path: "/produccion", icon: <Sprout size={18} />, roles: ["admin", "supervisor", "operario"] },
  { label: "Trazabilidad", path: "/trazabilidad", icon: <GitBranch size={18} />, roles: ["admin", "supervisor", "operario"] },
  { label: "Ambiental", path: "/ambiental", icon: <Thermometer size={18} />, roles: ["admin", "supervisor", "operario"] },
  { label: "Calidad", path: "/calidad", icon: <ShieldCheck size={18} />, roles: ["admin", "supervisor", "operario"] },
  { label: "Inventario", path: "/inventario", icon: <Package size={18} />, roles: ["admin", "supervisor"] },
  { label: "Costos", path: "/costos", icon: <CircleDollarSign size={18} />, roles: ["admin", "supervisor"] },
  { label: "Personal", path: "/personal", icon: <Users size={18} />, roles: ["admin", "supervisor"] },
  { label: "Inteligencia", path: "/ia", icon: <BrainCircuit size={18} />, roles: ["admin", "supervisor"] },
  { label: "Reportes", path: "/reportes", icon: <BarChart3 size={18} />, roles: ["admin", "supervisor"] },
  { label: "Configuración", path: "/configuracion", icon: <Settings size={18} />, roles: ["admin"] },
];

const roleLabel = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operario: "Operario",
};

export default function BarraLateral() {
  const [colapsado, setColapsado] = useState(
    () => localStorage.getItem("aiden-sidebar") === "collapsed",
  );
  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem("aiden-theme") === "dark",
  );
  const [movilAbierto, setMovilAbierto] = useState(false);
  const location = useLocation();
  const session = getSession();
  const role = session?.role || "operario";
  const pathDashboard = getDashboardPath(role);
  const visible = useMemo(
    () => navItems.filter((item) => item.roles.includes(role)),
    [role],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("aiden-dark", oscuro);
    localStorage.setItem("aiden-theme", oscuro ? "dark" : "light");
  }, [oscuro]);

  useEffect(() => {
    localStorage.setItem("aiden-sidebar", colapsado ? "collapsed" : "expanded");
  }, [colapsado]);

  useEffect(() => {
    if (!movilAbierto) return undefined;
    const key = (event) => {
      if (event.key === "Escape") setMovilAbierto(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [movilAbierto]);

  const renderNav = (mobile = false) => (
    <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {visible.map((item) => {
          const targetPath = item.label === "Dashboard" ? pathDashboard : item.path;
          const isActive = location.pathname === targetPath;
          return (
            <li key={item.label}>
              <NavLink
                to={targetPath}
                title={!mobile && colapsado ? item.label : undefined}
                onClick={() => mobile && setMovilAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${!mobile && colapsado ? "justify-center" : "justify-start"} ${isActive ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {item.icon}
                {(mobile || !colapsado) && <span>{item.label}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg lg:hidden"
        aria-label="Abrir menú de navegación"
        aria-expanded={movilAbierto}
        onClick={() => setMovilAbierto(true)}
      >
        <Menu size={19} />
      </button>

      {movilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMovilAbierto(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,300px)] flex-col border-r border-[#dfe8e2] bg-white shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:shadow-none ${movilAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${colapsado ? "lg:w-16" : "lg:w-60"}`}
      >
        <header className="flex h-16 min-h-[64px] items-center border-b border-[#dfe8e2] px-4">
          <section className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white">
                  <Leaf size={16} />
                </span>
                {(movilAbierto || !colapsado) && (
                  <span className="text-lg font-bold tracking-tight text-emerald-800">
                    AiDEN
                  </span>
                )}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
                aria-label="Cerrar menú"
                onClick={() => setMovilAbierto(false)}
              >
                <X size={18} />
              </button>
            </div>
            {(movilAbierto || !colapsado) && (
              <p className="ml-10 mt-0.5 text-[10px] font-medium text-slate-400">
                {roleLabel[role]}
              </p>
            )}
          </section>
        </header>

        <div className="hidden min-w-0 flex-1 lg:flex">{renderNav()}</div>
        <div className="flex min-w-0 flex-1 lg:hidden">{renderNav(true)}</div>

        <footer className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => setOscuro((value) => !value)}
            title={
              !movilAbierto && colapsado
                ? oscuro
                  ? "Modo claro"
                  : "Modo oscuro"
                : undefined
            }
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 ${!movilAbierto && colapsado ? "justify-center" : ""}`}
            aria-label={oscuro ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {oscuro ? <Sun size={18} /> : <Moon size={18} />}
            {(movilAbierto || !colapsado) && (
              <span>{oscuro ? "Modo claro" : "Modo oscuro"}</span>
            )}
          </button>
        </footer>

        <button
          type="button"
          onClick={() => setColapsado((value) => !value)}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[#dfe8e2] bg-white shadow-sm hover:bg-slate-50 lg:flex"
          aria-label={colapsado ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          {colapsado ? (
            <ChevronRight size={12} className="text-slate-500" />
          ) : (
            <ChevronLeft size={12} className="text-slate-500" />
          )}
        </button>
      </aside>
    </>
  );
}

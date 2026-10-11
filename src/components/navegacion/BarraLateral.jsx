import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Menu, Search, X } from "lucide-react";
import { getDashboardPath } from "../../utilidades/autenticacion";
import { useSesion } from "../../hooks/useSesion";
import { useDatos } from "../../datos/almacen";
import { alertas as calcularAlertas } from "../../datos/selectores";
import { useComandos } from "../../contexto/comandos";
import { IsotipoAiden } from "../ui/MarcaAiden";
import InterruptorTema from "./InterruptorTema";
import { GRUPOS_MODULOS, modulosDeRol, rutaDeModulo } from "./modulos";

const roleLabel = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operario: "Operario",
};

function leerPreferencia(clave) {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarPreferencia(clave, valor) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Son preferencias opcionales: la barra sigue funcionando sin persistencia.
  }
}

export default function BarraLateral() {
  const [colapsado, setColapsado] = useState(() => leerPreferencia("aiden-sidebar") === "collapsed");
  const [movilAbierto, setMovilAbierto] = useState(false);
  const location = useLocation();
  const session = useSesion();
  const datos = useDatos();
  const { abrirPaleta } = useComandos();
  const role = session?.role || "operario";
  const conteos = useMemo(() => {
    const lista = calcularAlertas(datos, session);
    const cuenta = (tipo) => lista.filter((alerta) => alerta.tipo === tipo).length;
    return { "/calidad": cuenta("Calidad"), "/ambiental": cuenta("Ambiental"), "/inventario": cuenta("Inventario") };
  }, [datos, session]);
  const pathDashboard = getDashboardPath(role);
  const grupos = useMemo(() => {
    const visibles = modulosDeRol(role);
    return GRUPOS_MODULOS.map((grupo) => ({ ...grupo, modulos: visibles.filter((m) => m.grupo === grupo.id) })).filter((grupo) => grupo.modulos.length);
  }, [role]);

  useEffect(() => {
    guardarPreferencia("aiden-sidebar", colapsado ? "collapsed" : "expanded");
  }, [colapsado]);

  useEffect(() => {
    if (!movilAbierto) return undefined;
    const key = (event) => {
      if (event.key === "Escape") setMovilAbierto(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [movilAbierto]);

  const renderNav = (mobile = false) => {
    const estrecha = !mobile && colapsado;
    return (
      <nav aria-label="Menú principal" className="aiden-nav flex-1 overflow-y-auto px-3 py-4">
        {grupos.map((grupo, indiceGrupo) => (
          <section key={grupo.id} aria-labelledby={estrecha ? undefined : `grupo-${grupo.id}-${mobile ? "m" : "d"}`} className={indiceGrupo ? "mt-5" : ""}>
            {estrecha ? (
              indiceGrupo > 0 && <hr className="mx-2 mb-3 border-slate-100" aria-hidden="true" />
            ) : (
              <p id={`grupo-${grupo.id}-${mobile ? "m" : "d"}`} className="aiden-nav-grupo">
                {grupo.nombre}
              </p>
            )}
            <ul className="space-y-0.5">
              {grupo.modulos.map((item) => {
                const Icono = item.icono;
                const targetPath = rutaDeModulo(item, pathDashboard);
                const isActive = location.pathname === targetPath || (item.nombre === "Inicio" && location.pathname.startsWith("/dashboard-"));
                const cuenta = conteos[item.ruta] || 0;
                return (
                  <li key={item.nombre}>
                    <NavLink
                      to={targetPath}
                      viewTransition
                      title={estrecha ? item.nombre : undefined}
                      aria-keyshortcuts={`G ${item.atajo}`}
                      onClick={() => mobile && setMovilAbierto(false)}
                      className={`aiden-nav-enlace relative isolate flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${estrecha ? "justify-center" : "justify-start"} ${isActive ? "font-semibold text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                      {/* La pastilla del módulo activo se desliza al siguiente con View Transitions. */}
                      {isActive && <span className="aiden-nav-pastilla bg-emerald-50" aria-hidden="true" />}
                      <Icono size={18} aria-hidden="true" className={isActive ? "text-emerald-700" : ""} />
                      {!estrecha && <span className="flex-1">{item.nombre}</span>}
                      {!estrecha && !mobile && cuenta === 0 && (
                        <span className="aiden-nav-atajo" aria-hidden="true">
                          <kbd>G</kbd>
                          <kbd>{item.atajo}</kbd>
                        </span>
                      )}
                      {cuenta > 0 &&
                        (estrecha ? (
                          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-600">
                            <span className="sr-only">, {cuenta} {cuenta === 1 ? "alerta" : "alertas"}</span>
                          </span>
                        ) : (
                          <span className="aiden-nav-cuenta min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[11px] font-bold leading-5 text-white tabular-nums">
                            <span className="sr-only">, </span>
                            {cuenta}
                            <span className="sr-only"> {cuenta === 1 ? "alerta" : "alertas"}</span>
                          </span>
                        ))}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    );
  };

  return (
    <>
      <button
        type="button"
        className="no-imprimir fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg lg:hidden"
        aria-label="Abrir menú de navegación"
        aria-expanded={movilAbierto}
        onClick={() => setMovilAbierto(true)}
      >
        <Menu size={19} />
      </button>

      {movilAbierto && <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-40 bg-aiden-forest-deep/35 lg:hidden" onClick={() => setMovilAbierto(false)} />}

      <aside
        aria-label="Navegación de AiDEN"
        className={`aiden-barra-lateral no-imprimir fixed inset-y-0 left-0 z-50 flex w-[min(84vw,300px)] flex-col border-r border-[#dfe8e2] bg-white shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:shadow-none ${movilAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${colapsado ? "lg:w-16" : "lg:w-60"}`}
      >
        <header className="flex h-16 min-h-[64px] items-center border-b border-[#dfe8e2] px-4">
          <section className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IsotipoAiden tamano={32} className="aiden-isotipo-adaptable" />
                {(movilAbierto || !colapsado) && <span className="text-lg font-bold tracking-tight text-emerald-800">AiDEN</span>}
              </div>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Cerrar menú" onClick={() => setMovilAbierto(false)}>
                <X size={18} />
              </button>
            </div>
            {(movilAbierto || !colapsado) && <p className="aiden-rol-chip ml-10 mt-0.5 text-[11px] font-medium text-slate-500">{roleLabel[role]}</p>}
          </section>
        </header>

        <div className="hidden min-w-0 flex-1 lg:flex">{renderNav()}</div>
        <div className="flex min-w-0 flex-1 lg:hidden">{renderNav(true)}</div>

        <footer className="space-y-2 border-t border-slate-100 p-3">
          {(movilAbierto || !colapsado) && (
            <button type="button" onClick={() => { setMovilAbierto(false); abrirPaleta(); }} className="aiden-nav-comandos flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <Search size={15} aria-hidden="true" />
              <span className="flex-1">Buscar o ejecutar</span>
              <span className="aiden-nav-atajo is-visible" aria-hidden="true">
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </span>
            </button>
          )}
          <div className="hidden lg:block">
            <InterruptorTema compacto={colapsado} />
          </div>
          <div className="lg:hidden">
            <InterruptorTema />
          </div>
        </footer>

        <button
          type="button"
          onClick={() => setColapsado((value) => !value)}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[#dfe8e2] bg-white shadow-sm hover:bg-slate-50 lg:flex"
          aria-label={colapsado ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          {colapsado ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronLeft size={12} className="text-slate-500" />}
        </button>
      </aside>
    </>
  );
}

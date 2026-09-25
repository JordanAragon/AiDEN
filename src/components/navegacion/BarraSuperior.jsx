import { Bell, ChevronDown, Command, LogOut, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardPath, logout } from "../../utilidades/autenticacion";
import { CLAVE_NOTIFICACIONES, useDatos } from "../../datos/almacen";
import { alertas as calcularAlertas, esGestor, estadoIncidencia, incidenciasVisibles, lotesVisibles, nombrePersona, tareasVisibles } from "../../datos/selectores";
import { useFichaLote } from "../../contexto/ficha";
import { useSesion } from "../../hooks/useSesion";
import { coincide, numero } from "../../utilidades/formato";

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

function leerLeidas() {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE_NOTIFICACIONES) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

export default function BarraSuperior() {
  const navigate = useNavigate();
  const datos = useDatos();
  const session = useSesion();
  const { abrirLote } = useFichaLote();
  const role = session?.role || "operario";
  const gestor = esGestor(session);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [search, setSearch] = useState("");
  const [activo, setActivo] = useState(0);
  const [leidas, setLeidas] = useState(leerLeidas);
  const entrada = useRef(null);
  const zona = useRef(null);

  const modulos = useMemo(() => MODULOS.filter((m) => m.roles.includes(role)), [role]);
  const activadas = datos.configuracion.notificaciones !== "Desactivadas";
  const notificaciones = useMemo(() => (activadas ? calcularAlertas(datos, session) : []), [datos, session, activadas]);
  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id)).length;

  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape") {
        setShowPalette(false);
        setShowNotifs(false);
        setShowProfile(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowPalette(true);
        setShowNotifs(false);
        setShowProfile(false);
        entrada.current?.focus();
      }
    };
    const fuera = (event) => {
      if (zona.current && !zona.current.contains(event.target)) {
        setShowPalette(false);
        setShowNotifs(false);
        setShowProfile(false);
      }
    };
    window.addEventListener("keydown", key);
    document.addEventListener("mousedown", fuera);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", fuera);
    };
  }, []);

  const indiceRegistros = useMemo(() => {
    const registros = [];
    for (const lote of lotesVisibles(datos, session)) {
      registros.push({ tipo: "Lote", texto: `${lote.lote} · ${lote.cultivo}`, detalle: `${lote.estado === "Cerrado" ? "Cerrado" : lote.etapa} · ${lote.ubicacion} · ${numero(lote.cantidad)} plantas`, buscar: `${lote.lote} ${lote.cultivo} ${lote.ubicacion} ${lote.etapa}`, abrir: () => abrirLote(lote.lote) });
    }
    for (const i of incidenciasVisibles(datos, session)) {
      registros.push({ tipo: "Calidad", texto: `${i.codigo} · ${i.descripcion}`, detalle: `${estadoIncidencia(i)} · ${i.lote}`, buscar: `${i.codigo} ${i.descripcion} ${i.lote}`, ruta: `/calidad?incidencia=${i.id}` });
    }
    for (const t of tareasVisibles(datos, session)) {
      registros.push({ tipo: "Tarea", texto: t.titulo, detalle: `${t.estado} · ${nombrePersona(datos.personas, t.responsableId)}`, buscar: `${t.titulo} ${t.lote} ${nombrePersona(datos.personas, t.responsableId)}`, ruta: gestor ? `/personal?vista=tareas&tarea=${t.id}` : "/dashboard-operario" });
    }
    if (gestor) {
      for (const insumo of datos.inventario) {
        registros.push({ tipo: "Inventario", texto: insumo.nombre, detalle: `${numero(insumo.stock)} ${insumo.unidad} · mínimo ${numero(insumo.minimo)}`, buscar: `${insumo.nombre} ${insumo.categoria} ${insumo.id}`, ruta: `/inventario?insumo=${insumo.id}` });
      }
      for (const persona of datos.personas) {
        registros.push({ tipo: "Personal", texto: persona.nombre, detalle: `${persona.cargo} · ${persona.departamento}`, buscar: `${persona.nombre} ${persona.cargo}`, ruta: `/personal?persona=${persona.id}` });
      }
      for (const c of datos.costos.slice(0, 200)) {
        registros.push({ tipo: "Costos", texto: c.concepto, detalle: `${c.lote || "General"}`, buscar: `${c.concepto} ${c.lote}`, ruta: "/costos" });
      }
    }
    return registros;
  }, [datos, session, gestor, abrirLote]);

  const valor = search.trim();
  const resultados = valor ? modulos.filter((item) => coincide(item.nombre, valor)) : modulos;
  const resultadosRegistros = valor ? indiceRegistros.filter((row) => coincide(row.buscar, valor)).slice(0, 7) : [];
  const opciones = [
    ...resultados.slice(0, 7).map((m) => ({ clave: `m-${m.ruta}`, ir: () => irAModulo(m.ruta) })),
    ...resultadosRegistros.map((r, i) => ({ clave: `r-${i}`, ir: () => abrirRegistro(r) })),
  ];

  function cerrarBusqueda() {
    setSearch("");
    setActivo(0);
    setShowPalette(false);
    setShowNotifs(false);
  }

  function irAModulo(ruta) {
    navigate(ruta === "/dashboard-admin" ? getDashboardPath(role) : ruta);
    cerrarBusqueda();
  }

  function abrirRegistro(registro) {
    cerrarBusqueda();
    if (registro.abrir) registro.abrir();
    else navigate(registro.ruta);
  }

  const guardarLeidas = (ids) => {
    const vigentes = [...new Set(ids)];
    setLeidas(vigentes);
    try {
      localStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(vigentes));
    } catch (error) {
      console.warn("No se pudo guardar el estado de notificaciones", error);
    }
  };

  const marcarLeida = (item) => {
    guardarLeidas([...leidas, item.id]);
    setShowNotifs(false);
    navigate(item.ruta);
  };

  const handleLogout = () => {
    navigate("/login", { replace: true, state: null });
    logout();
  };

  const nombre = session?.name || "Usuario";
  const rol = roleLabel[role] || "Usuario";

  return (
    <header ref={zona} className="no-imprimir relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E5EDE8] bg-white pl-16 pr-3 sm:pr-6 lg:px-6">
      <section className="relative min-w-0">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            opciones[activo]?.ir();
          }}
          className="relative"
        >
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            ref={entrada}
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActivo(0);
              setShowPalette(true);
            }}
            onFocus={() => setShowPalette(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActivo((i) => Math.min(opciones.length - 1, i + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActivo((i) => Math.max(0, i - 1));
              }
            }}
            className="w-full max-w-[11rem] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 sm:w-72 sm:max-w-none sm:pr-16"
            placeholder="Buscar módulos, lotes, insumos..."
            aria-label="Buscar módulos y registros"
            aria-controls={showPalette ? "resultados-busqueda" : undefined}
          />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:flex">
            <Command size={10} aria-hidden="true" />K
          </kbd>
        </form>
        {showPalette && (
          <section id="resultados-busqueda" className="absolute left-0 top-12 w-[min(24rem,calc(100vw-5rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" role="dialog" aria-label="Resultados de búsqueda">
            <header className="flex items-center justify-between px-2 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Módulos disponibles</span>
              <button type="button" onClick={cerrarBusqueda} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar búsqueda">
                <X size={13} aria-hidden="true" />
              </button>
            </header>
            {resultados.length ? (
              resultados.slice(0, 7).map((item, i) => (
                <button
                  key={item.ruta}
                  type="button"
                  onClick={() => irAModulo(item.ruta)}
                  onMouseEnter={() => setActivo(i)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 ${activo === i ? "bg-emerald-50 text-emerald-800" : ""}`}
                >
                  <span>{item.nombre}</span>
                  <span className="text-[10px] text-slate-500">Abrir</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-center text-xs text-slate-500">No se encontró un módulo disponible para tu rol.</p>
            )}
            {resultadosRegistros.length > 0 && (
              <>
                <p className="mt-1 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Registros</p>
                {resultadosRegistros.map((item, index) => {
                  const posicion = resultados.slice(0, 7).length + index;
                  return (
                    <button
                      key={`${item.tipo}-${item.texto}-${index}`}
                      type="button"
                      onClick={() => abrirRegistro(item)}
                      onMouseEnter={() => setActivo(posicion)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50 ${activo === posicion ? "bg-emerald-50" : ""}`}
                    >
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.tipo}</span>
                      <span className="min-w-0">
                        <span className="block truncate">{item.texto}</span>
                        <span className="block truncate text-[11px] text-slate-500">{item.detalle}</span>
                      </span>
                    </button>
                  );
                })}
              </>
            )}
            {valor && !resultados.length && !resultadosRegistros.length && <p className="px-3 py-4 text-center text-xs text-slate-500">Sin coincidencias para “{valor}”. Prueba con el código del lote, un cultivo o un nombre.</p>}
          </section>
        )}
      </section>
      <section className="flex shrink-0 items-center gap-1 sm:gap-3">
        <section className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifs((value) => !value);
              setShowProfile(false);
              setShowPalette(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"
            aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
            aria-expanded={showNotifs}
          >
            <Bell size={18} className="text-slate-500" aria-hidden="true" />
            {noLeidas > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">{noLeidas}</span>}
          </button>
          {showNotifs && (
            <section className="absolute right-0 top-12 z-30 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="dialog" aria-label="Notificaciones">
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notificaciones</p>
                {noLeidas > 0 && (
                  <button type="button" onClick={() => guardarLeidas([...leidas, ...notificaciones.map((n) => n.id)])} className="text-[11px] font-semibold text-emerald-700">
                    Marcar todas
                  </button>
                )}
              </header>
              <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                {!activadas ? (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">
                    Las notificaciones están desactivadas.
                    {role === "admin" && (
                      <button type="button" onClick={() => { setShowNotifs(false); navigate("/configuracion"); }} className="mt-2 block w-full text-[11px] font-semibold text-emerald-700">
                        Activarlas en Configuración
                      </button>
                    )}
                  </li>
                ) : notificaciones.length ? (
                  notificaciones.map((n) => {
                    const leida = leidas.includes(n.id);
                    return (
                      <li key={n.id}>
                        <button type="button" onClick={() => marcarLeida(n)} className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${leida ? "opacity-50" : ""}`}>
                          <span className="flex gap-3">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${leida ? "bg-slate-300" : n.severidad === "critico" ? "bg-red-500" : "bg-emerald-500"}`} />
                            <span className="text-sm leading-5 text-slate-700">
                              {n.titulo}
                              <span className="mt-0.5 block text-xs text-slate-500">{n.detalle}</span>
                              <span className="mt-1 block text-[11px] font-semibold text-emerald-700">Ver registro</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-4 py-8 text-center text-sm text-slate-500">No hay alertas pendientes.</li>
                )}
              </ul>
            </section>
          )}
        </section>
        <section className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile((value) => !value);
              setShowNotifs(false);
            }}
            className="flex items-center gap-2 rounded-xl py-1.5 pl-2 pr-2 hover:bg-slate-100 sm:pr-3"
            aria-label="Cuenta"
            aria-expanded={showProfile}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
              <User size={14} aria-hidden="true" />
            </span>
            <section className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none text-slate-800">{nombre}</p>
              <p className="mt-0.5 text-xs text-slate-500">{rol}</p>
            </section>
            <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
          </button>
          {showProfile && (
            <section className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" role="dialog" aria-label="Cuenta">
              <section className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{nombre}</p>
                <p className="mt-1 text-xs text-slate-500">{session?.email}</p>
              </section>
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut size={14} aria-hidden="true" />
                Cerrar sesión
              </button>
            </section>
          )}
        </section>
      </section>
    </header>
  );
}

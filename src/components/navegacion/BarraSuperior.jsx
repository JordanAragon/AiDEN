import { Bell, ChevronDown, Command, Keyboard, LogOut, Search, User, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../utilidades/autenticacion";
import { CLAVE_NOTIFICACIONES, useDatos } from "../../datos/almacen";
import { alertas as calcularAlertas } from "../../datos/selectores";
import { useComandos } from "../../contexto/comandos";
import { useSesion } from "../../hooks/useSesion";

const roleLabel = { admin: "Administrador", supervisor: "Supervisor", operario: "Operario" };

// Cada cuenta guarda sus propias notificaciones leídas.
function claveLeidas(sesion) {
  return sesion?.id ? `${CLAVE_NOTIFICACIONES}:${sesion.id}` : CLAVE_NOTIFICACIONES;
}

function leerLeidas(sesion) {
  try {
    const valor = JSON.parse(localStorage.getItem(claveLeidas(sesion)) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

const TIPO_NOTIFICACION = { Calidad: "Calidad", Ambiental: "Ambiental", Inventario: "Inventario", Tareas: "Tareas" };

export default function BarraSuperior() {
  const navigate = useNavigate();
  const datos = useDatos();
  const session = useSesion();
  const { abrirPaleta, abrirAtajos } = useComandos();
  const role = session?.role || "operario";
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [leidas, setLeidas] = useState(() => leerLeidas(session));
  const zona = useRef(null);

  const activadas = datos.configuracion.notificaciones !== "Desactivadas";
  const notificaciones = useMemo(() => (activadas ? calcularAlertas(datos, session) : []), [datos, session, activadas]);
  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id)).length;

  // Una alerta resuelta sale de la lista de leídas: si vuelve a ocurrir (el insumo baja
  // otra vez del mínimo, se reabre la incidencia) aparece como nueva.
  useEffect(() => {
    const vigentes = leidas.filter((id) => notificaciones.some((n) => n.id === id));
    if (vigentes.length === leidas.length) return;
    setLeidas(vigentes);
    try {
      localStorage.setItem(claveLeidas(session), JSON.stringify(vigentes));
    } catch {
      // Si no se puede guardar, la poda se repite en el próximo cambio.
    }
  }, [leidas, notificaciones, session]);

  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape") {
        setShowNotifs(false);
        setShowProfile(false);
      }
    };
    const fuera = (event) => {
      if (zona.current && !zona.current.contains(event.target)) {
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

  const guardarLeidas = (ids) => {
    const vigentes = [...new Set(ids)];
    setLeidas(vigentes);
    try {
      localStorage.setItem(claveLeidas(session), JSON.stringify(vigentes));
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
    <header ref={zona} className="aiden-barra-superior no-imprimir relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E5EDE8] bg-white pl-16 pr-3 sm:pr-6 lg:px-6">
      <section className="relative min-w-0">
        <button
          type="button"
          onClick={() => {
            setShowNotifs(false);
            setShowProfile(false);
            abrirPaleta();
          }}
          aria-label="Buscar módulos y registros"
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          className="aiden-disparador-paleta flex w-full max-w-[11rem] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-2 text-left text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white sm:w-80 sm:max-w-none"
        >
          <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Buscar o ejecutar…</span>
          <kbd className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 sm:flex">
            <Command size={10} aria-hidden="true" />K
          </kbd>
        </button>
      </section>
      <section className="flex shrink-0 items-center gap-1 sm:gap-3">
        <section className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifs((value) => !value);
              setShowProfile(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"
            aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
            aria-expanded={showNotifs}
          >
            <Bell size={18} className={`text-slate-500 ${noLeidas ? "aiden-campana" : ""}`} aria-hidden="true" />
            <span key={noLeidas} className="aiden-insignia-notificaciones absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-[11px] font-bold leading-4 text-white tabular-nums" data-vacia={noLeidas ? undefined : "si"} aria-hidden="true">
              {noLeidas || ""}
            </span>
          </button>
          {showNotifs && (
            <section className="aiden-desplegable aiden-desplegable-derecha absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="dialog" aria-label="Notificaciones">
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Notificaciones
                  {noLeidas > 0 && <span className="ml-2 text-xs font-medium text-slate-500 tabular-nums">{noLeidas} sin leer</span>}
                </p>
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
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifs(false);
                          navigate("/configuracion");
                        }}
                        className="mt-2 block w-full text-[11px] font-semibold text-emerald-700"
                      >
                        Activarlas en Configuración
                      </button>
                    )}
                  </li>
                ) : notificaciones.length ? (
                  notificaciones.map((n) => {
                    const leida = leidas.includes(n.id);
                    return (
                      <li key={n.id} className={leida ? "is-leida" : ""}>
                        <button type="button" onClick={() => marcarLeida(n)} className={`aiden-notificacion w-full px-4 py-3 text-left hover:bg-slate-50 ${leida ? "opacity-60" : ""}`}>
                          <span className="flex gap-3">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${leida ? "bg-slate-300" : n.severidad === "critico" ? "bg-red-600" : "bg-amber-500"}`} />
                            <span className="min-w-0 text-sm leading-5 text-slate-700">
                              <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{TIPO_NOTIFICACION[n.tipo] || n.tipo}</span>
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
            <section className="aiden-desplegable aiden-desplegable-derecha absolute right-0 top-12 z-30 w-60 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" role="dialog" aria-label="Cuenta">
              <section className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{nombre}</p>
                <p className="mt-1 text-xs text-slate-500">{session?.email}</p>
              </section>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate("/perfil");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserCircle2 size={14} aria-hidden="true" />
                Mi perfil
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  abrirAtajos();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Keyboard size={14} aria-hidden="true" />
                Atajos de teclado
                <kbd className="aiden-tecla ml-auto">?</kbd>
              </button>
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

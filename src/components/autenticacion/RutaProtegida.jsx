import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { UserX } from "lucide-react";
import { useDatos } from "../../datos/almacen";
import { useSesion } from "../../hooks/useSesion";
import { getDashboardPath, logout, salioVoluntariamente } from "../../utilidades/autenticacion";

// Una persona desactivada en Personal no sigue operando con su cuenta.
function AccesoPausado({ nombre }) {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-aiden-paper px-4">
      <section role="alert" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <UserX size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-slate-950">Tu acceso está pausado</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {nombre}, tu ficha en Personal está inactiva. Pide a supervisión o administración que la reactive para volver a registrar trabajo.
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="mt-6 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}

export default function RutaProtegida({ roles, children }) {
  const location = useLocation();
  const sesion = useSesion();
  const datos = useDatos();

  if (!sesion) {
    if (salioVoluntariamente()) return <Navigate to="/login" replace />;
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  const persona = sesion.personaId ? datos.personas.find((p) => p.id === sesion.personaId) : null;
  if (persona?.estado === "Inactivo") return <AccesoPausado nombre={persona.nombre} />;

  if (roles && !roles.includes(sesion.role)) {
    return <Navigate to={getDashboardPath(sesion.role)} replace />;
  }

  return children ?? <Outlet />;
}

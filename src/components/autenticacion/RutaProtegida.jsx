import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSesion } from "../../hooks/useSesion";
import { getDashboardPath, salioVoluntariamente } from "../../utilidades/autenticacion";

export default function RutaProtegida({ roles, children }) {
  const location = useLocation();
  const sesion = useSesion();

  if (!sesion) {
    if (salioVoluntariamente()) return <Navigate to="/login" replace />;
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (roles && !roles.includes(sesion.role)) {
    return <Navigate to={getDashboardPath(sesion.role)} replace />;
  }

  return children ?? <Outlet />;
}

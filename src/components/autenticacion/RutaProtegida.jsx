import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDashboardPath, getSession } from "../../utilidades/autenticacion";

export default function RutaProtegida({ roles, children }) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to={getDashboardPath(session.role)} replace />;
  }

  return children ?? <Outlet />;
}

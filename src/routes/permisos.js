const TODOS = ["admin", "supervisor", "operario"];
const GESTION = ["admin", "supervisor"];

export const PERMISOS = {
  "/dashboard-admin": ["admin"],
  "/dashboard-supervisor": GESTION,
  "/dashboard-operario": TODOS,
  "/produccion": TODOS,
  "/trazabilidad": TODOS,
  "/ambiental": TODOS,
  "/calidad": TODOS,
  "/inventario": GESTION,
  "/costos": GESTION,
  "/personal": GESTION,
  "/reportes": GESTION,
  "/ia": GESTION,
  "/configuracion": ["admin"],
};

/*
  Decide a dónde llevar a alguien después de iniciar sesión. Solo respeta la
  página que intentaba abrir si su rol puede verla y no es el tablero de otro
  rol; así un cierre de sesión no arrastra la ruta de la persona anterior.
*/
export function destinoTrasLogin(desde, rol, inicio) {
  if (!desde || typeof desde !== "string") return inicio;
  const ruta = desde.split("?")[0];
  const roles = PERMISOS[ruta];
  if (!roles || !roles.includes(rol)) return inicio;
  if (ruta.startsWith("/dashboard-") && ruta !== inicio) return inicio;
  return desde;
}

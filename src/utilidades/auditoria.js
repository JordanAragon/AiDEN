const KEY = "aiden-auditoria";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function leerAuditoria(limit = 50) {
  return readAll().slice(0, limit);
}

export function registrarAuditoria({
  accion,
  modulo,
  entidad = "",
  detalle = "",
  antes = null,
  despues = null,
  usuario = "",
}) {
  const entry = {
    id: "AUD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    fecha: new Date().toISOString(),
    accion: String(accion || "Actualización"),
    modulo: String(modulo || "Sistema"),
    entidad: String(entidad || ""),
    detalle: String(detalle || ""),
    usuario: String(usuario || "Sistema"),
    antes,
    despues,
  };
  const next = [entry, ...readAll()].slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("aiden-audit-change"));
  return entry;
}

export function limpiarAuditoria() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aiden-audit-change"));
}

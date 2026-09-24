const DEFAULT_CONFIG = {
  tempMin: 18,
  tempMax: 27,
  humMin: 55,
  humMax: 80,
  notificaciones: "Activadas",
};

export function leerDato(clave, fallback = []) {
  try {
    const raw = localStorage.getItem(clave);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function leerConfiguracion() {
  const value = leerDato("aiden-configuracion", {});
  return { ...DEFAULT_CONFIG, ...(value && typeof value === "object" ? value : {}) };
}

export function suscribirseADatos(callback) {
  window.addEventListener("aiden-data-change", callback);
  window.addEventListener("aiden-config-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("aiden-data-change", callback);
    window.removeEventListener("aiden-config-change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function obtenerUltimasLecturasAmbientales(rows) {
  const byZone = new Map();

  for (const row of rows) {
    if (!row?.zona || !row?.fecha) continue;
    const current = byZone.get(row.zona);
    if (!current || new Date(row.fecha) > new Date(current.fecha)) {
      byZone.set(row.zona, row);
    }
  }

  return [...byZone.values()];
}

export function lecturaAmbientalFueraDeRango(row, config = leerConfiguracion()) {
  if (!row) return false;
  return (
    Number(row.temperatura) < Number(config.tempMin) ||
    Number(row.temperatura) > Number(config.tempMax) ||
    Number(row.humedad) < Number(config.humMin) ||
    Number(row.humedad) > Number(config.humMax)
  );
}

export function obtenerAlertasAmbientales(rows, config = leerConfiguracion()) {
  return obtenerUltimasLecturasAmbientales(rows)
    .filter((row) => lecturaAmbientalFueraDeRango(row, config))
    .map((row) => ({
      id: `amb-${row.id || row.zona}`,
      tipo: "Ambiental",
      texto: `Condición ambiental fuera de rango: ${row.zona}`,
      ruta: "/ambiental",
      zona: row.zona,
      lectura: row,
    }));
}

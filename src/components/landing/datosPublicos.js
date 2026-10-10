import { hoyISO, numero } from "../../utilidades/formato";

// El día que lleva el lote más joven del vivero de ejemplo (el cilantro).
export function diaDelCilantro(datos) {
  const joven = [...datos.lotes].filter((l) => l.estado === "Activo").sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  if (!joven) return null;
  const [y, m, d] = joven.fecha.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = hoyISO().split("-").map(Number);
  return numero(Math.round((new Date(y2, m2 - 1, d2) - new Date(y, m - 1, d)) / 86_400_000));
}

import { useSyncExternalStore } from "react";

/* Un solo reloj de minuto para toda la app: los tiempos relativos se refrescan juntos. */
let minuto = Math.floor(Date.now() / 60_000);
const oyentes = new Set();
let reloj = 0;

function suscribir(oyente) {
  oyentes.add(oyente);
  if (!reloj) {
    reloj = window.setInterval(() => {
      minuto = Math.floor(Date.now() / 60_000);
      for (const avisar of oyentes) avisar();
    }, 30_000);
  }
  return () => {
    oyentes.delete(oyente);
    if (!oyentes.size) {
      window.clearInterval(reloj);
      reloj = 0;
    }
  };
}

export function useMinuto() {
  return useSyncExternalStore(suscribir, () => minuto, () => minuto);
}

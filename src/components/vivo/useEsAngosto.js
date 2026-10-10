import { useSyncExternalStore } from "react";

/* Composición de una columna (≤ 860 px, el mismo corte de la landing). */
const CONSULTA = "(max-width: 860px)";

function suscribir(avisar) {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

export function useEsAngosto() {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches, () => false);
}

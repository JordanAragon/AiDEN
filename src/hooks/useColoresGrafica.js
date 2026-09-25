import { useSyncExternalStore } from "react";

const CLARO = { verde: "#176b45", verdeClaro: "#2f9d65", ambar: "#d97706", rojo: "#dc2626", rejilla: "#e2e8f0", eje: "#64748b", superficie: "#ffffff", tinta: "#132019", banda: "#10b981" };
const OSCURO = { verde: "#3fae74", verdeClaro: "#68d391", ambar: "#f4c96b", rojo: "#f28b96", rejilla: "#26332d", eje: "#91a098", superficie: "#121815", tinta: "#f1f5f3", banda: "#34d399" };

function leer() {
  return document.documentElement.classList.contains("aiden-dark") ? OSCURO : CLARO;
}

function suscribir(avisar) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observador.disconnect();
}

export function useColoresGrafica() {
  return useSyncExternalStore(suscribir, leer);
}

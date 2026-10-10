import { useSyncExternalStore } from "react";

/*
  Cuándo puede correr una escena viva. El motor dibuja con WebGPU; sin él (o con
  ahorro de datos o una conexión lenta) cada escena muestra su respaldo en CSS y
  ni siquiera se descarga el motor.
*/

export function hayWebGpu() {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
  const conexion = navigator.connection;
  // El motor pesa ~320 KB comprimido: no se descarga con ahorro de datos ni en 2G/3G.
  if (conexion?.saveData || /(^|-)(2g|3g)$/.test(conexion?.effectiveType || "")) return false;
  return true;
}

let adaptador = null;

/*
  Hay navegadores con navigator.gpu pero sin adaptador (GPU en lista negra, sin
  aceleración, máquinas virtuales). Se pregunta una sola vez por visita, antes de
  descargar el motor, para no bajar ~320 KB que no se podrían usar.
*/
export function adaptadorDisponible() {
  if (!adaptador) {
    adaptador = hayWebGpu()
      ? navigator.gpu.requestAdapter().then((a) => Boolean(a), () => false)
      : Promise.resolve(false);
  }
  return adaptador;
}

const CONSULTA_REDUCIDO = "(prefers-reduced-motion: reduce)";

function suscribirReducido(avisar) {
  const consulta = window.matchMedia(CONSULTA_REDUCIDO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

export function useMovimientoReducido() {
  return useSyncExternalStore(
    suscribirReducido,
    () => window.matchMedia(CONSULTA_REDUCIDO).matches,
    () => false,
  );
}

const CONSULTA_PUNTERO = "(pointer: fine)";

function suscribirPuntero(avisar) {
  const consulta = window.matchMedia(CONSULTA_PUNTERO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/* Puntero fino (ratón o trackpad): solo entonces la escena responde al cursor. */
export function usePunteroFino() {
  return useSyncExternalStore(
    suscribirPuntero,
    () => window.matchMedia(CONSULTA_PUNTERO).matches,
    () => false,
  );
}

import { createContext, useContext } from "react";

/*
  Las acciones de registro (nuevo lote, tarea, incidencia, actividad, lectura)
  abiertas desde cualquier lugar de la app: la paleta ⌘K, los atajos de
  teclado o un botón. Los formularios viven una sola vez en la plantilla.
*/
export const ContextoAcciones = createContext({ abrirAccion: () => {}, accionesDisponibles: [] });

export function useAcciones() {
  return useContext(ContextoAcciones);
}

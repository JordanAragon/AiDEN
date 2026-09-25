import { createContext, useContext } from "react";

export const ContextoFicha = createContext({ abrirLote: () => {} });

export function useFichaLote() {
  return useContext(ContextoFicha);
}

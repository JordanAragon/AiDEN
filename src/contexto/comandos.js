import { createContext, useContext } from "react";

export const ContextoComandos = createContext({ abrirPaleta: () => {}, abrirAtajos: () => {} });

export function useComandos() {
  return useContext(ContextoComandos);
}

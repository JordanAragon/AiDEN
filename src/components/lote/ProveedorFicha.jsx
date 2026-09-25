import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ContextoFicha } from "../../contexto/ficha";
import FichaLote from "./FichaLote";

export default function ProveedorFicha({ children }) {
  const { pathname } = useLocation();
  const [ficha, setFicha] = useState(null);
  const abrirLote = useCallback((codigo) => setFicha({ codigo, ruta: window.location.pathname }), []);
  const valor = useMemo(() => ({ abrirLote }), [abrirLote]);
  const visible = ficha && ficha.ruta === pathname ? ficha.codigo : null;
  return (
    <ContextoFicha.Provider value={valor}>
      {children}
      <FichaLote codigo={visible} onCerrar={() => setFicha(null)} />
    </ContextoFicha.Provider>
  );
}

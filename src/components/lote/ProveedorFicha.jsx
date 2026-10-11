import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ContextoFicha } from "../../contexto/ficha";
import { useDatos } from "../../datos/almacen";
import { lotesVisibles } from "../../datos/selectores";
import { useSesion } from "../../hooks/useSesion";
import FichaLote from "./FichaLote";

/*
  La ficha del lote, abierta desde cualquier módulo. Quien la abre puede pasar
  la lista que está viendo (los lotes filtrados de Producción, por ejemplo) y
  la ficha se recorre con J/K en ese orden; sin lista, en el de todos los lotes
  visibles para la persona (activos primero).
*/
export default function ProveedorFicha({ children }) {
  const { pathname } = useLocation();
  const datos = useDatos();
  const sesion = useSesion();
  const [ficha, setFicha] = useState(null);
  const abrirLote = useCallback((codigo, lista) => setFicha({ codigo, lista: Array.isArray(lista) ? lista : null, ruta: window.location.pathname }), []);
  const valor = useMemo(() => ({ abrirLote }), [abrirLote]);
  const porDefecto = useMemo(
    () =>
      [...lotesVisibles(datos, sesion)]
        .sort((a, b) => (a.estado === "Cerrado") - (b.estado === "Cerrado") || (a.lote < b.lote ? -1 : 1))
        .map((lote) => lote.lote),
    [datos, sesion],
  );
  const visible = ficha && ficha.ruta === pathname ? ficha.codigo : null;
  const lista = ficha?.lista?.includes(ficha.codigo) ? ficha.lista : porDefecto;
  const ir = useCallback((codigo) => setFicha((actual) => (actual ? { ...actual, codigo } : actual)), []);
  return (
    <ContextoFicha.Provider value={valor}>
      {children}
      <FichaLote codigo={visible} lista={lista} onIr={ir} onCerrar={() => setFicha(null)} />
    </ContextoFicha.Provider>
  );
}

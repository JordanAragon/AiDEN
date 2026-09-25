import { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ContextoAvisos, ContextoConfirmacion } from "../../contexto/retroalimentacion";
import Modal from "./Modal";
import { Boton } from "./Boton";

const ICONOS = { exito: CheckCircle2, error: AlertTriangle, info: Info };
const COLOR_ICONO = { exito: "text-emerald-400", error: "text-red-400", info: "text-sky-300" };

export default function ProveedorRetroalimentacion({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);
  const contador = useRef(0);

  const quitar = useCallback((id) => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), []);

  const aviso = useCallback(
    ({ tipo = "info", titulo, detalle }) => {
      contador.current += 1;
      const id = contador.current;
      setAvisos((lista) => [...lista.slice(-2), { id, tipo, titulo, detalle }]);
      window.setTimeout(() => quitar(id), tipo === "error" ? 7000 : 4200);
    },
    [quitar],
  );

  const confirmar = useCallback((opciones) => new Promise((resolver) => setConfirmacion({ ...opciones, resolver })), []);

  const responder = (valor) => {
    confirmacion?.resolver(valor);
    setConfirmacion(null);
  };

  return (
    <ContextoAvisos.Provider value={aviso}>
      <ContextoConfirmacion.Provider value={confirmar}>
        {children}
        <Modal
          abierto={Boolean(confirmacion)}
          onCerrar={() => responder(false)}
          titulo={confirmacion?.titulo}
          ancho="sm"
          pie={
            <>
              <Boton variante="secundario" onClick={() => responder(false)}>
                {confirmacion?.cancelar || "Cancelar"}
              </Boton>
              <Boton variante={confirmacion?.peligro ? "peligro" : "primario"} onClick={() => responder(true)} data-autofocus>
                {confirmacion?.confirmar || "Confirmar"}
              </Boton>
            </>
          }
        >
          <p className="text-sm leading-6 text-slate-600">{confirmacion?.mensaje}</p>
        </Modal>
        <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-5 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end">
          {avisos.map((item) => {
            const Icono = ICONOS[item.tipo] || Info;
            return (
              <div key={item.id} role={item.tipo === "error" ? "alert" : "status"} className="aiden-modal-entrada pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-2xl">
                <Icono size={17} className={`mt-0.5 shrink-0 ${COLOR_ICONO[item.tipo]}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.titulo}</p>
                  {item.detalle && <p className="mt-0.5 text-xs leading-5 text-slate-300">{item.detalle}</p>}
                </div>
                <button type="button" onClick={() => quitar(item.id)} aria-label="Cerrar aviso" className="-mr-1 rounded-md p-1 text-slate-400 hover:text-white">
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </ContextoConfirmacion.Provider>
    </ContextoAvisos.Provider>
  );
}

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { EVENTO_VERSION_NUEVA, activarVersionNueva } from "../../pwa/registrar";

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);
  return enLinea;
}

// Avisos persistentes de la app instalada: sin señal en el vivero y versión nueva lista.
export default function EstadoConexion() {
  const enLinea = useEnLinea();
  const [trabajadorNuevo, setTrabajadorNuevo] = useState(null);
  const [aplazada, setAplazada] = useState(false);
  const [avisoVisto, setAvisoVisto] = useState(false);

  useEffect(() => {
    if (enLinea) setAvisoVisto(false);
  }, [enLinea]);

  useEffect(() => {
    const recibir = (evento) => setTrabajadorNuevo(evento.detail);
    window.addEventListener(EVENTO_VERSION_NUEVA, recibir);
    return () => window.removeEventListener(EVENTO_VERSION_NUEVA, recibir);
  }, []);

  return (
    <>
      {!enLinea && avisoVisto && (
        <p role="status" className="pointer-events-auto inline-flex items-center gap-2 self-center rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:self-end">
          <WifiOff size={13} className="text-amber-300" aria-hidden="true" />
          Sin conexión
        </p>
      )}
      {!enLinea && !avisoVisto && (
        <div role="status" className="aiden-modal-entrada pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-2xl">
          <WifiOff size={17} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Sin conexión</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-300">AiDEN sigue funcionando. Lo que registres se guarda en este dispositivo.</p>
            <button type="button" onClick={() => setAvisoVisto(true)} className="mt-2 rounded-lg px-2 py-1 -ml-2 text-xs font-semibold text-aiden-lime hover:bg-white/10">
              Entendido
            </button>
          </div>
        </div>
      )}
      {trabajadorNuevo && !aplazada && (
        <div role="status" className="aiden-modal-entrada pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-2xl">
          <RefreshCw size={17} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Hay una versión nueva de AiDEN</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-300">Actualiza cuando termines lo que estás registrando.</p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={() => activarVersionNueva(trabajadorNuevo)} className="rounded-lg bg-aiden-lime px-3 py-1.5 text-xs font-bold text-aiden-forest hover:brightness-105">
                Actualizar
              </button>
              <button type="button" onClick={() => setAplazada(true)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
                Después
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

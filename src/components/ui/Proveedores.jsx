import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ContextoAvisos, ContextoConfirmacion } from "../../contexto/retroalimentacion";
import Modal from "./Modal";
import { Boton } from "./Boton";
import EstadoConexion from "./EstadoConexion";

const ICONOS = { exito: CheckCircle2, error: AlertTriangle, info: Info };
const COLOR_ICONO = { exito: "text-emerald-400", error: "text-red-400", info: "text-sky-300" };
const DURACION = { error: 7000, otro: 4200 };
// Las acciones destructivas esperan este tiempo antes de poder confirmarse.
const ESPERA_PELIGRO = 1100;

function BotonConfirmar({ confirmacion, onConfirmar }) {
  const [listo, setListo] = useState(!confirmacion?.peligro);
  useEffect(() => {
    if (!confirmacion?.peligro) return undefined;
    const espera = window.setTimeout(() => setListo(true), ESPERA_PELIGRO);
    return () => window.clearTimeout(espera);
  }, [confirmacion]);
  return (
    <Boton
      variante={confirmacion?.peligro ? "peligro" : "primario"}
      onClick={onConfirmar}
      disabled={!listo}
      className={confirmacion?.peligro ? `aiden-confirmar-peligro ${listo ? "is-listo" : ""}` : ""}
      style={confirmacion?.peligro ? { "--espera": `${ESPERA_PELIGRO}ms` } : undefined}
      data-autofocus={confirmacion?.peligro ? undefined : true}
    >
      {confirmacion?.confirmar || "Confirmar"}
    </Boton>
  );
}

export default function ProveedorRetroalimentacion({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);
  const [expandida, setExpandida] = useState(false);
  const contador = useRef(0);
  const temporizadores = useRef(new Map());

  const quitar = useCallback((id) => {
    window.clearTimeout(temporizadores.current.get(id)?.temporizador);
    temporizadores.current.delete(id);
    setAvisos((lista) => lista.map((aviso) => (aviso.id === id ? { ...aviso, saliendo: true } : aviso)));
    window.setTimeout(() => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), 220);
  }, []);

  const programar = useCallback(
    (id, duracion) => {
      const temporizador = window.setTimeout(() => quitar(id), duracion);
      temporizadores.current.set(id, { temporizador, inicio: Date.now(), restante: duracion });
    },
    [quitar],
  );

  const aviso = useCallback(
    ({ tipo = "info", titulo, detalle }) => {
      contador.current += 1;
      const id = contador.current;
      const duracion = tipo === "error" ? DURACION.error : DURACION.otro;
      setAvisos((lista) => [...lista.filter((a) => !a.saliendo).slice(-3), { id, tipo, titulo, detalle, duracion }]);
      programar(id, duracion);
    },
    [programar],
  );

  // Con el cursor encima (o el foco dentro) la pila se abre y los avisos esperan.
  const pausar = () => {
    setExpandida(true);
    const mapa = temporizadores.current;
    for (const [id, t] of mapa) {
      window.clearTimeout(t.temporizador);
      mapa.set(id, { temporizador: 0, inicio: t.inicio, restante: Math.max(800, t.restante - (Date.now() - t.inicio)) });
    }
  };
  const reanudar = () => {
    setExpandida(false);
    const mapa = temporizadores.current;
    for (const [id, t] of mapa) {
      mapa.set(id, { temporizador: window.setTimeout(() => quitar(id), t.restante), inicio: Date.now(), restante: t.restante });
    }
  };

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => {
      for (const [, t] of mapa) window.clearTimeout(t.temporizador);
    };
  }, []);

  const confirmar = useCallback(
    (opciones) =>
      new Promise((resolver) => {
        contador.current += 1;
        setConfirmacion({ ...opciones, resolver, id: contador.current });
      }),
    [],
  );

  const responder = (valor) => {
    confirmacion?.resolver(valor);
    setConfirmacion(null);
  };

  const visibles = avisos;
  const total = visibles.length;

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
              {/* En acciones destructivas el foco empieza en Cancelar y confirmar espera un instante: un Enter no borra nada. */}
              <Boton variante="secundario" onClick={() => responder(false)} data-autofocus={confirmacion?.peligro ? true : undefined}>
                {confirmacion?.cancelar || "Cancelar"}
              </Boton>
              <BotonConfirmar key={confirmacion?.id || 0} confirmacion={confirmacion} onConfirmar={() => responder(true)} />
            </>
          }
        >
          <p className="text-sm leading-6 text-slate-600">{confirmacion?.mensaje}</p>
        </Modal>
        <div className="pointer-events-none fixed inset-x-3 bottom-5 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end">
          <EstadoConexion />
          <ol
            aria-live="polite"
            className={`aiden-avisos ${expandida ? "is-expandida" : ""}`}
            style={{ "--total": total }}
            onPointerEnter={pausar}
            onPointerLeave={reanudar}
            onFocus={pausar}
            onBlur={(evento) => {
              if (!evento.currentTarget.contains(evento.relatedTarget)) reanudar();
            }}
          >
            {visibles.map((item, indice) => {
              const Icono = ICONOS[item.tipo] || Info;
              const profundidad = total - 1 - indice;
              return (
                <li
                  key={item.id}
                  role={item.tipo === "error" ? "alert" : "status"}
                  className={`aiden-aviso pointer-events-auto ${item.saliendo ? "is-saliendo" : ""}`}
                  style={{ "--profundidad": profundidad, "--duracion": `${item.duracion}ms` }}
                >
                  <Icono size={17} className={`mt-0.5 shrink-0 ${COLOR_ICONO[item.tipo]}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.titulo}</p>
                    {item.detalle && <p className="mt-0.5 text-xs leading-5 text-slate-300">{item.detalle}</p>}
                  </div>
                  <button type="button" onClick={() => quitar(item.id)} aria-label="Cerrar aviso" className="-mr-1 rounded-md p-1 text-slate-400 hover:text-white">
                    <X size={13} aria-hidden="true" />
                  </button>
                  <span className="aiden-aviso-tiempo" aria-hidden="true" />
                </li>
              );
            })}
          </ol>
        </div>
      </ContextoConfirmacion.Provider>
    </ContextoAvisos.Provider>
  );
}

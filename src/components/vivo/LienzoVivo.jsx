import { Component, Suspense, useEffect, useRef, useState } from "react";
import { adaptadorDisponible, hayWebGpu, useMovimientoReducido, usePunteroFino } from "./soporte";
import "../../estilos/vivo.css";

class Contencion extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch() {
    this.props.onFallo?.();
  }

  render() {
    return this.state.fallo ? null : this.props.children;
  }
}

/*
  El lienzo de una escena viva. El respaldo en CSS se pinta siempre primero; la
  escena (diferida, con el motor en su propio chunk) se monta cuando el marco se
  acerca a la pantalla y solo tapa al respaldo cuando el motor confirma que dibuja.
  Sin WebGPU, si la GPU falla o si el código no carga, queda el respaldo: la página
  nunca se ve vacía. Es decorativo de punta a punta (aria-hidden).
*/
export default function LienzoVivo({ escena: Escena, datos = {}, respaldo = null, className = "", margen = "360px" }) {
  const nodoRef = useRef(null);
  const [soportado] = useState(hayWebGpu);
  const [cerca, setCerca] = useState(() => typeof window !== "undefined" && !("IntersectionObserver" in window));
  const [estado, setEstado] = useState("esperando");
  const [respaldoVisible, setRespaldoVisible] = useState(true);
  const quieto = useMovimientoReducido();
  const cursor = usePunteroFino() && !quieto;

  useEffect(() => {
    const nodo = nodoRef.current;
    if (!soportado || cerca || !nodo) return undefined;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        setCerca(true);
        observador.disconnect();
      },
      { rootMargin: margen },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [soportado, cerca, margen]);

  // El respaldo se retira cuando la escena terminó de aparecer encima.
  useEffect(() => {
    if (estado !== "lista") return undefined;
    const espera = window.setTimeout(() => setRespaldoVisible(false), 1400);
    return () => window.clearTimeout(espera);
  }, [estado]);

  // Cerca de la pantalla, se confirma que hay adaptador antes de pedir el motor.
  const [conAdaptador, setConAdaptador] = useState(null);
  useEffect(() => {
    if (!soportado || !cerca || conAdaptador !== null) return undefined;
    let vigente = true;
    adaptadorDisponible().then((hay) => {
      if (!vigente) return;
      setConAdaptador(hay);
      if (!hay) setEstado("sin-gpu");
    });
    return () => {
      vigente = false;
    };
  }, [soportado, cerca, conAdaptador]);

  const montar = soportado && cerca && conAdaptador === true && estado !== "sin-gpu";

  return (
    <div ref={nodoRef} className={`aiden-lienzo ${className}`} data-estado={estado} aria-hidden="true">
      {(respaldoVisible || estado !== "lista") && respaldo && <div className="aiden-lienzo-respaldo">{respaldo}</div>}
      {montar && (
        <Contencion onFallo={() => setEstado("sin-gpu")}>
          <Suspense fallback={null}>
            <Escena
              className="aiden-lienzo-escena"
              quieto={quieto}
              cursor={cursor}
              onLista={() => setEstado("lista")}
              onSinGpu={() => setEstado("sin-gpu")}
              {...datos}
            />
          </Suspense>
        </Contencion>
      )}
    </div>
  );
}

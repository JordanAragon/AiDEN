import { Component, Suspense, lazy, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { getDashboardPath } from "../utilidades/autenticacion";
import { IsotipoAiden } from "../components/ui/MarcaAiden";
import { useMovimientoReducido, usePunteroFino } from "../components/vivo/soporte";

const LupaVidrio = lazy(() => import("../components/landing/LupaVidrio"));

// Si la lupa no carga, la página sigue completa: es un adorno.
class SinLupa extends Component {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}

/*
  La 404 es el invernadero de noche con una linterna: la luz sigue al cursor y
  una lupa de vidrio líquido (@samasante/liquid-glass) agranda lo que queda
  bajo ella. Sin ratón o con movimiento reducido, la página está iluminada y
  sin lupa.
*/
export default function NoEncontrada() {
  const sesion = useSesion();
  const escena = useRef(null);
  const quieto = useMovimientoReducido();
  const fino = usePunteroFino();
  useTitulo("Página no encontrada");
  const linterna = fino && !quieto;

  useEffect(() => {
    const nodo = escena.current;
    if (!linterna || !nodo) return undefined;
    const mover = (evento) => {
      const caja = nodo.getBoundingClientRect();
      nodo.style.setProperty("--linterna-x", `${evento.clientX - caja.left}px`);
      nodo.style.setProperty("--linterna-y", `${evento.clientY - caja.top}px`);
    };
    nodo.addEventListener("pointermove", mover, { passive: true });
    return () => nodo.removeEventListener("pointermove", mover);
  }, [linterna]);

  const contenido = (
    <div className="aiden-404-contenido">
      <h1>Esta página no existe.</h1>
      <p className="aiden-404-texto">Error 404. Puede que el enlace esté mal escrito o que la vista haya cambiado de lugar. Si buscabas un lote, entra y usa el buscador (⌘K o Ctrl K) con su código.</p>
    </div>
  );

  return (
    <main ref={escena} className={`aiden-404 ${linterna ? "is-linterna" : ""}`}>
      <div className="aiden-404-marco">
        <Link to="/" className="aiden-404-marca" aria-label="AiDEN, ir al inicio">
          <IsotipoAiden tamano={34} placa />
          <span>AiDEN</span>
        </Link>
        <div className="aiden-404-lente">
          {linterna ? (
            <SinLupa respaldo={contenido}>
              <Suspense fallback={contenido}>
                <LupaVidrio>{contenido}</LupaVidrio>
              </Suspense>
            </SinLupa>
          ) : (
            contenido
          )}
        </div>
        <div className="aiden-404-acciones">
          <Link to={sesion ? getDashboardPath(sesion.role) : "/"} className="aiden-404-primario">
            {sesion ? "Ir a mi tablero" : "Ir al inicio"} <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {!sesion && (
            <Link to="/login" className="aiden-404-secundario">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

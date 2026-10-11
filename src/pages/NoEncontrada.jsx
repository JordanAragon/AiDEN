import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { getDashboardPath } from "../utilidades/autenticacion";
import { IsotipoAiden } from "../components/ui/MarcaAiden";
import { useMovimientoReducido, usePunteroFino } from "../components/vivo/soporte";

/*
  La 404 es el invernadero de noche con una linterna: la luz se enciende al
  entrar el cursor y lo sigue. Sin ratón o con movimiento reducido, la página
  queda quieta y legible.
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
      nodo.classList.add("is-encendida");
    };
    const salir = () => nodo.classList.remove("is-encendida");
    nodo.addEventListener("pointermove", mover, { passive: true });
    nodo.addEventListener("pointerleave", salir);
    return () => {
      nodo.removeEventListener("pointermove", mover);
      nodo.removeEventListener("pointerleave", salir);
    };
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
        <div className="aiden-404-lente">{contenido}</div>
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

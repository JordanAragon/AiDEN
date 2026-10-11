import { Component, Suspense, lazy, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { alternarTema, centroDe, useTema } from "../../hooks/useTema";
import { useMovimientoReducido } from "../vivo/soporte";

const LenteTema = lazy(() => import("./LenteTema"));

// Si la lente no carga (sin red, navegador viejo), queda la pista con su pulgar en CSS.
class SinLente extends Component {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}

function PistaSimple({ oscuro }) {
  return (
    <span className="aiden-interruptor-caja is-simple" data-oscuro={oscuro}>
      <span className="aiden-interruptor-pulgar" />
      <span className="aiden-interruptor-pista" aria-hidden="true">
        <span className={!oscuro ? "is-activo" : ""}>
          <Sun size={15} /> Claro
        </span>
        <span className={oscuro ? "is-activo" : ""}>
          <Moon size={15} /> Oscuro
        </span>
      </span>
    </span>
  );
}

/* El cambio de tema de la barra lateral: un interruptor con lente de vidrio y,
   con la barra colapsada, un solo botón. Revela el tema en círculo desde aquí. */
export default function InterruptorTema({ compacto = false }) {
  const oscuro = useTema();
  const quieto = useMovimientoReducido();
  const boton = useRef(null);
  const cambiar = () => alternarTema(centroDe(boton.current));

  if (compacto) {
    return (
      <button ref={boton} type="button" role="switch" aria-checked={oscuro} aria-label="Modo oscuro" title={oscuro ? "Modo claro" : "Modo oscuro"} onClick={cambiar} className="flex h-10 w-full items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50">
        {oscuro ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
    );
  }

  const respaldo = <PistaSimple oscuro={oscuro} />;
  return (
    <button ref={boton} type="button" role="switch" aria-checked={oscuro} aria-label="Modo oscuro" onClick={cambiar} className="aiden-interruptor-tema">
      <SinLente respaldo={respaldo}>
        <Suspense fallback={respaldo}>
          <LenteTema oscuro={oscuro} quieto={quieto} />
        </Suspense>
      </SinLente>
    </button>
  );
}

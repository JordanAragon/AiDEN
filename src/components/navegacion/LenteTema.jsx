import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Glass, animateGlassValue, glassEase, glassValue } from "@samasante/liquid-glass";
import { Moon, Sun } from "lucide-react";

/*
  La pista del interruptor de tema bajo una lente de vidrio líquido
  (@samasante/liquid-glass, MIT): la lente refracta los íconos que tiene debajo
  y viaja de «Claro» a «Oscuro». Modo en sitio: dobla su propio contenido, así
  funciona igual en Chrome, Safari y Firefox. Se carga diferida.
*/
// Una lente sobria: aumenta un poco lo que tiene debajo y lo dobla solo en el borde.
const OPTICA = {
  strength: 0.06,
  depth: 0.3,
  curvature: 0.22,
  dispersion: 0.05,
  bend: 0.14,
  bendWidth: 0.08,
  frost: 0,
  sheen: 0.55,
  glow: 0.18,
};

export default function LenteTema({ oscuro, quieto }) {
  const caja = useRef(null);
  const [tamano, setTamano] = useState(null);
  const [centro] = useState(() => glassValue(oscuro ? 0.75 : 0.25));

  useLayoutEffect(() => {
    const nodo = caja.current;
    if (!nodo) return undefined;
    const medir = () => setTamano({ ancho: nodo.clientWidth, alto: nodo.clientHeight });
    medir();
    if (!("ResizeObserver" in window)) return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const destino = oscuro ? 0.75 : 0.25;
    if (quieto) {
      centro.set(destino);
      return undefined;
    }
    const animacion = animateGlassValue(centro, destino, { duration: 0.52, ease: glassEase });
    return () => animacion.stop();
  }, [oscuro, quieto, centro]);

  const pista = (
    <span className="aiden-interruptor-pista" aria-hidden="true">
      <span className={!oscuro ? "is-activo" : ""}>
        <Sun size={15} /> Claro
      </span>
      <span className={oscuro ? "is-activo" : ""}>
        <Moon size={15} /> Oscuro
      </span>
    </span>
  );

  return (
    <span ref={caja} className="aiden-interruptor-caja">
      {tamano && tamano.ancho > 60 && tamano.alto > 16 ? (
        <Glass size={[tamano.ancho / 2 - 6, tamano.alto - 6]} radius={(tamano.alto - 6) / 2} center={{ x: centro, y: 0.5 }} optics={OPTICA} className="aiden-interruptor-vidrio">
          {pista}
        </Glass>
      ) : (
        pista
      )}
    </span>
  );
}

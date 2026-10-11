import { useEffect, useRef, useState } from "react";
import { Glass, animateGlassValue, deriveGlass, glassValue } from "@samasante/liquid-glass";

/*
  Una lupa de vidrio líquido (@samasante/liquid-glass, MIT) que sigue al
  cursor sobre su contenido y lo agranda: el texto bajo ella sigue siendo
  texto. Aparece al entrar el cursor y se recoge al salir. Modo en sitio: la
  lente dobla su propio contenido, así funciona igual en Chrome, Safari y
  Firefox. Se carga diferida y solo con ratón o trackpad.
*/
const OPTICA = {
  strength: 0.06,
  depth: 0.55,
  curvature: 0.4,
  dispersion: 0.08,
  bend: 0.18,
  bendWidth: 0.08,
  frost: 0,
  sheen: 0.6,
  glow: 0.2,
};

const limitar = (valor) => Math.min(1, Math.max(0, valor));

export default function LupaVidrio({ children, diametro = 168 }) {
  const caja = useRef(null);
  const [x] = useState(() => glassValue(0.5));
  const [y] = useState(() => glassValue(0.5));
  const [lado] = useState(() => glassValue(0));
  const [radio] = useState(() => deriveGlass([lado], () => lado.get() / 2));

  useEffect(() => {
    let dentro = false;
    let animacion = null;
    const mover = (evento) => {
      const nodo = caja.current;
      if (!nodo) return;
      const r = nodo.getBoundingClientRect();
      const fx = (evento.clientX - r.left) / r.width;
      const fy = (evento.clientY - r.top) / r.height;
      x.set(limitar(fx));
      y.set(limitar(fy));
      const ahora = fx > -0.04 && fx < 1.04 && fy > -0.25 && fy < 1.25;
      if (ahora !== dentro) {
        dentro = ahora;
        animacion?.stop();
        animacion = animateGlassValue(lado, ahora ? diametro : 0, { duration: 0.32 });
      }
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      animacion?.stop();
    };
  }, [x, y, lado, diametro]);

  return (
    <span ref={caja} className="aiden-lupa">
      <Glass size={[lado, lado]} radius={radio} center={{ x, y }} optics={OPTICA}>
        {children}
      </Glass>
    </span>
  );
}

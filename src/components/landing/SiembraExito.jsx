import { useEffect, useRef } from "react";
import { useMovimientoReducido } from "../vivo/soporte";

/*
  Cuando la solicitud llega: dieciocho semillas (musgo y lima) saltan del botón
  y caen en tresbolillo, como una bandeja recién sembrada, y se desvanecen. Es
  el único confeti de AiDEN y vive solo aquí. Con movimiento reducido no hay
  semillas: el mensaje de confirmación basta.
*/
const SEMILLAS = 18;

export default function SiembraExito({ activa }) {
  const ref = useRef(null);
  const quieto = useMovimientoReducido();

  useEffect(() => {
    const contenedor = ref.current;
    if (!activa || quieto || !contenedor || typeof contenedor.animate !== "function") return undefined;
    const animaciones = [...contenedor.children].map((semilla, i) => {
      const fila = Math.floor(i / 6);
      const columna = i % 6;
      const x = (columna - 2.5) * 20 + (fila % 2 ? 10 : 0);
      const y = -38 - fila * 17;
      return semilla.animate(
        [
          { transform: "translate(0, 0) scale(0.2)", opacity: 0 },
          { transform: `translate(${x * 1.5}px, ${y - 34}px) scale(1.1)`, opacity: 1, offset: 0.42 },
          { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1, offset: 0.72 },
          { transform: `translate(${x}px, ${y}px) scale(0.5)`, opacity: 0 },
        ],
        { duration: 1500, delay: i * 22, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
      );
    });
    return () => animaciones.forEach((animacion) => animacion.cancel());
  }, [activa, quieto]);

  return (
    <span ref={ref} className="aiden-siembra" aria-hidden="true">
      {Array.from({ length: SEMILLAS }, (_, i) => (
        <i key={i} className={i % 3 === 0 ? "is-lima" : ""} />
      ))}
    </span>
  );
}

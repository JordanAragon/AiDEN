import { useId } from "react";

/*
  El sello del vivero: un timbre circular con su texto en el borde, el mismo de
  la guía de despacho de la landing. Cae al aparecer (escala y giro) cuando
  `animar` es verdadero: una incidencia cerrada, un lote despachado. Con
  movimiento reducido aparece en su sitio.
*/
export default function Sello({ texto, borde = "AiDEN · REGISTRO VERIFICADO ·", detalle, tono = "verde", animar = false, tamano = 92, className = "" }) {
  const id = useId().replace(/:/g, "");
  const r = tamano / 2 - 9;
  return (
    <span className={`aiden-sello aiden-sello-${tono} ${animar ? "is-cae" : ""} ${className}`} style={{ width: tamano, height: tamano }} role="img" aria-label={`${texto}${detalle ? `, ${detalle}` : ""}`}>
      <svg viewBox={`0 0 ${tamano} ${tamano}`} width={tamano} height={tamano} aria-hidden="true">
        <defs>
          <path id={`borde-${id}`} d={`M ${tamano / 2} ${tamano / 2} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`} />
        </defs>
        <circle cx={tamano / 2} cy={tamano / 2} r={tamano / 2 - 2} fill="none" strokeWidth="1.5" />
        <circle cx={tamano / 2} cy={tamano / 2} r={tamano / 2 - 16} fill="none" strokeWidth="1" strokeDasharray="2 3" />
        <text className="aiden-sello-borde">
          <textPath href={`#borde-${id}`} startOffset="0">
            {borde} {borde}
          </textPath>
        </text>
      </svg>
      <span className="aiden-sello-centro">
        <b>{texto}</b>
        {detalle && <small>{detalle}</small>}
      </span>
    </span>
  );
}

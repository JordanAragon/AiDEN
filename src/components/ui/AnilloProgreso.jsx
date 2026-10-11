/*
  Un valor contra su meta en un anillo (stock contra mínimo, avance del ciclo).
  El umbral se dice en texto junto al anillo: el color no es la única señal.
  El arco se anima solo cuando el valor cambia.
*/
const TONOS = { verde: "var(--anillo-verde)", alerta: "var(--anillo-alerta)", critico: "var(--anillo-critico)", lima: "var(--anillo-lima)" };

export default function AnilloProgreso({ valor, maximo = 100, tamano = 40, grosor = 4, tono = "verde", etiqueta, children, className = "" }) {
  const proporcion = maximo > 0 ? Math.max(0, Math.min(1, Number(valor) / maximo)) : 0;
  const radio = (tamano - grosor) / 2;
  return (
    <span
      role="meter"
      aria-valuenow={Math.round(proporcion * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
      className={`aiden-anillo ${className}`}
      style={{ width: tamano, height: tamano }}
    >
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" strokeWidth={grosor} className="aiden-anillo-pista" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - proporcion * 100}
          className="aiden-anillo-arco"
          style={{ stroke: TONOS[tono] || TONOS.verde }}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
      </svg>
      {children && <span className="aiden-anillo-centro">{children}</span>}
    </span>
  );
}

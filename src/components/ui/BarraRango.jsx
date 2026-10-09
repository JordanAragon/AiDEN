import { numero } from "../../utilidades/formato";

/*
  Una lectura juzgada contra su rango objetivo: la banda verde es el rango configurado,
  el tramo moss el rango de las últimas lecturas y el punto el valor actual. Fuera de
  rango el punto pasa a rojo y el desvío se dice en texto (no solo con color).
*/
export default function BarraRango({ etiqueta, unidad, valor, minimo, maximo, historico = [], compacta = false }) {
  const valores = [valor, minimo, maximo, ...historico].map(Number).filter(Number.isFinite);
  const bajo = Math.min(...valores);
  const alto = Math.max(...valores);
  const margen = Math.max(1, (alto - bajo) * 0.12);
  const desde = bajo - margen;
  const hasta = alto + margen;
  const pos = (x) => `${Math.min(100, Math.max(0, ((Number(x) - desde) / (hasta - desde)) * 100))}%`;
  const ancho = (a, b) => `${Math.max(0, ((Number(b) - Number(a)) / (hasta - desde)) * 100)}%`;
  const v = Number(valor);
  const sobre = v > maximo ? v - maximo : 0;
  const debajo = v < minimo ? minimo - v : 0;
  const fuera = sobre > 0 || debajo > 0;
  const desvio = sobre ? `+${numero(sobre)} ${unidad} sobre el máximo` : debajo ? `${numero(debajo)} ${unidad} bajo el mínimo` : "En rango";
  const hMin = historico.length ? Math.min(...historico) : null;
  const hMax = historico.length ? Math.max(...historico) : null;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{etiqueta}</span>
        <span className={`font-semibold tabular-nums ${compacta ? "text-sm" : "text-lg"} ${fuera ? "text-red-700" : "text-slate-900"}`}>
          {numero(v)} {unidad}
        </span>
      </div>
      <div className="relative mt-2 h-2.5 rounded-full bg-slate-100" role="img" aria-label={`${etiqueta}: ${numero(v)} ${unidad}. Rango objetivo ${numero(minimo)} a ${numero(maximo)} ${unidad}. ${desvio}.`}>
        <span className="absolute inset-y-0 rounded-full bg-verde-100 ring-1 ring-inset ring-verde-300" style={{ left: pos(minimo), width: ancho(minimo, maximo) }} />
        {hMin !== null && hMax > hMin && <span className="absolute inset-y-[3px] rounded-full bg-aiden-moss/50" style={{ left: pos(hMin), width: ancho(hMin, hMax) }} />}
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ${fuera ? "bg-red-600" : "bg-aiden-forest"}`}
          style={{ left: pos(v) }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap justify-between gap-x-2 text-[11px] tabular-nums text-slate-500">
        <span>
          Objetivo {numero(minimo)}–{numero(maximo)} {unidad}
        </span>
        <span className={fuera ? "font-semibold text-red-700" : ""}>{desvio}</span>
      </div>
    </div>
  );
}

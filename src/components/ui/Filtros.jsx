import { useLayoutEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export function Buscador({ valor, onCambio, etiqueta, placeholder, className = "" }) {
  return (
    <section className={`relative min-w-0 sm:min-w-[220px] ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-lime-100 [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button type="button" onClick={() => onCambio("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100">
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

/* Segmentos con una píldora que se desliza a la opción elegida (como el
   indicador de selección de Play): la elección se ve viajar, no saltar. */
export function Segmentos({ opciones, valor, onCambio, etiqueta }) {
  const grupo = useRef(null);
  const botones = useRef(new Map());
  const [pildora, setPildora] = useState(null);

  useLayoutEffect(() => {
    const medir = () => {
      const boton = botones.current.get(valor);
      if (!boton) return setPildora(null);
      setPildora((anterior) => {
        const siguiente = { x: boton.offsetLeft, ancho: boton.offsetWidth, alto: boton.offsetHeight, y: boton.offsetTop };
        return anterior && anterior.x === siguiente.x && anterior.ancho === siguiente.ancho && anterior.y === siguiente.y ? anterior : siguiente;
      });
    };
    medir();
    if (!("ResizeObserver" in window) || !grupo.current) return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(grupo.current);
    return () => observador.disconnect();
  }, [valor, opciones]);

  return (
    <section ref={grupo} role="group" aria-label={etiqueta} className="aiden-segmentos relative flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-slate-200 bg-white p-1">
      {pildora && <span className="aiden-segmentos-pildora" aria-hidden="true" style={{ "--x": `${pildora.x}px`, "--y": `${pildora.y}px`, "--ancho": `${pildora.ancho}px`, "--alto": `${pildora.alto}px` }} />}
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            ref={(nodo) => {
              if (nodo) botones.current.set(opcion.valor, nodo);
              else botones.current.delete(opcion.valor);
            }}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambio(opcion.valor)}
            className={`aiden-segmento relative z-[1] whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activo ? "is-activo text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            {opcion.etiqueta}
            {opcion.cuenta !== undefined && <span className={`ml-1.5 tabular-nums ${activo ? "text-emerald-100" : "text-slate-400"}`}>{opcion.cuenta}</span>}
          </button>
        );
      })}
    </section>
  );
}

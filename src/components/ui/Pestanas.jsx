import { useLayoutEffect, useRef, useState } from "react";

/*
  Pestañas con un indicador que se desliza hasta la elegida (mide su posición
  y su ancho) en vez de aparecer de golpe. Flechas para moverse, como siempre.
*/
export default function Pestanas({ pestanas, activa, onCambio, etiqueta }) {
  const refs = useRef([]);
  const lista = useRef(null);
  const [indicador, setIndicador] = useState(null);

  useLayoutEffect(() => {
    const medir = () => {
      const indice = pestanas.findIndex((pestana) => pestana.id === activa);
      const boton = refs.current[indice];
      if (!boton || !lista.current) return;
      setIndicador((anterior) => {
        const siguiente = { x: boton.offsetLeft, ancho: boton.offsetWidth };
        return anterior && anterior.x === siguiente.x && anterior.ancho === siguiente.ancho ? anterior : siguiente;
      });
    };
    medir();
    if (!("ResizeObserver" in window) || !lista.current) return undefined;
    const observador = new ResizeObserver(medir);
    observador.observe(lista.current);
    return () => observador.disconnect();
  }, [activa, pestanas]);

  const mover = (indice) => {
    const siguiente = (indice + pestanas.length) % pestanas.length;
    refs.current[siguiente]?.focus();
    onCambio(pestanas[siguiente].id);
  };
  return (
    <section ref={lista} role="tablist" aria-label={etiqueta} className="aiden-pestanas relative flex max-w-full gap-1 overflow-x-auto">
      {pestanas.map((pestana, indice) => {
        const seleccionada = pestana.id === activa;
        return (
          <button
            key={pestana.id}
            ref={(el) => {
              refs.current[indice] = el;
            }}
            type="button"
            role="tab"
            id={`pestana-${pestana.id}`}
            aria-selected={seleccionada}
            aria-controls={seleccionada ? `panel-${pestana.id}` : undefined}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambio(pestana.id)}
            onKeyDown={(evento) => {
              if (evento.key === "ArrowRight") mover(indice + 1);
              if (evento.key === "ArrowLeft") mover(indice - 1);
            }}
            className={`relative whitespace-nowrap px-1.5 py-3 text-xs font-semibold transition-colors ${seleccionada ? "text-emerald-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            {pestana.etiqueta}
            {pestana.cuenta !== undefined && (
              <span className={`ml-1.5 tabular-nums ${seleccionada ? "text-emerald-700" : "text-slate-500"}`}>
                <span className="sr-only">, </span>
                {pestana.cuenta}
              </span>
            )}
          </button>
        );
      })}
      {indicador && <span className="aiden-pestanas-indicador" aria-hidden="true" style={{ "--x": `${indicador.x}px`, "--ancho": `${indicador.ancho}px` }} />}
    </section>
  );
}

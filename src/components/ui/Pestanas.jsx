import { useRef } from "react";

export default function Pestanas({ pestanas, activa, onCambio, etiqueta }) {
  const refs = useRef([]);
  const mover = (indice) => {
    const siguiente = (indice + pestanas.length) % pestanas.length;
    refs.current[siguiente]?.focus();
    onCambio(pestanas[siguiente].id);
  };
  return (
    <section role="tablist" aria-label={etiqueta} className="flex max-w-full gap-1 overflow-x-auto">
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
            aria-controls={`panel-${pestana.id}`}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambio(pestana.id)}
            onKeyDown={(evento) => {
              if (evento.key === "ArrowRight") mover(indice + 1);
              if (evento.key === "ArrowLeft") mover(indice - 1);
            }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${seleccionada ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
          >
            {pestana.etiqueta}
            {pestana.cuenta !== undefined && <span className={`ml-1.5 ${seleccionada ? "text-emerald-100" : "text-slate-500"}`}>{pestana.cuenta}</span>}
          </button>
        );
      })}
    </section>
  );
}

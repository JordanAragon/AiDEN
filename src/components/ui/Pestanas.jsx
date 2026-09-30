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
            aria-controls={seleccionada ? `panel-${pestana.id}` : undefined}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambio(pestana.id)}
            onKeyDown={(evento) => {
              if (evento.key === "ArrowRight") mover(indice + 1);
              if (evento.key === "ArrowLeft") mover(indice - 1);
            }}
            className={`relative whitespace-nowrap px-1.5 py-3 text-xs font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-colors ${seleccionada ? "text-emerald-800 after:bg-emerald-700" : "text-slate-500 after:bg-transparent hover:text-slate-800"}`}
          >
            {pestana.etiqueta}
            {pestana.cuenta !== undefined && <span className={`ml-1.5 ${seleccionada ? "text-emerald-700" : "text-slate-400"}`}>{pestana.cuenta}</span>}
          </button>
        );
      })}
    </section>
  );
}

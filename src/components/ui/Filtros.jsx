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
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-emerald-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button type="button" onClick={() => onCambio("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100">
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export function Segmentos({ opciones, valor, onCambio, etiqueta }) {
  return (
    <section role="group" aria-label={etiqueta} className="flex max-w-full gap-1 overflow-x-auto">
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambio(opcion.valor)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${activo ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
          >
            {opcion.etiqueta}
            {opcion.cuenta !== undefined && <span className={`ml-1.5 ${activo ? "text-emerald-100" : "text-slate-500"}`}>{opcion.cuenta}</span>}
          </button>
        );
      })}
    </section>
  );
}

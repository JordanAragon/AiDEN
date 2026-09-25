import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Estadistica({ etiqueta, valor, to, detalle }) {
  return (
    <Link to={to} className="block rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30">
      <p className="text-2xl font-bold text-slate-900">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{etiqueta}</p>
      {detalle && <p className="mt-0.5 text-[11px] text-slate-500">{detalle}</p>}
      <span className="mt-3 block text-[11px] font-semibold text-emerald-700">Abrir módulo →</span>
    </Link>
  );
}

export function AccionRapida({ to, onClick, children }) {
  const clases = "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-700";
  if (to) {
    return (
      <Link to={to} className={clases}>
        {children}
        <span aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clases}>
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}

export function TarjetaAccion({ icono: Icono, titulo, texto, accion, to }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icono size={18} className="text-emerald-700" aria-hidden="true" />
      <h2 className="mt-3 font-semibold text-slate-900">{titulo}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{texto}</p>
      <Link to={to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
        {accion}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function ItemOscuro({ tipo, texto, detalle, to }) {
  return (
    <Link to={to} className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
      <p className="text-xs font-semibold text-emerald-300">{tipo}</p>
      <p className="mt-1 text-sm text-white/85">{texto}</p>
      {detalle && <p className="mt-0.5 text-xs text-white/60">{detalle}</p>}
    </Link>
  );
}

export function EnlaceModulo({ to, children }) {
  return (
    <Link to={to} className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
      {children}
      <ArrowRight size={12} aria-hidden="true" />
    </Link>
  );
}

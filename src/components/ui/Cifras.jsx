import { Link } from "react-router-dom";
import CifraRodante from "./CifraRodante";

// El tono solo se marca cuando pide atención: un punto ámbar o rojo junto a la etiqueta.
const PUNTO = { alerta: "bg-amber-500", critico: "bg-red-600" };

function Contenido({ etiqueta, valor, detalle, icono: Icono, tono }) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold leading-5 text-slate-600">
          {PUNTO[tono] && <span className={`h-2 w-2 shrink-0 rounded-full ${PUNTO[tono]}`} aria-hidden="true" />}
          {etiqueta}
        </span>
        {Icono && <Icono size={16} className="mt-0.5 shrink-0 text-aiden-moss" aria-hidden="true" />}
      </span>
      <span className="mt-3 block break-words text-[clamp(1.35rem,4.6vw,1.75rem)] font-semibold leading-none tracking-tight text-slate-950 tabular-nums">
        {typeof valor === "number" || typeof valor === "string" ? <CifraRodante valor={valor} desdeCero /> : valor}
      </span>
      {detalle && <span className="mt-2 block text-xs leading-5 text-slate-500">{detalle}</span>}
    </>
  );
}

const COLUMNAS = { 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5" };

export default function Cifras({ items, className = "" }) {
  return (
    <section className={`aiden-stat-grid grid grid-cols-2 gap-3 sm:gap-4 ${COLUMNAS[items.length] || "xl:grid-cols-4"} ${className}`}>
      {items.map((item) => {
        const base = `block min-w-0 rounded-2xl border bg-white p-4 text-left transition-colors ${item.activo ? "border-aiden-moss ring-1 ring-aiden-moss/30" : "border-slate-200"}`;
        if (item.to) {
          return (
            <Link key={item.etiqueta} to={item.to} className={`${base} hover:border-aiden-moss/60`}>
              <Contenido {...item} />
            </Link>
          );
        }
        if (item.onClick) {
          return (
            <button key={item.etiqueta} type="button" onClick={item.onClick} aria-pressed={item.activo} className={`${base} hover:border-aiden-moss/60`}>
              <Contenido {...item} />
            </button>
          );
        }
        return (
          <article key={item.etiqueta} className={base}>
            <Contenido {...item} />
          </article>
        );
      })}
    </section>
  );
}

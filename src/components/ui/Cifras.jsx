import { Link } from "react-router-dom";

const TONOS = {
  exito: "bg-emerald-50 text-emerald-700",
  neutral: "bg-emerald-50 text-emerald-700",
  alerta: "bg-amber-50 text-amber-700",
  critico: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-700",
};

function Contenido({ etiqueta, valor, detalle, icono: Icono, tono }) {
  return (
    <>
      {Icono && (
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONOS[tono] || TONOS.exito}`}>
          <Icono size={17} aria-hidden="true" />
        </span>
      )}
      <span className={`block text-2xl font-bold tracking-tight text-slate-950 ${Icono ? "mt-4" : ""}`}>{valor}</span>
      <span className="block text-xs font-semibold text-slate-600">{etiqueta}</span>
      {detalle && <span className="mt-1 block text-[11px] text-slate-500">{detalle}</span>}
    </>
  );
}

const COLUMNAS = { 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5" };

export default function Cifras({ items, className = "" }) {
  return (
    <section className={`grid gap-4 sm:grid-cols-2 ${COLUMNAS[items.length] || "xl:grid-cols-4"} ${className}`}>
      {items.map((item) => {
        const base = `block rounded-2xl border bg-white p-4 text-left shadow-sm ${item.activo ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"}`;
        if (item.to) {
          return (
            <Link key={item.etiqueta} to={item.to} className={`${base} transition-colors hover:border-emerald-200`}>
              <Contenido {...item} />
            </Link>
          );
        }
        if (item.onClick) {
          return (
            <button key={item.etiqueta} type="button" onClick={item.onClick} aria-pressed={item.activo} className={`${base} transition-colors hover:border-emerald-200`}>
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

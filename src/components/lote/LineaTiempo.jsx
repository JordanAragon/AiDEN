import { fechaHora } from "../../utilidades/formato";
import EtiquetaLote from "./EtiquetaLote";

export default function LineaTiempo({ eventos, mostrarLote = false, limite }) {
  const lista = limite ? eventos.slice(0, limite) : eventos;
  return (
    <ol className="relative ml-3 border-l border-slate-200 pl-7">
      {lista.map((evento) => (
        <li key={evento.id} className="relative pb-7 last:pb-0">
          <span className="absolute -left-[36px] top-0 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-500" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-emerald-700">{evento.evento}</p>
              <time className="text-[11px] text-slate-500">{fechaHora(evento.fecha)}</time>
            </header>
            <p className="mt-2 text-sm font-medium text-slate-800">{evento.detalle}</p>
            <footer className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              {mostrarLote && (
                <>
                  <EtiquetaLote codigo={evento.lote} />
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{evento.responsable || "Sistema"}</span>
              {evento.origen && evento.origen !== "Manual" && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>desde {evento.origen}</span>
                </>
              )}
            </footer>
          </section>
        </li>
      ))}
    </ol>
  );
}

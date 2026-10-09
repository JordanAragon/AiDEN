import { ArrowRightLeft, Bug, ChevronsRight, Circle, ClipboardCheck, Droplets, Eye, FlaskConical, Package, Search, ShieldCheck, Shovel, SprayCan, Sprout, Truck } from "lucide-react";
import EtiquetaLote from "./EtiquetaLote";
import { NOMBRE_ORIGEN } from "../../datos/catalogos";
import { fechaCorta, hora, hoyISO, sumarDias } from "../../utilidades/formato";

const ICONOS = {
  "Registro de lote": Sprout,
  "Cambio de etapa": ChevronsRight,
  Riego: Droplets,
  Fertilización: FlaskConical,
  "Aplicación fitosanitaria": SprayCan,
  Trasplante: Shovel,
  Inspección: Search,
  Observación: Eye,
  "Consumo de insumo": Package,
  Incidencia: Bug,
  "Cierre de incidencia": ShieldCheck,
  "Tarea completada": ClipboardCheck,
  Traslado: ArrowRightLeft,
  Despacho: Truck,
};

// Los hitos del lote (etapas, despacho) van en bosque; las incidencias, en ámbar.
const TONOS = {
  "Cambio de etapa": "bg-aiden-forest text-aiden-lime ring-aiden-forest",
  "Registro de lote": "bg-aiden-forest text-aiden-lime ring-aiden-forest",
  Despacho: "bg-aiden-forest text-aiden-lime ring-aiden-forest",
  Incidencia: "bg-amber-50 text-amber-700 ring-amber-300",
};
const TONO_BASE = "bg-white text-aiden-moss ring-slate-200";

function etiquetaDia(dia) {
  const hoy = hoyISO();
  if (dia === hoy) return "Hoy";
  if (dia === sumarDias(hoy, -1)) return "Ayer";
  return fechaCorta(dia);
}

function agruparPorDia(eventos) {
  const grupos = [];
  for (const evento of eventos) {
    const dia = String(evento.fecha).slice(0, 10);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.dia === dia) ultimo.eventos.push(evento);
    else grupos.push({ dia, eventos: [evento] });
  }
  return grupos;
}

export default function LineaTiempo({ eventos, mostrarLote = false, limite }) {
  const lista = limite ? eventos.slice(0, limite) : eventos;
  return (
    <div className="space-y-4">
      {agruparPorDia(lista).map((grupo) => (
        <section key={grupo.dia} aria-label={etiquetaDia(grupo.dia)}>
          <h4 className="aiden-linea-dia py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">{etiquetaDia(grupo.dia)}</h4>
          <ol className="relative ml-3.5 border-l border-slate-200">
            {grupo.eventos.map((evento) => {
              const Icono = ICONOS[evento.evento] || Circle;
              return (
                <li key={evento.id} className="relative border-b border-slate-100 py-3 pl-7 last:border-b-0">
                  <span className={`absolute -left-[15px] top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full ring-1 ${TONOS[evento.evento] || TONO_BASE}`} aria-hidden="true">
                    <Icono size={14} />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-semibold text-slate-900">{evento.evento}</p>
                    <time dateTime={evento.fecha} className="text-xs text-slate-500 tabular-nums">
                      {hora(evento.fecha)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm leading-6 text-slate-700">{evento.detalle}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
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
                        <span>desde {NOMBRE_ORIGEN[evento.origen] || evento.origen}</span>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

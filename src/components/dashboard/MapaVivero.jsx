import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Vivero3D from "../vivero3d/Vivero3D";
import { planoVivero, vistaGeneral } from "../vivero3d/planoVivero";
import { useFichaLote } from "../../contexto/ficha";
import { ETAPAS } from "../../datos/catalogos";
import { evaluarLectura, ultimasLecturas } from "../../datos/selectores";
import { numero } from "../../utilidades/formato";

/*
  El mapa del vivero en el tablero del supervisor: el mismo vivero en 3D de la
  landing, con los datos del día. Cada punto es una planta viva; las zonas con
  la última lectura fuera de rango se marcan. La lista de la derecha es la
  parte accesible: pasar por un lote lo ubica en el mapa y abrirlo abre su
  ficha. Gira despacio; con movimiento reducido queda quieto.
*/

const COLOR_ETAPA = ["#c9df7a", "#9dc068", "#769c56", "#587f45"];

export default function MapaVivero({ datos }) {
  const { abrirLote } = useFichaLote();
  const [resaltado, setResaltado] = useState(-1);
  const plano = useMemo(() => planoVivero({ lotes: datos.lotes, zonas: datos.zonas }), [datos.lotes, datos.zonas]);
  const lecturas = useMemo(() => ultimasLecturas(datos.ambiental), [datos.ambiental]);
  const enAlerta = useMemo(() => new Set(plano.zonas.filter((zona) => evaluarLectura(lecturas.get(zona.nombre), datos.configuracion).fuera).map((zona) => zona.nombre)), [plano, lecturas, datos.configuracion]);
  const codigos = plano.lotes.map((lote) => lote.codigo);
  const pose = useCallback((aspecto) => vistaGeneral(plano, aspecto, aspecto > 1.4 ? 0.8 : 0.95), [plano]);

  const etiquetas = useMemo(
    () => [
      ...plano.zonas.map((zona) => ({
        id: `zona-${zona.nombre}`,
        punto: zona.centro,
        contenido: (
          <span className="aiden-vivero3d-rotulo is-zona">
            {zona.nombre}
            {enAlerta.has(zona.nombre) && <span className="aiden-vivero3d-alerta">Fuera de rango</span>}
          </span>
        ),
      })),
      // El rótulo de un lote solo aparece al ubicarlo desde la lista: el mapa respira.
      ...plano.lotes.filter((lote) => lote.indice === resaltado).map((lote) => ({
        id: lote.codigo,
        punto: lote.centro,
        contenido: (
          <span className="aiden-vivero3d-rotulo is-activo">
            <b>{lote.codigo}</b>
            <span>{numero(lote.plantas)} plantas</span>
          </span>
        ),
      })),
    ],
    [plano, enAlerta, resaltado],
  );

  return (
    <section className="aiden-mapa-vivero overflow-hidden rounded-[24px] bg-[#0b2b1b] text-white shadow-[0_24px_70px_rgba(11,43,27,0.16)]" aria-labelledby="titulo-mapa-vivero">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative min-h-[320px] lg:min-h-[440px]">
          <div className="absolute inset-0">
            <Vivero3D plano={plano} pose={pose} resaltado={resaltado} orbita={0.045} etiquetas={etiquetas} className="h-full w-full" />
          </div>
          <header className="pointer-events-none absolute left-5 top-5 max-w-sm sm:left-6 sm:top-6">
            <h2 id="titulo-mapa-vivero" className="text-lg font-semibold tracking-tight">
              Mapa del vivero
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/70">
              {numero(plano.totalPlantas)} plantas vivas, un punto por planta{plano.representa > 1 ? ` (cada punto, ${numero(plano.representa)} plantas)` : ""}.
            </p>
          </header>
        </div>
        <aside className="border-t border-white/10 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Lotes en el mapa</h3>
            <Link to="/produccion" className="inline-flex items-center gap-1 text-xs font-semibold text-aiden-lime hover:underline">
              Producción <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 space-y-1" onMouseLeave={() => setResaltado(-1)}>
            {plano.lotes.map((lote) => (
              <li key={lote.codigo}>
                <button
                  type="button"
                  onMouseEnter={() => setResaltado(lote.indice)}
                  onFocus={() => setResaltado(lote.indice)}
                  onBlur={() => setResaltado(-1)}
                  onClick={() => abrirLote(lote.codigo, codigos)}
                  aria-label={`${lote.codigo}, ${lote.cultivo}, ${numero(lote.plantas)} plantas en ${lote.etapa}, ${lote.zona}${enAlerta.has(lote.zona) ? ", zona fuera de rango" : ""}. Abrir ficha`}
                  className={`aiden-mapa-vivero-lote flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${resaltado === lote.indice ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_ETAPA[lote.etapaIndice] }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{lote.cultivo}</span>
                    <span className="block truncate text-[11px] text-white/60">
                      {lote.codigo} · {lote.zona}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums">{numero(lote.plantas)}</span>
                    <span className="block text-[11px] text-white/60">{ETAPAS[lote.etapaIndice]}</span>
                  </span>
                  {enAlerta.has(lote.zona) && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />}
                </button>
              </li>
            ))}
            {!plano.lotes.length && <li className="px-3 py-6 text-center text-sm text-white/70">Aún no hay lotes activos. Cuando registres el primero, sus plantas aparecerán en el mapa.</li>}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/70" aria-label="Color por etapa">
            {ETAPAS.map((etapa, i) => (
              <li key={etapa} className="inline-flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full" style={{ background: COLOR_ETAPA[i] }} aria-hidden="true" />
                {etapa}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

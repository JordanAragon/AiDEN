import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ClipboardList, Clock3, History, Plus, Thermometer } from "lucide-react";
import { Boton } from "../ui/Boton";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Panel from "../ui/Panel";
import { Segmentos } from "../ui/Filtros";
import { FILA_ENCABEZADO, TD, TH, TR } from "../ui/tabla";
import EtiquetaLote from "../lote/EtiquetaLote";
import BarraRango from "../ui/BarraRango";
import MapaCalor from "../ui/MapaCalor";
import TiempoRelativo from "../ui/TiempoRelativo";
import ModalLectura from "../formularios/ModalLectura";
import ModalTarea from "../formularios/ModalTarea";
import { useDatos } from "../../datos/almacen";
import { describirLectura, esGestor, evaluarLectura, lecturasOrdenadas, lotesActivos, ultimasLecturas, zonasVisibles } from "../../datos/selectores";
import { useColoresGrafica } from "../../hooks/useColoresGrafica";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { aFecha, fechaHora, hora, hoyISO, numero, plural } from "../../utilidades/formato";

export default function AmbientalOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const colores = useColoresGrafica();
  const [parametros, setParametros] = useSearchParams();
  const [metrica, setMetrica] = useState("temperatura");
  const [periodo, setPeriodo] = useState("72");
  const [modal, setModal] = useState(null);
  const gestor = esGestor(sesion);
  const cfg = datos.configuracion;
  useTitulo("Ambiental");

  const zonas = zonasVisibles(datos, sesion);
  const ultimas = ultimasLecturas(datos.ambiental);
  const zone = zonas.includes(parametros.get("zona")) ? parametros.get("zona") : "Todas";
  const visibles = datos.ambiental.filter((l) => zonas.includes(l.zona));
  const enAlerta = zonas.filter((z) => evaluarLectura(ultimas.get(z), cfg).fuera);
  const activos = lotesActivos(datos.lotes);
  const ultima = lecturasOrdenadas(visibles).at(-1);
  const mostradas = zone === "Todas" ? zonas : [zone];

  const elegir = (nombre) => {
    const siguiente = new URLSearchParams(parametros);
    if (nombre === "Todas") siguiente.delete("zona");
    else siguiente.set("zona", nombre);
    setParametros(siguiente, { replace: true });
  };

  const tareaRevision = (nombre) => {
    setModal({
      tipo: "tarea",
      inicial: {
        titulo: `Revisar condiciones en ${nombre}`,
        modulo: "Ambiental",
        prioridad: "Alta",
        fecha: hoyISO(),
        responsableId: activos.find((l) => l.ubicacion === nombre)?.responsableId,
        descripcion: `Última lectura: ${describirLectura(ultimas.get(nombre), cfg)}. Verificar ventilación, riego y sombra.`,
      },
    });
  };

  // El mapa de calor: 72 horas en franjas de 4 horas, la lectura más reciente de cada franja por zona.
  const FRANJA = 4 * 3_600_000;
  const finFranjas = (() => {
    const fin = new Date();
    fin.setMinutes(0, 0, 0);
    return fin.getTime() + 3_600_000;
  })();
  const inicioFranjas = finFranjas - 18 * FRANJA;
  const columnasCalor = Array.from({ length: 18 }, (_, i) => {
    const desde = new Date(inicioFranjas + i * FRANJA);
    const diaAnterior = i > 0 ? new Date(inicioFranjas + (i - 1) * FRANJA).getDate() : null;
    const iso = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-${String(desde.getDate()).padStart(2, "0")}`;
    const marca = diaAnterior === desde.getDate() ? "" : iso === hoyISO() ? "Hoy" : desde.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
    return { id: i, nombre: `${desde.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" })} ${hora(desde)}`, marca };
  });
  const lecturasPorFranja = new Map();
  for (const lectura of visibles) {
    const t = aFecha(lectura.fecha).getTime();
    const i = Math.floor((t - inicioFranjas) / FRANJA);
    if (i < 0 || i >= 18) continue;
    const clave = `${lectura.zona}|${i}`;
    const previa = lecturasPorFranja.get(clave);
    if (!previa || aFecha(previa.fecha).getTime() < t) lecturasPorFranja.set(clave, lectura);
  }
  const tonoCalor = (lectura) => {
    if (!lectura) return "";
    const e = evaluarLectura(lectura, cfg);
    if (!e.fuera) return Number(lectura.temperatura) > cfg.tempMax - 1.5 ? "is-rango-alto" : "is-rango";
    if (e.temperatura === "baja") return "is-frio";
    return e.desvio >= 3 ? "is-critico" : "is-alerta";
  };
  const describirCalor = (fila, columna, lectura) => `${fila.nombre} · ${fechaHora(lectura.fecha)}: ${describirLectura(lectura, cfg)}${evaluarLectura(lectura, cfg).fuera ? " — fuera de rango" : " — en rango"}`;

  const deZona = zone === "Todas" ? [] : lecturasOrdenadas(datos.ambiental.filter((l) => l.zona === zone));
  const referencia = deZona.length ? aFecha(deZona[deZona.length - 1].fecha).getTime() : 0;
  const serie = deZona
    .filter((l) => aFecha(l.fecha).getTime() >= referencia - Number(periodo) * 3_600_000)
    .map((l) => ({ ...l, etiqueta: String(l.fecha).slice(0, 10) === hoyISO() ? hora(l.fecha) : `${aFecha(l.fecha).toLocaleDateString("es-CO", { weekday: "short" })} ${hora(l.fecha)}` }));
  const [min, max, unidad] = metrica === "temperatura" ? [cfg.tempMin, cfg.tempMax, "°C"] : [cfg.humMin, cfg.humMax, "%"];
  const valores = serie.map((l) => Number(l[metrica]));
  const dominio = [Math.floor(Math.min(min, ...valores) - 2), Math.ceil(Math.max(max, ...valores) + 2)];
  const punto = ({ cx, cy, payload, index }) => {
    if (cx === undefined || cy === undefined) return null;
    const v = Number(payload[metrica]);
    const fuera = v < min || v > max;
    return <circle key={`p-${index}`} cx={cx} cy={cy} r={fuera ? 4.5 : 3} fill={fuera ? colores.rojo : colores.verde} stroke={colores.superficie} strokeWidth={1.5} />;
  };
  const estiloTooltip = { background: colores.superficie, border: `1px solid ${colores.rejilla}`, borderRadius: 12, fontSize: 12, color: colores.tinta };

  return (
    <section className="aiden-modulo-vista aiden-operario-vista aiden-modulo-ambiental space-y-7">
      <EncabezadoPagina
        rotulo="AiDEN / seguimiento"
        titulo="Ambiental"
        descripcion="Monitorea temperatura, humedad e iluminación por zona para detectar condiciones que requieren atención."
        acciones={
          <Boton variante="primario" icono={Plus} onClick={() => setModal({ tipo: "lectura", zona: zone === "Todas" ? undefined : zone })} disabled={!zonas.length}>
            Registrar lectura
          </Boton>
        }
      />

      <Cifras
        items={[
          { icono: Thermometer, etiqueta: "Zonas", valor: zonas.length, detalle: "Con lecturas visibles" },
          { icono: AlertTriangle, etiqueta: "En alerta", valor: enAlerta.length, detalle: `${cfg.tempMin}–${cfg.tempMax} °C · ${cfg.humMin}–${cfg.humMax}%`, tono: enAlerta.length ? "critico" : "exito" },
          { icono: History, etiqueta: "Lecturas", valor: visibles.length, detalle: "Histórico disponible", tono: "info" },
          { icono: Clock3, etiqueta: "Actualizado", valor: ultima ? hora(ultima.fecha) : "—", detalle: ultima ? <>Última lectura <TiempoRelativo fecha={ultima.fecha} /></> : "Sin lecturas", tono: "alerta" },
        ]}
      />

      <Segmentos etiqueta="Filtrar zonas" valor={zone} onCambio={elegir} opciones={["Todas", ...zonas].map((z) => ({ valor: z, etiqueta: z }))} />

      {enAlerta.length > 0 && (
        <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <header className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
            <h2 className="font-semibold text-amber-900">Atención ambiental</h2>
          </header>
          <p className="mt-1 text-xs text-amber-800">Las alertas se calculan con los umbrales definidos en Configuración.</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {enAlerta.map((z) => (
              <li key={z} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  <span className="font-semibold">{z}:</span> {describirLectura(ultimas.get(z), cfg)}.
                </span>
                {gestor && (
                  <button type="button" onClick={() => tareaRevision(z)} className="text-xs font-semibold text-amber-900 underline-offset-2 hover:underline">
                    Asignar revisión
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mostradas.map((nombre) => {
          const row = ultimas.get(nombre);
          const e = evaluarLectura(row, cfg);
          const history = lecturasOrdenadas(datos.ambiental.filter((item) => item.zona === nombre)).slice(-10);
          const lotesZona = activos.filter((l) => l.ubicacion === nombre);
          return (
            <article key={nombre} className={`aiden-operario-superficie rounded-[22px] border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(11,47,32,0.07)] ${zone === nombre ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"}`}>
              <header className="flex items-start justify-between gap-3">
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Zona</p>
                  <div className="flex items-center gap-2">
                    <h2 className="mt-1 font-semibold text-slate-900">{nombre}</h2>
                    {zone === nombre && <span className="text-[10px] font-semibold text-emerald-700">Seleccionada</span>}
                  </div>
                </section>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${!row ? "bg-slate-100 text-slate-500" : e.fuera ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{!row ? "Sin datos" : e.fuera ? "Atención" : "Estable"}</span>
              </header>
              {row ? (
                <>
                  <section className="mt-5 space-y-4">
                    <BarraRango etiqueta="Temperatura" unidad="°C" valor={row.temperatura} minimo={cfg.tempMin} maximo={cfg.tempMax} historico={history.map((h) => Number(h.temperatura))} />
                    <BarraRango etiqueta="Humedad" unidad="%" valor={row.humedad} minimo={cfg.humMin} maximo={cfg.humMax} historico={history.map((h) => Number(h.humedad))} />
                    <p className="text-xs text-slate-500">Luz: {row.iluminacion ? `${numero(row.iluminacion)} lux` : "sin medición"}</p>
                  </section>
                  <section className="mt-4 h-24 rounded-xl bg-slate-50/80 px-2 py-1" role="img" aria-label={`Últimas ${history.length} lecturas de ${nombre}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <XAxis dataKey="fecha" hide />
                        <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
                        <Tooltip wrapperClassName="aiden-tooltip" contentStyle={estiloTooltip} itemStyle={{ color: colores.tinta }} labelStyle={{ color: colores.tinta }} labelFormatter={(value) => fechaHora(value)} />
                        <Line dataKey="temperatura" name="Temperatura" stroke={colores.verde} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line dataKey="humedad" name="Humedad" stroke="#6b8fb3" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                </>
              ) : (
                <p className="mt-5 text-sm text-slate-500">Sin lecturas registradas.</p>
              )}
              {lotesZona.length > 0 && (
                <section className="mt-3 flex flex-wrap items-center gap-2">
                  {lotesZona.map((l) => (
                    <EtiquetaLote key={l.id} codigo={l.lote} />
                  ))}
                </section>
              )}
              <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span>{row ? `Última lectura: ${fechaHora(row.fecha)} · ${row.registradoPor}` : "—"}</span>
                <span className="flex gap-3 font-semibold">
                  {zone === "Todas" && (
                    <button type="button" onClick={() => elegir(nombre)} className="text-emerald-700 hover:underline">
                      Ver historial
                    </button>
                  )}
                  {gestor && e.fuera && (
                    <button type="button" onClick={() => tareaRevision(nombre)} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                      <ClipboardList size={12} aria-hidden="true" />
                      Asignar revisión
                    </button>
                  )}
                </span>
              </footer>
            </article>
          );
        })}
        {!zonas.length && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No hay lecturas visibles para tu rol. Las zonas salen de los lotes a tu cargo.</p>}
      </section>

      {zone === "Todas" && zonas.length > 0 && (
        <Panel titulo="Las últimas 72 horas, lectura por lectura" descripcion="Cada celda es una franja de 4 horas. Pasa el cursor para ver la lectura; el color dice si quedó en el rango configurado.">
          <MapaCalor
              titulo={`Lecturas de las últimas 72 horas por zona, en franjas de 4 horas. Rango: ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax} %`}
              filas={zonas.map((nombre) => ({ id: nombre, nombre }))}
              columnas={columnasCalor}
              celda={(fila, columna) => lecturasPorFranja.get(`${fila.id}|${columna.id}`)}
              tono={tonoCalor}
              describir={describirCalor}
              leyenda={
                <>
                  <span><i className="aiden-mapa-calor-muestra is-rango" /> En rango</span>
                  <span><i className="aiden-mapa-calor-muestra is-rango-alto" /> Cerca del máximo</span>
                  <span><i className="aiden-mapa-calor-muestra is-alerta" /> Fuera de rango</span>
                  <span><i className="aiden-mapa-calor-muestra is-critico" /> Muy fuera (3 °C o más)</span>
                  <span><i className="aiden-mapa-calor-muestra is-frio" /> Por debajo del mínimo</span>
                  <span><i className="aiden-mapa-calor-muestra" /> Sin lectura</span>
                </>
              }
            />
        </Panel>
      )}

      {zone !== "Todas" && (
        <>
          <Panel
            titulo={`Historial de ${zone}`}
            descripcion="La franja verde es el rango configurado. Los puntos rojos quedaron fuera."
            accion={
              <>
                <Segmentos
                  etiqueta="Variable"
                  valor={metrica}
                  onCambio={setMetrica}
                  opciones={[
                    { valor: "temperatura", etiqueta: "Temperatura" },
                    { valor: "humedad", etiqueta: "Humedad" },
                  ]}
                />
                <Segmentos
                  etiqueta="Periodo"
                  valor={periodo}
                  onCambio={setPeriodo}
                  opciones={[
                    { valor: "24", etiqueta: "24 h" },
                    { valor: "72", etiqueta: "3 días" },
                  ]}
                />
              </>
            }
          >
            {serie.length ? (
              <div className="h-72" role="img" aria-label={`${metrica === "temperatura" ? "Temperatura" : "Humedad"} en ${zone}: ${serie.map((l) => `${l.etiqueta} ${numero(l[metrica])} ${unidad}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={colores.rejilla} className="aiden-chart-grid" />
                    <ReferenceArea y1={min} y2={max} fill={colores.banda} fillOpacity={0.12} stroke="none" ifOverflow="extendDomain" />
                    <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fill: colores.eje, fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} className="aiden-chart-axis" />
                    <YAxis domain={dominio} tickLine={false} axisLine={false} width={44} tick={{ fill: colores.eje, fontSize: 12 }} tickFormatter={(v) => `${v}${unidad === "%" ? "%" : "°"}`} className="aiden-chart-axis" />
                    <Tooltip
                      wrapperClassName="aiden-tooltip"
                      contentStyle={estiloTooltip}
                      itemStyle={{ color: colores.tinta }}
                      labelStyle={{ color: colores.tinta, fontWeight: 600 }}
                      formatter={(v) => [`${numero(v)} ${unidad}`, metrica === "temperatura" ? "Temperatura" : "Humedad"]}
                      labelFormatter={(_, p) => (p?.[0] ? fechaHora(p[0].payload.fecha) : "")}
                    />
                    <Line type="monotone" dataKey={metrica} stroke={colores.verde} strokeWidth={2} dot={punto} activeDot={{ r: 5 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Sin lecturas en este periodo.</p>
            )}
          </Panel>

          <Panel titulo="Lecturas recientes" descripcion={`${zone} · ${plural(deZona.length, "lectura guardada", "lecturas guardadas")}`} cuerpo="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className={FILA_ENCABEZADO}>
                  {["Fecha y hora", "Temperatura", "Humedad", "Luz", "Registró", "Estado"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...deZona]
                  .reverse()
                  .slice(0, 8)
                  .map((l) => {
                    const e = evaluarLectura(l, cfg);
                    return (
                      <tr key={l.id} className={TR}>
                        <td className={`${TD} whitespace-nowrap`}>{fechaHora(l.fecha)}</td>
                        <td className={`px-4 py-3 text-xs ${e.temperatura ? "font-bold text-red-600" : "text-slate-700"}`}>{numero(l.temperatura)} °C</td>
                        <td className={`px-4 py-3 text-xs ${e.humedad ? "font-bold text-red-600" : "text-slate-700"}`}>{numero(l.humedad)} %</td>
                        <td className={TD}>{l.iluminacion ? `${numero(l.iluminacion)} lux` : "—"}</td>
                        <td className={TD}>{l.registradoPor}</td>
                        <td className="px-4 py-3">
                          <Insignia tono={e.fuera ? "critico" : "exito"}>{e.fuera ? "Atención" : "Estable"}</Insignia>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </Panel>
        </>
      )}

      <ModalLectura abierto={modal?.tipo === "lectura"} onCerrar={() => setModal(null)} inicial={{ zona: modal?.zona }} />
      <ModalTarea abierto={modal?.tipo === "tarea"} onCerrar={() => setModal(null)} inicial={modal?.inicial} />
    </section>
  );
}

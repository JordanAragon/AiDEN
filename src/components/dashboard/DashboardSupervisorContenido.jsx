import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardList, Clock3, Package, Plus, Sprout, Users } from "lucide-react";
import { Boton } from "../ui/Boton";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Panel from "../ui/Panel";
import { EnlaceModulo, TarjetaAccion } from "../ui/Piezas";
import EtiquetaLote from "../lote/EtiquetaLote";
import LineaTiempo from "../lote/LineaTiempo";
import ModalTarea from "../formularios/ModalTarea";
import ModalLote from "../formularios/ModalLote";
import { useDatos } from "../../datos/almacen";
import { ETAPAS } from "../../datos/catalogos";
import { alertas as calcularAlertas, cargaPorPersona, evaluarLectura, lotesActivos, tareaVencida, ultimasLecturas } from "../../datos/selectores";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { aFecha, haceTiempo, hoyISO, numero, plural } from "../../utilidades/formato";

function accionRapida(alerta, datos) {
  if (alerta.tipo === "Ambiental") {
    return { texto: "Asignar revisión", tarea: { titulo: `Revisar condiciones en ${alerta.zona}`, modulo: "Ambiental", prioridad: "Alta", fecha: hoyISO(), descripcion: `${alerta.detalle} Verificar ventilación, riego y sombra.` } };
  }
  if (alerta.tipo === "Calidad") {
    const incidencia = datos.calidad.find((i) => `cal-${i.id}` === alerta.id);
    return { texto: "Asignar acción", tarea: { titulo: `Atender ${incidencia?.codigo}`, lote: incidencia?.lote, modulo: "Calidad", prioridad: "Alta", fecha: hoyISO(), responsableId: incidencia?.responsableId, descripcion: incidencia?.descripcion } };
  }
  if (alerta.tipo === "Inventario") return { texto: "Registrar entrada", ruta: `${alerta.ruta}&accion=entrada` };
  return { texto: "Reasignar", ruta: alerta.ruta };
}

export default function DashboardSupervisorContenido() {
  const datos = useDatos();
  const sesion = useSesion();
  const [tareaInicial, setTareaInicial] = useState(null);
  const [nuevoLote, setNuevoLote] = useState(false);
  useTitulo("Centro de supervisión");

  const hoy = hoyISO();
  const activos = lotesActivos(datos.lotes);
  const lista = calcularAlertas(datos, sesion);
  const carga = cargaPorPersona(datos).filter((c) => c.persona.cargo === "Operario");
  const maximo = Math.max(1, ...carga.map((c) => c.abiertas));
  const abiertas = datos.tareas.filter((t) => t.estado !== "Completada");
  const vencidas = abiertas.filter((t) => tareaVencida(t, hoy)).length;
  const completadasHoy = datos.tareas.filter((t) => t.estado === "Completada" && String(t.completada || "").slice(0, 10) === hoy).length;
  const bajoMinimo = datos.inventario.filter((i) => Number(i.stock) <= Number(i.minimo)).length;
  const lecturas = ultimasLecturas(datos.ambiental);
  const cfg = datos.configuracion;
  const recientes = [...datos.trazabilidad].sort((a, b) => aFecha(b.fecha) - aFecha(a.fecha)).slice(0, 5);

  return (
    <article className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / coordinación"
        titulo="Centro de supervisión"
        descripcion="Coordina la ejecución diaria: asigna trabajo, detecta bloqueos, valida incidencias y mantiene la operación en movimiento."
        acciones={
          <>
            <Boton variante="secundario" icono={Plus} onClick={() => setNuevoLote(true)} className="!px-3">
              Nuevo lote
            </Boton>
            <Boton variante="primario" icono={ClipboardList} onClick={() => setTareaInicial({})}>
              Asignar trabajo
            </Boton>
          </>
        }
      />

      <Cifras
        items={[
          { icono: Sprout, etiqueta: "Lotes activos", valor: activos.length, detalle: `${activos.filter((l) => l.etapa === "Cosecha").length} en cosecha · ${numero(activos.reduce((s, l) => s + Number(l.cantidad || 0), 0))} plantas`, to: "/produccion" },
          { icono: ClipboardList, etiqueta: "Trabajo pendiente", valor: abiertas.length, detalle: vencidas ? `${plural(vencidas, "vencida", "vencidas")} · ${completadasHoy} completadas hoy` : `Sin tareas vencidas · ${completadasHoy} completadas hoy`, tono: vencidas ? "critico" : "info", to: vencidas ? "/personal?vista=tareas&filtro=vencidas" : "/personal?vista=tareas" },
          { icono: AlertTriangle, etiqueta: "Alertas", valor: lista.length, detalle: `Operación, ambiente y calidad · ${cfg.tempMin}–${cfg.tempMax} °C`, tono: lista.length ? "critico" : "exito" },
          { icono: Package, etiqueta: "Insumos bajo mínimo", valor: bajoMinimo, detalle: bajoMinimo ? "Coordina reposición" : "Stock suficiente", tono: "alerta", to: "/inventario?filtro=bajo" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <section>
              <h2 className="font-semibold text-slate-900">Carga de trabajo</h2>
              <p className="mt-1 text-xs text-slate-500">Tareas pendientes por responsable</p>
            </section>
            <Users size={18} className="text-emerald-700" aria-hidden="true" />
          </header>
          <section className="mt-5 space-y-4">
            {carga.map(({ persona, abiertas: n, vencidas: v, lotes }) => (
              <Link key={persona.id} to={`/personal?persona=${persona.id}`} className="group block">
                <section className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700 group-hover:text-emerald-700">{persona.nombre}</span>
                  <span className="font-semibold text-slate-500">
                    {n} pendientes{v ? ` · ${v} vencida${v === 1 ? "" : "s"}` : ""} · {plural(lotes, "lote", "lotes")}
                  </span>
                </section>
                <section className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full bg-red-500" style={{ width: `${(v / maximo) * 100}%` }} />
                  <span className="block h-full bg-emerald-500" style={{ width: `${((n - v) / maximo) * 100}%` }} />
                </section>
              </Link>
            ))}
            {!carga.length && <p className="text-sm text-slate-500">Aún no hay tareas asignadas.</p>}
          </section>
          <EnlaceModulo to="/personal?vista=tareas">Gestionar tareas</EnlaceModulo>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Atención inmediata</h2>
            <p className="mt-1 text-xs text-slate-500">Eventos que necesitan intervención del supervisor</p>
          </header>
          <section className="mt-4 space-y-2">
            {lista.map((alerta) => {
              const accion = accionRapida(alerta, datos);
              return (
                <article key={alerta.id} className={`rounded-xl border bg-slate-50 p-3 ${alerta.severidad === "critico" ? "border-red-100" : "border-slate-100"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Insignia tono={alerta.severidad === "critico" ? "critico" : "alerta"}>{alerta.tipo}</Insignia>
                    {alerta.lote && <EtiquetaLote codigo={alerta.lote} />}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">{alerta.titulo}</p>
                  <p className="text-xs text-slate-500">{alerta.detalle}</p>
                  <div className="mt-2 flex gap-3 text-[11px] font-semibold">
                    <Link to={alerta.ruta} className="text-slate-600 hover:text-emerald-700">
                      Ver registro
                    </Link>
                    {accion.tarea ? (
                      <button type="button" onClick={() => setTareaInicial(accion.tarea)} className="text-emerald-700 hover:underline">
                        {accion.texto}
                      </button>
                    ) : (
                      <Link to={accion.ruta} className="text-emerald-700 hover:underline">
                        {accion.texto}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
            {!lista.length && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">No hay alertas que requieran intervención.</p>}
          </section>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TarjetaAccion icono={Sprout} titulo="Producción" texto="Avanza lotes, revisa etapas y crea tareas de seguimiento." accion="Abrir producción" to="/produccion" />
        <TarjetaAccion icono={Package} titulo="Inventario" texto="Revisa consumos, niveles mínimos y reposiciones pendientes." accion="Abrir inventario" to="/inventario" />
        <TarjetaAccion icono={Clock3} titulo="Seguimiento" texto="Consulta trazabilidad y verifica que cada actividad quede registrada." accion="Abrir trazabilidad" to="/trazabilidad" />
      </section>

      <Panel titulo="Lotes por etapa" descripcion="Toca un código para abrir la ficha del lote." accion={<Link to="/produccion" className="text-xs font-semibold text-emerald-700 hover:underline">Abrir producción</Link>}>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ETAPAS.map((etapa) => {
            const enEtapa = activos.filter((l) => l.etapa === etapa);
            return (
              <section key={etapa} aria-label={etapa} className="rounded-2xl bg-slate-50 p-3">
                <h3 className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  {etapa}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{enEtapa.length}</span>
                </h3>
                <ul className="mt-3 space-y-2">
                  {enEtapa.map((lote) => (
                    <li key={lote.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <EtiquetaLote codigo={lote.lote} />
                      <p className="mt-1 text-sm font-semibold text-slate-800">{lote.cultivo}</p>
                      <p className="text-[11px] text-slate-500">
                        {numero(lote.cantidad)} plantas · {lote.ubicacion}
                      </p>
                    </li>
                  ))}
                  {!enEtapa.length && <li className="py-3 text-center text-xs text-slate-500">Sin lotes</li>}
                </ul>
              </section>
            );
          })}
        </section>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Ambiente por zona" descripcion={`Rango: ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax} % de humedad`}>
          <ul className="divide-y divide-slate-100">
            {datos.zonas.map((zona) => {
              const lectura = lecturas.get(zona.nombre);
              const e = evaluarLectura(lectura, cfg);
              return (
                <li key={zona.id}>
                  <Link to={`/ambiental?zona=${encodeURIComponent(zona.nombre)}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{zona.nombre}</span>
                      <span className="block text-[11px] text-slate-500">{lectura ? `Última lectura ${haceTiempo(lectura.fecha)}` : "Sin lecturas"}</span>
                    </span>
                    {lectura && (
                      <span className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${e.fuera ? "text-red-600" : "text-slate-800"}`}>
                          {numero(lectura.temperatura)} °C · {numero(lectura.humedad)} %
                        </span>
                        <Insignia tono={e.fuera ? "critico" : "exito"}>{e.fuera ? "Atención" : "Estable"}</Insignia>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel titulo="Actividad reciente" descripcion="Lo último registrado en los lotes" accion={<Link to="/trazabilidad" className="text-xs font-semibold text-emerald-700 hover:underline">Ver trazabilidad</Link>}>
          {recientes.length ? <LineaTiempo eventos={recientes} mostrarLote /> : <p className="py-8 text-center text-sm text-slate-500">Todavía no hay actividad registrada.</p>}
        </Panel>
      </section>

      <ModalTarea abierto={Boolean(tareaInicial)} onCerrar={() => setTareaInicial(null)} inicial={tareaInicial || undefined} />
      <ModalLote abierto={nuevoLote} onCerrar={() => setNuevoLote(false)} />
    </article>
  );
}

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CircleDollarSign, ClipboardCheck, Settings, ShieldCheck, Sprout, Users } from "lucide-react";
import { BotonEnlace } from "../ui/Boton";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Panel from "../ui/Panel";
import { AccionRapida, EnlaceModulo, Estadistica, ItemOscuro } from "../ui/Piezas";
import EtiquetaLote from "../lote/EtiquetaLote";
import { useDatos } from "../../datos/almacen";
import { alertas as calcularAlertas, estadoIncidencia, lotesActivos, resumenLote, resumenMensual } from "../../datos/selectores";
import { useColoresGrafica } from "../../hooks/useColoresGrafica";
import { useSesion, useUsuarios } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { dinero, dineroCorto, fechaCorta, numero, plural } from "../../utilidades/formato";

export default function DashboardAdminContenido() {
  const datos = useDatos();
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const colores = useColoresGrafica();
  useTitulo("Centro de administración");

  const roles = { admin: 0, supervisor: 0, operario: 0 };
  usuarios.forEach((u) => {
    if (roles[u.role] !== undefined) roles[u.role] += 1;
  });
  const porRevisar = usuarios.filter((u) => !u.revisado);
  const resumenes = lotesActivos(datos.lotes).map((lote) => ({ lote, r: resumenLote(lote, datos) }));
  const plantas = resumenes.reduce((s, x) => s + x.r.plantas, 0);
  const costoPromedio = plantas ? resumenes.reduce((s, x) => s + x.r.gasto, 0) / plantas : 0;
  const meses = resumenMensual(datos.costos, 4);
  const mes = meses[meses.length - 1];
  const lista = calcularAlertas(datos, sesion);
  const criticas = lista.filter((a) => a.severidad === "critico");
  const atrasados = resumenes.filter((x) => x.r.diasParaSalida !== null && x.r.diasParaSalida < 0);
  const tareasAbiertas = datos.tareas.filter((t) => t.estado !== "Completada").length;
  const incidenciasAbiertas = datos.calidad.filter((i) => estadoIncidencia(i) !== "Cerrada").length;
  const bajoMinimo = datos.inventario.filter((i) => Number(i.stock) <= Number(i.minimo)).length;

  const decisiones = [
    ...criticas.map((a) => ({ id: a.id, tipo: a.tipo, texto: a.titulo, detalle: a.detalle, to: a.ruta })),
    ...porRevisar.map((u) => ({ id: u.id, tipo: "Accesos", texto: `Cuenta nueva: ${u.name}`, detalle: `Registrada el ${fechaCorta(u.creado)} como operario. Confirma su rol.`, to: "/personal?vista=accesos" })),
    ...atrasados.map(({ lote, r }) => ({ id: `atr-${lote.id}`, tipo: "Producción", texto: `${lote.lote} superó la salida estimada`, detalle: `Debía salir hace ${-r.diasParaSalida} días; sigue en ${lote.etapa}.`, to: "/produccion" })),
  ];

  return (
    <article className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / control del sistema"
        titulo="Centro de administración"
        descripcion="Supervisa usuarios, operación, seguridad y desempeño general. Aquí se toman decisiones del sistema, no se ejecutan tareas de campo."
        acciones={
          <>
            <BotonEnlace to="/personal" variante="secundario" icono={Users} className="!px-3">
              Gestionar personal
            </BotonEnlace>
            <BotonEnlace to="/configuracion" variante="primario" icono={Settings} className="!px-3">
              Configuración
            </BotonEnlace>
          </>
        }
      />

      <Cifras
        items={[
          { icono: Users, etiqueta: "Usuarios", valor: usuarios.length, detalle: `${roles.supervisor} supervisores · ${roles.operario} operarios${porRevisar.length ? ` · ${porRevisar.length} por revisar` : ""}`, tono: porRevisar.length ? "alerta" : "exito", to: "/personal?vista=accesos" },
          { icono: Sprout, etiqueta: "Lotes activos", valor: resumenes.length, detalle: `${numero(plantas)} plantas · ${dinero(costoPromedio)} por planta`, to: "/produccion" },
          { icono: CircleDollarSign, etiqueta: `Balance de ${mes.mes}`, valor: dinero(mes.balance), detalle: `${dinero(mes.ingresos)} ingresos · ${dinero(mes.gastos)} gastos`, tono: "info", to: "/costos" },
          { icono: ShieldCheck, etiqueta: "Alertas operativas", valor: lista.length, detalle: criticas.length ? `${plural(criticas.length, "crítica", "críticas")} · requieren seguimiento` : "Sin alertas críticas", tono: criticas.length ? "critico" : "exito", to: "/dashboard-supervisor" },
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header>
            <h2 className="font-semibold text-slate-900">Estado operativo</h2>
            <p className="mt-1 text-xs text-slate-500">Indicadores de la información almacenada</p>
          </header>
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <Estadistica etiqueta="Tareas abiertas" valor={tareasAbiertas} to="/personal?vista=tareas" />
            <Estadistica etiqueta="Incidencias abiertas" valor={incidenciasAbiertas} to="/calidad" />
            <Estadistica etiqueta="Insumos bajo mínimo" valor={bajoMinimo} to="/inventario?filtro=bajo" />
          </section>
          <section className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Responsabilidad del administrador</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">Administrar usuarios, reglas, seguridad y reportes para evaluar el funcionamiento global de AiDEN.</p>
          </section>
        </article>
        <article className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Prioridad</p>
          <h2 className="mt-2 text-lg font-semibold">Alertas que requieren decisión</h2>
          <section className="mt-4 space-y-2">
            {decisiones.slice(0, 5).map((d) => (
              <ItemOscuro key={d.id} tipo={d.tipo} texto={d.texto} detalle={d.detalle} to={d.to} />
            ))}
            {!decisiones.length && <p className="text-sm text-white/70">No hay alertas pendientes.</p>}
            {decisiones.length > 5 && <p className="pt-1 text-xs text-white/70">Y {plural(decisiones.length - 5, "asunto más", "asuntos más")} en el centro de supervisión.</p>}
          </section>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" titulo="Ingresos y gastos" descripcion="Últimos cuatro meses, según los movimientos registrados en Costos.">
          <div className="h-64" role="img" aria-label={`Ingresos y gastos por mes: ${meses.map((m) => `${m.mes}, ingresos ${dinero(m.ingresos)} y gastos ${dinero(m.gastos)}`).join("; ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meses} barGap={4} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colores.rejilla} className="aiden-chart-grid" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: colores.eje, fontSize: 12 }} className="aiden-chart-axis" />
                <YAxis tickLine={false} axisLine={false} width={78} tick={{ fill: colores.eje, fontSize: 12 }} tickFormatter={(v) => dineroCorto(v)} className="aiden-chart-axis" />
                <Tooltip
                  cursor={{ fill: colores.rejilla, opacity: 0.5 }}
                  wrapperClassName="aiden-tooltip"
                  contentStyle={{ background: colores.superficie, border: `1px solid ${colores.rejilla}`, borderRadius: 12, fontSize: 12, color: colores.tinta }}
                  itemStyle={{ color: colores.tinta }}
                  labelStyle={{ color: colores.tinta, fontWeight: 600 }}
                  formatter={(valor, nombre) => [dinero(valor), nombre]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill={colores.verdeClaro} radius={[6, 6, 0, 0]} maxBarSize={34} />
                <Bar dataKey="gastos" name="Gastos" fill={colores.verde} radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {mes.balance < 0 ? `Este mes los gastos superan los ingresos en ${dinero(-mes.balance)}. Los lotes en desarrollo todavía no se venden.` : `Este mes los ingresos superan los gastos en ${dinero(mes.balance)}.`}
          </p>
        </Panel>
        <Panel titulo="Rentabilidad por lote" descripcion="Costo por planta viva y resultado acumulado" cuerpo="px-5 pb-5">
          <ul className="divide-y divide-slate-100">
            {resumenes.map(({ lote, r }) => (
              <li key={lote.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <EtiquetaLote codigo={lote.lote} />
                  <span className="block truncate text-sm font-medium text-slate-800">{lote.cultivo}</span>
                  <span className="block text-[11px] text-slate-500">{dinero(r.costoPlanta)} por planta</span>
                </span>
                <span className={`shrink-0 text-sm font-bold ${r.resultado < 0 ? "text-red-600" : "text-emerald-700"}`}>{dinero(r.resultado)}</span>
              </li>
            ))}
            {!resumenes.length && <li className="py-8 text-center text-sm text-slate-500">No hay lotes activos.</li>}
          </ul>
          <EnlaceModulo to="/costos">Ver costos</EnlaceModulo>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <header>
            <h2 className="font-semibold text-slate-900">Distribución de acceso</h2>
            <p className="mt-1 text-xs text-slate-500">Usuarios por responsabilidad</p>
          </header>
          <section className="mt-5 space-y-3">
            {[
              ["Administrador", roles.admin, "bg-emerald-700"],
              ["Supervisor", roles.supervisor, "bg-sky-500"],
              ["Operario", roles.operario, "bg-amber-500"],
            ].map(([etiqueta, cuenta, barra]) => (
              <section key={etiqueta}>
                <section className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600">{etiqueta}</span>
                  <span className="font-semibold text-slate-800">{cuenta}</span>
                </section>
                <section className="h-2 rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${barra}`} style={{ width: `${Math.min(100, (cuenta / Math.max(1, usuarios.length)) * 100)}%` }} />
                </section>
              </section>
            ))}
          </section>
          {porRevisar.length > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
              {plural(porRevisar.length, "cuenta nueva espera", "cuentas nuevas esperan")} confirmación de rol en Personal.
            </p>
          )}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center gap-2">
            <ClipboardCheck size={17} className="text-emerald-700" aria-hidden="true" />
            <h2 className="font-semibold text-slate-900">Acciones rápidas</h2>
          </header>
          <section className="mt-4 grid gap-2">
            <AccionRapida to="/reportes">Abrir reportes</AccionRapida>
            <AccionRapida to="/personal?vista=accesos">Administrar accesos</AccionRapida>
            <AccionRapida to="/costos">Revisar costos</AccionRapida>
            <AccionRapida to="/configuracion">Revisar reglas</AccionRapida>
          </section>
        </article>
      </section>
    </article>
  );
}

import { useState } from "react";
import { BarChart3, CircleDollarSign, ClipboardList, Download, FileText, GitBranch, Leaf, Package, Printer, ShieldCheck, Sprout } from "lucide-react";
import { Boton } from "../ui/Boton";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import { Selector } from "../ui/Campo";
import { FILA_ENCABEZADO, TH } from "../ui/tabla";
import { Segmentos } from "../ui/Filtros";
import { useDatos } from "../../datos/almacen";
import { costosPorLote, diasAbierta, estadoIncidencia, evaluarLectura, nombrePersona, tareaVencida } from "../../datos/selectores";
import { useAccion } from "../../contexto/retroalimentacion";
import { useTitulo } from "../../hooks/useTitulo";
import { dinero, fechaCorta, fechaHora, fechaLarga, hoyISO, numero, plural, sumarDias } from "../../utilidades/formato";
import { descargarCSV } from "../../utilidades/exportar";

const PERIODOS = [
  { valor: "todo", etiqueta: "Todo" },
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "30", etiqueta: "30 días" },
  { valor: "90", etiqueta: "90 días" },
];

function enPeriodo(fecha, periodo) {
  const dia = String(fecha || "").slice(0, 10);
  if (periodo === "todo" || !dia) return true;
  if (periodo === "mes") return dia.slice(0, 7) === hoyISO().slice(0, 7);
  return dia >= sumarDias(hoyISO(), -Number(periodo));
}

const REPORTES = [
  {
    id: "produccion",
    icono: Sprout,
    titulo: "Producción por lote",
    descripcion: "Etapa, plantas vivas y supervivencia de cada lote.",
    periodo: "siembra",
    filas: (d, p) =>
      d.lotes
        .filter((l) => enPeriodo(l.fecha, p))
        .map((l) => ({
          Lote: l.lote,
          Cultivo: l.cultivo,
          Estado: l.estado === "Cerrado" ? `Cerrado (${l.motivoCierre || ""})` : l.etapa,
          Zona: l.ubicacion,
          Responsable: nombrePersona(d.personas, l.responsableId),
          Sembradas: l.cantidadInicial,
          Vivas: l.cantidad,
          "Supervivencia %": l.cantidadInicial ? Math.round((l.cantidad / l.cantidadInicial) * 1000) / 10 : "",
          Siembra: l.fecha,
          "Salida estimada": l.fechaEstimada || "",
        })),
    resumen: (f) => `${plural(f.length, "lote")} · ${numero(f.reduce((s, x) => s + Number(x.Vivas || 0), 0))} plantas vivas`,
  },
  {
    id: "rentabilidad",
    icono: BarChart3,
    titulo: "Rentabilidad por lote",
    descripcion: "Gastos, ingresos y costo por planta acumulados.",
    filas: (d) =>
      [...costosPorLote(d.costos)].map(([codigo, v]) => {
        const l = d.lotes.find((x) => x.lote === codigo);
        return {
          Lote: codigo,
          Cultivo: l?.cultivo || "",
          Estado: l?.estado === "Cerrado" ? "Cerrado" : l?.etapa || "",
          Gastos: v.gasto,
          Ingresos: v.ingreso,
          Resultado: v.resultado,
          "Costo por planta": l && Number(l.cantidad) ? Math.round(v.gasto / Number(l.cantidad)) : "",
        };
      }),
    moneda: ["Gastos", "Ingresos", "Resultado", "Costo por planta"],
    resumen: (f) => `Resultado total: ${dinero(f.reduce((s, x) => s + x.Resultado, 0))}`,
  },
  {
    id: "costos",
    icono: CircleDollarSign,
    titulo: "Gastos e ingresos",
    descripcion: "Cada movimiento con su categoría y lote.",
    periodo: "fecha",
    filas: (d, p) =>
      d.costos
        .filter((c) => enPeriodo(c.fecha, p))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((c) => ({ Fecha: c.fecha, Tipo: c.tipo === "ingreso" ? "Ingreso" : "Gasto", Concepto: c.concepto, Categoría: c.categoria, Lote: c.lote || "General", Valor: c.valor })),
    moneda: ["Valor"],
    resumen: (f) => {
      const ing = f.filter((x) => x.Tipo === "Ingreso").reduce((s, x) => s + x.Valor, 0);
      const gas = f.filter((x) => x.Tipo === "Gasto").reduce((s, x) => s + x.Valor, 0);
      return `Ingresos ${dinero(ing)} · Gastos ${dinero(gas)} · Balance ${dinero(ing - gas)}`;
    },
  },
  {
    id: "inventario",
    icono: Package,
    titulo: "Inventario",
    descripcion: "Existencias actuales, mínimo y valor.",
    filas: (d) =>
      d.inventario.map((i) => ({
        Código: i.id,
        Insumo: i.nombre,
        Categoría: i.categoria,
        Stock: i.stock,
        Unidad: i.unidad,
        Mínimo: i.minimo,
        "Precio unitario": i.precio,
        Valor: Number(i.stock) * Number(i.precio || 0),
        Estado: Number(i.stock) <= Number(i.minimo) ? "Bajo mínimo" : "Suficiente",
      })),
    moneda: ["Precio unitario", "Valor"],
    resumen: (f) => `Valor en bodega: ${dinero(f.reduce((s, x) => s + x.Valor, 0))} · ${plural(f.filter((x) => x.Estado === "Bajo mínimo").length, "insumo bajo mínimo", "insumos bajo mínimo")}`,
  },
  {
    id: "tareas",
    icono: ClipboardList,
    titulo: "Tareas del equipo",
    descripcion: "Asignaciones, estado y cumplimiento.",
    periodo: "fecha límite",
    filas: (d, p) =>
      d.tareas
        .filter((t) => enPeriodo(t.fecha, p))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((t) => ({
          Tarea: t.titulo,
          Responsable: nombrePersona(d.personas, t.responsableId),
          Área: t.modulo,
          Lote: t.lote || "",
          Prioridad: t.prioridad,
          "Fecha límite": t.fecha,
          Estado: tareaVencida(t) ? "Vencida" : t.estado,
          Completada: t.completada ? String(t.completada).slice(0, 10) : "",
          Nota: t.nota || "",
        })),
    resumen: (f) => `${plural(f.filter((x) => x.Estado === "Completada").length, "completada")} de ${f.length} · ${plural(f.filter((x) => x.Estado === "Vencida").length, "vencida")}`,
  },
  {
    id: "calidad",
    icono: ShieldCheck,
    titulo: "Incidencias de calidad",
    descripcion: "Reportes, acciones correctivas y tiempos de cierre.",
    periodo: "reporte",
    filas: (d, p) =>
      d.calidad
        .filter((i) => enPeriodo(i.fecha, p))
        .map((i) => ({
          Código: i.codigo,
          Lote: i.lote,
          Prioridad: i.prioridad,
          Estado: estadoIncidencia(i),
          Descripción: i.descripcion,
          Responsable: nombrePersona(d.personas, i.responsableId),
          Reporte: i.fecha,
          Cierre: i.cierre || "",
          Días: diasAbierta(i),
          Acción: i.accion || "",
        })),
    resumen: (f) => `${plural(f.filter((x) => x.Estado !== "Cerrada").length, "abierta")} de ${f.length}`,
  },
  {
    id: "trazabilidad",
    icono: GitBranch,
    titulo: "Trazabilidad",
    descripcion: "Todos los eventos registrados por lote.",
    periodo: "fecha",
    porLote: true,
    filas: (d, p, lote) =>
      d.trazabilidad
        .filter((e) => enPeriodo(e.fecha, p) && (!lote || e.lote === lote))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((e) => ({ Fecha: fechaHora(e.fecha), Lote: e.lote, Evento: e.evento, Detalle: e.detalle, Responsable: e.responsable, Origen: e.origen })),
    resumen: (f) => `${plural(f.length, "evento")} en ${plural(new Set(f.map((x) => x.Lote)).size, "lote")}`,
  },
  {
    id: "ambiental",
    icono: Leaf,
    titulo: "Lecturas ambientales",
    descripcion: "Temperatura y humedad por zona frente al rango.",
    periodo: "fecha",
    filas: (d, p) =>
      d.ambiental
        .filter((l) => enPeriodo(l.fecha, p))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((l) => ({
          Fecha: fechaHora(l.fecha),
          Zona: l.zona,
          "Temperatura °C": l.temperatura,
          "Humedad %": l.humedad,
          "Luz lx": l.iluminacion || "",
          Estado: evaluarLectura(l, d.configuracion).fuera ? "Fuera de rango" : "En rango",
          Registró: l.registradoPor,
        })),
    resumen: (f) => `${plural(f.filter((x) => x.Estado === "Fuera de rango").length, "lectura fuera de rango", "lecturas fuera de rango")} de ${f.length}`,
  },
];

const LIMITE_VISTA = 60;

export default function ReportesOperativo() {
  const datos = useDatos();
  const ejecutar = useAccion();
  const [id, setId] = useState("produccion");
  const [periodo, setPeriodo] = useState("todo");
  const [lote, setLote] = useState("");
  useTitulo("Reportes operativos");

  const reporte = REPORTES.find((r) => r.id === id);
  const filas = reporte.filas(datos, reporte.periodo ? periodo : "todo", lote);
  const columnas = filas[0] ? Object.keys(filas[0]) : [];
  const nombrePeriodo = PERIODOS.find((p) => p.valor === periodo).etiqueta.toLowerCase();

  const exportar = () =>
    ejecutar(() => descargarCSV(`aiden-${reporte.id}-${reporte.periodo ? periodo : "actual"}-${hoyISO()}`, filas), (n) => ({ titulo: "CSV descargado", detalle: `${reporte.titulo}: ${plural(n, "fila")}.` }));

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / sistema"
        titulo="Reportes operativos"
        descripcion="Consulta información consolidada de los módulos. Cada reporte se construye con los datos actuales de AiDEN y se exporta a CSV o se imprime."
        acciones={
          <>
            <Boton variante="secundario" icono={Printer} onClick={() => window.print()} disabled={!filas.length} className="!px-3">
              Imprimir
            </Boton>
            <Boton variante="secundario" icono={Download} onClick={exportar} disabled={!filas.length} className="!px-3 hover:border-emerald-200">
              Exportar CSV
            </Boton>
          </>
        }
      />

      <section className="no-imprimir grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Tipos de reporte">
        {REPORTES.map((r) => {
          const activo = r.id === id;
          const Icono = r.icono;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setId(r.id);
                setLote("");
              }}
              aria-pressed={activo}
              className={`rounded-2xl border p-4 text-left transition-colors ${activo ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-200"}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icono size={17} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-slate-900">{r.titulo}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{r.descripcion}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <FileText size={16} aria-hidden="true" />
          </span>
          <section className="min-w-0 flex-1">
            <p className="hidden text-xs text-slate-500 print:block">AiDEN · generado el {fechaLarga(new Date())}</p>
            <h2 className="font-semibold text-slate-900">{reporte.titulo}</h2>
            <p className="text-xs text-slate-500">
              {filas.length ? `${plural(filas.length, "registro disponible", "registros disponibles")} · ${reporte.resumen(filas)}` : "0 registros disponibles"}
              {reporte.periodo && periodo !== "todo" ? ` · por ${reporte.periodo}, ${nombrePeriodo}` : ""}
            </p>
          </section>
          {(reporte.periodo || reporte.porLote) && (
            <section className="no-imprimir flex flex-wrap items-center gap-2">
              {reporte.periodo && <Segmentos etiqueta={`Periodo por ${reporte.periodo}`} valor={periodo} onCambio={setPeriodo} opciones={PERIODOS} />}
              {reporte.porLote && (
                <Selector value={lote} onChange={(e) => setLote(e.target.value)} aria-label="Lote" className="!py-2">
                  <option value="">Todos los lotes</option>
                  {datos.lotes.map((l) => (
                    <option key={l.id} value={l.lote}>
                      {l.lote} · {l.cultivo}
                    </option>
                  ))}
                </Selector>
              )}
            </section>
          )}
        </header>
        <section className="overflow-x-auto" tabIndex={0}>
          {filas.length ? (
            <table className="w-full min-w-[760px]">
              <caption className="sr-only">{reporte.titulo}</caption>
              <thead>
                <tr className={FILA_ENCABEZADO}>
                  {columnas.map((c) => (
                    <th key={c} scope="col" className={TH}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, LIMITE_VISTA).map((fila, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {columnas.map((c) => {
                      const v = fila[c];
                      const esNumero = typeof v === "number";
                      const texto = reporte.moneda?.includes(c) && esNumero ? dinero(v) : esNumero ? numero(v) : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fechaCorta(v) : v;
                      return (
                        <td key={c} className={`px-4 py-3 text-sm text-slate-700 ${String(v).length > 60 ? "min-w-[260px]" : "whitespace-nowrap"}`}>
                          {texto === "" || texto === undefined ? "—" : texto}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <section className="px-6 py-14 text-center">
              <FileText className="mx-auto text-slate-300" size={28} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-slate-700">Todavía no hay datos para este reporte</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{reporte.periodo && periodo !== "todo" ? "Prueba con un periodo más amplio." : "Registra información en el módulo correspondiente y vuelve a consultar este reporte."}</p>
              {reporte.periodo && periodo !== "todo" && (
                <button type="button" onClick={() => setPeriodo("todo")} className="mt-3 text-xs font-semibold text-emerald-700 hover:underline">
                  Ver todo
                </button>
              )}
            </section>
          )}
        </section>
        {filas.length > LIMITE_VISTA && <p className="no-imprimir border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Mostrando {LIMITE_VISTA} de {filas.length} filas. El CSV incluye todas.</p>}
      </section>
    </section>
  );
}

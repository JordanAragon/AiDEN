import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Download, Filter, History, Plus, Sprout } from "lucide-react";
import { Boton } from "../ui/Boton";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import { Buscador } from "../ui/Filtros";
import LineaTiempo from "../lote/LineaTiempo";
import ModalEvento from "../formularios/ModalEvento";
import { useDatos } from "../../datos/almacen";
import { codigosVisibles, lotesVisibles, nombrePersona } from "../../datos/selectores";
import { useAccion } from "../../contexto/retroalimentacion";
import { useFichaLote } from "../../contexto/ficha";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { aFecha, coincide, fechaCorta, fechaHora, numero, plural } from "../../utilidades/formato";
import { descargarCSV } from "../../utilidades/exportar";

const ORIGENES = { Todos: "Todos", Producción: "Producción", Manual: "Campo", Calidad: "Calidad", Inventario: "Inventario", Personal: "Tareas" };
const SELECT = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500";

export default function TrazabilidadOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const ejecutar = useAccion();
  const { abrirLote } = useFichaLote();
  const [parametros, setParametros] = useSearchParams();
  const [kind, setKind] = useState("Todos");
  const [origen, setOrigen] = useState("Todos");
  const [consulta, setConsulta] = useState("");
  const [modal, setModal] = useState(false);
  useTitulo("Trazabilidad");

  const lotes = lotesVisibles(datos, sesion);
  const codigos = codigosVisibles(datos, sesion);
  const lot = codigos.has(parametros.get("lote")) ? parametros.get("lote") : "Todos";
  const lote = lotes.find((l) => l.lote === lot);
  const visibles = datos.trazabilidad.filter((e) => codigos.has(e.lote)).sort((a, b) => aFecha(b.fecha) - aFecha(a.fecha));
  const delLote = lot === "Todos" ? visibles : visibles.filter((e) => e.lote === lot);
  const types = [...new Set(delLote.map((r) => r.evento))].sort();
  const filtered = delLote.filter((e) => (kind === "Todos" || e.evento === kind) && (origen === "Todos" || e.origen === origen) && coincide(`${e.evento} ${e.detalle} ${e.responsable} ${e.lote}`, consulta));

  const elegirLote = (codigo) => {
    const siguiente = new URLSearchParams(parametros);
    if (codigo && codigo !== "Todos") siguiente.set("lote", codigo);
    else siguiente.delete("lote");
    setParametros(siguiente, { replace: true });
    setKind("Todos");
  };

  const exportar = () =>
    ejecutar(
      () => descargarCSV(`aiden-trazabilidad-${lot === "Todos" ? "todos" : lot}`, filtered.map((e) => ({ Fecha: fechaHora(e.fecha), Lote: e.lote, Evento: e.evento, Detalle: e.detalle, Responsable: e.responsable, Origen: e.origen }))),
      (n) => plural(n, "evento exportado", "eventos exportados"),
    );

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / seguimiento"
        titulo="Trazabilidad"
        descripcion="Reconstruye la línea de vida de un lote: qué ocurrió, cuándo y quién lo registró. Producción, calidad, inventario y tareas agregan eventos solos."
        acciones={
          <>
            <Boton variante="fantasma" icono={Download} onClick={exportar} disabled={!filtered.length}>
              Exportar
            </Boton>
            <Boton variante="primario" icono={Plus} onClick={() => setModal(true)}>
              Nuevo evento
            </Boton>
          </>
        }
      />

      <Cifras
        items={[
          { icono: History, etiqueta: "Eventos", valor: visibles.length, detalle: "Histórico disponible para tu rol" },
          { icono: Sprout, etiqueta: "Lotes trazados", valor: new Set(visibles.map((r) => r.lote)).size, detalle: "Con al menos un evento" },
          { icono: Filter, etiqueta: "Tipos de evento", valor: new Set(visibles.map((r) => r.evento)).size, detalle: "En los registros visibles" },
          { icono: CalendarDays, etiqueta: "Último registro", valor: visibles[0] ? fechaCorta(visibles[0].fecha) : "—", detalle: visibles[0] ? `${visibles[0].evento} · ${visibles[0].lote}` : "Sin registros", tono: "info" },
        ]}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <section>
            <h2 className="font-semibold text-slate-900">Filtros</h2>
            <p className="text-xs text-slate-500">Consulta toda la historia disponible o la de un lote.</p>
          </section>
          <span className="text-xs text-slate-500">{plural(filtered.length, "evento")}</span>
        </header>
        <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-medium text-slate-600">
            Lote
            <select value={lot} onChange={(e) => elegirLote(e.target.value)} className={SELECT}>
              <option value="Todos">Todos</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.lote}>
                  {l.lote} · {l.cultivo}
                  {l.estado === "Cerrado" ? " (cerrado)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600">
            Tipo de evento
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={SELECT}>
              <option value="Todos">Todos</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600">
            Origen
            <select value={origen} onChange={(e) => setOrigen(e.target.value)} className={SELECT}>
              {Object.entries(ORIGENES).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </label>
          <div className="block text-sm font-medium text-slate-600">
            <span>Buscar</span>
            <Buscador valor={consulta} onCambio={setConsulta} etiqueta="Buscar en los eventos" placeholder="Detalle o responsable" className="mt-1" />
          </div>
        </section>
        {lote && (
          <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{lote.cultivo}</span> · {lote.estado === "Cerrado" ? "Cerrado" : lote.etapa} · {lote.ubicacion} · {numero(lote.cantidad)} plantas · {nombrePersona(datos.personas, lote.responsableId)}
            </span>
            <button type="button" onClick={() => abrirLote(lote.lote)} className="text-xs font-semibold text-emerald-700 hover:underline">
              Abrir ficha del lote
            </button>
          </section>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="mb-6">
          <h2 className="font-semibold text-slate-900">Línea de vida del lote</h2>
        </header>
        {filtered.length ? (
          <LineaTiempo eventos={filtered} mostrarLote={lot === "Todos"} />
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">
            <p>{delLote.length ? "Ningún evento coincide con los filtros." : "Todavía no hay eventos para este lote."}</p>
            {delLote.length ? (
              <button
                type="button"
                onClick={() => {
                  setKind("Todos");
                  setOrigen("Todos");
                  setConsulta("");
                }}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
              >
                Limpiar filtros
              </button>
            ) : (
              <button type="button" onClick={() => setModal(true)} className="mt-2 text-xs font-semibold text-emerald-700 hover:underline">
                Registrar el primer evento
              </button>
            )}
          </div>
        )}
      </section>

      <ModalEvento abierto={modal} onCerrar={() => setModal(false)} inicial={{ lote: lot === "Todos" ? "" : lot }} />
    </section>
  );
}

import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, FilePenLine, ListChecks, Plus, Sprout } from "lucide-react";
import { Boton } from "../ui/Boton";
import { Selector } from "../ui/Campo";
import Cifras from "../ui/Cifras";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import { Buscador, Segmentos } from "../ui/Filtros";
import EtiquetaLote from "../lote/EtiquetaLote";
import PasosEtapa from "../lote/PasosEtapa";
import ModalLote from "../formularios/ModalLote";
import { useDatos } from "../../datos/almacen";
import { ETAPAS } from "../../datos/catalogos";
import { esGestor, lotesActivos, lotesVisibles, nombrePersona } from "../../datos/selectores";
import { useFichaLote } from "../../contexto/ficha";
import { useAvanzarEtapa } from "../../hooks/useAvanzarEtapa";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { coincide, diasEntre, fechaCorta, hoyISO, numero, plural } from "../../utilidades/formato";

function Salida({ lote }) {
  if (lote.estado === "Cerrado") return <span>{`${lote.motivoCierre || "Cerrado"} ${fechaCorta(lote.cierre)}`}</span>;
  if (!lote.fechaEstimada) return <span>Sin salida estimada</span>;
  const dias = diasEntre(hoyISO(), lote.fechaEstimada);
  return <span className={dias < 0 ? "font-semibold text-red-600" : ""}>Salida {fechaCorta(lote.fechaEstimada)} · {dias < 0 ? `atrasada ${-dias} d` : dias === 0 ? "hoy" : `en ${dias} d`}</span>;
}

export default function ProduccionOperativo() {
  const datos = useDatos();
  const sesion = useSesion();
  const { abrirLote } = useFichaLote();
  const avanzar = useAvanzarEtapa();
  const canManage = esGestor(sesion);
  const isOperator = !canManage;
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("Todas");
  const [zona, setZona] = useState("Todas");
  const [modal, setModal] = useState(null);
  useTitulo("Producción");

  const visibles = lotesVisibles(datos, sesion);
  const activos = lotesActivos(visibles);
  const cerrados = visibles.length - activos.length;
  const filtrados = visibles.filter((l) => {
    const porEtapa = stage === "Todas" ? l.estado !== "Cerrado" : stage === "Cerrados" ? l.estado === "Cerrado" : l.estado !== "Cerrado" && l.etapa === stage;
    const texto = `${l.lote} ${l.cultivo} ${nombrePersona(datos.personas, l.responsableId)} ${l.ubicacion}`;
    return porEtapa && (zona === "Todas" || l.ubicacion === zona) && coincide(texto, query);
  });
  const tareasLotes = datos.tareas.filter((t) => t.estado !== "Completada" && activos.some((l) => l.lote === t.lote)).length;
  const plantas = activos.reduce((a, l) => a + Number(l.cantidad || 0), 0);
  const sembradas = activos.reduce((a, l) => a + Number(l.cantidadInicial || l.cantidad || 0), 0);
  const atrasados = activos.filter((l) => l.fechaEstimada && diasEntre(hoyISO(), l.fechaEstimada) < 0).length;

  return (
    <section className="space-y-6">
      <EncabezadoPagina
        rotulo="AiDEN / operación"
        titulo="Producción"
        descripcion={isOperator ? "Consulta tus lotes asignados y ejecuta el seguimiento de campo." : "Gestiona lotes, etapas, responsables y seguimiento de la producción."}
        acciones={
          canManage && (
            <Boton variante="primario" icono={Plus} onClick={() => setModal({ tipo: "nuevo" })}>
              Nuevo lote
            </Boton>
          )
        }
      />

      <Cifras
        items={[
          { icono: Sprout, etiqueta: isOperator ? "Mis lotes" : "Lotes activos", valor: activos.length, detalle: `${activos.filter((l) => l.etapa === "Cosecha").length} en cosecha${cerrados ? ` · ${cerrados} cerrados` : ""}` },
          { icono: CheckCircle2, etiqueta: "Plantas", valor: numero(plantas), detalle: sembradas ? `${numero(Math.round((plantas / sembradas) * 1000) / 10)} % de supervivencia` : "En producción" },
          { icono: ListChecks, etiqueta: "Tareas", valor: tareasLotes, detalle: isOperator ? "Abiertas en tus lotes" : "Abiertas en lotes activos", tono: "info", to: canManage ? "/personal?vista=tareas" : "/dashboard-operario" },
          { icono: Clock3, etiqueta: "Por avanzar", valor: activos.filter((l) => l.etapa !== "Cosecha").length, detalle: atrasados ? `${plural(atrasados, "lote atrasado", "lotes atrasados")} en su salida` : "Con siguiente etapa", tono: atrasados ? "critico" : "alerta" },
        ]}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <section>
            <h2 className="font-semibold text-slate-900">Etapa de cada lote</h2>
            <p className="text-xs text-slate-500">
              {canManage ? "Avanza el ciclo desde aquí y registra automáticamente la trazabilidad." : "Consulta el estado del lote. Los cambios de etapa los realiza supervisión."}
            </p>
          </section>
          <Segmentos
            etiqueta="Filtrar por etapa"
            valor={stage}
            onCambio={setStage}
            opciones={[
              { valor: "Todas", etiqueta: "Todas" },
              ...ETAPAS.map((e) => ({ valor: e, etiqueta: e })),
              ...(cerrados ? [{ valor: "Cerrados", etiqueta: "Cerrados" }] : []),
            ]}
          />
        </header>
        <section className="mt-5 space-y-3">
          {filtrados.map((l) => {
            const cerrado = l.estado === "Cerrado";
            return (
              <article key={l.id} className="rounded-2xl border border-slate-200 p-4">
                <section className="flex flex-wrap items-center gap-4">
                  <section className="min-w-48 flex-1">
                    <EtiquetaLote codigo={l.lote} />
                    <h3 className="mt-1 font-semibold text-slate-900">{l.cultivo}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {nombrePersona(datos.personas, l.responsableId)} · {l.ubicacion}
                    </p>
                  </section>
                  <section className="w-full sm:w-52">
                    <PasosEtapa etapa={l.etapa} compacto cerrado={cerrado} />
                    <p className="mt-1 text-[11px] text-slate-500">
                      <Salida lote={l} />
                    </p>
                  </section>
                  <section className="text-right">
                    <p className="text-sm font-bold text-slate-800">{numero(l.cantidad)}</p>
                    <p className="text-[11px] text-slate-500">de {numero(l.cantidadInicial)} plantas</p>
                  </section>
                  <section className="flex gap-1">
                    <button type="button" onClick={() => abrirLote(l.lote)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-700" title="Ver lote" aria-label={`Ver lote ${l.lote}`}>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                    {canManage && !cerrado && (
                      <button type="button" onClick={() => setModal({ tipo: "editar", lote: l })} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-700" title="Editar lote" aria-label={`Editar lote ${l.lote}`}>
                        <FilePenLine size={16} aria-hidden="true" />
                      </button>
                    )}
                    {canManage && !cerrado && l.etapa !== "Cosecha" && (
                      <button type="button" onClick={() => avanzar(l)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Avanzar <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    )}
                  </section>
                </section>
              </article>
            );
          })}
          {!filtrados.length && (
            <div className="py-10 text-center text-sm text-slate-500">
              {visibles.length ? (
                <>
                  <p>No hay lotes que coincidan con el filtro.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStage("Todas");
                      setZona("Todas");
                    }}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </>
              ) : isOperator ? (
                "No tienes lotes asignados actualmente."
              ) : (
                "Todavía no hay lotes. Crea el primero con “Nuevo lote”."
              )}
            </div>
          )}
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Buscador valor={query} onCambio={setQuery} etiqueta="Buscar lotes" placeholder="Buscar lote, cultivo, responsable o ubicación..." className="flex-1" />
          <Selector value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Filtrar por zona" className="sm:w-52">
            <option value="Todas">Todas las zonas</option>
            {datos.zonas.map((z) => (
              <option key={z.id}>{z.nombre}</option>
            ))}
          </Selector>
          <span className="text-xs text-slate-500">{plural(filtrados.length, "resultado")}</span>
        </header>
      </section>

      <ModalLote abierto={modal?.tipo === "nuevo"} onCerrar={() => setModal(null)} />
      <ModalLote abierto={modal?.tipo === "editar"} onCerrar={() => setModal(null)} lote={modal?.lote} />
    </section>
  );
}

import { ETAPAS, indiceEtapa } from "../../datos/catalogos";
import { fechaCorta } from "../../utilidades/formato";

export default function PasosEtapa({ etapa, fechas = {}, compacto = false, cerrado = false, mostrarEtiqueta = true }) {
  const actual = indiceEtapa(etapa);
  const pct = Math.round(((actual + 1) / ETAPAS.length) * 100);
  if (compacto) {
    return (
      <section aria-label={`Etapa ${actual + 1} de ${ETAPAS.length}: ${etapa}`}>
        {mostrarEtiqueta && (
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-slate-500">{cerrado ? "Cerrado" : etapa}</span>
            <span className="font-semibold text-slate-700">{pct}%</span>
          </div>
        )}
        <section className="h-2 rounded-full bg-slate-100">
          <span className={`block h-full rounded-full ${cerrado ? "bg-slate-400" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
        </section>
      </section>
    );
  }
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Etapas del lote">
      {ETAPAS.map((nombre, i) => {
        const alcanzada = i <= actual;
        return (
          <li key={nombre} aria-current={i === actual && !cerrado ? "step" : undefined} className={`rounded-xl border p-3 ${alcanzada ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
            <p className="text-[10px] font-bold text-slate-500">{i + 1}</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">{nombre}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{fechas[nombre] ? fechaCorta(fechas[nombre]) : i === actual && !cerrado ? "En curso" : "—"}</p>
          </li>
        );
      })}
    </ol>
  );
}

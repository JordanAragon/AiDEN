import { Check } from "lucide-react";
import { ETAPAS, indiceEtapa } from "../../datos/catalogos";
import { diasEntre, fechaCorta, hoyISO } from "../../utilidades/formato";

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
        <section className="grid grid-cols-4 gap-1" aria-hidden="true">
          {ETAPAS.map((nombre, i) => (
            <span key={nombre} className={`h-1.5 rounded-full ${cerrado ? "bg-slate-300" : i < actual ? "bg-aiden-moss" : i === actual ? "bg-aiden-forest" : "bg-slate-200"}`} />
          ))}
        </section>
      </section>
    );
  }
  // Pista de cuatro tramos: lo hecho en moss, la etapa en curso en bosque con sus días.
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Etapas del lote">
      {ETAPAS.map((nombre, i) => {
        const hecha = i < actual || (cerrado && i <= actual);
        const enCurso = i === actual && !cerrado;
        const dias = enCurso && fechas[nombre] ? diasEntre(fechas[nombre], hoyISO()) + 1 : null;
        return (
          <li key={nombre} aria-current={enCurso ? "step" : undefined} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${hecha ? "bg-aiden-moss" : enCurso ? "bg-aiden-forest" : "bg-slate-200"}`} aria-hidden="true" />
            <p className={`mt-2 flex items-center gap-1 truncate text-[11px] font-semibold sm:text-xs ${enCurso ? "text-slate-950" : hecha ? "text-slate-700" : "text-slate-500"}`}>
              {hecha && <Check size={12} className="shrink-0 text-aiden-moss" aria-hidden="true" />}
              {nombre}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500 tabular-nums">
              {enCurso ? (dias ? `Día ${dias}` : "En curso") : fechas[nombre] ? fechaCorta(fechas[nombre]) : "—"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

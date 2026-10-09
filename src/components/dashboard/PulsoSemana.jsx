import { pulsoDeLaSemana } from "../../datos/selectores";

export default function PulsoSemana({ datos }) {
  const semana = pulsoDeLaSemana(datos);
  const maximo = Math.max(1, ...semana.map((d) => d.registros));
  const total = semana.reduce((s, d) => s + d.registros, 0);
  const completadas = semana.reduce((s, d) => s + d.completadas, 0);
  return (
    <section className="rounded-xl border border-slate-200 p-4" aria-labelledby="pulso-titulo">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="pulso-titulo" className="text-sm font-semibold text-slate-900">
          Pulso de la semana
        </h3>
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-800 tabular-nums">{total}</span> registros · <span className="font-semibold text-slate-800 tabular-nums">{completadas}</span> tareas completadas
        </p>
      </header>
      <div className="mt-4 grid h-28 grid-cols-7 items-end gap-2" aria-hidden="true">
        {semana.map((d, i) => (
          <div key={d.dia} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{d.registros || ""}</span>
            <span
              className={`w-full max-w-9 rounded-t-md ${i === semana.length - 1 ? "bg-aiden-moss" : "bg-verde-100"}`}
              style={{ height: `${Math.max(4, (d.registros / maximo) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-2 text-center text-[11px] text-slate-500" aria-hidden="true">
        {semana.map((d, i) => (
          <span key={d.dia} className={i === semana.length - 1 ? "font-semibold text-slate-800" : ""}>
            {i === semana.length - 1 ? "hoy" : d.etiqueta}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Registros de actividad por día, últimos 7 días</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Registros</th>
            <th>Tareas completadas</th>
          </tr>
        </thead>
        <tbody>
          {semana.map((d) => (
            <tr key={d.dia}>
              <td>{d.dia}</td>
              <td>{d.registros}</td>
              <td>{d.completadas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

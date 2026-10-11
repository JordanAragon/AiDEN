export default function Panel({ titulo, descripcion, accion, icono: Icono, children, className = "", cuerpo = "px-5 pb-5", oscuro = false, as: Etiqueta = "section", id }) {
  if (oscuro) {
    return (
      <Etiqueta id={id} className={`aiden-panel aiden-panel-dark min-w-0 rounded-2xl bg-aiden-forest-deep p-5 text-white ${className}`}>
        {(titulo || accion) && (
          <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              {titulo && <h2 className="text-lg font-semibold text-white">{titulo}</h2>}
              {descripcion && <p className="mt-1 text-sm text-slate-300">{descripcion}</p>}
            </div>
            {accion}
          </header>
        )}
        {children}
      </Etiqueta>
    );
  }
  const borde = cuerpo === "" || cuerpo.includes("p-0") || cuerpo.includes("overflow-x-auto");
  return (
    <Etiqueta id={id} className={`aiden-panel min-w-0 rounded-2xl border border-slate-200 bg-white ${className}`}>
      {(titulo || accion) && (
        <header className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-5 ${borde ? "border-b border-slate-100 pb-4" : "pb-4"}`}>
          <div className="flex min-w-0 items-start gap-2">
            {Icono && <Icono size={17} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />}
            <div className="min-w-0">
              {titulo && <h2 className="font-semibold text-slate-900">{titulo}</h2>}
              {descripcion && <p className="text-xs text-slate-500">{descripcion}</p>}
            </div>
          </div>
          {accion && <div className="flex shrink-0 flex-wrap items-center gap-2">{accion}</div>}
        </header>
      )}
      <div className={cuerpo || undefined} tabIndex={cuerpo.includes("overflow-x-auto") ? 0 : undefined}>
        {children}
      </div>
    </Etiqueta>
  );
}

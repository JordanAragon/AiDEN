export default function EncabezadoPagina({ rotulo, titulo, descripcion, acciones, icono: Icono, children }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <section className={`min-w-0 ${Icono ? "flex items-start gap-3" : ""}`}>
        {Icono && (
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Icono size={19} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          {rotulo && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">{rotulo}</p>}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{titulo}</h1>
          {descripcion && <p className="mt-1 max-w-2xl text-sm text-slate-500">{descripcion}</p>}
          {children}
        </div>
      </section>
      {acciones && <section className="no-imprimir flex flex-wrap items-center gap-2">{acciones}</section>}
    </header>
  );
}

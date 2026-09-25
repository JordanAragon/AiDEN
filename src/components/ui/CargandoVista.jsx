export default function CargandoVista() {
  return (
    <section role="status" aria-label="Cargando la vista" className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      <span className="sr-only">Cargando…</span>
    </section>
  );
}

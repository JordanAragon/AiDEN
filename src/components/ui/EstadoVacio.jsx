export default function EstadoVacio({ icono: Icono, titulo, texto, children, compacto = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compacto ? "px-4 py-8" : "px-6 py-10"}`}>
      {Icono && <Icono size={22} className="mb-3 text-slate-400" aria-hidden="true" />}
      <p className={Icono ? "text-sm font-semibold text-slate-700" : "text-sm text-slate-500"}>{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-slate-500">{texto}</p>}
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

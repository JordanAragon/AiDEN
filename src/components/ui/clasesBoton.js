export const VARIANTES = {
  primario: "bg-emerald-700 text-white hover:bg-emerald-800",
  secundario: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  contorno: "border border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
  suave: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  fantasma: "text-slate-500 hover:bg-slate-100 hover:text-emerald-700",
  peligro: "bg-red-600 text-white hover:bg-red-700",
  claro: "bg-white text-slate-900 hover:bg-slate-100",
};

export const TAMANOS = {
  sm: "gap-1.5 rounded-lg px-3 py-2 text-xs",
  md: "gap-2 rounded-xl px-4 py-2.5 text-sm",
  lg: "gap-2 rounded-xl px-5 py-3.5 text-sm",
};

export function clasesBoton({ variante = "secundario", tamano = "md", ancho = false, className = "" } = {}) {
  return [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-45",
    VARIANTES[variante],
    TAMANOS[tamano],
    ancho ? "w-full" : "",
    className,
  ].join(" ");
}

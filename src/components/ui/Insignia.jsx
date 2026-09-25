const TONOS = {
  neutral: "bg-slate-100 text-slate-500",
  exito: "bg-emerald-50 text-emerald-700",
  alerta: "bg-amber-50 text-amber-700",
  critico: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-700",
};

export default function Insignia({ tono = "neutral", children, className = "" }) {
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${TONOS[tono] || TONOS.neutral} ${className}`}>{children}</span>;
}

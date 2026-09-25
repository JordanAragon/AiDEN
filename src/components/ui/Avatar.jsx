export default function Avatar({ nombre = "", tamano = "md", className = "" }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  const lado = tamano === "sm" ? "h-7 w-7 text-[10px]" : tamano === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-700 ${lado} ${className}`}>
      {iniciales || "?"}
    </span>
  );
}

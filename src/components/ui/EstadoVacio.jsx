import { CircleSlash, Lock, SearchX, Sprout, TriangleAlert } from "lucide-react";

/*
  Estados vacíos con intención: primer uso (enseña qué va aquí), sin resultados
  (dice qué no coincidió y cómo salir), sin acceso y error. Una sola acción
  principal, escrita como verbo y sustantivo.
*/
const VARIANTES = {
  inicio: { icono: Sprout, clase: "is-inicio" },
  busqueda: { icono: SearchX, clase: "is-busqueda" },
  acceso: { icono: Lock, clase: "is-acceso" },
  error: { icono: TriangleAlert, clase: "is-error" },
  neutro: { icono: CircleSlash, clase: "" },
};

export default function EstadoVacio({ icono, titulo, texto, children, compacto = false, variante }) {
  const definicion = variante ? VARIANTES[variante] || VARIANTES.neutro : null;
  const Icono = icono || definicion?.icono;
  return (
    <div className={`aiden-vacio flex flex-col items-center text-center ${definicion?.clase || ""} ${compacto ? "px-4 py-8" : "px-6 py-10"}`} aria-live={variante === "busqueda" ? "polite" : undefined}>
      {Icono && (
        <span className={variante ? "aiden-vacio-icono" : "mb-3"}>
          <Icono size={variante ? 20 : 22} className={variante ? "" : "text-slate-400"} aria-hidden="true" />
        </span>
      )}
      <p className={Icono ? "text-sm font-semibold text-slate-700" : "text-sm text-slate-500"}>{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-slate-500">{texto}</p>}
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

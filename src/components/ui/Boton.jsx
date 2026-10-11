import { Check, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { VARIANTES, clasesBoton } from "./clasesBoton";

/*
  El botón de la app. Con `estado` cuenta lo que pasó sin cambiar de lugar:
  «cargando» gira, «listo» dibuja un check y «error» marca una equis. El texto
  se queda (el ancho no salta). El resultado lo anuncian los avisos.
*/
export function Boton({ variante, tamano, ancho, icono: Icono, cargando = false, estado, children, className, type = "button", disabled, ...props }) {
  const actual = cargando ? "cargando" : estado;
  return (
    <button
      type={type}
      disabled={disabled || actual === "cargando"}
      aria-busy={actual === "cargando" || undefined}
      data-estado={actual || undefined}
      className={clasesBoton({ variante, tamano, ancho, className: `aiden-boton-estado ${className || ""}` })}
      {...props}
    >
      {actual === "cargando" ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : actual === "listo" ? (
        <Check size={15} className="aiden-boton-check" aria-hidden="true" />
      ) : actual === "error" ? (
        <X size={15} aria-hidden="true" />
      ) : (
        Icono && <Icono size={15} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function BotonEnlace({ variante, tamano, ancho, icono: Icono, children, className, ...props }) {
  return (
    <Link className={clasesBoton({ variante, tamano, ancho, className })} {...props}>
      {Icono && <Icono size={15} aria-hidden="true" />}
      {children}
    </Link>
  );
}

export function BotonIcono({ icono: Icono, etiqueta, variante = "fantasma", tamano = "md", className = "", ...props }) {
  const lado = tamano === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors ${lado} ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      <Icono size={tamano === "sm" ? 15 : 16} aria-hidden="true" />
    </button>
  );
}

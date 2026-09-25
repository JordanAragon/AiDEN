import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { VARIANTES, clasesBoton } from "./clasesBoton";

export function Boton({ variante, tamano, ancho, icono: Icono, cargando = false, children, className, type = "button", disabled, ...props }) {
  return (
    <button type={type} disabled={disabled || cargando} className={clasesBoton({ variante, tamano, ancho, className })} {...props}>
      {cargando ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : Icono && <Icono size={15} aria-hidden="true" />}
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

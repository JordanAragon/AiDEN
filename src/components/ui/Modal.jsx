import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const pila = [];
const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const ANCHOS = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };

export default function Modal({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = "md", variante = "centro", encabezado }) {
  const idTitulo = useId();
  const dialogo = useRef(null);
  const cerrar = useRef(onCerrar);

  useEffect(() => {
    cerrar.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    if (!abierto) return undefined;
    const token = Symbol("modal");
    pila.push(token);
    const previo = document.activeElement;
    const primero = dialogo.current?.querySelector("[data-autofocus]") || dialogo.current?.querySelector(ENFOCABLES);
    (primero || dialogo.current)?.focus({ preventScroll: true });

    const alTeclear = (evento) => {
      if (pila[pila.length - 1] !== token) return;
      if (evento.key === "Escape") {
        evento.stopPropagation();
        cerrar.current?.();
        return;
      }
      if (evento.key !== "Tab" || !dialogo.current) return;
      const elementos = [...dialogo.current.querySelectorAll(ENFOCABLES)].filter((el) => el.offsetParent !== null);
      if (!elementos.length) return;
      const inicio = elementos[0];
      const fin = elementos[elementos.length - 1];
      if (evento.shiftKey && document.activeElement === inicio) {
        evento.preventDefault();
        fin.focus();
      } else if (!evento.shiftKey && document.activeElement === fin) {
        evento.preventDefault();
        inicio.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      const indice = pila.indexOf(token);
      if (indice >= 0) pila.splice(indice, 1);
      if (previo && typeof previo.focus === "function" && document.contains(previo)) previo.focus({ preventScroll: true });
    };
  }, [abierto]);

  if (!abierto) return null;
  const anchoFinal = variante === "panel" ? "max-w-3xl" : ANCHOS[ancho];

  return createPortal(
    <section className="aiden-modal-fondo fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && cerrar.current?.()}>
      <article
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`aiden-modal-entrada flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none ${anchoFinal}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="min-w-0">
            {encabezado}
            <h2 id={idTitulo} className="font-semibold text-slate-900">
              {titulo}
            </h2>
            {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
          </div>
          <button type="button" onClick={() => cerrar.current?.()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {pie && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">{pie}</footer>}
      </article>
    </section>,
    document.body,
  );
}

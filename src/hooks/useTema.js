import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

/*
  El tema de la app (claro u oscuro) como un almacén compartido: la barra
  lateral, la paleta ⌘K y el atajo de teclado lo cambian igual. El cambio se
  revela en círculo desde el control que lo pidió (View Transitions); sin
  soporte o con movimiento reducido, cambia al instante.
*/

const CLAVE = "aiden-theme";
const oyentes = new Set();

function leer() {
  try {
    return window.localStorage.getItem(CLAVE) === "dark";
  } catch {
    return false;
  }
}

let oscuro = typeof window === "undefined" ? false : leer();

function avisar() {
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function aplicar(valor) {
  oscuro = valor;
  document.documentElement.classList.toggle("aiden-dark", valor);
  try {
    window.localStorage.setItem(CLAVE, valor ? "dark" : "light");
  } catch {
    // La preferencia es opcional: el tema cambia aunque no se pueda guardar.
  }
  flushSync(avisar);
}

export function fijarTema(valor, origen) {
  if (valor === oscuro) return;
  const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reducido) {
    aplicar(valor);
    return;
  }
  const x = origen?.x ?? window.innerWidth / 2;
  const y = origen?.y ?? window.innerHeight / 2;
  const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const raiz = document.documentElement;
  raiz.classList.add("aiden-cambio-tema");
  const transicion = document.startViewTransition(() => aplicar(valor));
  transicion.ready
    .then(() => {
      raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(0.2, 0, 0, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
  transicion.finished.finally(() => raiz.classList.remove("aiden-cambio-tema"));
}

export function alternarTema(origen) {
  fijarTema(!oscuro, origen);
}

/* Centro de un elemento en la ventana: el origen del revelado. */
export function centroDe(elemento) {
  if (!elemento?.getBoundingClientRect) return undefined;
  const caja = elemento.getBoundingClientRect();
  return { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
}

export function useTema() {
  return useSyncExternalStore(suscribir, () => oscuro, () => false);
}

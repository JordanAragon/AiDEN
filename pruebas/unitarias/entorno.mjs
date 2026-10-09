// Navegador mínimo para la capa de datos: almacenamiento en memoria y eventos de ventana.
process.env.TZ = "America/Bogota";

class Almacenamiento {
  #mapa = new Map();
  getItem(clave) {
    return this.#mapa.has(clave) ? this.#mapa.get(clave) : null;
  }
  setItem(clave, valor) {
    this.#mapa.set(clave, String(valor));
  }
  removeItem(clave) {
    this.#mapa.delete(clave);
  }
  clear() {
    this.#mapa.clear();
  }
  key(indice) {
    return [...this.#mapa.keys()][indice] ?? null;
  }
  get length() {
    return this.#mapa.size;
  }
}

const eventos = new EventTarget();
globalThis.localStorage = new Almacenamiento();
globalThis.sessionStorage = new Almacenamiento();
globalThis.window = {
  localStorage: globalThis.localStorage,
  sessionStorage: globalThis.sessionStorage,
  addEventListener: eventos.addEventListener.bind(eventos),
  removeEventListener: eventos.removeEventListener.bind(eventos),
  dispatchEvent: eventos.dispatchEvent.bind(eventos),
  setTimeout,
};

const { inicializarDatos } = await import("../../src/datos/almacen.js");
const { asegurarPersonasDeUsuarios } = await import("../../src/datos/acciones.js");
const { ensureInitialUser } = await import("../../src/utilidades/autenticacion.js");

// Deja los datos de ejemplo recién generados, como en un navegador nuevo.
export function reiniciar() {
  localStorage.clear();
  sessionStorage.clear();
  ensureInitialUser();
  inicializarDatos({ forzar: true });
  asegurarPersonasDeUsuarios();
}

export const ADMIN = { id: "usr-admin", name: "Jordan Aragon", email: "jordanaragon@aiden.com", role: "admin", personaId: "PER-001" };
export const SUPERVISOR = { id: "usr-supervisor", name: "Laura Méndez", email: "supervisor@aiden.com", role: "supervisor", personaId: "PER-002" };
export const OPERARIO = { id: "usr-operario", name: "Andrés Rojas", email: "operario@aiden.com", role: "operario", personaId: "PER-003" };

import { useSyncExternalStore } from "react";
import { generarSemilla } from "./semilla";
import { CONFIG_INICIAL } from "./catalogos";

/*
  Almacén local de AiDEN. No hay backend: cada colección vive en localStorage y
  este módulo es la única puerta de lectura y escritura. Los componentes se
  suscriben con useDatos() y se vuelven a pintar cuando algo cambia, sin
  remontar la vista ni perder el estado de formularios o filtros.
*/

export const COLECCIONES = {
  personas: "aiden-personal",
  zonas: "aiden-zonas",
  lotes: "aiden-produccion",
  tareas: "aiden-tareas",
  inventario: "aiden-inventario",
  movimientos: "aiden-movimientos-inventario",
  costos: "aiden-costos",
  calidad: "aiden-calidad",
  ambiental: "aiden-ambiental",
  trazabilidad: "aiden-trazabilidad",
  configuracion: "aiden-configuracion",
};

const CLAVE_VERSION = "aiden-datos-version";
const VERSION_DATOS = "2026.2";
export const CLAVE_NOTIFICACIONES = "aiden-notificaciones-leidas";
export const CLAVE_RESPALDO_AUTOMATICO = "aiden-respaldo-automatico";
const TAMANO_MAXIMO_RESPALDO = 5_000_000;

/*
  Cambios de estructura: cada entrada transforma los datos de esa versión a la
  siguiente. Nunca se vuelve a sembrar sobre datos existentes; antes de migrar
  se guarda una copia en CLAVE_RESPALDO_AUTOMATICO.
  Ejemplo: "2026.2": (datos) => ({ ...datos, lotes: datos.lotes.map(...) }),
*/
const MIGRACIONES = {};
const ORDEN_VERSIONES = ["2026.2"];

const oyentes = new Set();
let instantanea = null;

function esObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function leerClave(clave, respaldo) {
  let crudo = null;
  try {
    crudo = localStorage.getItem(clave);
    if (crudo === null || crudo === "") return respaldo;
    return JSON.parse(crudo) ?? respaldo;
  } catch (error) {
    conservarCorrupto(clave, crudo, error);
    return respaldo;
  }
}

// Una clave ilegible se copia aparte antes de seguir: la próxima escritura de esa
// colección ya no puede destruir lo único que quedaba de ella.
function conservarCorrupto(clave, crudo, error) {
  console.error(`Los datos de ${clave} no se pudieron leer; se guardó una copia en ${clave}:corrupto`, error);
  if (crudo === null) return;
  try {
    if (localStorage.getItem(`${clave}:corrupto`) === null) localStorage.setItem(`${clave}:corrupto`, crudo);
  } catch {
    // Sin espacio para la copia: se mantiene el aviso en consola.
  }
}

function construirInstantanea() {
  const datos = {};
  for (const [nombre, clave] of Object.entries(COLECCIONES)) {
    const respaldo = nombre === "configuracion" ? CONFIG_INICIAL : [];
    const valor = leerClave(clave, respaldo);
    if (nombre === "configuracion") {
      datos[nombre] = { ...CONFIG_INICIAL, ...(esObjeto(valor) ? valor : {}) };
    } else if (Array.isArray(valor)) {
      datos[nombre] = valor.filter(esObjeto);
    } else {
      if (valor !== respaldo) conservarCorrupto(clave, localStorage.getItem(clave), new TypeError("no es una lista"));
      datos[nombre] = [];
    }
  }
  return datos;
}

function migrar(datos, desde) {
  let version = desde;
  let resultado = datos;
  while (version !== VERSION_DATOS) {
    const indice = ORDEN_VERSIONES.indexOf(version);
    if (indice === -1 || indice === ORDEN_VERSIONES.length - 1) break;
    resultado = MIGRACIONES[version] ? MIGRACIONES[version](resultado) : resultado;
    version = ORDEN_VERSIONES[indice + 1];
  }
  return resultado;
}

function hayDatosGuardados() {
  return Object.values(COLECCIONES).some((clave) => localStorage.getItem(clave) !== null);
}

function emitir() {
  oyentes.forEach((oyente) => oyente());
}

function sembrar() {
  const semilla = generarSemilla();
  for (const [nombre, clave] of Object.entries(COLECCIONES)) {
    localStorage.setItem(clave, JSON.stringify(semilla[nombre]));
  }
  localStorage.setItem(CLAVE_VERSION, JSON.stringify(VERSION_DATOS));
  localStorage.removeItem(CLAVE_NOTIFICACIONES);
}

export function inicializarDatos({ forzar = false } = {}) {
  if (forzar || !hayDatosGuardados()) {
    sembrar();
  } else {
    const version = leerClave(CLAVE_VERSION, null);
    if (version !== VERSION_DATOS) {
      const actuales = construirInstantanea();
      guardarRespaldoAutomatico(actuales, version, "Antes de actualizar la estructura de datos");
      const migrados = migrar(actuales, version);
      for (const [nombre, clave] of Object.entries(COLECCIONES)) {
        localStorage.setItem(clave, JSON.stringify(migrados[nombre]));
      }
      localStorage.setItem(CLAVE_VERSION, JSON.stringify(VERSION_DATOS));
    }
  }
  instantanea = construirInstantanea();
  emitir();
}

function guardarRespaldoAutomatico(datos, version, motivo) {
  try {
    localStorage.setItem(
      CLAVE_RESPALDO_AUTOMATICO,
      JSON.stringify({ aplicacion: "AiDEN", version: version || "desconocida", exportado: new Date().toISOString(), motivo, datos }),
    );
  } catch (error) {
    console.warn("No hubo espacio para el respaldo automático", error);
  }
}

export function obtenerRespaldoAutomatico() {
  try {
    return localStorage.getItem(CLAVE_RESPALDO_AUTOMATICO);
  } catch {
    return null;
  }
}

export function obtenerDatos() {
  if (!instantanea) instantanea = construirInstantanea();
  return instantanea;
}

export function obtener(nombre) {
  return obtenerDatos()[nombre];
}

/*
  Guarda varias colecciones como una sola operación: si alguna escritura falla
  (por ejemplo, sin espacio), se restauran las que ya se habían escrito para que
  inventario, costos y trazabilidad nunca queden a medias.
*/
export function guardar(cambios) {
  const siguiente = { ...obtenerDatos() };
  const previos = [];
  try {
    for (const [nombre, valor] of Object.entries(cambios)) {
      const clave = COLECCIONES[nombre];
      if (!clave) throw new Error(`Colección desconocida: ${nombre}`);
      previos.push([clave, localStorage.getItem(clave)]);
      localStorage.setItem(clave, JSON.stringify(valor));
      siguiente[nombre] = valor;
    }
  } catch (error) {
    for (const [clave, anterior] of previos.reverse()) {
      try {
        if (anterior === null) localStorage.removeItem(clave);
        else localStorage.setItem(clave, anterior);
      } catch (restaurar) {
        console.error("No se pudo restaurar", clave, restaurar);
      }
    }
    instantanea = construirInstantanea();
    emitir();
    if (error?.name === "QuotaExceededError") {
      throw new Error("No hay espacio disponible para guardar más datos. Exporta un respaldo y restaura los datos base.", { cause: error });
    }
    throw error;
  }
  instantanea = siguiente;
  emitir();
}

let escuchandoOtrasPestanas = false;

function escucharOtrasPestanas() {
  if (escuchandoOtrasPestanas || typeof window === "undefined") return;
  escuchandoOtrasPestanas = true;
  window.addEventListener("storage", (evento) => {
    if (!evento.key || Object.values(COLECCIONES).includes(evento.key)) {
      instantanea = construirInstantanea();
      emitir();
    }
  });
}

function suscribir(oyente) {
  escucharOtrasPestanas();
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useDatos() {
  return useSyncExternalStore(suscribir, obtenerDatos);
}

export function exportarRespaldo() {
  return JSON.stringify(
    { aplicacion: "AiDEN", version: VERSION_DATOS, exportado: new Date().toISOString(), datos: obtenerDatos() },
    null,
    2,
  );
}

/*
  Valida un respaldo completo antes de tocar nada: un registro nulo o sin id
  rompería los cálculos de alertas en todas las pantallas. Guarda una copia de
  los datos actuales para poder volver atrás.
*/
export function importarRespaldo(texto) {
  if (typeof texto !== "string" || texto.length > TAMANO_MAXIMO_RESPALDO) {
    throw new Error("El respaldo es demasiado grande para un archivo de AiDEN.");
  }
  let contenido;
  try {
    contenido = JSON.parse(texto);
  } catch (error) {
    throw new Error("El archivo no es un JSON válido.", { cause: error });
  }
  if (contenido?.aplicacion !== "AiDEN" || !esObjeto(contenido?.datos)) {
    throw new Error("El archivo no es un respaldo de AiDEN.");
  }
  const version = contenido.version;
  if (version && version !== VERSION_DATOS && !ORDEN_VERSIONES.includes(version)) {
    throw new Error(`El respaldo es de una versión de AiDEN que esta aplicación no reconoce (${version}).`);
  }
  const cambios = {};
  for (const nombre of Object.keys(COLECCIONES)) {
    const valor = contenido.datos[nombre];
    if (nombre === "configuracion") {
      if (!esObjeto(valor)) throw new Error("El respaldo no incluye la configuración.");
      cambios[nombre] = valor;
      continue;
    }
    if (!Array.isArray(valor)) throw new Error(`El respaldo no incluye la colección "${nombre}".`);
    const ids = new Set();
    for (const registro of valor) {
      if (!esObjeto(registro) || typeof registro.id !== "string" || !registro.id) {
        throw new Error(`La colección "${nombre}" tiene registros sin el formato esperado.`);
      }
      if (ids.has(registro.id)) throw new Error(`La colección "${nombre}" repite el registro ${registro.id}.`);
      ids.add(registro.id);
    }
    cambios[nombre] = valor;
  }
  guardarRespaldoAutomatico(obtenerDatos(), VERSION_DATOS, "Antes de importar un respaldo");
  guardar(version && version !== VERSION_DATOS ? migrar(cambios, version) : cambios);
}

export function crearId(prefijo) {
  const azar =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(-10);
  return `${prefijo}-${azar.toUpperCase()}`;
}

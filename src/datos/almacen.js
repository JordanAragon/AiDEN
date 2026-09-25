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

const oyentes = new Set();
let instantanea = null;

function leerClave(clave, respaldo) {
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return respaldo;
    const valor = JSON.parse(crudo);
    return valor ?? respaldo;
  } catch (error) {
    console.warn(`No se pudo leer ${clave}`, error);
    return respaldo;
  }
}

function construirInstantanea() {
  const datos = {};
  for (const [nombre, clave] of Object.entries(COLECCIONES)) {
    const respaldo = nombre === "configuracion" ? CONFIG_INICIAL : [];
    const valor = leerClave(clave, respaldo);
    if (nombre === "configuracion") {
      datos[nombre] = { ...CONFIG_INICIAL, ...(valor && typeof valor === "object" ? valor : {}) };
    } else {
      datos[nombre] = Array.isArray(valor) ? valor : [];
    }
  }
  return datos;
}

function emitir() {
  oyentes.forEach((oyente) => oyente());
}

export function inicializarDatos({ forzar = false } = {}) {
  const version = leerClave(CLAVE_VERSION, null);
  if (forzar || version !== VERSION_DATOS) {
    const semilla = generarSemilla();
    for (const [nombre, clave] of Object.entries(COLECCIONES)) {
      localStorage.setItem(clave, JSON.stringify(semilla[nombre]));
    }
    localStorage.setItem(CLAVE_VERSION, JSON.stringify(VERSION_DATOS));
    localStorage.removeItem(CLAVE_NOTIFICACIONES);
  }
  instantanea = construirInstantanea();
  emitir();
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
      throw new Error("El navegador no tiene espacio para guardar más datos. Exporta un respaldo y restablece la demo.", { cause: error });
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

export function importarRespaldo(texto) {
  let contenido;
  try {
    contenido = JSON.parse(texto);
  } catch (error) {
    throw new Error("El archivo no es un JSON válido.", { cause: error });
  }
  if (contenido?.aplicacion !== "AiDEN" || !contenido?.datos) {
    throw new Error("El archivo no es un respaldo de AiDEN.");
  }
  const cambios = {};
  for (const nombre of Object.keys(COLECCIONES)) {
    const valor = contenido.datos[nombre];
    if (nombre === "configuracion" ? typeof valor !== "object" : !Array.isArray(valor)) {
      throw new Error(`El respaldo no incluye la colección "${nombre}".`);
    }
    cambios[nombre] = valor;
  }
  guardar(cambios);
}

export function crearId(prefijo) {
  const tiempo = Date.now().toString(36).slice(-5).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `${prefijo}-${tiempo}${azar}`;
}

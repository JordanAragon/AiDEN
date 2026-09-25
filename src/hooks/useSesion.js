import { useSyncExternalStore } from "react";
import { getSession, listarUsuarios, suscribirSesion } from "../utilidades/autenticacion";

let cache = { clave: null, valor: null };

function instantanea() {
  const sesion = getSession();
  const clave = sesion ? JSON.stringify(sesion) : "";
  if (clave !== cache.clave) cache = { clave, valor: sesion };
  return cache.valor;
}

export function useSesion() {
  return useSyncExternalStore(suscribirSesion, instantanea);
}

let cacheUsuarios = { clave: null, valor: [] };

function instantaneaUsuarios() {
  const lista = listarUsuarios();
  const clave = JSON.stringify(lista);
  if (clave !== cacheUsuarios.clave) cacheUsuarios = { clave, valor: lista };
  return cacheUsuarios.valor;
}

export function useUsuarios() {
  return useSyncExternalStore(suscribirSesion, instantaneaUsuarios);
}

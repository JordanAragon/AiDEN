import { lazy } from "react";

const CLAVE_RECARGA = "aiden-recarga-por-version";
const PATRON_FALLO_CARGA = /dynamically imported module|Importing a module script failed|error loading dynamically|Loading chunk|Failed to fetch/i;

export function esFalloDeCarga(error) {
  return PATRON_FALLO_CARGA.test(String(error?.message || error || ""));
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function recargarUnaVez() {
  try {
    const ultima = Number(window.sessionStorage.getItem(CLAVE_RECARGA)) || 0;
    if (Date.now() - ultima < 30_000) return false;
    window.sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

// React.lazy guarda la promesa rechazada: sin esto, un corte de red o un despliegue nuevo
// (los archivos con hash viejo ya no existen) deja la vista rota hasta recargar a mano.
export function diferida(importar) {
  return lazy(async () => {
    try {
      return await importar();
    } catch (error) {
      if (!esFalloDeCarga(error)) throw error;
      await esperar(700);
      try {
        return await importar();
      } catch (segundoError) {
        if (esFalloDeCarga(segundoError) && recargarUnaVez()) return new Promise(() => {});
        throw segundoError;
      }
    }
  });
}

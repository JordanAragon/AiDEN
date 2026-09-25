import { createContext, useCallback, useContext, useState } from "react";

export const ContextoAvisos = createContext(null);
export const ContextoConfirmacion = createContext(null);

export function useAviso() {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) throw new Error("useAviso debe usarse dentro de ProveedorRetroalimentacion");
  return contexto;
}

export function useConfirmar() {
  const contexto = useContext(ContextoConfirmacion);
  if (!contexto) throw new Error("useConfirmar debe usarse dentro de ProveedorRetroalimentacion");
  return contexto;
}

/*
  Ejecuta una acción de dominio y comunica el resultado. Devuelve el valor de la
  acción o null si falló, para que el formulario decida si se cierra o no.
*/
export function useAccion() {
  const aviso = useAviso();
  return useCallback(
    (accion, exito) => {
      try {
        const resultado = accion();
        if (exito) {
          const mensaje = typeof exito === "function" ? exito(resultado) : exito;
          aviso(typeof mensaje === "string" ? { tipo: "exito", titulo: mensaje } : { tipo: "exito", ...mensaje });
        }
        return resultado ?? true;
      } catch (error) {
        aviso({ tipo: "error", titulo: "No se pudo completar", detalle: error?.message || "Ocurrió un error inesperado." });
        return null;
      }
    },
    [aviso],
  );
}

/*
  Para formularios dentro de un modal: el error se muestra junto a los campos
  (no en un aviso flotante) y el modal solo se cierra si la acción salió bien.
*/
export function useEnvio(alTerminar) {
  const aviso = useAviso();
  const [error, setError] = useState("");
  const enviar = useCallback(
    (accion, mensaje) => {
      try {
        const resultado = accion();
        setError("");
        if (mensaje) {
          const texto = typeof mensaje === "function" ? mensaje(resultado) : mensaje;
          aviso(typeof texto === "string" ? { tipo: "exito", titulo: texto } : { tipo: "exito", ...texto });
        }
        alTerminar?.(resultado);
        return resultado ?? true;
      } catch (err) {
        setError(err?.message || "Ocurrió un error inesperado.");
        return null;
      }
    },
    [aviso, alTerminar],
  );
  return { error, setError, enviar };
}

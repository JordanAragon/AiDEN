import { useCallback } from "react";
import { ETAPAS } from "../datos/catalogos";
import { avanzarEtapa } from "../datos/acciones";
import { useAccion, useConfirmar } from "../contexto/retroalimentacion";
import { useSesion } from "./useSesion";
import { numero } from "../utilidades/formato";

export function useAvanzarEtapa() {
  const sesion = useSesion();
  const confirmar = useConfirmar();
  const ejecutar = useAccion();
  return useCallback(
    async (lote) => {
      const siguiente = ETAPAS[ETAPAS.indexOf(lote.etapa) + 1];
      if (!siguiente) return;
      const ok = await confirmar({
        titulo: `Pasar ${lote.lote} a ${siguiente}`,
        mensaje: `El cambio queda en la trazabilidad con fecha de hoy y a tu nombre. ${lote.cultivo} tiene ${numero(lote.cantidad)} plantas vivas de ${numero(lote.cantidadInicial)}.`,
        confirmar: `Pasar a ${siguiente}`,
      });
      if (ok) ejecutar(() => avanzarEtapa(lote.lote, sesion), `${lote.lote} pasó a ${siguiente}`);
    },
    [confirmar, ejecutar, sesion],
  );
}

import { useMinuto } from "../../hooks/useMinuto";
import { aFecha, fechaHora, haceTiempo } from "../../utilidades/formato";

/*
  «hace 3 h» con la fecha completa a mano: un solo reloj de minuto para toda la
  app (no un temporizador por fila) y la fecha y hora exactas al pasar el cursor.
  En pantalla se lee lo relativo; <time> lleva la fecha de máquina.
*/

export default function TiempoRelativo({ fecha, className = "" }) {
  useMinuto();
  if (!fecha) return null;
  const completo = fechaHora(fecha);
  const iso = aFecha(fecha);
  return (
    <time dateTime={Number.isNaN(iso.getTime()) ? undefined : iso.toISOString()} title={completo} data-completo={completo} className={`aiden-tiempo ${className}`}>
      {haceTiempo(fecha)}
    </time>
  );
}

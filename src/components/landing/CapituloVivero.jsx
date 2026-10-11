import { useEffect, useMemo, useRef, useState } from "react";
import Vivero3D from "../vivero3d/Vivero3D";
import { planoVivero, vistaGeneral, vistaZona } from "../vivero3d/planoVivero";
import { estacionesVivero } from "../vivero3d/estaciones";
import { mezclar, suavizar } from "../vivero3d/matematica";
import { useMovimientoReducido } from "../vivo/soporte";
import { ETAPAS } from "../../datos/catalogos";
import { numero } from "../../utilidades/formato";

/*
  «El vivero, planta por planta»: el vivero de la semilla en 3D, una instancia
  por planta viva, recorrido con el scroll. La cámara para en cada zona (primero
  la del lote protagonista) y la parada dice, con los datos, qué hay en ella.
  Con movimiento reducido no hay recorrido: el plano general y las paradas en
  lista.
*/

const COLOR_ETAPA = ["#c9df7a", "#9dc068", "#769c56", "#587f45"];

export default function CapituloVivero({ datos, protagonista }) {
  const plano = useMemo(() => planoVivero(datos), [datos]);
  const estaciones = useMemo(() => estacionesVivero(datos, plano, { protagonista }), [datos, plano, protagonista]);
  const pistaRef = useRef(null);
  const viveroRef = useRef(null);
  const [activa, setActiva] = useState(0);
  const quieto = useMovimientoReducido();

  const porEtapa = useMemo(() => {
    const cuentas = ETAPAS.map(() => 0);
    for (const lote of plano.lotes) cuentas[lote.etapaIndice] += lote.plantas;
    return cuentas;
  }, [plano]);

  // En la vista general van todos los rótulos; en una zona, solo los de sus lotes.
  const zonaActiva = estaciones[activa]?.zona;
  const etiquetas = useMemo(
    () =>
      plano.lotes
        .filter((lote) => zonaActiva === null || zonaActiva === undefined || plano.zonas[zonaActiva]?.nombre === lote.zona)
        .map((lote) => ({
        id: lote.codigo,
        punto: lote.centro,
        className: "",
        contenido: (
          <span className={`aiden-vivero3d-rotulo ${estaciones[activa]?.lote === lote.indice ? "is-activo" : estaciones[activa]?.lote >= 0 ? "is-atenuado" : ""}`}>
            <b>{lote.codigo}</b>
            <span>
              {lote.cultivo} · {numero(lote.plantas)}
            </span>
          </span>
        ),
      })),
    [plano, estaciones, activa, zonaActiva],
  );

  useEffect(() => {
    const poseDe = (estacion, aspecto) => (estacion.zona === null ? vistaGeneral(plano, aspecto) : vistaZona(plano.zonas[estacion.zona], aspecto));
    if (quieto) {
      const vivero = viveroRef.current;
      vivero?.fijarPose(vistaGeneral(plano, vivero.aspecto()), true);
      vivero?.resaltar(-1);
      return undefined;
    }
    let cuadro = 0;
    let anterior = -1;
    const actualizar = () => {
      cuadro = 0;
      const pista = pistaRef.current;
      const vivero = viveroRef.current;
      if (!pista || !vivero) return;
      const caja = pista.getBoundingClientRect();
      const recorrido = Math.max(1, caja.height - window.innerHeight);
      const avance = Math.min(1, Math.max(0, -caja.top / recorrido));
      const tramo = avance * (estaciones.length - 1);
      const i = Math.min(estaciones.length - 2, Math.floor(tramo));
      const f = tramo - i;
      const aspecto = vivero.aspecto();
      const a = poseDe(estaciones[i], aspecto);
      const b = poseDe(estaciones[i + 1], aspecto);
      const t = suavizar((f - 0.42) / 0.58);
      vivero.fijarPose({ ojo: mezclar(a.ojo, b.ojo, t), objetivo: mezclar(a.objetivo, b.objetivo, t) }, anterior < 0);
      const indice = f > 0.74 ? i + 1 : i;
      if (indice !== anterior) {
        anterior = indice;
        setActiva(indice);
        vivero.resaltar(estaciones[indice].lote);
      }
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, [estaciones, plano, quieto]);

  const irA = (indice) => {
    const pista = pistaRef.current;
    if (!pista) return;
    const recorrido = pista.offsetHeight - window.innerHeight;
    const inicio = pista.getBoundingClientRect().top + window.scrollY;
    // Se apunta un poco antes del final del tramo, donde la cámara ya llegó.
    const destino = inicio + (recorrido * Math.max(0, indice - 0.12)) / (estaciones.length - 1);
    window.scrollTo({ top: indice === 0 ? inicio : destino, behavior: quieto ? "auto" : "smooth" });
  };

  return (
    <div ref={pistaRef} className="aiden-vivero-recorrido" style={{ "--pasos": estaciones.length }}>
      <div className="aiden-vivero-escenario">
        <Vivero3D ref={viveroRef} plano={plano} etiquetas={etiquetas} className="aiden-vivero-lienzo3d" />

        <div className="aiden-vivero-leyenda" aria-hidden="true">
          <p>
            <i className="is-vivo" /> Un punto por planta viva
          </p>
          <ul>
            {ETAPAS.map((etapa, i) => (
              <li key={etapa}>
                <i style={{ background: COLOR_ETAPA[i] }} />
                {etapa} <span>{numero(porEtapa[i])}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="aiden-vivero-paradas" aria-label="Paradas del recorrido por el vivero">
          {estaciones.map((estacion, i) => (
            <li key={estacion.id} className={i === activa ? "is-activa" : ""} aria-current={i === activa ? "step" : undefined}>
              <h3>
                <span>
                  {estacion.titulo} {estacion.remate && <em>{estacion.remate}</em>}
                </span>
                {estacion.alerta && <span className="aiden-vivero-alerta">Zona en alerta</span>}
              </h3>
              <p>{estacion.cuerpo}</p>
            </li>
          ))}
        </ol>

        <nav className="aiden-vivero-riel" aria-label="Ir a una parada del vivero">
          {estaciones.map((estacion, i) => (
            <button key={estacion.id} type="button" onClick={() => irA(i)} aria-current={i === activa ? "step" : undefined} className={i === activa ? "is-activa" : ""}>
              <span>{estacion.zona === null ? (i === 0 ? "Vivero" : "Tablero") : estacion.nombre}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

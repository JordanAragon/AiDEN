import { evaluarLectura, resumenLote, ultimasLecturas } from "../../datos/selectores";
import { numero, plural } from "../../utilidades/formato";

/*
  Las paradas del recorrido por el vivero en 3D, escritas desde los datos:
  cuántas plantas hay, en qué etapa, cuándo salen, qué incidencias siguen
  abiertas y qué marcó la última lectura de la zona. Nada se redacta a mano.
*/

function salida(dias) {
  if (dias === null || dias === undefined) return "";
  if (dias > 1) return `, salen en ${numero(dias)} días`;
  if (dias === 1) return ", salen mañana";
  if (dias === 0) return ", salen hoy";
  return `, ${plural(-dias, "día", "días")} de atraso`;
}

function minuscula(texto = "") {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

export function estacionesVivero(datos, plano, { protagonista } = {}) {
  const lecturas = ultimasLecturas(datos.ambiental || []);
  const cfg = datos.configuracion;
  const conLotes = plano.zonas.map((zona, indice) => ({ zona, indice })).filter(({ zona }) => zona.lotes.length);
  const zonaProtagonista = conLotes.find(({ zona }) => zona.lotes.some((i) => plano.lotes[i].codigo === protagonista));
  const plantasDe = ({ zona }) => zona.lotes.reduce((suma, i) => suma + plano.lotes[i].plantas, 0);
  const resto = conLotes.filter((z) => z !== zonaProtagonista).sort((a, b) => plantasDe(b) - plantasDe(a));
  const orden = zonaProtagonista ? [zonaProtagonista, ...resto] : resto;

  const estaciones = [
    {
      id: "vivero",
      zona: null,
      lote: -1,
      titulo: `${numero(plano.totalPlantas)} plantas vivas,`,
      remate: "cada una en su lugar.",
      cuerpo: `${plural(plano.lotes.length, "lote activo", "lotes activos")} en ${plural(conLotes.length, "zona", "zonas")}. Un punto por planta, en la cama y la estructura donde está hoy.`,
    },
  ];

  for (const { zona, indice } of orden) {
    const lotes = zona.lotes.map((i) => plano.lotes[i]).sort((a, b) => (a.codigo === protagonista ? -1 : b.codigo === protagonista ? 1 : b.plantas - a.plantas));
    const principal = lotes[0];
    const frases = lotes.slice(0, 2).map((meta) => {
      const lote = datos.lotes.find((l) => l.lote === meta.codigo);
      const r = lote ? resumenLote(lote, datos) : null;
      return `${meta.cultivo} (${meta.codigo}): ${numero(meta.plantas)} plantas en ${minuscula(meta.etapa)}${salida(r?.diasParaSalida)}`;
    });
    if (lotes.length > 2) frases.push(`y ${plural(lotes.length - 2, "lote más", "lotes más")}`);

    const abiertas = (datos.calidad || []).filter((i) => lotes.some((l) => l.codigo === i.lote) && i.estado !== "Cerrada");
    if (abiertas.length === 1) frases.push(`Una incidencia abierta: ${minuscula(abiertas[0].descripcion).replace(/\.$/, "")}`);
    else if (abiertas.length > 1) frases.push(`${numero(abiertas.length)} incidencias abiertas`);

    const lectura = lecturas.get(zona.nombre);
    let alerta = false;
    if (lectura && cfg) {
      const evaluacion = evaluarLectura(lectura, cfg);
      alerta = evaluacion.fuera;
      const valores = `${String(lectura.temperatura).replace(".", ",")} °C y ${numero(lectura.humedad)} %`;
      frases.push(alerta ? `La última lectura marca ${valores}: fuera del rango de ${cfg.tempMin}–${cfg.tempMax} °C y ${cfg.humMin}–${cfg.humMax} %` : `Última lectura: ${valores}, en rango`);
    }

    estaciones.push({
      id: `zona-${indice}`,
      zona: indice,
      lote: principal ? principal.indice : -1,
      titulo: `${zona.nombre},`,
      remate: `${plural(lotes.reduce((suma, l) => suma + l.plantas, 0), "planta.", "plantas.")}`,
      nombre: zona.nombre,
      cuerpo: `${frases.join(". ")}.`,
      alerta,
    });
  }

  estaciones.push({
    id: "plano",
    zona: null,
    lote: -1,
    titulo: "El mismo plano,",
    remate: "en el tablero de supervisión.",
    cuerpo: "Con los datos del día: cada lote nuevo, cada merma y cada alerta de zona cambian lo que se ve aquí.",
  });

  return estaciones;
}

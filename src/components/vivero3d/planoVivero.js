import { ETAPAS } from "../../datos/catalogos";

/*
  El vivero como plano: de las zonas y los lotes activos sale dónde va cada
  planta. Una instancia por planta viva (4.894 en la semilla), agrupada por lote
  en camas dentro de la estructura de su zona. Es un esquema, no un levantamiento:
  las zonas no traen coordenadas, así que se acomodan en dos columnas con el
  tamaño que piden sus plantas. Función pura y determinista: la usan la landing
  (con la semilla), el tablero del supervisor (con los datos reales), el motor
  WebGPU y el respaldo en Canvas 2D.
*/

// Distancia entre plantas por etapa: la bandeja de germinación es densa; la cosecha, holgada.
const ESPACIO = [0.2, 0.26, 0.32, 0.36];
const ALTURA = [0.3, 0.52, 0.82, 1.02];
const FILAS_POR_CAMA = [6, 4, 3, 3];
const MARGEN = 0.9;
const PASILLO_LOTES = 0.7;
const SEPARACION_ZONAS = 3.2;
// Por encima de este número de instancias, cada punto representa varias plantas.
export const MAXIMO_INSTANCIAS = 40000;
export const FLOTANTES_POR_PLANTA = 8;

export const TIPOS_ZONA = {
  invernadero: { aspecto: 1.75, alturaCama: 0.36, alturaEstructura: 2.6, cumbrera: 3.9 },
  germinacion: { aspecto: 1.3, alturaCama: 0.82, alturaEstructura: 2.7, cumbrera: 2.7 },
  umbraculo: { aspecto: 1.5, alturaCama: 0.08, alturaEstructura: 3.1, cumbrera: 3.1 },
  campo: { aspecto: 1.6, alturaCama: 0.06, alturaEstructura: 0.5, cumbrera: 0.5 },
};

export function tipoZona(nombre = "") {
  const texto = nombre.toLowerCase();
  if (/invernader|casa ?malla|túnel|tunel/.test(texto)) return "invernadero";
  if (/germina|propaga|semiller|cuarto|cámara|camara|laboratorio/.test(texto)) return "germinacion";
  if (/umbr|sombra|malla/.test(texto)) return "umbraculo";
  return "campo";
}

function factorCultivo(cultivo = "") {
  const texto = cultivo.toLowerCase();
  if (/caf[eé]|aguacat|c[ií]tric|naranj|lim[oó]n|mango|frutal|cacao|forestal/.test(texto)) return 1.3;
  if (/lechug|cilantr|espinac|acelg|arom[aá]tic|albahac|perejil|cebollin/.test(texto)) return 0.68;
  return 1;
}

// Pseudoazar determinista por planta: la misma semilla dibuja siempre el mismo vivero.
function azar(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function etapaDe(lote) {
  return Math.max(0, ETAPAS.indexOf(lote.etapa));
}

export function planoVivero(datos) {
  const activos = (datos.lotes || []).filter((lote) => lote.estado !== "Cerrado" && Number(lote.cantidad) > 0);
  const nombres = (datos.zonas || []).map((zona) => zona.nombre);
  for (const lote of activos) if (lote.ubicacion && !nombres.includes(lote.ubicacion)) nombres.push(lote.ubicacion);

  const totalPlantas = activos.reduce((suma, lote) => suma + Number(lote.cantidad), 0);
  const representa = Math.max(1, Math.ceil(totalPlantas / MAXIMO_INSTANCIAS));

  // 1. Tamaño de cada zona según el área que piden sus lotes.
  const zonas = nombres.map((nombre) => {
    const tipo = tipoZona(nombre);
    const propios = activos.filter((lote) => lote.ubicacion === nombre);
    const area = propios.reduce((suma, lote) => {
      const espacio = ESPACIO[etapaDe(lote)];
      return suma + (Number(lote.cantidad) / representa) * espacio * espacio * 1.35;
    }, 0);
    const { aspecto } = TIPOS_ZONA[tipo];
    const interiorAncho = Math.max(4.2, Math.sqrt(Math.max(area, 6) * aspecto));
    return { nombre, tipo, propios, interiorAncho };
  });

  // 2. Lotes en franjas y camas dentro de cada zona (coordenadas locales desde la esquina interior).
  const lotes = [];
  for (const zona of zonas) {
    let z = 0;
    zona.franjas = [];
    for (const lote of zona.propios) {
      const etapa = etapaDe(lote);
      const espacio = ESPACIO[etapa];
      const instancias = Math.max(1, Math.round(Number(lote.cantidad) / representa));
      const columnas = Math.max(1, Math.floor(zona.interiorAncho / espacio));
      const filas = Math.ceil(instancias / columnas);
      const filasPorCama = FILAS_POR_CAMA[etapa];
      const camas = Math.ceil(filas / filasPorCama);
      const huecoCama = espacio * 1.25;
      const fondo = filas * espacio + (camas - 1) * huecoCama;
      zona.franjas.push({ lote, etapa, espacio, instancias, columnas, filas, filasPorCama, huecoCama, z, fondo });
      z += fondo + PASILLO_LOTES;
    }
    zona.interiorFondo = Math.max(3.2, z - (zona.franjas.length ? PASILLO_LOTES : 0));
    zona.ancho = zona.interiorAncho + MARGEN * 2;
    zona.fondo = zona.interiorFondo + MARGEN * 2;
  }

  // 3. Zonas en dos columnas, centradas en el origen.
  const filasZonas = [];
  for (let i = 0; i < zonas.length; i += 2) filasZonas.push(zonas.slice(i, i + 2));
  const fondoTotal = filasZonas.reduce((suma, fila) => suma + Math.max(...fila.map((zona) => zona.fondo)), 0) + SEPARACION_ZONAS * Math.max(0, filasZonas.length - 1);
  let cursorZ = -fondoTotal / 2;
  for (const fila of filasZonas) {
    const fondoFila = Math.max(...fila.map((zona) => zona.fondo));
    if (fila.length === 1) {
      const zona = fila[0];
      zona.x0 = -zona.ancho / 2;
    } else {
      fila[0].x0 = -SEPARACION_ZONAS / 2 - fila[0].ancho;
      fila[1].x0 = SEPARACION_ZONAS / 2;
    }
    for (const zona of fila) {
      zona.z0 = cursorZ + (fondoFila - zona.fondo) / 2;
      zona.x1 = zona.x0 + zona.ancho;
      zona.z1 = zona.z0 + zona.fondo;
    }
    cursorZ += fondoFila + SEPARACION_ZONAS;
  }

  // 4. Plantas y camas en coordenadas del mundo.
  const totalInstancias = zonas.reduce((suma, zona) => suma + zona.franjas.reduce((s, f) => s + f.instancias, 0), 0);
  const plantas = new Float32Array(totalInstancias * FLOTANTES_POR_PLANTA);
  let n = 0;
  const zonasSalida = zonas.map((zona) => {
    const ajustes = TIPOS_ZONA[zona.tipo];
    const camas = [];
    const indicesLotes = [];
    const ix0 = zona.x0 + MARGEN;
    const iz0 = zona.z0 + MARGEN;
    for (const franja of zona.franjas) {
      const { lote, etapa, espacio, instancias, columnas, filasPorCama, huecoCama } = franja;
      const indice = lotes.length;
      indicesLotes.push(indice);
      const anchoUsado = Math.min(columnas, instancias) * espacio;
      const desplazamientoX = ix0 + (zona.interiorAncho - anchoUsado) / 2;
      const factor = factorCultivo(lote.cultivo);
      const alturaBase = ajustes.alturaCama;
      let camaActual = null;
      for (let i = 0; i < instancias; i += 1) {
        const fila = Math.floor(i / columnas);
        const columna = i % columnas;
        const cama = Math.floor(fila / filasPorCama);
        const zLocal = franja.z + fila * espacio + cama * huecoCama + espacio / 2;
        const semilla = azar(indice * 9973 + i);
        const x = desplazamientoX + columna * espacio + espacio / 2 + (azar(i * 3.1 + indice) - 0.5) * espacio * 0.35;
        const zMundo = iz0 + zLocal + (azar(i * 7.7 + indice) - 0.5) * espacio * 0.35;
        if (!camaActual || camaActual.indice !== cama) {
          const zCama = iz0 + franja.z + cama * filasPorCama * espacio + cama * huecoCama;
          camaActual = {
            indice: cama,
            x0: desplazamientoX - espacio * 0.25,
            x1: desplazamientoX + anchoUsado + espacio * 0.25,
            z0: zCama - espacio * 0.15,
            z1: zCama + Math.min(filasPorCama, franja.filas - cama * filasPorCama) * espacio + espacio * 0.15,
            h: alturaBase,
            lote: indice,
          };
          camas.push(camaActual);
        }
        const o = n * FLOTANTES_POR_PLANTA;
        plantas[o] = x;
        plantas[o + 1] = alturaBase;
        plantas[o + 2] = zMundo;
        plantas[o + 3] = ALTURA[etapa] * factor * (0.82 + semilla * 0.36);
        plantas[o + 4] = etapa;
        plantas[o + 5] = indice;
        plantas[o + 6] = azar(i * 1.3 + indice * 17) * Math.PI * 2;
        plantas[o + 7] = semilla;
        n += 1;
      }
      const x0 = desplazamientoX;
      const z0 = iz0 + franja.z;
      const x1 = x0 + anchoUsado;
      const z1 = z0 + franja.fondo;
      lotes.push({
        indice,
        codigo: lote.lote,
        cultivo: lote.cultivo,
        etapa: lote.etapa,
        etapaIndice: etapa,
        plantas: Number(lote.cantidad),
        zona: zona.nombre,
        x0,
        z0,
        x1,
        z1,
        centro: [(x0 + x1) / 2, alturaBase + ALTURA[etapa] * factor + 0.35, (z0 + z1) / 2],
      });
    }
    return {
      nombre: zona.nombre,
      tipo: zona.tipo,
      x0: zona.x0,
      z0: zona.z0,
      x1: zona.x1,
      z1: zona.z1,
      altura: ajustes.alturaEstructura,
      cumbrera: ajustes.cumbrera,
      camas,
      lotes: indicesLotes,
      centro: [(zona.x0 + zona.x1) / 2, ajustes.cumbrera + 0.6, (zona.z0 + zona.z1) / 2],
    };
  });

  const x0 = Math.min(0, ...zonasSalida.map((zona) => zona.x0));
  const x1 = Math.max(0, ...zonasSalida.map((zona) => zona.x1));
  const z0 = Math.min(0, ...zonasSalida.map((zona) => zona.z0));
  const z1 = Math.max(0, ...zonasSalida.map((zona) => zona.z1));

  return {
    zonas: zonasSalida,
    lotes,
    plantas,
    cantidad: n,
    totalPlantas,
    representa,
    limites: { x0, z0, x1, z1, radio: Math.hypot(x1 - x0, z1 - z0) / 2, centro: [(x0 + x1) / 2, 0, (z0 + z1) / 2] },
  };
}

/* Vista general: la cámara que encuadra el vivero entero en tres cuartos. */
export function vistaGeneral(plano, aspecto = 16 / 9) {
  const { radio, centro } = plano.limites;
  const distancia = radio * (aspecto < 1 ? 2.35 : 1.62);
  return {
    ojo: [centro[0] + distancia * 0.62, distancia * 0.78, centro[2] + distancia * 0.86],
    objetivo: [centro[0], 0.4, centro[2] + radio * 0.04],
  };
}

/* Encuadre de una zona: de frente y en picada suave, para leer sus lotes. */
export function vistaZona(zona, aspecto = 16 / 9) {
  const ancho = zona.x1 - zona.x0;
  const fondo = zona.z1 - zona.z0;
  const tamano = Math.max(ancho / Math.min(aspecto, 1.9), fondo) * (aspecto < 1 ? 1.5 : 1);
  const distancia = tamano * 1.2 + 3;
  // En pantallas anchas la zona se corre un poco a la derecha: abajo a la izquierda va la parada.
  // La cámara sube para mirar por encima de las estructuras que quedan delante.
  const corrimiento = aspecto > 1.2 ? 0.07 : 0;
  const objetivo = [zona.centro[0] - ancho * corrimiento, 0.7, zona.centro[2] + fondo * (0.06 + corrimiento)];
  return {
    ojo: [objetivo[0] + distancia * 0.3, distancia * 0.94, objetivo[2] + distancia * 0.74],
    objetivo,
  };
}

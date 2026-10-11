import { cruz, normalizar, restar } from "./matematica";

/*
  Geometría del vivero en 3D, sin GPU: arreglos planos que el motor sube a
  buffers. Dos mallas:
  - la planta: tallo en cruz y siete hojas, en espacio local con altura 1; el
    motor la repite una vez por planta (instancias);
  - lo estático: suelo, camas o mesas y la estructura de cada zona (invernadero
    a dos aguas, cuarto de germinación, umbráculo o campo), con color por vértice.
  El vidrio y la malla van aparte porque se dibujan translúcidos, al final.
*/

const SRGB = (hex, alfa = 1) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alfa];
};

export const COLORES = {
  fondo: SRGB("#071b11"),
  suelo: SRGB("#0b2b1b"),
  piso: SRGB("#123722"),
  cama: SRGB("#24301f"),
  mesa: SRGB("#3a4634"),
  estructura: SRGB("#c9cfbb"),
  vidrio: SRGB("#eef2e6", 0.09),
  malla: SRGB("#8fa872", 0.3),
  cuarto: SRGB("#eef2e6", 0.11),
};

// ---- La planta -------------------------------------------------------------

const HOJAS = [
  // altura base, ángulo, largo, subida, ancho
  [0.16, 0.2, 0.33, 0.1, 0.1],
  [0.28, 2.5, 0.35, 0.12, 0.11],
  [0.42, 4.5, 0.31, 0.1, 0.1],
  [0.56, 1.3, 0.27, 0.12, 0.09],
  [0.7, 3.5, 0.23, 0.12, 0.08],
  [0.84, 5.6, 0.17, 0.12, 0.07],
  [0.87, 2.3, 0.16, 0.12, 0.07],
];

export const FLOTANTES_VERTICE_PLANTA = 7;

export function mallaPlanta() {
  const datos = [];
  const triangulo = (a, b, c, parte) => {
    const normal = normalizar(cruz(restar(b, a), restar(c, a)));
    for (const v of [a, b, c]) datos.push(v[0], v[1], v[2], normal[0], normal[1], normal[2], parte);
  };
  // Tallo: dos planos en cruz, más delgados arriba.
  const alto = 0.92;
  for (const [dx, dz] of [
    [0.022, 0],
    [0, 0.022],
  ]) {
    const a = [-dx, 0, -dz];
    const b = [dx, 0, dz];
    const c = [dx * 0.4, alto, dz * 0.4];
    const d = [-dx * 0.4, alto, -dz * 0.4];
    triangulo(a, b, c, 0);
    triangulo(a, c, d, 0);
  }
  for (const [y, angulo, largo, subida, ancho] of HOJAS) {
    const base = [0, y, 0];
    const punta = [Math.cos(angulo) * largo, y + subida, Math.sin(angulo) * largo];
    const medio = [punta[0] * 0.45, y + subida * 0.62, punta[2] * 0.45];
    const lado = [-Math.sin(angulo) * ancho, 0.015, Math.cos(angulo) * ancho];
    const izquierda = [medio[0] + lado[0], medio[1] + lado[1], medio[2] + lado[2]];
    const derecha = [medio[0] - lado[0], medio[1] - lado[1], medio[2] - lado[2]];
    triangulo(base, izquierda, punta, 1);
    triangulo(base, punta, derecha, 1);
  }
  return { datos: new Float32Array(datos), vertices: datos.length / FLOTANTES_VERTICE_PLANTA };
}

// ---- Lo estático -------------------------------------------------------------

export const FLOTANTES_VERTICE_ESTATICO = 10;

function crearMalla() {
  const datos = [];
  const triangulo = (a, b, c, color, normalFija) => {
    const normal = normalFija || normalizar(cruz(restar(b, a), restar(c, a)));
    for (const v of [a, b, c]) datos.push(v[0], v[1], v[2], normal[0], normal[1], normal[2], color[0], color[1], color[2], color[3]);
  };
  const cuadro = (a, b, c, d, color) => {
    triangulo(a, b, c, color);
    triangulo(a, c, d, color);
  };
  // Caja alineada a los ejes (suelo, camas, mesas).
  const caja = (x0, y0, z0, x1, y1, z1, color) => {
    cuadro([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], color);
    cuadro([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color);
    cuadro([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], color);
    cuadro([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color);
    cuadro([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], color);
  };
  // Viga: caja orientada entre dos puntos.
  const viga = (a, b, grosor, color) => {
    const direccion = normalizar(restar(b, a));
    const apoyo = Math.abs(direccion[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const lado = normalizar(cruz(direccion, apoyo)).map((v) => (v * grosor) / 2);
    const arriba = normalizar(cruz(lado, direccion)).map((v) => (v * grosor) / 2);
    const esquina = (p, s, u) => [p[0] + lado[0] * s + arriba[0] * u, p[1] + lado[1] * s + arriba[1] * u, p[2] + lado[2] * s + arriba[2] * u];
    const [a1, a2, a3, a4] = [esquina(a, -1, -1), esquina(a, 1, -1), esquina(a, 1, 1), esquina(a, -1, 1)];
    const [b1, b2, b3, b4] = [esquina(b, -1, -1), esquina(b, 1, -1), esquina(b, 1, 1), esquina(b, -1, 1)];
    cuadro(a1, a2, b2, b1, color);
    cuadro(a2, a3, b3, b2, color);
    cuadro(a3, a4, b4, b3, color);
    cuadro(a4, a1, b1, b4, color);
  };
  return { datos, triangulo, cuadro, caja, viga };
}

function postes(desde, hasta, paso) {
  const tramos = Math.max(1, Math.round((hasta - desde) / paso));
  return Array.from({ length: tramos + 1 }, (_, i) => desde + ((hasta - desde) * i) / tramos);
}

function estructura(malla, vidrio, zona) {
  const { x0, z0, x1, z1, altura: h, cumbrera: r, tipo } = zona;
  const color = COLORES.estructura;
  const zm = (z0 + z1) / 2;
  const g = 0.07;
  if (tipo === "invernadero") {
    for (const x of postes(x0, x1, 2.4)) {
      malla.viga([x, 0, z0], [x, h, z0], g, color);
      malla.viga([x, 0, z1], [x, h, z1], g, color);
      malla.viga([x, h, z0], [x, r, zm], g * 0.8, color);
      malla.viga([x, h, z1], [x, r, zm], g * 0.8, color);
    }
    for (const x of [x0, x1]) malla.viga([x, 0, zm], [x, r, zm], g, color);
    malla.viga([x0, h, z0], [x1, h, z0], g, color);
    malla.viga([x0, h, z1], [x1, h, z1], g, color);
    malla.viga([x0, r, zm], [x1, r, zm], g, color);
    // Policarbonato: techo a dos aguas, paredes y culatas.
    vidrio.cuadro([x0, h, z0], [x1, h, z0], [x1, r, zm], [x0, r, zm], COLORES.vidrio);
    vidrio.cuadro([x1, h, z1], [x0, h, z1], [x0, r, zm], [x1, r, zm], COLORES.vidrio);
    vidrio.cuadro([x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], COLORES.vidrio);
    vidrio.cuadro([x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], COLORES.vidrio);
    for (const [x, signo] of [
      [x0, -1],
      [x1, 1],
    ]) {
      const a = [x, 0, signo > 0 ? z0 : z1];
      const b = [x, 0, signo > 0 ? z1 : z0];
      const c = [x, h, signo > 0 ? z1 : z0];
      const d = [x, h, signo > 0 ? z0 : z1];
      vidrio.cuadro(a, b, c, d, COLORES.vidrio);
      vidrio.triangulo(d, c, [x, r, zm], COLORES.vidrio);
    }
    return;
  }
  if (tipo === "germinacion") {
    for (const [x, z] of [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ])
      malla.viga([x, 0, z], [x, h, z], g, color);
    malla.viga([x0, h, z0], [x1, h, z0], g, color);
    malla.viga([x1, h, z0], [x1, h, z1], g, color);
    malla.viga([x1, h, z1], [x0, h, z1], g, color);
    malla.viga([x0, h, z1], [x0, h, z0], g, color);
    vidrio.cuadro([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], COLORES.cuarto);
    vidrio.cuadro([x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], COLORES.cuarto);
    vidrio.cuadro([x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], COLORES.cuarto);
    vidrio.cuadro([x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], COLORES.cuarto);
    vidrio.cuadro([x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], COLORES.cuarto);
    return;
  }
  if (tipo === "umbraculo") {
    const xs = postes(x0, x1, 3);
    const zs = postes(z0, z1, 3);
    for (const x of xs) for (const z of zs) if (x === x0 || x === x1 || z === z0 || z === z1) malla.viga([x, 0, z], [x, h, z], g, color);
    for (const x of xs) malla.viga([x, h, z0], [x, h, z1], g * 0.7, color);
    for (const z of [z0, z1]) malla.viga([x0, h, z], [x1, h, z], g * 0.7, color);
    // Malla sombra al 50 %: un plano translúcido musgo sobre las vigas.
    vidrio.cuadro([x0, h + 0.04, z0], [x0, h + 0.04, z1], [x1, h + 0.04, z1], [x1, h + 0.04, z0], COLORES.malla);
    return;
  }
  // Campo abierto: estacas en las esquinas y un cordel bajo.
  const esquinas = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
  esquinas.forEach(([x, z], i) => {
    const [xs, zs] = esquinas[(i + 1) % 4];
    malla.viga([x, 0, z], [x, h, z], g, color);
    malla.viga([x, h * 0.7, z], [xs, h * 0.7, zs], g * 0.45, color);
  });
}

export function mallaEstatica(plano) {
  const opaca = crearMalla();
  const vidrio = crearMalla();
  const { x0, z0, x1, z1, radio } = plano.limites;
  const extra = radio * 0.9 + 6;
  opaca.caja(x0 - extra, -0.2, z0 - extra, x1 + extra, 0, z1 + extra, COLORES.suelo);
  for (const zona of plano.zonas) {
    opaca.caja(zona.x0, 0, zona.z0, zona.x1, 0.03, zona.z1, COLORES.piso);
    const colorCama = zona.tipo === "germinacion" ? COLORES.mesa : COLORES.cama;
    for (const cama of zona.camas) opaca.caja(cama.x0, 0.03, cama.z0, cama.x1, Math.max(0.05, cama.h), cama.z1, colorCama);
    estructura(opaca, vidrio, zona);
  }
  return {
    opaca: new Float32Array(opaca.datos),
    vidrio: new Float32Array(vidrio.datos),
  };
}

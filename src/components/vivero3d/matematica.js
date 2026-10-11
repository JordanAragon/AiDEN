/*
  Álgebra mínima para la cámara del vivero en 3D. Matrices de 4×4 en orden de
  columnas (el que espera WGSL en mat4x4f) y profundidad de WebGPU (0 a 1).
  La misma cámara sirve al motor WebGPU y al respaldo en Canvas 2D, así las
  etiquetas y los dos dibujos coinciden punto por punto.
*/

export function restar(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function cruz(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function normalizar(v) {
  const largo = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / largo, v[1] / largo, v[2] / largo];
}

export function mezclar(a, b, t) {
  return a.map((valor, i) => valor + (b[i] - valor) * t);
}

export function suavizar(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function perspectiva(fovY, aspecto, cerca, lejos) {
  const f = 1 / Math.tan(fovY / 2);
  const rango = 1 / (cerca - lejos);
  const m = new Float32Array(16);
  m[0] = f / aspecto;
  m[5] = f;
  m[10] = lejos * rango;
  m[11] = -1;
  m[14] = cerca * lejos * rango;
  return m;
}

export function mirarA(ojo, objetivo, arriba = [0, 1, 0]) {
  const z = normalizar(restar(ojo, objetivo));
  const x = normalizar(cruz(arriba, z));
  const y = cruz(z, x);
  const m = new Float32Array(16);
  m[0] = x[0];
  m[1] = y[0];
  m[2] = z[0];
  m[4] = x[1];
  m[5] = y[1];
  m[6] = z[1];
  m[8] = x[2];
  m[9] = y[2];
  m[10] = z[2];
  m[12] = -(x[0] * ojo[0] + x[1] * ojo[1] + x[2] * ojo[2]);
  m[13] = -(y[0] * ojo[0] + y[1] * ojo[1] + y[2] * ojo[2]);
  m[14] = -(z[0] * ojo[0] + z[1] * ojo[1] + z[2] * ojo[2]);
  m[15] = 1;
  return m;
}

export function multiplicar(a, b) {
  const m = new Float32Array(16);
  for (let columna = 0; columna < 4; columna += 1) {
    for (let fila = 0; fila < 4; fila += 1) {
      let suma = 0;
      for (let k = 0; k < 4; k += 1) suma += a[k * 4 + fila] * b[columna * 4 + k];
      m[columna * 4 + fila] = suma;
    }
  }
  return m;
}

/* Cámara completa: matriz vista-proyección y su posición, para luz y niebla. */
export function camara({ ojo, objetivo, aspecto, fov = 0.72 }) {
  const vista = mirarA(ojo, objetivo);
  const proyeccion = perspectiva(fov, aspecto, 0.5, 400);
  return { vp: multiplicar(proyeccion, vista), ojo, objetivo };
}

/* Proyecta un punto del mundo a píxeles CSS del lienzo. */
export function proyectar(vp, punto, ancho, alto) {
  const [x, y, z] = punto;
  const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
  const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
  const cz = vp[2] * x + vp[6] * y + vp[10] * z + vp[14];
  const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
  if (cw <= 0.0001) return { x: 0, y: 0, profundidad: 1, visible: false, detras: true };
  const nx = cx / cw;
  const ny = cy / cw;
  return {
    x: (nx * 0.5 + 0.5) * ancho,
    y: (1 - (ny * 0.5 + 0.5)) * alto,
    profundidad: cz / cw,
    visible: nx > -1.15 && nx < 1.15 && ny > -1.15 && ny < 1.15,
    detras: false,
  };
}

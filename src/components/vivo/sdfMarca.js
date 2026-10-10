import { CAJA_ISOTIPO, TRAZOS_ISOTIPO } from "./isotipoTrazos";

/*
  Campo de distancia (SDF) del isotipo, generado en el navegador a partir de los
  trazos oficiales: el motor lo usa para que el enjambre de plantas o el vidrio
  tomen la forma exacta del símbolo. Sin archivo extra ni servicio externo.

  Formato que espera el motor: 512 × 512, fila 0 arriba, distancia con signo en
  unidades de textura (negativa dentro), empaquetada en Uint16 ((d + 1) · 32767,5).
*/

const LADO = 512;
const MARGEN = 0.08;
// Ranura entre piezas (montaña, cinta, hoja, esfera), en píxeles del campo:
// conserva la estructura del símbolo cuando se dibuja con partículas o vidrio.
const RANURA = 5;
const INFINITO = 1e20;

const GRUPOS = [
  [TRAZOS_ISOTIPO.montana],
  [TRAZOS_ISOTIPO.cinta],
  [TRAZOS_ISOTIPO.hojaBaja, TRAZOS_ISOTIPO.hojaAlta],
  [TRAZOS_ISOTIPO.esfera, TRAZOS_ISOTIPO.esferaSombra],
];

// Transformada de distancia exacta en 1D (Felzenszwalb y Huttenlocher, 2012).
function distancia1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -INFINITO;
  z[1] = INFINITO;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INFINITO;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    const r = q - v[k];
    d[q] = r * r + f[v[k]];
  }
}

// Distancia euclídea al cuadrado hasta el píxel semilla más cercano (semilla = 0).
function distancia2d(rejilla) {
  const f = new Float64Array(LADO);
  const d = new Float64Array(LADO);
  const v = new Int32Array(LADO);
  const z = new Float64Array(LADO + 1);
  for (let x = 0; x < LADO; x += 1) {
    for (let y = 0; y < LADO; y += 1) f[y] = rejilla[y * LADO + x];
    distancia1d(f, LADO, d, v, z);
    for (let y = 0; y < LADO; y += 1) rejilla[y * LADO + x] = d[y];
  }
  for (let y = 0; y < LADO; y += 1) {
    const fila = y * LADO;
    for (let x = 0; x < LADO; x += 1) f[x] = rejilla[fila + x];
    distancia1d(f, LADO, d, v, z);
    for (let x = 0; x < LADO; x += 1) rejilla[fila + x] = d[x];
  }
}

/*
  Silueta del isotipo en un cuadro de `lado` píxeles (alfa por píxel), con la
  ranura entre piezas. La usan el campo de distancia y el sembrado del hero.
*/
export function rasterizar(lado = LADO, margen = MARGEN, ranura = RANURA) {
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  const [x0, y0, ancho, alto] = CAJA_ISOTIPO;
  const escala = (lado * (1 - 2 * margen)) / Math.max(ancho, alto);
  ctx.setTransform(escala, 0, 0, escala, (lado - ancho * escala) / 2 - x0 * escala, (lado - alto * escala) / 2 - y0 * escala);
  ctx.lineJoin = "round";
  ctx.lineWidth = (ranura * 2) / escala;
  for (const grupo of GRUPOS) {
    const trazos = grupo.map((d) => new Path2D(d));
    // Primero se abre la ranura sobre lo ya dibujado, luego se rellena el grupo:
    // la ranura solo queda donde el grupo toca a los anteriores.
    ctx.globalCompositeOperation = "destination-out";
    for (const trazo of trazos) ctx.stroke(trazo);
    ctx.globalCompositeOperation = "source-over";
    for (const trazo of trazos) ctx.fill(trazo);
  }
  return ctx.getImageData(0, 0, lado, lado).data;
}

function generar() {
  const pixeles = rasterizar();
  const total = LADO * LADO;
  const haciaDentro = new Float64Array(total);
  const haciaFuera = new Float64Array(total);
  for (let i = 0; i < total; i += 1) {
    const dentro = pixeles[i * 4 + 3] >= 128;
    haciaDentro[i] = dentro ? 0 : INFINITO;
    haciaFuera[i] = dentro ? INFINITO : 0;
  }
  distancia2d(haciaDentro);
  distancia2d(haciaFuera);
  const campo = new Uint16Array(total);
  for (let i = 0; i < total; i += 1) {
    const fuera = haciaFuera[i] === 0;
    const pixelesBorde = fuera ? Math.sqrt(haciaDentro[i]) - 0.5 : -(Math.sqrt(haciaFuera[i]) - 0.5);
    const d = Math.max(-1, Math.min(1, pixelesBorde / LADO));
    campo[i] = Math.round((d + 1) * 32767.5);
  }
  return URL.createObjectURL(new Blob([campo.buffer], { type: "application/octet-stream" }));
}

let pendiente = null;

/* URL (blob:) del campo del isotipo; se genera una sola vez por visita. */
export function sdfIsotipo() {
  if (!pendiente) {
    pendiente = new Promise((resolver, rechazar) => {
      const correr = () => {
        try {
          resolver(generar());
        } catch (error) {
          pendiente = null;
          rechazar(error);
        }
      };
      if ("requestIdleCallback" in window) window.requestIdleCallback(correr, { timeout: 400 });
      else window.setTimeout(correr, 0);
    });
  }
  return pendiente;
}

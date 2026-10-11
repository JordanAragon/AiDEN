import { proyectar } from "./matematica";
import { FLOTANTES_POR_PLANTA } from "./planoVivero";

/*
  El vivero sin WebGPU: la misma cámara y el mismo plano dibujados en Canvas 2D.
  Cada planta es un punto (como en el isotipo sembrado) y cada estructura, su
  contorno. Se ve en cualquier navegador y mientras el motor carga.
*/

const ETAPA = ["#c9df7a", "#9dc068", "#769c56", "#587f45"];
const LIMA = "#d9ea73";
const FONDO = "#071b11";
const LINEA = "rgba(201, 207, 187, 0.34)";
const LINEA_SUAVE = "rgba(201, 207, 187, 0.16)";

function trazar(ctx, puntos) {
  if (puntos.some((punto) => punto.detras)) return false;
  ctx.moveTo(puntos[0].x, puntos[0].y);
  for (let i = 1; i < puntos.length; i += 1) ctx.lineTo(puntos[i].x, puntos[i].y);
  return true;
}

export function dibujarRespaldo(lienzo, plano, vp, { resaltado = -1 } = {}) {
  const ctx = lienzo.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const ancho = lienzo.clientWidth;
  const alto = lienzo.clientHeight;
  if (!ancho || !alto) return;
  if (lienzo.width !== Math.round(ancho * dpr) || lienzo.height !== Math.round(alto * dpr)) {
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, ancho, alto);
  const p = (x, y, z) => proyectar(vp, [x, y, z], ancho, alto);

  // Pisos y estructuras.
  for (const zona of plano.zonas) {
    const { x0, z0, x1, z1, altura: h, cumbrera: r, tipo } = zona;
    ctx.beginPath();
    if (trazar(ctx, [p(x0, 0, z0), p(x1, 0, z0), p(x1, 0, z1), p(x0, 0, z1)])) {
      ctx.closePath();
      ctx.fillStyle = "rgba(18, 55, 34, 0.9)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.strokeStyle = LINEA;
    ctx.lineWidth = 1;
    const zm = (z0 + z1) / 2;
    if (tipo === "invernadero") {
      trazar(ctx, [p(x0, h, z0), p(x1, h, z0)]);
      trazar(ctx, [p(x0, h, z1), p(x1, h, z1)]);
      trazar(ctx, [p(x0, r, zm), p(x1, r, zm)]);
      trazar(ctx, [p(x0, 0, z1), p(x0, h, z1), p(x0, r, zm), p(x0, h, z0), p(x0, 0, z0)]);
      trazar(ctx, [p(x1, 0, z1), p(x1, h, z1), p(x1, r, zm), p(x1, h, z0), p(x1, 0, z0)]);
    } else {
      const techo = tipo === "campo" ? h * 0.7 : h;
      trazar(ctx, [p(x0, techo, z0), p(x1, techo, z0), p(x1, techo, z1), p(x0, techo, z1), p(x0, techo, z0)]);
      for (const [x, z] of [
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
      ])
        trazar(ctx, [p(x, 0, z), p(x, h, z)]);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = LINEA_SUAVE;
    for (const cama of zona.camas) trazar(ctx, [p(cama.x0, cama.h, cama.z0), p(cama.x1, cama.h, cama.z0), p(cama.x1, cama.h, cama.z1), p(cama.x0, cama.h, cama.z1), p(cama.x0, cama.h, cama.z0)]);
    ctx.stroke();
  }

  // Plantas: de atrás hacia adelante, un punto por planta.
  const puntos = [];
  for (let i = 0; i < plano.cantidad; i += 1) {
    const o = i * FLOTANTES_POR_PLANTA;
    const altura = plano.plantas[o + 3];
    const base = p(plano.plantas[o], plano.plantas[o + 1], plano.plantas[o + 2]);
    if (!base.visible) continue;
    const copa = p(plano.plantas[o], plano.plantas[o + 1] + altura * 0.75, plano.plantas[o + 2]);
    puntos.push({ x: copa.x, y: copa.y, z: copa.profundidad, r: Math.max(0.7, Math.min(4, Math.abs(base.y - copa.y) * 0.32)), etapa: plano.plantas[o + 4], lote: plano.plantas[o + 5] });
  }
  puntos.sort((a, b) => b.z - a.z);
  for (const punto of puntos) {
    const enFoco = resaltado < 0 || punto.lote === resaltado;
    ctx.globalAlpha = enFoco ? 0.92 : 0.28;
    ctx.fillStyle = resaltado >= 0 && punto.lote === resaltado ? LIMA : ETAPA[punto.etapa] || ETAPA[2];
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, punto.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Viñeta, como la presentación del motor.
  const vineta = ctx.createRadialGradient(ancho / 2, alto * 0.46, Math.min(ancho, alto) * 0.3, ancho / 2, alto * 0.46, Math.max(ancho, alto) * 0.75);
  vineta.addColorStop(0, "rgba(7, 27, 17, 0)");
  vineta.addColorStop(1, "rgba(7, 27, 17, 0.82)");
  ctx.fillStyle = vineta;
  ctx.fillRect(0, 0, ancho, alto);
}

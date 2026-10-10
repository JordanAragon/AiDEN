import { useEffect, useRef } from "react";
import { rasterizar } from "./sdfMarca";

/*
  El isotipo sembrado: una planta por cada planta viva del vivero, en tresbolillo
  (la rejilla hexagonal con que se siembra en cama) dentro de la silueta exacta
  del símbolo. Al entrar brota en ola desde la base de la hoja; luego se mece con
  la brisa y se aparta del cursor como un cultivo con viento, y vuelve a su sitio.

  Canvas 2D: no depende de WebGPU, así que también acompaña al respaldo. Con
  movimiento reducido se dibuja una sola vez, quieto. Fuera de pantalla se pausa.
*/

const RESOLUCION_MASCARA = 256;

// Generador determinista: el mismo sembrado en cada visita.
function aleatorio(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sembrar(plantas) {
  const lado = RESOLUCION_MASCARA;
  const alfa = rasterizar(lado, 0.04, 2.5);
  const dentro = (x, y) => {
    const px = Math.floor(x * lado);
    const py = Math.floor(y * lado);
    if (px < 0 || py < 0 || px >= lado || py >= lado) return false;
    return alfa[(py * lado + px) * 4 + 3] >= 128;
  };
  let area = 0;
  for (let i = 3; i < alfa.length; i += 4) if (alfa[i] >= 128) area += 1;
  area /= lado * lado;
  // Tresbolillo un poco más apretado de lo justo; luego se ralea hasta el número exacto.
  const paso = Math.sqrt((2 * area) / (Math.sqrt(3) * plantas * 1.08));
  const azar = aleatorio(4894);
  const candidatas = [];
  const filaAlto = (paso * Math.sqrt(3)) / 2;
  for (let fila = 0, y = filaAlto / 2; y < 1; fila += 1, y += filaAlto) {
    for (let x = (fila % 2) * (paso / 2); x < 1; x += paso) {
      const jx = x + (azar() - 0.5) * paso * 0.35;
      const jy = y + (azar() - 0.5) * paso * 0.35;
      if (dentro(jx, jy)) candidatas.push([jx, jy]);
    }
  }
  for (let i = candidatas.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
  }
  return candidatas.slice(0, plantas).map(([x, y]) => ({
    x0: x,
    y0: y,
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    fase: azar() * Math.PI * 2,
    tono: azar(),
    // La ola de brote sale de la base de la hoja (abajo a la izquierda).
    brote: (x * 0.55 + (1 - y) * 0.45) * 1.25 + azar() * 0.18,
  }));
}

export default function SembradoIsotipo({ plantas = 4894, className = "" }) {
  const lienzoRef = useRef(null);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return undefined;
    const contexto = lienzo.getContext("2d");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conPuntero = window.matchMedia("(pointer: fine)").matches;
    const marco = lienzo.closest("[data-sembrado-marco]") || lienzo.parentElement;
    const puntos = sembrar(plantas);
    const raton = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let lado = 0;
    let dpr = 1;
    let cuadro = 0;
    let visible = true;
    let inicio = 0;
    let anterior = 0;

    const medir = () => {
      const caja = lienzo.getBoundingClientRect();
      lado = Math.max(1, Math.min(caja.width, caja.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      lienzo.width = Math.round(lado * dpr);
      lienzo.height = Math.round(lado * dpr);
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const radioBase = () => Math.max(0.9, lado / 300);

    const pintar = (tiempo) => {
      contexto.clearRect(0, 0, lado, lado);
      const r = radioBase();
      // Dos capas de color: lima viva y un musgo más quieto que da profundidad.
      for (const capa of [0, 1]) {
        contexto.beginPath();
        for (const p of puntos) {
          if ((p.tono > 0.86) !== Boolean(capa)) continue;
          const crecido = reducido ? 1 : Math.min(1, Math.max(0, (tiempo - p.brote) / 0.55));
          if (crecido <= 0) continue;
          const suave = 1 - (1 - crecido) ** 3;
          const radio = r * (0.75 + p.tono * 0.5) * suave;
          const x = p.x * lado;
          const y = p.y * lado;
          contexto.moveTo(x + radio, y);
          contexto.arc(x, y, radio, 0, Math.PI * 2);
        }
        contexto.fillStyle = capa ? "rgba(113, 139, 88, 0.95)" : "rgba(217, 234, 115, 0.92)";
        contexto.fill();
      }
    };

    const avanzar = (dt, tiempo) => {
      const radio = 0.11;
      const radio2 = radio * radio;
      for (const p of puntos) {
        // Brisa: una ola que cruza el cultivo de izquierda a derecha.
        const brisa = Math.sin(tiempo * 1.3 - p.x0 * 7 + p.fase * 0.35) * 0.0028;
        let fx = (p.x0 + brisa - p.x) * 38;
        let fy = (p.y0 + brisa * 0.35 - p.y) * 38;
        const dx = p.x - raton.x;
        const dy = p.y - raton.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < radio2) {
          const d = Math.sqrt(d2) || 1e-4;
          const empuje = (1 - d / radio) ** 2 * 9;
          fx += (dx / d) * empuje + raton.vx * 0.9 * (1 - d / radio);
          fy += (dy / d) * empuje + raton.vy * 0.9 * (1 - d / radio);
        }
        p.vx = (p.vx + fx * dt) * Math.exp(-7 * dt);
        p.vy = (p.vy + fy * dt) * Math.exp(-7 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      raton.vx *= Math.exp(-6 * dt);
      raton.vy *= Math.exp(-6 * dt);
    };

    const cuadroSiguiente = (marca) => {
      cuadro = 0;
      if (!visible) return;
      if (!inicio) inicio = marca;
      const dt = anterior ? Math.min(0.033, (marca - anterior) / 1000) : 0.016;
      anterior = marca;
      const tiempo = (marca - inicio) / 1000;
      avanzar(dt, tiempo);
      pintar(tiempo);
      cuadro = window.requestAnimationFrame(cuadroSiguiente);
    };

    const despertar = () => {
      if (reducido || cuadro || !visible) return;
      anterior = 0;
      cuadro = window.requestAnimationFrame(cuadroSiguiente);
    };

    const moverRaton = (evento) => {
      const caja = lienzo.getBoundingClientRect();
      const x = (evento.clientX - caja.left) / caja.width;
      const y = (evento.clientY - caja.top) / caja.height;
      if (raton.x > -1) {
        raton.vx = (x - raton.x) * 60;
        raton.vy = (y - raton.y) * 60;
      }
      raton.x = x;
      raton.y = y;
    };
    const salirRaton = () => {
      raton.x = -9999;
      raton.y = -9999;
    };

    medir();
    if (reducido) pintar(99);
    const observador = new IntersectionObserver((entradas) => {
      visible = entradas.some((entrada) => entrada.isIntersecting);
      if (visible) despertar();
    });
    observador.observe(lienzo);
    const alRedimensionar = () => {
      medir();
      if (reducido) pintar(99);
    };
    window.addEventListener("resize", alRedimensionar, { passive: true });
    if (conPuntero && !reducido) {
      marco.addEventListener("pointermove", moverRaton, { passive: true });
      marco.addEventListener("pointerleave", salirRaton, { passive: true });
    }
    despertar();

    return () => {
      observador.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      marco.removeEventListener("pointermove", moverRaton);
      marco.removeEventListener("pointerleave", salirRaton);
      if (cuadro) window.cancelAnimationFrame(cuadro);
    };
  }, [plantas]);

  return <canvas ref={lienzoRef} className={`aiden-sembrado ${className}`} aria-hidden="true" />;
}

import { useEffect, useRef } from "react";

/*
  El campo vivo del marco del hero: un punto por cada planta viva del lote
  (420), ordenados como camas de cultivo que respiran y se apartan suaves
  del cursor. Canvas 2D puro, decorativo (aria-hidden), apagado con
  movimiento reducido o sin puntero fino, y pausado fuera de pantalla.
*/
export default function CampoVivo({ plantas = 420 }) {
  const lienzoRef = useRef(null);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return undefined;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const contexto = lienzo.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const raton = { x: -9999, y: -9999 };
    const conPuntero = window.matchMedia("(pointer: fine)").matches;
    let puntos = [];
    let ancho = 0;
    let alto = 0;
    let cuadro = 0;
    let visible = true;
    let tiempo = Math.random() * 1000;
    let marcaAnterior = 0;

    const sembrar = () => {
      const caja = lienzo.parentElement.getBoundingClientRect();
      ancho = Math.max(1, caja.width);
      alto = Math.max(1, caja.height);
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Camas de cultivo: filas apretadas, columnas con calle cada 8 plantas.
      const columnas = Math.ceil(Math.sqrt(plantas * (ancho / alto)));
      const filas = Math.ceil(plantas / columnas);
      const pasoX = ancho / (columnas + 1);
      const pasoY = alto / (filas + 1);
      puntos = [];
      for (let i = 0; i < plantas; i += 1) {
        const c = i % columnas;
        const f = Math.floor(i / columnas);
        const calle = Math.floor(c / 8) * pasoX * 0.35;
        puntos.push({
          x0: pasoX * (c + 1) + calle * 0.4 + (Math.random() - 0.5) * pasoX * 0.3,
          y0: pasoY * (f + 1) + (Math.random() - 0.5) * pasoY * 0.3,
          x: 0,
          y: 0,
          r: 1 + Math.random() * 1.6,
          fase: Math.random() * Math.PI * 2,
          tono: Math.random(),
        });
      }
      for (const p of puntos) {
        p.x = p.x0;
        p.y = p.y0;
      }
    };

    const pintar = (marca = 0) => {
      cuadro = 0;
      if (!visible) return;
      const delta = marcaAnterior ? Math.min(0.05, (marca - marcaAnterior) / 1000) : 0.016;
      marcaAnterior = marca;
      tiempo += delta;
      contexto.clearRect(0, 0, ancho, alto);
      for (const p of puntos) {
        // Respiración del cultivo más la huida suave del cursor.
        const brisaX = Math.sin(tiempo * 0.7 + p.fase) * 1.4;
        const brisaY = Math.cos(tiempo * 0.5 + p.fase * 1.3) * 1.1;
        let dx = p.x0 + brisaX - p.x;
        let dy = p.y0 + brisaY - p.y;
        if (conPuntero) {
          const rx = p.x - raton.x;
          const ry = p.y - raton.y;
          const d2 = rx * rx + ry * ry;
          if (d2 < 10000) {
            const d = Math.sqrt(d2) || 1;
            const fuerza = ((100 - d) / 100) * 26;
            dx += (rx / d) * fuerza;
            dy += (ry / d) * fuerza;
          }
        }
        p.x += dx * 0.08;
        p.y += dy * 0.08;
        const alfa = 0.25 + p.tono * 0.45;
        contexto.fillStyle = p.tono > 0.82 ? `rgba(217, 234, 115, ${alfa})` : `rgba(113, 139, 88, ${alfa})`;
        contexto.beginPath();
        contexto.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        contexto.fill();
      }
      if (!reducido) cuadro = window.requestAnimationFrame(pintar);
    };

    const despertar = () => {
      if (!cuadro && visible) cuadro = window.requestAnimationFrame(pintar);
    };

    const moverRaton = (evento) => {
      const caja = lienzo.getBoundingClientRect();
      raton.x = evento.clientX - caja.left;
      raton.y = evento.clientY - caja.top;
    };
    const salirRaton = () => {
      raton.x = -9999;
      raton.y = -9999;
    };

    const observador = new IntersectionObserver((entradas) => {
      visible = entradas.some((e) => e.isIntersecting);
      if (visible) despertar();
    });
    observador.observe(lienzo);

    sembrar();
    despertar();
    window.addEventListener("resize", sembrar, { passive: true });
    if (reducido) {
      const repintar = () => {
        sembrar();
        pintar();
      };
      window.addEventListener("resize", repintar, { passive: true });
      return () => {
        observador.disconnect();
        window.removeEventListener("resize", sembrar);
        window.removeEventListener("resize", repintar);
      };
    }
    if (conPuntero) {
      lienzo.parentElement.addEventListener("pointermove", moverRaton, { passive: true });
      lienzo.parentElement.addEventListener("pointerleave", salirRaton, { passive: true });
    }
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", sembrar);
      if (conPuntero) {
        lienzo.parentElement?.removeEventListener("pointermove", moverRaton);
        lienzo.parentElement?.removeEventListener("pointerleave", salirRaton);
      }
      if (cuadro) window.cancelAnimationFrame(cuadro);
    };
  }, [plantas]);

  return <canvas ref={lienzoRef} className="aiden-campo-vivo" aria-hidden="true" />;
}

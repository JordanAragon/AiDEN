import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { adaptadorDisponible, hayWebGpu, useMovimientoReducido } from "../vivo/soporte";
import { camara, proyectar } from "./matematica";
import { dibujarRespaldo } from "./respaldoVivero";
import "../../estilos/vivero3d.css";

/*
  El vivero en 3D. Primero pinta el respaldo en Canvas 2D (la misma cámara, un
  punto por planta) y, si hay WebGPU, carga el motor de vgpu en su propio chunk
  y lo funde encima cuando dibuja. Las etiquetas son HTML colocadas con la
  proyección de la cámara: siguen a sus lotes en los dos modos.

  La pose de la cámara llega por prop (`pose`, una función del aspecto) o, para
  recorridos con scroll, por el método imperativo `ref.current.fijarPose`, que
  no re-renderiza React en cada cuadro.
*/

function resolver(pose, aspecto) {
  return typeof pose === "function" ? pose(aspecto) : pose;
}

export default function Vivero3D({ ref, plano, pose, resaltado = -1, orbita = 0, etiquetas = [], className = "", alCambiarEstado }) {
  const contenedorRef = useRef(null);
  const respaldoRef = useRef(null);
  const gpuRef = useRef(null);
  const motorRef = useRef(null);
  const etiquetasRef = useRef(new Map());
  const poseRef = useRef(null);
  const resaltadoRef = useRef(resaltado);
  const cuadro2dRef = useRef(0);
  const [cerca, setCerca] = useState(false);
  const [estado, setEstado] = useState("respaldo");
  const quieto = useMovimientoReducido();

  const aspecto = () => {
    const nodo = contenedorRef.current;
    return nodo && nodo.clientHeight ? nodo.clientWidth / nodo.clientHeight : 16 / 9;
  };

  // Coloca cada etiqueta sobre su punto y, si dos se pisan, sube la más lejana.
  const colocarEtiquetas = useCallback((proyectarPunto) => {
    const colocadas = [];
    const lista = [];
    for (const [id, nodo] of etiquetasRef.current) {
      const punto = nodo?.dataset.punto ? JSON.parse(nodo.dataset.punto) : null;
      if (!punto) continue;
      lista.push({ id, nodo, p: proyectarPunto(punto) });
    }
    lista.sort((a, b) => a.p.profundidad - b.p.profundidad);
    for (const { nodo, p } of lista) {
      const fuera = p.detras || !p.visible;
      nodo.dataset.fuera = fuera ? "si" : "no";
      nodo.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      if (fuera) continue;
      const rotulo = nodo.firstElementChild;
      const ancho = rotulo?.offsetWidth || 0;
      const alto = rotulo?.offsetHeight || 0;
      // El rótulo no se sale por los lados del lienzo: se corre hacia adentro (su
      // línea guía se oculta para no apuntar a otro sitio).
      const limite = contenedorRef.current?.clientWidth || 0;
      let correr = 0;
      if (limite) {
        const izquierda = p.x - ancho / 2 - 8;
        const derecha = p.x + ancho / 2 + 8 - limite;
        if (izquierda < 0) correr = -izquierda;
        else if (derecha > 0) correr = -derecha;
      }
      nodo.style.setProperty("--correr", `${Math.round(correr)}px`);
      nodo.dataset.corrida = correr ? "si" : "no";
      const cx = p.x + correr;
      let subir = 0;
      for (let intento = 0; intento < 6; intento += 1) {
        const caja = { x0: cx - ancho / 2, x1: cx + ancho / 2, y1: p.y - 10 - subir, y0: p.y - 10 - subir - alto };
        const choque = colocadas.find((otra) => caja.x0 < otra.x1 && caja.x1 > otra.x0 && caja.y0 < otra.y1 && caja.y1 > otra.y0);
        if (!choque) {
          colocadas.push(caja);
          break;
        }
        // Un rótulo atenuado (de un lote que no está en foco) no se apila: se esconde.
        if (rotulo?.classList.contains("is-atenuado")) {
          nodo.dataset.fuera = "si";
          break;
        }
        subir += caja.y1 - choque.y0 + 4;
      }
      nodo.style.setProperty("--subir", `${Math.round(subir)}px`);
    }
  }, []);

  // Respaldo en Canvas 2D: un cuadro por cambio, agrupado en el siguiente frame.
  const dibujar2d = useCallback(() => {
    if (cuadro2dRef.current || motorRef.current) return;
    cuadro2dRef.current = requestAnimationFrame(() => {
      cuadro2dRef.current = 0;
      const lienzo = respaldoRef.current;
      const posicion = poseRef.current;
      if (!lienzo || !posicion || motorRef.current) return;
      const { vp } = camara({ ...posicion, aspecto: aspecto() });
      dibujarRespaldo(lienzo, plano, vp, { resaltado: resaltadoRef.current });
      colocarEtiquetas((punto) => proyectar(vp, punto, lienzo.clientWidth, lienzo.clientHeight));
    });
  }, [plano, colocarEtiquetas]);

  const fijarPose = useCallback(
    (nueva, inmediato = false) => {
      poseRef.current = nueva;
      if (motorRef.current) motorRef.current.fijarCamara(nueva, inmediato);
      else dibujar2d();
    },
    [dibujar2d],
  );

  useImperativeHandle(
    ref,
    () => ({
      fijarPose,
      aspecto,
      resaltar(indice) {
        resaltadoRef.current = indice;
        if (motorRef.current) motorRef.current.resaltar(indice);
        else dibujar2d();
      },
    }),
    [fijarPose, dibujar2d],
  );

  // Pose por prop.
  useEffect(() => {
    if (pose) fijarPose(resolver(pose, aspecto()), !poseRef.current);
  }, [pose, fijarPose]);

  useEffect(() => {
    resaltadoRef.current = resaltado;
    if (motorRef.current) motorRef.current.resaltar(resaltado);
    else dibujar2d();
  }, [resaltado, dibujar2d]);

  // Redimensionar: el respaldo se redibuja y la pose por prop se recalcula con el nuevo aspecto.
  useEffect(() => {
    const nodo = contenedorRef.current;
    if (!nodo || !("ResizeObserver" in window)) return undefined;
    const observador = new ResizeObserver(() => {
      if (pose) fijarPose(resolver(pose, aspecto()), true);
      else dibujar2d();
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [pose, fijarPose, dibujar2d]);

  // El motor se pide cuando el vivero se acerca a la pantalla.
  useEffect(() => {
    const nodo = contenedorRef.current;
    if (!nodo || cerca) return undefined;
    if (!("IntersectionObserver" in window)) {
      setCerca(true);
      return undefined;
    }
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        setCerca(true);
        observador.disconnect();
      }
    }, { rootMargin: "400px" });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [cerca]);

  useEffect(() => {
    if (!cerca || !hayWebGpu()) return undefined;
    let vigente = true;
    let motor = null;
    (async () => {
      try {
        if (!(await adaptadorDisponible()) || !vigente) return;
        setEstado("cargando");
        const { crearMotorVivero } = await import("./motorVivero");
        if (!vigente || !gpuRef.current) return;
        motor = await crearMotorVivero(gpuRef.current, plano, {
          alFallar: (error) => {
            if (import.meta.env.DEV) console.warn("[vivero3d] el motor falló", error);
            if (!vigente) return;
            motorRef.current?.destruir();
            motorRef.current = null;
            setEstado("sin-gpu");
            dibujar2d();
          },
        });
        if (!vigente) {
          motor.destruir();
          return;
        }
        motorRef.current = motor;
        motor.fijarMovimiento({ brisa: !quieto, orbita: quieto ? 0 : orbita });
        motor.resaltar(resaltadoRef.current);
        motor.alDibujar(() => colocarEtiquetas((punto) => motor.proyectar(punto)));
        motor.fijarCamara(poseRef.current || resolver(pose, aspecto()), true);
        motor.reanudar();
        setEstado("gpu");
      } catch (error) {
        if (import.meta.env.DEV) console.warn("[vivero3d] sin motor", error);
        if (!vigente) return;
        motorRef.current = null;
        setEstado("sin-gpu");
        dibujar2d();
      }
    })();
    return () => {
      vigente = false;
      motor?.destruir();
      if (motorRef.current === motor) motorRef.current = null;
    };
    // La pose y la órbita viven en refs y efectos propios: no recrean el motor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cerca, plano]);

  useEffect(() => {
    motorRef.current?.fijarMovimiento({ brisa: !quieto, orbita: quieto ? 0 : orbita });
    if (motorRef.current) motorRef.current.reanudar();
  }, [quieto, orbita, estado]);

  // Fuera de la pantalla, el motor no dibuja.
  useEffect(() => {
    const nodo = contenedorRef.current;
    if (!nodo || estado !== "gpu" || !("IntersectionObserver" in window)) return undefined;
    const observador = new IntersectionObserver((entradas) => {
      const visible = entradas.some((entrada) => entrada.isIntersecting);
      if (visible) motorRef.current?.reanudar();
      else motorRef.current?.pausar();
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [estado]);

  useEffect(() => {
    alCambiarEstado?.(estado);
  }, [estado, alCambiarEstado]);

  useEffect(() => () => cancelAnimationFrame(cuadro2dRef.current), []);

  return (
    <div ref={contenedorRef} className={`aiden-vivero3d ${className}`} data-estado={estado}>
      <canvas ref={respaldoRef} className="aiden-vivero3d-lienzo" aria-hidden="true" />
      <canvas ref={gpuRef} className="aiden-vivero3d-lienzo aiden-vivero3d-gpu" aria-hidden="true" />
      <div className="aiden-vivero3d-etiquetas" aria-hidden="true">
        {etiquetas.map((etiqueta) => (
          <div
            key={etiqueta.id}
            ref={(nodo) => {
              if (nodo) etiquetasRef.current.set(etiqueta.id, nodo);
              else etiquetasRef.current.delete(etiqueta.id);
            }}
            data-punto={JSON.stringify(etiqueta.punto)}
            data-fuera="si"
            className={`aiden-vivero3d-etiqueta ${etiqueta.className || ""}`}
          >
            {etiqueta.contenido}
          </div>
        ))}
      </div>
    </div>
  );
}

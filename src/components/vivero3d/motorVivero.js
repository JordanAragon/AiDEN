import { draw, effect, frame, frameLoop, geometry, init, sampler, surface, target } from "vgpu";
import { camara, mezclar, proyectar } from "./matematica";
import { COLORES, mallaEstatica, mallaPlanta } from "./geometriaVivero";
import { SOMBREADOR_ESTATICO, SOMBREADOR_PLANTAS, SOMBREADOR_PRESENTAR } from "./sombreadores";

/*
  El motor del vivero en 3D, con vgpu (Vercel Labs, MIT) sobre WebGPU. Dos
  pasadas: la escena con profundidad y MSAA en un objetivo propio, y la
  presentación (viñeta y grano) en el lienzo. Las plantas son una sola llamada
  instanciada: una instancia por planta viva.

  La cámara no salta: el componente pide una pose y el motor llega a ella con
  un amortiguado exponencial. Sin movimiento, el motor no corre en bucle:
  dibuja un cuadro cuando algo cambia.
*/

const LUZ = [0.42, 1, 0.62, 0];
const AMORTIGUADO = 5.5;

export async function crearMotorVivero(lienzoHtml, plano, { alFallar } = {}) {
  const gpu = await init({ powerPreference: "high-performance" });
  let destruido = false;
  const fallar = (error) => {
    if (destruido) return;
    alFallar?.(error);
  };
  gpu.onError?.((error) => fallar(error));
  gpu.device?.lost?.then((info) => {
    if (info?.reason !== "destroyed") fallar(new Error(info?.message || "Se perdió la GPU"));
  });

  const lienzo = surface(gpu, lienzoHtml, { dpr: [1, 1.75] });
  const escenaObjetivo = target(gpu, { size: [lienzo.size[0], lienzo.size[1]], depth: true, msaa: true });

  const planta = mallaPlanta();
  const instancias = plano.cantidad > 0 ? plano.plantas : new Float32Array(8);
  const plantas = draw(gpu, {
    label: "plantas",
    shader: SOMBREADOR_PLANTAS,
    geometry: geometry(gpu, {
      buffers: [
        { attributes: { local: "float32x3", normalLocal: "float32x3", parte: "float32" }, data: planta.datos },
        { attributes: { base: "float32x4", datos: "float32x4" }, data: instancias, stepMode: "instance" },
      ],
    }),
    instances: plano.cantidad,
  });

  const estatica = mallaEstatica(plano);
  const atributosEstaticos = { posicion: "float32x3", normal: "float32x3", color: "float32x4" };
  const suelo = draw(gpu, {
    label: "estructura",
    shader: SOMBREADOR_ESTATICO,
    geometry: geometry(gpu, { buffers: [{ attributes: atributosEstaticos, data: estatica.opaca }] }),
  });
  const vidrio = estatica.vidrio.length
    ? draw(gpu, {
        label: "vidrio",
        shader: SOMBREADOR_ESTATICO,
        geometry: geometry(gpu, { buffers: [{ attributes: atributosEstaticos, data: estatica.vidrio }] }),
        blend: "alpha",
        depth: { write: false, compare: "less-equal" },
      })
    : null;

  const presentar = effect(gpu, SOMBREADOR_PRESENTAR, {
    set: {
      escenaColor: escenaObjetivo,
      muestreo: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
      post: { ajustes: [0, 0.035, 0.85, 0] },
    },
  });

  // La presentación compila en su primer cuadro: el lienzo solo es objetivo dentro de frame().
  await Promise.all([plantas.compile(escenaObjetivo), suelo.compile(escenaObjetivo), vidrio?.compile(escenaObjetivo)]);

  // ---- Estado ------------------------------------------------------------
  const nieblaLejos = plano.limites.radio * 3.4 + 18;
  let aspecto = lienzo.size[0] / Math.max(1, lienzo.size[1]);
  let deseada = null;
  let actual = null;
  let resaltado = -1;
  let brisa = 1;
  let orbita = 0;
  let angulo = 0;
  let tiempo = 0;
  let vp = new Float32Array(16);
  let bucle = null;
  let pendiente = 0;
  const oyentes = new Set();

  lienzo.onResize(({ width, height }) => {
    escenaObjetivo.resize([width, height]);
    aspecto = width / Math.max(1, height);
  });

  function poseConOrbita(pose) {
    if (!orbita && !angulo) return pose;
    const [ox, , oz] = pose.objetivo;
    const dx = pose.ojo[0] - ox;
    const dz = pose.ojo[2] - oz;
    const c = Math.cos(angulo);
    const s = Math.sin(angulo);
    return { ojo: [ox + dx * c - dz * s, pose.ojo[1], oz + dx * s + dz * c], objetivo: pose.objetivo };
  }

  function pasadas(f) {
    f.pass({ target: escenaObjetivo, clear: COLORES.fondo, clearDepth: 1 }, (p) => {
      p.draw(suelo);
      p.draw(plantas);
      if (vidrio) p.draw(vidrio);
    });
    f.pass(lienzo, presentar);
  }

  // Dentro del bucle se usa el cuadro que da frameLoop; fuera, uno propio.
  function dibujar(dt, cuadro = null) {
    if (destruido || !actual) return;
    if (deseada) {
      const k = dt > 0 ? 1 - Math.exp(-dt * AMORTIGUADO) : 1;
      actual = { ojo: mezclar(actual.ojo, deseada.ojo, k), objetivo: mezclar(actual.objetivo, deseada.objetivo, k) };
    }
    angulo += orbita * dt;
    const pose = poseConOrbita(actual);
    const cam = camara({ ...pose, aspecto });
    vp = cam.vp;
    const valores = {
      escena: {
        vp,
        ojo: [...pose.ojo, 1],
        luz: LUZ,
        fondo: COLORES.fondo,
        ajustes: [tiempo, resaltado, brisa, nieblaLejos],
      },
    };
    plantas.set(valores);
    suelo.set(valores);
    vidrio?.set(valores);
    presentar.set({ post: { ajustes: [tiempo % 100, 0.035, 0.85, 0] } });
    if (cuadro) pasadas(cuadro);
    else frame(gpu, pasadas);
    for (const oyente of oyentes) oyente();
  }

  // Un cuadro a pedido (sin bucle): se agrupan los cambios del mismo cuadro.
  function pedirCuadro() {
    if (bucle || pendiente || destruido) return;
    pendiente = requestAnimationFrame(() => {
      pendiente = 0;
      const enMovimiento = deseada && actual && Math.hypot(...actual.ojo.map((v, i) => v - deseada.ojo[i])) > 0.01;
      try {
        dibujar(enMovimiento ? 1 / 60 : 0);
      } catch (error) {
        fallar(error);
        return;
      }
      if (enMovimiento) pedirCuadro();
    });
  }

  function iniciarBucle() {
    if (bucle || destruido) return;
    let anterior = performance.now();
    bucle = frameLoop(gpu, (cuadro) => {
      const ahora = performance.now();
      const dt = Math.min(0.05, (ahora - anterior) / 1000);
      anterior = ahora;
      tiempo += dt;
      try {
        dibujar(dt, cuadro);
      } catch (error) {
        detenerBucle();
        fallar(error);
      }
    });
  }

  function detenerBucle() {
    bucle?.stop();
    bucle = null;
  }

  const animado = () => brisa > 0 || orbita !== 0;

  return {
    plano,
    fijarCamara(pose, inmediato = false) {
      deseada = pose;
      if (inmediato || !actual) actual = pose;
      pedirCuadro();
    },
    resaltar(indice) {
      resaltado = Number.isInteger(indice) ? indice : -1;
      pedirCuadro();
    },
    fijarMovimiento({ brisa: conBrisa = true, orbita: velocidad = 0 } = {}) {
      brisa = conBrisa ? 1 : 0;
      orbita = velocidad;
      if (!animado()) {
        detenerBucle();
        pedirCuadro();
      }
    },
    reanudar() {
      if (animado()) iniciarBucle();
      else pedirCuadro();
    },
    pausar() {
      detenerBucle();
    },
    proyectar(punto) {
      const { clientWidth: ancho, clientHeight: alto } = lienzoHtml;
      return proyectar(vp, punto, ancho, alto);
    },
    alDibujar(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    destruir() {
      destruido = true;
      detenerBucle();
      if (pendiente) cancelAnimationFrame(pendiente);
      oyentes.clear();
      try {
        lienzo.dispose();
        gpu.dispose?.();
      } catch {
        // La GPU ya pudo haberse liberado: no hay nada más que soltar.
      }
    },
  };
}

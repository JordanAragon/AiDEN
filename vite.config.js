import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const EXTENSIONES_PRECARGA = /\.(html|js|css|woff2|png|ico|svg|webmanifest)$/;
// Imágenes para redes e íconos de instalación: el sistema los pide aparte y no hacen
// falta para trabajar sin conexión. Tampoco el motor de las escenas vivas: es
// decorativo, pesa y sin conexión la landing usa su respaldo en CSS.
const EXCLUIR_PRECARGA = /^(marca\/|icon-512|icon-maskable|apple-touch-icon|assets\/(motor-vivo|Escena)[\w-]*\.js)/;

function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

// Publica /sw.js con la lista exacta de archivos del build, para que toda la app
// (incluidas las vistas diferidas) quede disponible sin conexión tras la primera visita.
function trabajadorSinConexion() {
  let salida = "dist";
  return {
    name: "aiden-trabajador-sin-conexion",
    apply: "build",
    configResolved(config) {
      salida = config.build.outDir;
    },
    closeBundle() {
      const precarga = archivos(salida)
        .map((ruta) => relative(salida, ruta).split(sep).join("/"))
        .filter((ruta) => EXTENSIONES_PRECARGA.test(ruta) && !EXCLUIR_PRECARGA.test(ruta) && ruta !== "sw.js")
        .sort();
      const huella = createHash("sha256");
      for (const ruta of precarga) huella.update(ruta).update(readFileSync(join(salida, ruta)));
      const version = huella.digest("hex").slice(0, 12);
      const plantilla = readFileSync(new URL("./src/pwa/sw.plantilla.js", import.meta.url), "utf8");
      const codigo = plantilla
        .replace("const VERSION = __VERSION__;", `const VERSION = ${JSON.stringify(version)};`)
        .replace("const PRECARGA = __PRECARGA__;", `const PRECARGA = ${JSON.stringify(["/", ...precarga.map((ruta) => `/${ruta}`)])};`);
      if (codigo.includes("= __")) throw new Error("sw.plantilla.js: quedó un marcador sin reemplazar");
      writeFileSync(join(salida, "sw.js"), codigo);
    },
  };
}

// El motor de shaders (TypeGPU) prueba si puede compilar código con `new Function("return true")`
// dentro de un try/catch y, si no, usa escritores sin eval. La CSP del sitio no permite
// 'unsafe-eval', así que la prueba fallaría igual, pero Chrome dejaría la violación en la
// consola de cada visita. Se resuelve en el build: el camino sin eval queda fijo.
function motorSinEval() {
  return {
    name: "aiden-motor-sin-eval",
    transform(codigo, id) {
      if (!/[\\/]node_modules[\\/](shaders|typegpu)[\\/]/.test(id) || !codigo.includes('new Function("return true")')) return null;
      return { code: codigo.replaceAll('new Function("return true")', '(() => { throw new EvalError("CSP") })()'), map: null };
    },
  };
}

// La librería de shaders registra sus ~200 componentes en un mapa (para presets en
// JSON, que AiDEN no usa) y además los importa todos por efecto desde su núcleo: el
// tree-shaking no puede quitar ninguno. Aquí el registro y esas importaciones se
// limitan a los componentes que usan las escenas de src/components/vivo/escenas.
const COMPONENTES_VIVOS = new Set([
  "ContourLines",
  "CursorRipples",
  "DotGrid",
  "FilmGrain",
  "FlutedGlass",
  "Fog",
  "Glass",
  "Godrays",
  "ImageTexture",
  "LinearGradient",
  "MeshGradient",
  "RadialGradient",
  "SimplexNoise",
  "SolidColor",
  "Vignette",
]);

function motorRecortado() {
  const esNucleo = /[\\/]node_modules[\\/]shaders[\\/]dist[\\/]core[\\/]/;
  return {
    name: "aiden-motor-recortado",
    apply: "build",
    transform(codigo, id) {
      if (!esNucleo.test(id)) return null;
      if (/[\\/]shaderRegistry-[^\\/]+\.js$/.test(id)) {
        const conservar = new Set();
        let salida = codigo.replace(/^\s*(\w+): (componentDefinition(?:\$\d+)?),?\n/gm, (linea, nombre, variable) => {
          if (COMPONENTES_VIVOS.has(nombre)) {
            conservar.add(variable);
            return linea;
          }
          return "";
        });
        salida = salida.replace(/^import \{ \w+ as (componentDefinition(?:\$\d+)?) \} from "[^"]+";\n/gm, (linea, variable) => (conservar.has(variable) ? linea : ""));
        return { code: salida, map: null };
      }
      if (/[\\/]core[\\/]index\.js$/.test(id)) {
        const salida = codigo.replace(/^import "\.\/([A-Z][A-Za-z0-9]*)-[\w-]+\.js";\n/gm, (linea, nombre) => (COMPONENTES_VIVOS.has(nombre) ? linea : ""));
        return { code: salida, map: null };
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), motorSinEval(), motorRecortado(), trabajadorSinConexion()],
  build: {
    rolldownOptions: {
      output: {
        // Librerías en chunks propios y estables: un cambio en la app no invalida React
        // ni los ~100 KB de las gráficas en la caché de quien ya entró.
        codeSplitting: {
          groups: [
            { name: "react", test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/, priority: 20 },
            // El motor de las escenas vivas (WebGPU): solo lo descarga quien tiene WebGPU.
            { name: "motor-vivo", test: /[\\/]node_modules[\\/](shaders|typegpu|tinyest|tsover-runtime|typed-binary)[\\/]/, priority: 15 },
            // El vivero en 3D (vgpu): lo usan la landing y los tableros, y solo se pide con WebGPU.
            { name: "motor-vivero3d", test: /[\\/]node_modules[\\/](vgpu|@vgpu)[\\/]/, priority: 14 },
            // La lente de vidrio líquido del interruptor de tema.
            { name: "vidrio", test: /[\\/]node_modules[\\/]@samasante[\\/]liquid-glass[\\/]/, priority: 13 },
            {
              name: "graficas",
              test: /[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|@reduxjs|redux|react-redux|immer|reselect|es-toolkit|decimal\.js|eventemitter3|use-sync-external-store|tiny-invariant|clsx)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});

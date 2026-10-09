import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const EXTENSIONES_PRECARGA = /\.(html|js|css|woff2|png|ico|svg|webmanifest)$/;
// Imágenes para redes e íconos de instalación: el sistema los pide aparte y no hacen
// falta para trabajar sin conexión.
const EXCLUIR_PRECARGA = /^(marca\/|icon-512|icon-maskable|apple-touch-icon)/;

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), trabajadorSinConexion()],
});

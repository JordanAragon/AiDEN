// Permite importar src/ desde Node: Vite resuelve imports sin extensión, Node no.
import { register } from "node:module";

register("./cargador.mjs", import.meta.url);

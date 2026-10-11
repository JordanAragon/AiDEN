import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilos/index.css";
import "./estilos/modo-oscuro.css";
import "./estilos/animaciones-app.css";
import "./estilos/experiencia-aiden.css";
import "./estilos/sistema-aiden.css";
import "./estilos/refinamiento-global.css";
import "./estilos/estudio.css";
import App from "./App.jsx";
import { inicializarDatos } from "./datos/almacen";
import { asegurarPersonasDeUsuarios } from "./datos/acciones";
import { ensureInitialUser } from "./utilidades/autenticacion";

let temaGuardado = "light";
try {
  temaGuardado = window.localStorage.getItem("aiden-theme") || "light";
} catch {
  // AiDEN puede iniciar aunque el navegador bloquee el almacenamiento local.
}
document.documentElement.classList.toggle("aiden-dark", temaGuardado === "dark");

try {
  ensureInitialUser();
  inicializarDatos();
  asegurarPersonasDeUsuarios();
} catch (error) {
  console.error("No se pudieron preparar los datos locales de AiDEN", error);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

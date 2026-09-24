import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilos/index.css";
import "./estilos/modo-oscuro.css";
import "./estilos/animaciones-app.css";
import "./estilos/experiencia-aiden.css";
import App from "./App.jsx";

const temaGuardado = localStorage.getItem("aiden-theme");
document.documentElement.classList.toggle(
  "aiden-dark",
  temaGuardado === "dark",
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

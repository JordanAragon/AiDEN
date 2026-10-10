import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MarcoPublico from "../components/landing/MarcoPublico";
import { diaDelCilantro } from "../components/landing/datosPublicos";
import Insignia from "../components/ui/Insignia";
import { generarSemilla } from "../datos/semilla";
import { useTitulo } from "../hooks/useTitulo";

/*
  Planes como página propia, al estilo de la referencia: la landing queda corta
  y aquí se decide con calma. Sin precios inventados: el precio de lanzamiento
  se define en la presentación, y la página lo dice tal cual.
*/

const PLANES = [
  {
    id: "suscripcion",
    nombre: "Suscripción",
    insignia: ["exito", "PARA EMPEZAR"],
    resumen: "El sistema completo por una cuota mensual por vivero.",
    incluye: [
      "Los nueve módulos y el asistente",
      "Actualizaciones y mejoras incluidas",
      "Funciona en los equipos del vivero, también sin conexión",
      "Cancela cuando quieras, sin penalización",
    ],
    para: "Para el vivero que quiere empezar ya, sin inversión inicial.",
  },
  {
    id: "licencia",
    nombre: "Licencia",
    insignia: ["neutral", "PAGO ÚNICO"],
    resumen: "Una licencia por instalación, al estilo del software de escritorio.",
    incluye: [
      "Los nueve módulos y el asistente",
      "Tus datos viven en tus equipos",
      "Soporte y actualizaciones anuales opcionales",
      "Pensada para quien prefiere invertir una vez",
    ],
    para: "Para el vivero que prefiere ser dueño de su herramienta.",
  },
  {
    id: "acompanado",
    nombre: "Acompañado",
    insignia: ["info", "CON EQUIPO"],
    resumen: "AiDEN más la puesta en marcha con tu gente, en tu vivero.",
    incluye: [
      "Implementación guiada zona por zona",
      "Migración del cuaderno y las planillas",
      "Capacitación por rol, en campo",
      "Acompañamiento el primer mes de registros",
    ],
    para: "Para el vivero que quiere llegar con el equipo ya entrenado.",
  },
];

export default function Planes() {
  useTitulo("Planes");
  const datos = useMemo(() => generarSemilla(), []);
  const [elegido, setElegido] = useState("suscripcion");
  const plan = PLANES.find((p) => p.id === elegido);

  return (
    <MarcoPublico diaCilantro={diaDelCilantro(datos)}>
      <section className="aiden-pagina-planes" aria-labelledby="titulo-planes">
        <div className="aiden-shell">
          <header className="aiden-planes-cabecera">
            <div>
              <h1 id="titulo-planes" className="aiden-titulo-pagina">Tres formas de <em>adoptar AiDEN.</em></h1>
              <p>Todas incluyen los nueve módulos y el asistente. Cambian la forma de llegar a tu vivero y el acompañamiento. Elige una para ver a quién le sirve.</p>
            </div>
            <span className="aiden-anillo" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs><path id="anillo-ruta" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
                <text><textPath href="#anillo-ruta">AIDEN · NUEVE MÓDULOS · UN VIVERO · AIDEN · PLANES ·</textPath></text>
              </svg>
            </span>
          </header>

          <div className="aiden-planes-fila" role="radiogroup" aria-label="Formas de adoptar AiDEN">
            {PLANES.map((p) => (
              <article key={p.id} className={elegido === p.id ? "is-elegido" : ""}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={elegido === p.id}
                  className="aiden-plan-selector"
                  onClick={() => setElegido(p.id)}
                >
                  <header><h2>{p.nombre}</h2><Insignia tono={p.insignia[0]}>{p.insignia[1]}</Insignia></header>
                  <p>{p.resumen}</p>
                </button>
                <ul>
                  {p.incluye.map((linea) => <li key={linea}>{linea}</li>)}
                </ul>
              </article>
            ))}
          </div>

          <div className="aiden-plan-detalle" aria-live="polite">
            <p><strong>{plan.nombre}:</strong> {plan.para}</p>
            <Link to="/#contacto" className="aiden-boton aiden-boton-oscuro aiden-boton-grande">
              Hablemos del plan {plan.nombre} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="aiden-planes-banda">
            <p>Precio de lanzamiento: se define contigo en la presentación, según el tamaño del vivero. Sin letra chica.</p>
            <p className="aiden-planes-nota">La presentación se hace sobre un vivero ilustrativo; tus datos quedan en tus equipos y el tratamiento sigue la <Link to="/privacidad">política de privacidad</Link>.</p>
          </div>
        </div>
      </section>
    </MarcoPublico>
  );
}

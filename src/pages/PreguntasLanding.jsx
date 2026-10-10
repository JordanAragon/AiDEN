import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import MarcoPublico from "../components/landing/MarcoPublico";
import { diaDelCilantro } from "../components/landing/datosPublicos";
import { generarSemilla } from "../datos/semilla";
import { useTitulo } from "../hooks/useTitulo";

/*
  Preguntas como página propia: un acordeón accesible en vez de una columna de
  texto corrido. Las respuestas no prometen nada que el producto no haga.
*/

const PREGUNTAS = [
  {
    pregunta: "¿Qué es AiDEN?",
    respuesta:
      "Un sistema de registro y seguimiento para viveros e invernaderos: lotes por etapas, tareas, inventario, lecturas ambientales, incidencias, costos y personal, con la historia de cada lote escrita de principio a fin.",
  },
  {
    pregunta: "¿Qué incluye hoy?",
    respuesta:
      "Los nueve módulos funcionan en el navegador y guardan los datos en ese equipo, también sin conexión. Sensores, sincronización entre equipos e integraciones todavía no están disponibles.",
  },
  {
    pregunta: "¿La historia de la página de inicio es real?",
    respuesta:
      "Es ilustrativa: el vivero del Cauca con que arranca AiDEN, con siete lotes, cuatro zonas y cinco personas. Sin clientes inventados ni cifras de humo; cada pantalla que ves es la que el producto muestra.",
  },
  {
    pregunta: "¿El asistente de la página es el del producto?",
    respuesta:
      "Sí: corre en tu navegador con las mismas reglas del módulo de inteligencia artificial, sobre los registros de ese vivero. Cada respuesta cita el módulo donde se puede verificar.",
  },
  {
    pregunta: "¿Necesito internet en el vivero?",
    respuesta:
      "Para trabajar, no: la aplicación abre y guarda sin conexión en el equipo donde se usa, y queda instalable en la pantalla del celular. Internet hace falta para la primera carga y para las actualizaciones.",
  },
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "El precio de lanzamiento se define contigo en la presentación, según el tamaño del vivero y la forma de adopción (suscripción, licencia o acompañado). Sin letra chica.",
    enlace: ["/planes", "Ver las tres formas de adoptar AiDEN"],
  },
  {
    pregunta: "¿Qué pasa con los datos que dejo en el formulario?",
    respuesta:
      "El formulario pide lo mínimo para responderte y el tratamiento sigue la Ley 1581 de 2012. Los detalles están en la política de privacidad.",
    enlace: ["/privacidad", "Leer la política de privacidad"],
  },
];

export default function PreguntasLanding() {
  useTitulo("Preguntas");
  const datos = useMemo(() => generarSemilla(), []);
  const [abierta, setAbierta] = useState(0);

  return (
    <MarcoPublico diaCilantro={diaDelCilantro(datos)}>
      <section className="aiden-pagina-preguntas" aria-labelledby="titulo-preguntas">
        <div className="aiden-shell aiden-preguntas-grid">
          <div>
            <h1 id="titulo-preguntas" className="aiden-titulo-pagina">Preguntas directas, <em>respuestas directas.</em></h1>
            <p className="aiden-preguntas-intro">Lo que un vivero pregunta antes de agendar la presentación. Si falta la tuya, <Link to="/#contacto">escríbenos</Link>.</p>
            <div className="aiden-liquidacion aiden-esencial" role="group" aria-label="Lo esencial de AiDEN">
              <header>
                <span className="aiden-guia-doc">Lo esencial</span>
                <span className="aiden-guia-folio">AiDEN</span>
              </header>
              <dl>
                <div><dt>Módulos</dt><dd>9</dd></div>
                <div><dt>Roles</dt><dd>3</dd></div>
                <div><dt>Funciona sin conexión</dt><dd>Sí</dd></div>
                <div><dt>Asistente con tus registros</dt><dd>Incluido</dd></div>
              </dl>
              <small>La historia completa está en la <Link to="/">página de inicio</Link>.</small>
            </div>
          </div>
          <div className="aiden-acordeon">
            {PREGUNTAS.map((item, indice) => {
              const abiertaEsta = abierta === indice;
              return (
                <div key={item.pregunta} className={`aiden-acordeon-item ${abiertaEsta ? "is-abierta" : ""}`}>
                  <h2>
                    <button
                      type="button"
                      aria-expanded={abiertaEsta}
                      aria-controls={`respuesta-${indice}`}
                      id={`pregunta-${indice}`}
                      onClick={() => setAbierta(abiertaEsta ? -1 : indice)}
                    >
                      <span>{item.pregunta}</span>
                      <ChevronDown size={17} aria-hidden="true" />
                    </button>
                  </h2>
                  <div
                    id={`respuesta-${indice}`}
                    role="region"
                    aria-labelledby={`pregunta-${indice}`}
                    className="aiden-acordeon-cuerpo"
                    hidden={!abiertaEsta}
                  >
                    <p>{item.respuesta}</p>
                    {item.enlace && <Link to={item.enlace[0]}>{item.enlace[1]}</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MarcoPublico>
  );
}

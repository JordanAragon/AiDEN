import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo";

const PRIVACIDAD = [
  ["Información recopilada", "El sistema puede almacenar la información necesaria para identificar usuarios y operar las funciones disponibles: nombre, correo y contraseña de las cuentas, y los registros operativos (lotes, tareas, lecturas, incidencias, inventario, costos y personal)."],
  ["Dónde se guarda", "En esta versión, las cuentas y los registros operativos se guardan en el almacenamiento local del navegador (localStorage); no se sincronizan con otros equipos. Las contraseñas no se cifran, así que no reutilices una contraseña importante. Las solicitudes del formulario comercial son una excepción y se describen en la sección siguiente."],
  ["Solicitudes comerciales desde la web", "Si solicitas una demostración, se envían tu nombre, organización, correo electrónico y mensaje al servicio de AiDEN, que los entrega al destinatario comercial configurado para el sitio. Estos datos se utilizan para responder a tu solicitud. El tiempo de conservación y el tratamiento posterior dependen del servicio receptor; no envíes información sensible en el formulario."],
  ["Uso de la información", "La información operativa se utiliza para gestionar el acceso y facilitar las funciones disponibles en la aplicación. No hay analítica, publicidad ni cookies de seguimiento."],
  ["Responsabilidad", "Las organizaciones deben administrar los permisos y la información registrada de acuerdo con sus propias políticas internas. Si registras datos de otras personas del equipo, hazlo con su autorización."],
];

const TERMINOS = [
  ["Uso del sistema", "AiDEN está destinado a la gestión y organización de información relacionada con la operación de viveros."],
  ["Versión sin servidor", "Esta versión funciona completamente en el navegador. Los datos existen solo en el equipo donde se registraron: se pierden si se borran los datos del sitio, y no se sincronizan entre usuarios. Desde Configuración se puede exportar un respaldo."],
  ["Credenciales", "Cada usuario debe mantener sus credenciales bajo su responsabilidad y utilizar las funciones correspondientes a su acceso. Las cuentas nuevas entran como operario hasta que administración confirme su rol."],
  ["Información registrada", "La información registrada debe ser utilizada de forma responsable y mantenerse actualizada cuando corresponda. Las alertas, costos y respuestas del asistente se calculan con esos registros; las decisiones siguen siendo de quien opera el vivero."],
];

export default function InformacionLegal() {
  const location = useLocation();
  const navigate = useNavigate();
  const privacidad = location.pathname === "/privacidad";
  const titulo = privacidad ? "Política de Privacidad" : "Términos de Uso";
  useTitulo(titulo);
  const secciones = privacidad ? PRIVACIDAD : TERMINOS;

  return (
    <main className="aiden-public-page aiden-legal-page">
      <article className="aiden-public-card">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="aiden-public-back">
          ← Volver
        </button>
        <header className="aiden-public-heading">
          <p className="aiden-public-eyebrow">AiDEN · Información legal</p>
          <h1>{titulo}</h1>
        </header>
        <div className="aiden-legal-sections">
          {secciones.map(([subtitulo, texto]) => (
            <section className="aiden-legal-section" key={subtitulo}>
              <h2>{subtitulo}</h2>
              <p>{texto}</p>
            </section>
          ))}
        </div>
        <p className="aiden-public-related">
          {privacidad ? "Consulta también los " : "Consulta también la "}
          <Link to={privacidad ? "/terminos" : "/privacidad"} className="font-semibold text-emerald-700 hover:text-emerald-800">
            {privacidad ? "Términos de Uso" : "Política de Privacidad"}
          </Link>
          .
        </p>
      </article>
    </main>
  );
}

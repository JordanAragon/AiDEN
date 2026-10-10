import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo";

/*
  Datos del Responsable del tratamiento (Ley 1581 de 2012, art. 17; Decreto 1377 de
  2013, art. 13). Los confirma David; mientras falten, la política lo dice y el
  formulario comercial no debe activarse (sin AIDEN_LEADS_WEBHOOK_URL responde 503).
  Ejemplo: { nombre: "…", identificacion: "NIT …", domicilio: "…", correo: "…", telefono: "…" }
*/
const RESPONSABLE = null;
const VIGENCIA = "9 de octubre de 2026";

const PRIVACIDAD = [
  [
    "Responsable del tratamiento",
    RESPONSABLE
      ? `${RESPONSABLE.nombre} (${RESPONSABLE.identificacion}), con domicilio en ${RESPONSABLE.domicilio}. Correo: ${RESPONSABLE.correo}${RESPONSABLE.telefono ? ` · Teléfono: ${RESPONSABLE.telefono}` : ""}.`
      : "La identificación completa del responsable (nombre o razón social, documento o NIT, domicilio, correo y teléfono) se publicará aquí antes de activar el formulario de solicitudes comerciales.",
  ],
  [
    "Qué datos se tratan",
    [
      "En la aplicación: nombre, correo y contraseña de las cuentas, y los registros operativos del vivero (lotes, tareas, lecturas ambientales, incidencias, inventario, costos y personal).",
      "En el formulario de presentación: nombre, organización, correo electrónico y el mensaje que escribas. No envíes datos sensibles en ese mensaje.",
    ],
  ],
  [
    "Para qué se usan",
    [
      "Los datos de la aplicación, para dar acceso a cada persona según su rol y hacer funcionar los módulos.",
      "Los datos del formulario, solo para responder tu solicitud y coordinar una presentación. No se usan para publicidad ni se entregan a terceros con fines comerciales sin una nueva autorización tuya.",
    ],
  ],
  [
    "Dónde se guardan",
    [
      "Las cuentas y los registros de la aplicación se guardan en el almacenamiento local de tu navegador: no salen de tu equipo ni se sincronizan con otros. Las contraseñas no se cifran, así que no reutilices una contraseña importante.",
      "Las solicitudes del formulario pasan por el servidor del sitio, alojado por Vercel Inc. en Estados Unidos, que las entrega al receptor que defina el responsable. Esa transmisión es parte de la autorización que das al enviar el formulario.",
    ],
  ],
  [
    "Tu autorización",
    "El formulario solo se envía si marcas la casilla de autorización. Con la solicitud se guarda la fecha y la versión de esta política que aceptaste, como prueba de esa autorización.",
  ],
  [
    "Tus derechos",
    [
      "Conocer, actualizar y rectificar tus datos.",
      "Pedir prueba de la autorización que diste.",
      "Saber, si lo pides, qué uso se ha dado a tus datos.",
      "Revocar la autorización y pedir que se borren tus datos cuando no exista un deber legal de conservarlos.",
      "Presentar quejas ante la Superintendencia de Industria y Comercio.",
      "Acceder gratis a los datos que hayas entregado.",
    ],
  ],
  [
    "Cómo ejercerlos",
    "Escribe al canal del responsable indicado arriba con tu nombre, el correo que usaste y lo que pides. Las consultas se responden en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, como fija la Ley 1581 de 2012 (artículos 14 y 15).",
  ],
  [
    "Cuánto tiempo se conservan",
    "Los datos de la aplicación permanecen en tu navegador hasta que los borres o restablezcas los datos desde Configuración. Las solicitudes comerciales se conservan mientras se atiende la conversación y hasta 12 meses después del último contacto, salvo que pidas antes su supresión.",
  ],
  [
    "Sin rastreo",
    "AiDEN no usa analítica, publicidad ni cookies de seguimiento. Las fuentes tipográficas se sirven desde el propio sitio, así que ningún tercero recibe tu visita por cargarlas.",
  ],
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
              {Array.isArray(texto) ? (
                <ul>
                  {texto.map((linea) => (
                    <li key={linea}>{linea}</li>
                  ))}
                </ul>
              ) : (
                <p>{texto}</p>
              )}
            </section>
          ))}
        </div>
        {privacidad && <p className="aiden-legal-vigencia">Vigente desde el {VIGENCIA}.</p>}
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

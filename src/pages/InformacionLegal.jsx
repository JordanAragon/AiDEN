import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo";

const PRIVACIDAD = [
  ["Información recopilada", "El sistema puede almacenar la información necesaria para identificar usuarios y operar las funciones disponibles: nombre, correo y contraseña de las cuentas, y los registros operativos (lotes, tareas, lecturas, incidencias, inventario, costos y personal)."],
  ["Dónde se guarda", "En esta versión toda la información se guarda en el almacenamiento local del navegador (localStorage). No se envía a ningún servidor de AiDEN ni a terceros. Las contraseñas no se cifran, así que no reutilices una contraseña importante."],
  ["Uso de la información", "La información se utiliza para gestionar el acceso y facilitar las funciones de la aplicación. No hay analítica, publicidad ni cookies de seguimiento."],
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
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans text-slate-800">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="text-sm text-emerald-700 hover:text-emerald-800">
          ← Volver
        </button>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">{titulo}</h1>
        <section className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          {secciones.map(([subtitulo, texto]) => (
            <section key={subtitulo}>
              <h2 className="font-semibold text-slate-900">{subtitulo}</h2>
              <p className="mt-2">{texto}</p>
            </section>
          ))}
        </section>
        <p className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-500">
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

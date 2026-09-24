import { Link, useLocation } from "react-router-dom";

export default function InformacionLegal() {
  const location = useLocation();
  const privacidad = location.pathname === "/privacidad";
  const titulo = privacidad ? "Política de Privacidad" : "Términos de Uso";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans text-slate-800">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          to="/signup"
          className="text-sm text-emerald-700 hover:text-emerald-800"
        >
          ← Volver
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">{titulo}</h1>
        <section className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          {privacidad ? (
            <>
              <section>
                <h2 className="font-semibold text-slate-900">
                  Información recopilada
                </h2>
                <p className="mt-2">
                  El sistema puede almacenar la información necesaria para
                  identificar usuarios y operar las funciones disponibles.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-slate-900">
                  Uso de la información
                </h2>
                <p className="mt-2">
                  La información se utiliza para gestionar el acceso y facilitar
                  las funciones de la aplicación.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-slate-900">
                  Responsabilidad
                </h2>
                <p className="mt-2">
                  Las organizaciones deben administrar los permisos y la
                  información registrada de acuerdo con sus propias políticas
                  internas.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="font-semibold text-slate-900">
                  Uso del sistema
                </h2>
                <p className="mt-2">
                  AiDEN está destinado a la gestión y organización de
                  información relacionada con la operación de viveros.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-slate-900">Credenciales</h2>
                <p className="mt-2">
                  Cada usuario debe mantener sus credenciales bajo su
                  responsabilidad y utilizar las funciones correspondientes a su
                  acceso.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-slate-900">
                  Información registrada
                </h2>
                <p className="mt-2">
                  La información registrada debe ser utilizada de forma
                  responsable y mantenerse actualizada cuando corresponda.
                </p>
              </section>
            </>
          )}
        </section>
      </article>
    </main>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { getDashboardPath } from "../utilidades/autenticacion";
import { LogotipoAiden } from "../components/ui/MarcaAiden";

export default function NoEncontrada() {
  const sesion = useSesion();
  useTitulo("Página no encontrada");
  return (
    <main className="aiden-public-page aiden-not-found-page">
      <section className="aiden-public-card aiden-not-found-card">
        <Link to="/" className="inline-flex items-center" aria-label="AiDEN, ir al inicio">
          <LogotipoAiden alto={34} />
        </Link>
        <p className="aiden-public-eyebrow">Error 404 · Página no encontrada</p>
        <h1>Esta página no existe.</h1>
        <p className="aiden-not-found-copy">Puede que el enlace esté mal escrito o que la vista haya cambiado de lugar. Si buscabas un lote, entra y usa el buscador (⌘K o Ctrl K) con su código.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to={sesion ? getDashboardPath(sesion.role) : "/"} className="aiden-public-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
            {sesion ? "Ir a mi tablero" : "Ir al inicio"} <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {!sesion && (
            <Link to="/login" className="aiden-public-secondary inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold">
              Iniciar sesión
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

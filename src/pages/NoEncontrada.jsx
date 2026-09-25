import { Link } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { getDashboardPath } from "../utilidades/autenticacion";

export default function NoEncontrada() {
  const sesion = useSesion();
  useTitulo("Página no encontrada");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-6 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white">
            <Leaf size={15} aria-hidden="true" />
          </span>
          <span className="font-bold tracking-tight">AiDEN</span>
        </Link>
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Esta página no existe.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Puede que el enlace esté mal escrito o que la vista haya cambiado de lugar. Si buscabas un lote, entra y usa el buscador (⌘K o Ctrl K) con su código.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to={sesion ? getDashboardPath(sesion.role) : "/"} className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-emerald-800">
            {sesion ? "Ir a mi tablero" : "Ir al inicio"} <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {!sesion && (
            <Link to="/login" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Iniciar sesión
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

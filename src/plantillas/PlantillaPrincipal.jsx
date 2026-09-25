import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BarraLateral from "../components/navegacion/BarraLateral";
import BarraSuperior from "../components/navegacion/BarraSuperior";
import ProveedorFicha from "../components/lote/ProveedorFicha";
import LimiteError from "../components/ui/LimiteError";
import CargandoVista from "../components/ui/CargandoVista";

export default function PlantillaPrincipal() {
  const { pathname } = useLocation();

  return (
    <ProveedorFicha>
      <section className="aiden-app-shell flex h-screen overflow-hidden bg-[#f5f7f5] font-sans text-slate-900">
        <a href="#contenido" className="sr-only z-[70] rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Saltar al contenido
        </a>
        <BarraLateral />
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <BarraSuperior />
          <main id="contenido" tabIndex={-1} key={pathname} className="aiden-transicion-modulo min-w-0 flex-1 overflow-y-auto p-4 outline-none sm:p-6">
            <LimiteError clave={pathname}>
              <Suspense fallback={<CargandoVista />}>
                <Outlet />
              </Suspense>
            </LimiteError>
          </main>
        </section>
      </section>
    </ProveedorFicha>
  );
}

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BarraLateral from "../components/navegacion/BarraLateral";
import BarraSuperior from "../components/navegacion/BarraSuperior";

export default function PlantillaPrincipal() {
  const [dataVersion, setDataVersion] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const refresh = () => setDataVersion((version) => version + 1);
    window.addEventListener("aiden-data-change", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("aiden-session-change", refresh);
    return () => {
      window.removeEventListener("aiden-data-change", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("aiden-session-change", refresh);
    };
  }, []);

  return (
    <section className="aiden-app-shell flex h-screen overflow-hidden bg-[#f5f7f5] font-sans text-slate-900">
      <BarraLateral />
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <BarraSuperior />
        <main
          key={`${pathname}-${dataVersion}`}
          className="aiden-transicion-modulo min-w-0 flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <Outlet />
        </main>
      </section>
    </section>
  );
}

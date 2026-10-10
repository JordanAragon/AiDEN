import { Suspense, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import PlantillaPrincipal from "../plantillas/PlantillaPrincipal";
import RutaProtegida from "../components/autenticacion/RutaProtegida";
import CargandoVista from "../components/ui/CargandoVista";
import { PERMISOS } from "./permisos";
import { diferida } from "../utilidades/cargaDiferida";

const Home = diferida(() => import("../pages/Home"));
const Login = diferida(() => import("../pages/Login"));
const Planes = diferida(() => import("../pages/Planes"));
const PreguntasLanding = diferida(() => import("../pages/PreguntasLanding"));
const Signup = diferida(() => import("../pages/Signup"));
const ForgotPassword = diferida(() => import("../pages/ForgotPassword"));
const InformacionLegal = diferida(() => import("../pages/InformacionLegal"));
const NoEncontrada = diferida(() => import("../pages/NoEncontrada"));
const Perfil = diferida(() => import("../pages/Perfil"));
const DashboardAdmin = diferida(() => import("../pages/DashboardAdmin"));
const DashboardSupervisor = diferida(() => import("../pages/DashboardSupervisor"));
const DashboardOperario = diferida(() => import("../pages/DashboardOperario"));
const InteligenciaArtificial = diferida(() => import("../pages/InteligenciaArtificial"));
const InventarioOperativo = diferida(() => import("../components/inventario/InventarioOperativo"));
const ProduccionOperativo = diferida(() => import("../components/produccion/ProduccionOperativo"));
const PersonalOperativo = diferida(() => import("../components/modulos/PersonalOperativo"));
const CostosOperativo = diferida(() => import("../components/modulos/CostosOperativo"));
const CalidadOperativo = diferida(() => import("../components/modulos/CalidadOperativo"));
const AmbientalOperativo = diferida(() => import("../components/modulos/AmbientalOperativo"));
const TrazabilidadOperativo = diferida(() => import("../components/modulos/TrazabilidadOperativo"));
const ConfiguracionOperativo = diferida(() => import("../components/modulos/ConfiguracionOperativo"));
const ReportesOperativo = diferida(() => import("../components/reportes/ReportesOperativo"));

const VISTAS = {
  "/perfil": Perfil,
  "/dashboard-admin": DashboardAdmin,
  "/dashboard-supervisor": DashboardSupervisor,
  "/dashboard-operario": DashboardOperario,
  "/produccion": ProduccionOperativo,
  "/trazabilidad": TrazabilidadOperativo,
  "/ambiental": AmbientalOperativo,
  "/calidad": CalidadOperativo,
  "/inventario": InventarioOperativo,
  "/costos": CostosOperativo,
  "/personal": PersonalOperativo,
  "/reportes": ReportesOperativo,
  "/ia": InteligenciaArtificial,
  "/configuracion": ConfiguracionOperativo,
};

const PRIVADAS = Object.entries(VISTAS).map(([path, Vista]) => ({ path, roles: PERMISOS[path], Vista }));

function SincronizarTemaDeRuta() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const esRutaPrivada = Object.keys(VISTAS).some(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
    );
    let tema = "light";
    try {
      tema = window.localStorage.getItem("aiden-theme") || "light";
    } catch {
      // La preferencia de tema no debe impedir que se muestre una página.
    }
    document.documentElement.classList.toggle("aiden-dark", esRutaPrivada && tema === "dark");
  }, [pathname]);

  return null;
}

function CargandoPagina() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <CargandoVista />
    </div>
  );
}

export default function Rutas() {
  return (
    <BrowserRouter>
      <SincronizarTemaDeRuta />
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/preguntas" element={<PreguntasLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terminos" element={<InformacionLegal />} />
          <Route path="/privacidad" element={<InformacionLegal />} />
          <Route element={<RutaProtegida />}>
            <Route element={<PlantillaPrincipal />}>
              {PRIVADAS.map(({ path, roles, Vista }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RutaProtegida roles={roles}>
                      <Vista />
                    </RutaProtegida>
                  }
                />
              ))}
            </Route>
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

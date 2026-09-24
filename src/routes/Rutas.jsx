import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import PlantillaPrincipal from "../plantillas/PlantillaPrincipal";
import DashboardAdmin from "../pages/DashboardAdmin";
import DashboardOperario from "../pages/DashboardOperario";
import DashboardSupervisor from "../pages/DashboardSupervisor";
import ForgotPassword from "../pages/ForgotPassword";
import InteligenciaArtificial from "../pages/InteligenciaArtificial";
import InformacionLegal from "../pages/InformacionLegal";
import RutaProtegida from "../components/autenticacion/RutaProtegida";
import InventarioOperativo from "../components/inventario/InventarioOperativo";
import ProduccionOperativo from "../components/produccion/ProduccionOperativo";
import PersonalOperativo from "../components/modulos/PersonalOperativo";
import CostosOperativo from "../components/modulos/CostosOperativo";
import CalidadOperativo from "../components/modulos/CalidadOperativo";
import AmbientalOperativo from "../components/modulos/AmbientalOperativo";
import TrazabilidadOperativo from "../components/modulos/TrazabilidadOperativo";
import ConfiguracionOperativo from "../components/modulos/ConfiguracionOperativo";
import ReportesOperativo from "../components/reportes/ReportesOperativo";

const Permitido = ({ roles, children }) => (
  <RutaProtegida roles={roles}>{children}</RutaProtegida>
);

export default function Rutas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terminos" element={<InformacionLegal />} />
        <Route path="/privacidad" element={<InformacionLegal />} />
        <Route element={<RutaProtegida />}>
          <Route element={<PlantillaPrincipal />}>
            <Route
              path="/dashboard-admin"
              element={<RutaProtegida roles={["admin"]} />}
            >
              <Route index element={<DashboardAdmin />} />
            </Route>
            <Route
              path="/dashboard-supervisor"
              element={<RutaProtegida roles={["admin", "supervisor"]} />}
            >
              <Route index element={<DashboardSupervisor />} />
            </Route>
            <Route
              path="/dashboard-operario"
              element={
                <RutaProtegida roles={["admin", "supervisor", "operario"]} />
              }
            >
              <Route index element={<DashboardOperario />} />
            </Route>
            <Route
              path="/inventario"
              element={
                <Permitido roles={["admin", "supervisor"]}>
                  <InventarioOperativo />
                </Permitido>
              }
            />
            <Route
              path="/produccion"
              element={
                <Permitido roles={["admin", "supervisor", "operario"]}>
                  <ProduccionOperativo />
                </Permitido>
              }
            />
            <Route
              path="/trazabilidad"
              element={
                <Permitido roles={["admin", "supervisor", "operario"]}>
                  <TrazabilidadOperativo />
                </Permitido>
              }
            />
            <Route
              path="/ambiental"
              element={
                <Permitido roles={["admin", "supervisor", "operario"]}>
                  <AmbientalOperativo />
                </Permitido>
              }
            />
            <Route
              path="/calidad"
              element={
                <Permitido roles={["admin", "supervisor", "operario"]}>
                  <CalidadOperativo />
                </Permitido>
              }
            />
            <Route
              path="/costos"
              element={
                <Permitido roles={["admin", "supervisor"]}>
                  <CostosOperativo />
                </Permitido>
              }
            />
            <Route
              path="/personal"
              element={
                <Permitido roles={["admin", "supervisor"]}>
                  <PersonalOperativo />
                </Permitido>
              }
            />
            <Route
              path="/reportes"
              element={
                <Permitido roles={["admin", "supervisor"]}>
                  <ReportesOperativo />
                </Permitido>
              }
            />
            <Route
              path="/configuracion"
              element={
                <Permitido roles={["admin"]}>
                  <ConfiguracionOperativo />
                </Permitido>
              }
            />
            <Route
              path="/ia"
              element={
                <Permitido roles={["admin", "supervisor"]}>
                  <InteligenciaArtificial />
                </Permitido>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

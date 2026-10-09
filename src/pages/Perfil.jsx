import { useState } from "react";
import { KeyRound, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDashboardPath } from "../utilidades/autenticacion";
import { Boton } from "../components/ui/Boton";
import { Entrada } from "../components/ui/Campo";
import Avatar from "../components/ui/Avatar";
import EncabezadoPagina from "../components/ui/EncabezadoPagina";
import Panel from "../components/ui/Panel";
import AlertaFormulario from "../components/ui/AlertaFormulario";
import { useDatos } from "../datos/almacen";
import { actualizarMiPerfil, cambiarMiContrasena } from "../datos/acciones";
import { useEnvio } from "../contexto/retroalimentacion";
import { useSesion } from "../hooks/useSesion";
import { useTitulo } from "../hooks/useTitulo";
import { ROLES } from "../datos/catalogos";

const CLAVES_VACIAS = { actual: "", nueva: "", confirmacion: "" };

function CambiarContrasena({ sesion }) {
  const [c, setC] = useState(CLAVES_VACIAS);
  const { error, enviar } = useEnvio(() => setC(CLAVES_VACIAS));
  const cambiar = (campo) => (e) => setC((v) => ({ ...v, [campo]: e.target.value }));
  return (
    <Panel icono={KeyRound} titulo="Contraseña" descripcion="Cámbiala si alguien más pudo verla o si usas este equipo con otras personas.">
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar(() => cambiarMiContrasena(c, sesion), "Contraseña actualizada");
        }}
      >
        <AlertaFormulario mensaje={error} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Entrada etiqueta="Contraseña actual" type="password" autoComplete="current-password" value={c.actual} onChange={cambiar("actual")} required />
          <Entrada etiqueta="Contraseña nueva" type="password" autoComplete="new-password" minLength={8} ayuda="Mínimo 8 caracteres" value={c.nueva} onChange={cambiar("nueva")} required />
          <Entrada etiqueta="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} value={c.confirmacion} onChange={cambiar("confirmacion")} required />
        </div>
        <div className="flex justify-end">
          <Boton variante="secundario" type="submit" icono={KeyRound}>Cambiar contraseña</Boton>
        </div>
      </form>
    </Panel>
  );
}

export default function Perfil() {
  const sesion = useSesion();
  const datos = useDatos();
  const navigate = useNavigate();
  const [f, setF] = useState({ nombre: sesion?.name || "", email: sesion?.email || "" });
  const { error, enviar } = useEnvio();
  useTitulo("Mi perfil");

  const persona = datos.personas.find((p) => p.id === sesion?.personaId);
  const rol = ROLES[sesion?.role] || "Usuario";

  return (
    <section className="aiden-modulo-vista aiden-modulo-perfil mx-auto max-w-4xl space-y-6">
      <EncabezadoPagina
        icono={UserCircle2}
        rotulo="AiDEN / cuenta"
        titulo="Mi perfil"
        descripcion="Actualiza tus datos básicos. El rol y los permisos los administra el sistema."
        acciones={<Boton variante="secundario" onClick={() => navigate(getDashboardPath(sesion?.role))}>Volver al inicio</Boton>}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel icono={UserCircle2} titulo="Datos personales" descripcion="Estos datos se muestran en la aplicación y se sincronizan con tu ficha operativa.">
          <form
            className="space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              enviar(() => actualizarMiPerfil(f, sesion), "Perfil actualizado");
            }}
          >
            <AlertaFormulario mensaje={error} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Entrada
                etiqueta="Nombre completo"
                value={f.nombre}
                autoComplete="name"
                minLength={3}
                required
                onChange={(e) => setF((v) => ({ ...v, nombre: e.target.value }))}
              />
              <Entrada
                etiqueta="Correo electrónico"
                type="email"
                value={f.email}
                autoComplete="email"
                required
                onChange={(e) => setF((v) => ({ ...v, email: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Boton variante="primario" type="submit" icono={Save}>Guardar cambios</Boton>
            </div>
          </form>
        </Panel>

        <Panel className="lg:col-start-2 lg:row-span-2 lg:row-start-1" icono={ShieldCheck} titulo="Acceso actual" descripcion="Información que no puedes modificar desde el perfil.">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar nombre={sesion?.name || "Usuario"} tamano="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{sesion?.name}</p>
                <p className="truncate text-xs text-slate-500">{sesion?.email}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rol</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{rol}</p>
            </div>
            {persona && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Área</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{persona.departamento}</p>
              </div>
            )}
          </div>
        </Panel>

        <CambiarContrasena sesion={sesion} />
      </section>
    </section>
  );
}

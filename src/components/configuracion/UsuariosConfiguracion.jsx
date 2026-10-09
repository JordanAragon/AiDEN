import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Boton, BotonIcono } from "../ui/Boton";
import { Entrada, Seleccion } from "../ui/Campo";
import Avatar from "../ui/Avatar";
import EstadoVacio from "../ui/EstadoVacio";
import Insignia from "../ui/Insignia";
import Modal from "../ui/Modal";
import { ROLES } from "../../datos/catalogos";
import { crearCuentaAdministrativa, cambiarRolUsuario, marcarCuentaRevisada, restablecerContrasenaUsuario } from "../../datos/acciones";
import AlertaFormulario from "../ui/AlertaFormulario";
import { useDatos } from "../../datos/almacen";
import { useAccion, useConfirmar, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion, useUsuarios } from "../../hooks/useSesion";

const CAMPOS = [
  ["name", "Nombre completo", "Ej. María González"],
  ["email", "Correo electrónico", "nombre@vivero.com"],
  ["password", "Contraseña", "Mínimo 8 caracteres"],
];

function FormularioCuenta({ id, onListo }) {
  const sesion = useSesion();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "operario" });
  const { error, enviar } = useEnvio();

  const cambiar = (campo) => (e) => setF((actual) => ({ ...actual, [campo]: e.target.value }));

  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(
          () => crearCuentaAdministrativa(f, sesion),
          () => onListo(),
        );
      }}
    >
      <div className="space-y-4">
        {CAMPOS.map(([campo, etiqueta, placeholder]) => (
          <Entrada
            key={campo}
            etiqueta={etiqueta}
            type={campo === "password" ? "password" : campo === "email" ? "email" : "text"}
            autoComplete={campo === "password" ? "new-password" : campo === "email" ? "email" : "name"}
            minLength={campo === "password" ? 8 : undefined}
            required
            value={f[campo]}
            onChange={cambiar(campo)}
            placeholder={placeholder}
          />
        ))}
        <Seleccion etiqueta="Rol" value={f.role} onChange={cambiar("role")}>
          {Object.entries(ROLES).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Seleccion>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}
      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        Las cuentas creadas aquí quedan activas con el rol seleccionado y conservan una ficha de colaborador asociada.
      </p>
    </form>
  );
}

function FormularioContrasena({ id, usuario, onListo }) {
  const sesion = useSesion();
  const [c, setC] = useState({ nueva: "", confirmacion: "" });
  const { error, enviar } = useEnvio(onListo);
  return (
    <form
      id={id}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        enviar(() => restablecerContrasenaUsuario(usuario.id, c, sesion), `Contraseña de ${usuario.name} restablecida`);
      }}
    >
      <AlertaFormulario mensaje={error} />
      <Entrada etiqueta="Contraseña nueva" type="password" autoComplete="new-password" minLength={8} ayuda="Mínimo 8 caracteres. Compártela con la persona por un canal privado." value={c.nueva} onChange={(e) => setC((v) => ({ ...v, nueva: e.target.value }))} required />
      <Entrada etiqueta="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} value={c.confirmacion} onChange={(e) => setC((v) => ({ ...v, confirmacion: e.target.value }))} required />
    </form>
  );
}

export default function UsuariosConfiguracion() {
  const datos = useDatos();
  const sesion = useSesion();
  const usuarios = useUsuarios();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const idForm = useId();
  const idClave = useId();
  const pendientes = usuarios.filter((u) => !u.revisado).length;

  const cambiarRol = async (u, rol) => {
    if (rol === u.role) return;
    const ok = await confirmar({
      titulo: `Cambiar el rol de ${u.name}`,
      mensaje: `Pasará de ${ROLES[u.role]} a ${ROLES[rol]}. El acceso se actualiza inmediatamente en este navegador.`,
      confirmar: "Cambiar rol",
    });
    if (ok) ejecutar(() => cambiarRolUsuario(u.id, rol, sesion), `${u.name} ahora es ${ROLES[rol].toLowerCase()}`);
  };



  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <section>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">Usuarios y accesos</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Administra cuentas, roles y solicitudes de registro. La ficha operativa de cada persona sigue en Personal.
          </p>
        </section>
        <Boton variante="primario" icono={UserPlus} onClick={() => setModal({ tipo: "cuenta" })}>
          Nueva cuenta
        </Boton>
      </header>

      {pendientes > 0 && (
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Hay {pendientes} {pendientes === 1 ? "cuenta pendiente" : "cuentas pendientes"} de revisión. Las cuentas registradas públicamente permanecen como operario hasta que administración confirme su rol.
        </aside>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {usuarios.length ? (
          <div className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[860px]">
              <caption className="sr-only">Usuarios y accesos de AiDEN</caption>
              <thead>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Persona</th>
                  <th className="bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Correo</th>
                  <th className="bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Rol</th>
                  <th className="bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="bg-slate-50 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const propia = u.id === sesion.id;
                  const persona = datos.personas.find((p) => p.id === u.personaId);
                  return (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <Avatar nombre={u.name} tamano="sm" />
                          <span>
                            <span className="block text-xs font-semibold text-slate-900">{u.name}</span>
                            <span className="block text-[11px] text-slate-500">{persona ? `${persona.cargo} · ${persona.departamento}` : "Sin ficha de colaborador"}</span>
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={propia}
                          onChange={(e) => cambiarRol(u, e.target.value)}
                          aria-label={`Rol de ${u.name}`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          {Object.entries(ROLES).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.revisado ? (
                          <Insignia tono="exito">Confirmada</Insignia>
                        ) : (
                          <Boton tamano="sm" variante="suave" onClick={() => ejecutar(() => marcarCuentaRevisada(u.id, sesion), `Cuenta de ${u.name} confirmada`)}>
                            Confirmar
                          </Boton>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!propia && (
                            <BotonIcono icono={KeyRound} etiqueta={`Restablecer la contraseña de ${u.name}`} tamano="sm" onClick={() => setModal({ tipo: "clave", usuario: u })} className="hover:!bg-emerald-50 hover:!text-emerald-700" />
                          )}
                          {u.personaId && (
                            <BotonIcono icono={ArrowUpRight} etiqueta={`Ver ficha de ${u.name}`} tamano="sm" onClick={() => navigate(`/personal?persona=${u.personaId}`)} className="hover:!bg-emerald-50 hover:!text-emerald-700" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVacio icono={Users} titulo="No hay cuentas" texto="Crea una cuenta para dar acceso al sistema." />
        )}
      </section>

      <Modal
        abierto={modal?.tipo === "cuenta"}
        onCerrar={() => setModal(null)}
        titulo="Nueva cuenta"
        descripcion="La cuenta queda vinculada a una ficha de colaborador y activa de inmediato con el rol elegido."
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton variante="primario" type="submit" form={idForm}>Crear cuenta</Boton>
          </>
        }
      >
        <FormularioCuenta id={idForm} onListo={() => setModal(null)} />
      </Modal>

      <Modal
        abierto={modal?.tipo === "clave"}
        onCerrar={() => setModal(null)}
        titulo={modal?.usuario ? `Restablecer la contraseña de ${modal.usuario.name}` : "Restablecer contraseña"}
        descripcion="La contraseña anterior deja de funcionar de inmediato."
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModal(null)}>Cancelar</Boton>
            <Boton variante="primario" type="submit" form={idClave}>Restablecer</Boton>
          </>
        }
      >
        {modal?.tipo === "clave" && <FormularioContrasena id={idClave} usuario={modal.usuario} onListo={() => setModal(null)} />}
      </Modal>
    </section>
  );
}

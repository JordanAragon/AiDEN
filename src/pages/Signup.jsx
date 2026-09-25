import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../assets/imagenes/login.webp";
import { registrarCuenta } from "../datos/acciones";
import { useTitulo } from "../hooks/useTitulo";

export default function Register() {
  useTitulo("Crear cuenta");
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (name.trim().length < 2) return setError("Ingresa tu nombre completo.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden.");
    if (!accepted) return setError("Debes aceptar los términos y la política de privacidad.");

    setLoading(true);
    window.setTimeout(() => {
      const result = registrarCuenta({ name, email, password });
      setLoading(false);
      if (!result.ok) return setError(result.message);
      navigate("/login", { replace: true, state: { registered: true } });
    }, 180);
  };

  return (
    <main className="flex min-h-screen bg-[#f5f7f5] text-slate-900">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#0b2f20] lg:flex lg:w-[53%]">
        <img src={loginImage} alt="Invernadero agrícola" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,47,32,.97),rgba(11,47,32,.72),rgba(11,47,32,.88))]" aria-hidden="true" />
        <section className="relative z-10 flex w-full flex-col p-10 xl:p-14">
          <Link to="/" className="flex items-center gap-2 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10"><Leaf size={17} /></span><span className="text-xl font-bold tracking-tight">AiDEN</span></Link>
          <div className="mt-auto max-w-xl pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Una vista, una operación</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.05em] text-white xl:text-6xl">Empieza con una operación más clara.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/65">Tu cuenta te da acceso al entorno de AiDEN. El rol operativo se define en esta V1 para mantener cada responsabilidad en su lugar.</p>
          </div>
        </section>
      </aside>

      <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[47%] lg:px-12">
        <div className="w-full max-w-md">
          <header className="mb-8 lg:hidden"><Link to="/" className="inline-flex items-center gap-2 text-emerald-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white"><Leaf size={15} /></span><span className="font-bold tracking-tight">AiDEN</span></Link></header>
          <div className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Nuevo acceso</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Crear cuenta.</h2><p className="mt-2 text-sm leading-6 text-slate-500">Registra tus datos para entrar al entorno de trabajo de AiDEN.</p></div>
          {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <form onSubmit={handleRegister} className="space-y-5">
            <Field label="Nombre completo"><input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="María González Torres" /></Field>
            <Field label="Correo electrónico"><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@vivero.com" /></Field>
            <Field label="Contraseña"><div className="relative"><input id="password" type={showPass ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="pr-11" /><button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
            <Field label="Confirmar contraseña"><div className="relative"><input id="confirm-password" type={showConfirm ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className="pr-11" /><button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
            <label className="flex items-start gap-2 text-xs leading-5 text-slate-500"><input id="legal" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" required /><span>Acepto los <Link to="/terminos" className="font-semibold text-emerald-800">Términos de Uso</Link> y la <Link to="/privacidad" className="font-semibold text-emerald-800">Política de Privacidad</Link> de AiDEN.</span></label>
            <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 size={17} className="animate-spin" /> Creando cuenta...</> : <>Crear cuenta <ArrowRight size={16} /></>}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-emerald-800">Iniciar sesión</Link></p>
          <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">Las cuentas creadas en esta V1 son perfiles locales de desarrollo y se registran como operario.</p>
        </div>
      </section>
    </main>
  );
}
function Field({ label, children }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }

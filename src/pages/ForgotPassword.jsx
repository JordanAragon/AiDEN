import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../utilidades/autenticacion";
import { useTitulo } from "../hooks/useTitulo";
import loginImage from "../assets/imagenes/login.webp";
import "../estilos/autenticacion-aiden.css";

export default function ForgotPassword() {
  useTitulo("Recuperar contraseña");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    window.setTimeout(() => {
      const result = resetPassword(email, password);
      setLoading(false);
      if (!result.ok) return setError(result.message);
      setDone(true);
    }, 180);
  };

  return (
    <main className="aiden-auth">
      <aside className="aiden-auth-side">
        <img src={loginImage} alt="Invernadero agrícola" className="aiden-auth-image" />
        <div className="aiden-auth-image-overlay" aria-hidden="true" />
        <section className="aiden-auth-side-content">
          <Link to="/" className="aiden-auth-brand">
            <span className="aiden-auth-brand-mark"><Leaf size={17} /></span>
            <span>AiDEN</span>
          </Link>
          <div className="aiden-auth-side-copy">
            <p>Recuperación</p>
            <h2>Vuelve a la operación<br /><em>sin perder el contexto.</em></h2>
            <span>Un acceso claro para continuar trabajando donde lo dejaste.</span>
          </div>
        </section>
      </aside>

      <section className="aiden-auth-panel">
        <div className="aiden-auth-form-wrap">
          <header className="aiden-auth-mobile-brand">
            <Link to="/" className="inline-flex items-center gap-2 text-emerald-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white"><Leaf size={15} /></span>
              <span className="font-bold tracking-tight">AiDEN</span>
            </Link>
          </header>

          <article className="aiden-auth-card">
            {!done ? (
              <>
                <header className="aiden-auth-heading">
                  <p>Recuperación</p>
                  <h1>Restablecer acceso.</h1>
                  <p>Actualiza tu contraseña para recuperar el acceso a la operación.</p>
                </header>
                {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <form onSubmit={handleSubmit} className="aiden-auth-form">
                  <Field label="Correo electrónico"><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@vivero.com" /></Field>
                  <Field label="Nueva contraseña"><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="pr-11" /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
                  <Field label="Confirmar contraseña"><div className="relative"><input id="confirm-password" type={showConfirm ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className="pr-11" /><button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
                  <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? <><Loader2 size={17} className="animate-spin" /> Actualizando...</> : <>Actualizar contraseña <ArrowRight size={16} /></>}
                  </button>
                </form>
              </>
            ) : (
              <section className="py-4 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={23} /></span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Acceso actualizado.</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">La contraseña fue actualizada. Ya puedes iniciar sesión.</p>
                <button type="button" onClick={() => navigate("/login", { replace: true })} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white">Ir a iniciar sesión <ArrowRight size={16} /></button>
              </section>
            )}
          </article>

          <button type="button" onClick={() => navigate("/login")} className="aiden-auth-back"><ArrowLeft size={15} /> Volver a iniciar sesión</button>
          
        </div>
      </section>
    </main>
  );
}
function Field({ label, children }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../utilidades/autenticacion";

export default function ForgotPassword() {
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-10 text-slate-900">
      <section className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-2 text-emerald-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-white"><Leaf size={17} /></span><span className="text-xl font-bold tracking-tight">AiDEN</span></Link>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(11,47,32,.08)] sm:p-8">
          {!done ? (
            <>
              <header className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Recuperación</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Restablecer acceso.</h1><p className="mt-2 text-sm leading-6 text-slate-500">En esta V1 el cambio de contraseña es local. No se envía un correo ni se simula una recuperación externa.</p></header>
              {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Correo electrónico"><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@vivero.com" /></Field>
                <Field label="Nueva contraseña"><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="pr-11" /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
                <Field label="Confirmar contraseña"><div className="relative"><input id="confirm-password" type={showConfirm ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className="pr-11" /><button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
                <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 size={17} className="animate-spin" /> Actualizando...</> : <>Actualizar contraseña <ArrowRight size={16} /></>}</button>
              </form>
            </>
          ) : (
            <section className="py-4 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={23} /></span><h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Acceso actualizado.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">La contraseña de la cuenta local fue actualizada. Ya puedes iniciar sesión.</p><button type="button" onClick={() => navigate("/login", { replace: true })} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white">Ir a iniciar sesión <ArrowRight size={16} /></button></section>
          )}
        </article>
        <button type="button" onClick={() => navigate("/login")} className="mx-auto mt-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-800"><ArrowLeft size={15} /> Volver a iniciar sesión</button>
      </section>
    </main>
  );
}
function Field({ label, children }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }

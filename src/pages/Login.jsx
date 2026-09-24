import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginImage from "../assets/imagenes/login.png";
import { ensureInitialUser, login } from "../utilidades/autenticacion";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(
    () => localStorage.getItem("aiden_remember") === "true",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(
    () => (location.state?.registered ? "Cuenta creada. Ahora puedes iniciar sesión." : ""),
  );

  useEffect(() => {
    ensureInitialUser();
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setLoading(true);

    window.setTimeout(() => {
      const result = login(email, password, remember);
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const destination =
        location.state?.from ||
        (result.user.role === "admin"
          ? "/dashboard-admin"
          : result.user.role === "supervisor"
            ? "/dashboard-supervisor"
            : "/dashboard-operario");
      navigate(destination, { replace: true, state: {} });
    }, 180);
  };

  return (
    <main className="flex min-h-screen bg-[#f5f7f5] text-slate-900">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#0b2f20] lg:flex lg:w-[53%]">
        <img
          src={loginImage}
          alt="Vivero agrícola"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,47,32,.97),rgba(11,47,32,.72),rgba(11,47,32,.84))]"
          aria-hidden="true"
        />
        <section className="relative z-10 flex w-full flex-col p-10 xl:p-14">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Leaf size={17} />
            </span>
            <span className="text-xl font-bold tracking-tight">AiDEN</span>
          </Link>

          <section className="mt-auto max-w-xl pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              Gestión operativa para viveros
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.05em] text-white xl:text-6xl">
              La operación del vivero, en contexto.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
              Producción, inventario, ambiente, calidad y trazabilidad conectados
              alrededor de la información que realmente mueve el trabajo.
            </p>
            <section className="mt-8 flex gap-8 border-t border-white/10 pt-6">
              <div>
                <strong className="block text-2xl text-white">03</strong>
                <span className="text-xs text-white/50">roles</span>
              </div>
              <div>
                <strong className="block text-2xl text-white">09</strong>
                <span className="text-xs text-white/50">módulos</span>
              </div>
              <div>
                <strong className="block text-2xl text-white">01</strong>
                <span className="text-xs text-white/50">operación conectada</span>
              </div>
            </section>
          </section>
        </section>
      </aside>

      <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[47%] lg:px-12">
        <section className="w-full max-w-md">
          <header className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-emerald-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white">
                <Leaf size={15} />
              </span>
              <span className="font-bold tracking-tight">AiDEN</span>
            </Link>
          </header>

          <section className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Acceso
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Bienvenido de nuevo.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa para continuar con la operación de tu vivero.
            </p>
          </section>

          {success && (
            <p
              role="status"
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {success}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <Field label="Correo electrónico">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@vivero.com"
              />
            </Field>

            <Field label="Contraseña">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((value) => !value)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <section className="flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 accent-emerald-700"
                />
                Recordarme
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
              >
                Olvidé mi contraseña
              </Link>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Comprobando acceso...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link
              to="/signup"
              className="font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Crear cuenta
            </Link>
          </p>
          <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
            V1 frontend local · Las credenciales se almacenan únicamente en este
            navegador durante el desarrollo.
          </p>
        </section>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

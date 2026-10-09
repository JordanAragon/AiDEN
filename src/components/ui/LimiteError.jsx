import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getDashboardPath, getSession } from "../../utilidades/autenticacion";
import { esFalloDeCarga } from "../../utilidades/cargaDiferida";

function inicioDelRol() {
  try {
    const sesion = getSession();
    return sesion ? getDashboardPath(sesion.role) : "/";
  } catch {
    return "/";
  }
}

export default class LimiteError extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error al mostrar la vista", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.clave !== this.props.clave) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const deCarga = esFalloDeCarga(error);
    return (
      <section role="alert" className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${deCarga ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
          {deCarga ? <RefreshCw size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
        </span>
        <h1 className="mt-4 text-lg font-bold text-slate-950">{deCarga ? "No se pudo cargar esta sección" : "Esta vista no se pudo mostrar"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {deCarga
            ? "La conexión se interrumpió o hay una versión nueva de AiDEN. Recarga la página; tus registros están guardados en este navegador."
            : "Algún registro no tiene el formato esperado. Puedes reintentar o volver al inicio de tu rol; si se repite, restaura un respaldo desde Configuración."}
        </p>
        <details className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">Detalle técnico</summary>
          <p className="mt-2 break-words font-mono">{String(error?.message || error)}</p>
        </details>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => (deCarga ? window.location.reload() : this.setState({ error: null }))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {deCarga ? "Recargar" : "Reintentar"}
          </button>
          <a href={inicioDelRol()} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Ir a mi tablero
          </a>
        </div>
      </section>
    );
  }
}

import { Component } from "react";
import { AlertTriangle } from "lucide-react";

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
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={18} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold text-slate-950">Esta vista no se pudo mostrar</h1>
        <p className="mt-2 text-sm text-slate-500">Algo en los datos guardados en este navegador no tiene el formato esperado. Puedes reintentar o volver al inicio de tu rol.</p>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-left font-mono text-xs text-slate-600">{String(this.state.error?.message || this.state.error)}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => this.setState({ error: null })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Reintentar
          </button>
          <a href="/" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Ir al inicio
          </a>
        </div>
      </section>
    );
  }
}

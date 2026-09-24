import PanelInteligencia from "../components/inteligencia/PanelInteligencia";

export default function InteligenciaArtificial() {
  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">
          Inteligencia Artificial
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Herramientas inteligentes para apoyar el análisis y la gestión del
          vivero.
        </p>
      </header>
      <PanelInteligencia />
    </article>
  );
}

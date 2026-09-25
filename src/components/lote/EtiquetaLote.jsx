import { useDatos } from "../../datos/almacen";
import { useFichaLote } from "../../contexto/ficha";

export default function EtiquetaLote({ codigo, tamano, interactiva = true, className = "" }) {
  const { lotes } = useDatos();
  const { abrirLote } = useFichaLote();
  if (!codigo) return <span className="text-xs text-slate-500">Sin lote</span>;
  const lote = lotes.find((item) => item.lote === codigo);
  const cerrado = lote?.estado === "Cerrado";
  const clases = `!font-mono !font-bold ${tamano === "grande" ? "!text-xs" : "!text-[10px]"} !leading-4 ${cerrado ? "text-slate-500" : "text-emerald-700"} ${className}`;
  const titulo = lote ? `${codigo} · ${lote.cultivo} · ${cerrado ? "cerrado" : lote.etapa}` : codigo;

  if (!interactiva || !lote) {
    return (
      <span className={clases} title={titulo}>
        {codigo}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${clases} rounded underline-offset-2 hover:underline`}
      title={titulo}
      aria-label={`Abrir ficha del lote ${codigo}, ${lote.cultivo}`}
      onClick={(evento) => {
        evento.stopPropagation();
        abrirLote(codigo);
      }}
    >
      {codigo}
    </button>
  );
}

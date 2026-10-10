import { Fragment } from "react";

/*
  Un titular cuyas palabras emergen de su propia línea, en cascada. El texto
  sigue siendo texto (se lee y se selecciona igual); cada palabra va en un marco
  que la recorta mientras sube. `partes` alterna texto llano y remate en itálica:
  [{ texto: "Pasado mañana salen…" }, { texto: "hacia Timbío.", em: true }].
*/
function enPalabras(partes) {
  const salida = [];
  let indice = 0;
  for (const parte of partes) {
    const palabras = parte.texto.split(/\s+/).filter(Boolean).map((palabra) => ({ palabra, i: indice++ }));
    salida.push({ em: Boolean(parte.em), palabras });
  }
  return salida;
}

function Palabras({ palabras }) {
  return palabras.map(({ palabra, i }) => (
    <Fragment key={`${palabra}-${i}`}>
      <span className="aiden-titulo-palabra" style={{ "--i": i }}>
        <span>{palabra}</span>
      </span>{" "}
    </Fragment>
  ));
}

export default function TituloVivo({ como: Etiqueta = "h1", id, partes, retraso = 0, className = "" }) {
  return (
    <Etiqueta id={id} className={`aiden-titulo-vivo ${className}`} style={{ "--retraso": `${retraso}s` }}>
      {enPalabras(partes).map((parte, n) =>
        parte.em ? (
          <em key={n}>
            <Palabras palabras={parte.palabras} />
          </em>
        ) : (
          <span key={n}>
            <Palabras palabras={parte.palabras} />
          </span>
        ),
      )}
    </Etiqueta>
  );
}

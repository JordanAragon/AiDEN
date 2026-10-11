import { useId } from "react";

/*
  Mapa de calor: filas (zonas, personas) por columnas (lecturas, días). El color
  sale de `tono(celda)` y cada celda dice su valor al pasar el cursor. Para
  lectores de pantalla va la misma información en una tabla.
*/
export default function MapaCalor({ titulo, filas, columnas, celda, tono, describir, leyenda, className = "" }) {
  const id = useId();
  return (
    <figure className={`aiden-mapa-calor ${className}`} aria-labelledby={`${id}-titulo`}>
      <figcaption id={`${id}-titulo`} className="sr-only">
        {titulo}
      </figcaption>
      <div className="aiden-mapa-calor-rejilla" aria-hidden="true" style={{ "--columnas": columnas.length }}>
        {filas.map((fila) => (
          <div key={fila.id} className="aiden-mapa-calor-fila">
            <span className="aiden-mapa-calor-etiqueta">{fila.nombre}</span>
            <span className="aiden-mapa-calor-celdas">
              {columnas.map((columna) => {
                const valor = celda(fila, columna);
                return <i key={columna.id} className={`aiden-mapa-calor-celda ${tono(valor)}`} data-descripcion={valor ? describir(fila, columna, valor) : `${fila.nombre}: sin lectura`} />;
              })}
            </span>
          </div>
        ))}
        {columnas.some((c) => c.marca) && (
          <div className="aiden-mapa-calor-fila aiden-mapa-calor-eje">
            <span className="aiden-mapa-calor-etiqueta" />
            <span className="aiden-mapa-calor-celdas">
              {columnas.map((columna) => (
                <b key={columna.id}>{columna.marca || ""}</b>
              ))}
            </span>
          </div>
        )}
      </div>
      {leyenda && <div className="aiden-mapa-calor-leyenda" aria-hidden="true">{leyenda}</div>}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Fila</th>
            {columnas.map((columna) => (
              <th key={columna.id} scope="col">
                {columna.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              <th scope="row">{fila.nombre}</th>
              {columnas.map((columna) => {
                const valor = celda(fila, columna);
                return <td key={columna.id}>{valor ? describir(fila, columna, valor) : "Sin lectura"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

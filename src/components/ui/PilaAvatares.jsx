import { Link } from "react-router-dom";
import Avatar from "./Avatar";

/*
  El equipo en una pila de iniciales. Cada una dice quién es al pasar el cursor
  o al enfocarla; la etiqueta se inclina apenas hacia donde se mueve el cursor.
*/
export default function PilaAvatares({ personas, maximo = 5, etiqueta = "Equipo", className = "" }) {
  const visibles = personas.slice(0, maximo);
  const resto = personas.length - visibles.length;
  const inclinar = (evento) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const desvio = (evento.clientX - caja.left) / caja.width - 0.5;
    evento.currentTarget.style.setProperty("--giro", `${(desvio * 14).toFixed(1)}deg`);
  };
  return (
    <ul className={`aiden-pila ${className}`} aria-label={etiqueta}>
      {visibles.map((persona) => {
        const contenido = (
          <>
            <Avatar nombre={persona.nombre} tamano="sm" className="aiden-pila-avatar" />
            <span className="aiden-pila-ficha" aria-hidden="true">
              <b>{persona.nombre}</b>
              {persona.detalle && <span>{persona.detalle}</span>}
            </span>
          </>
        );
        return (
          <li key={persona.id} onPointerMove={inclinar}>
            {persona.to ? (
              <Link to={persona.to} className="aiden-pila-item" aria-label={`${persona.nombre}${persona.detalle ? `, ${persona.detalle}` : ""}`}>
                {contenido}
              </Link>
            ) : (
              <span className="aiden-pila-item" tabIndex={0} aria-label={`${persona.nombre}${persona.detalle ? `, ${persona.detalle}` : ""}`}>
                {contenido}
              </span>
            )}
          </li>
        );
      })}
      {resto > 0 && (
        <li>
          <span className="aiden-pila-item aiden-pila-resto">+{resto}</span>
        </li>
      )}
    </ul>
  );
}

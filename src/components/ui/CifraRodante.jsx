import { useEffect, useState } from "react";
import { numero } from "../../utilidades/formato";
import "../../estilos/cifra-rodante.css";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/*
  Una cifra cuyos dígitos ruedan como un contador mecánico cuando cambia el
  valor. Acepta un número (se formatea) o un texto ya formateado («$ 680»): solo
  ruedan los dígitos. Con `desdeCero`, al montarse arranca en ceros y rueda hasta
  el valor. Los lectores de pantalla oyen el número completo; las columnas son
  dibujo. Con movimiento reducido el cambio es inmediato. Las columnas se
  alinean desde la derecha para que unidades rueden con unidades.
*/
export default function CifraRodante({ valor, formatear = numero, desdeCero = false, className = "" }) {
  const [listo, setListo] = useState(!desdeCero);

  useEffect(() => {
    if (listo) return undefined;
    const cuadro = window.requestAnimationFrame(() => setListo(true));
    return () => window.cancelAnimationFrame(cuadro);
  }, [listo]);

  const texto = typeof valor === "number" ? formatear(valor) : String(valor ?? "");
  const caracteres = [...(listo ? texto : texto.replace(/\d/g, "0"))];
  return (
    <span className={`aiden-rodante ${className}`}>
      <span className="sr-only">{texto}</span>
      <span className="aiden-rodante-cifras" aria-hidden="true">
        {caracteres.map((caracter, i) => {
          const desdeDerecha = caracteres.length - i;
          // Dígitos y signos se dibujan con contenido CSS: no entran en innerText,
          // así el texto legible de la cifra es solo el número (sr-only).
          if (!DIGITOS.includes(caracter)) {
            return <span key={`s-${desdeDerecha}`} className="aiden-rodante-signo" data-c={caracter} />;
          }
          return (
            <span key={`d-${desdeDerecha}`} className="aiden-rodante-columna">
              <span className="aiden-rodante-tira" style={{ "--digito": Number(caracter) }} />
            </span>
          );
        })}
      </span>
    </span>
  );
}

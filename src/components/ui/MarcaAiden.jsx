import isotipo from "../../assets/marca/aiden-isotipo.png";
import logotipo from "../../assets/marca/aiden-logotipo.png";

// Isotipo oficial de AiDEN (A + hoja + punto de datos).
// `placa` lo coloca sobre una placa clara para fondos oscuros, donde las partes
// verde bosque del símbolo se perderían.
export function IsotipoAiden({ tamano = 32, placa = false, className = "" }) {
  const imagen = (
    <img
      src={isotipo}
      alt=""
      aria-hidden="true"
      width={placa ? Math.round(tamano * 0.78) : tamano}
      height={placa ? Math.round(tamano * 0.78) : tamano}
      className="aiden-isotipo"
      draggable="false"
    />
  );
  if (!placa) return <span className={`aiden-isotipo-caja ${className}`}>{imagen}</span>;
  return (
    <span className={`aiden-isotipo-placa ${className}`} style={{ width: tamano, height: tamano }}>
      {imagen}
    </span>
  );
}

// Logotipo horizontal (isotipo + palabra AiDEN) para fondos claros.
export function LogotipoAiden({ alto = 30, className = "" }) {
  return (
    <img
      src={logotipo}
      alt="AiDEN"
      height={alto}
      width={Math.round(alto * 3.51)}
      className={`aiden-logotipo ${className}`}
      style={{ height: alto, width: "auto" }}
      draggable="false"
    />
  );
}

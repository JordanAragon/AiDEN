import fotoAcceso from "../../assets/imagenes/login.webp";
import LienzoVivo from "../vivo/LienzoVivo";
import { diferida } from "../../utilidades/cargaDiferida";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const EscenaAcceso = diferida(() => import("../vivo/escenas/EscenaAcceso"));

// La foto del panel lateral solo se ve desde 1024 px: en el celular no se descarga.
// Con WebGPU, la misma foto pasa por el vidrio del invernadero (EscenaAcceso); el
// lienzo solo se monta cuando el panel está a la vista.
export default function FotoAcceso({ className = "absolute inset-0 h-full w-full object-cover opacity-70" }) {
  return (
    <>
      <picture>
        <source media="(min-width: 1024px)" srcSet={fotoAcceso} />
        <img src={PIXEL} alt="" fetchPriority="high" className={className} />
      </picture>
      <LienzoVivo escena={EscenaAcceso} datos={{ foto: fotoAcceso }} className="aiden-auth-lienzo" margen="0px" />
    </>
  );
}

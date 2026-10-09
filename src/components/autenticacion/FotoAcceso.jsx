import fotoAcceso from "../../assets/imagenes/login.webp";

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

// La foto del panel lateral solo se ve desde 1024 px: en el celular no se descarga.
export default function FotoAcceso({ className = "absolute inset-0 h-full w-full object-cover opacity-70" }) {
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={fotoAcceso} />
      <img src={PIXEL} alt="" fetchPriority="high" className={className} />
    </picture>
  );
}

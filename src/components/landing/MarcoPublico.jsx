import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IsotipoAiden, LogotipoAiden } from "../ui/MarcaAiden";
import palabraMarcaMoss from "../../assets/marca/aiden-palabra-moss.svg";
import "../../estilos/landing.css";

/*
  El casco público: cápsula de navegación, panel móvil, CTA flotante y pie mayor,
  compartidos por la landing y sus páginas (planes, preguntas). El contacto vive
  en la landing, así que desde las páginas internas se llega por /#contacto.
*/

const ENLACES = [
  ["/#historia", "La historia"],
  ["/#asistente", "Asistente"],
  ["/planes", "Planes"],
  ["/preguntas", "Preguntas"],
];

export default function MarcoPublico({ children, diaCilantro = null, flotanteVisible = true }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [headerCompacto, setHeaderCompacto] = useState(false);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const { pathname, hash } = useLocation();
  const cerrarMenu = () => setMenuAbierto(false);

  // Al llegar con ancla (por ejemplo desde /planes a /#contacto), desplazarse a ella.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const nodo = document.getElementById(hash.slice(1));
    if (nodo) nodo.scrollIntoView({ behavior: "auto", block: "start" });
  }, [pathname, hash]);

  useEffect(() => {
    const actualizar = () => setHeaderCompacto(window.scrollY > 18);
    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => window.removeEventListener("scroll", actualizar);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("aiden-menu-open", menuAbierto);
    return () => document.body.classList.remove("aiden-menu-open");
  }, [menuAbierto]);

  useEffect(() => {
    if (!menuAbierto) return undefined;
    const manejarTecla = (event) => {
      if (event.key === "Escape") {
        setMenuAbierto(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", manejarTecla);
    menuPanelRef.current?.querySelector("a")?.focus();
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [menuAbierto]);

  const enlace = ([destino, nombre]) =>
    destino.startsWith("/#") && pathname === "/" ? (
      <a key={destino} href={destino.slice(1)} onClick={cerrarMenu}>{nombre}</a>
    ) : (
      <Link key={destino} to={destino} onClick={cerrarMenu} viewTransition>{nombre}</Link>
    );

  return (
    <div className="aiden-landing">
      <a className="aiden-skip-link" href="#contenido">Saltar al contenido principal</a>
      <header className={`aiden-header ${headerCompacto ? "is-compact" : ""}`}>
        <nav className="aiden-shell" aria-label="Navegación principal">
          <div className="aiden-header-inner">
            <Link to="/" className="aiden-brand" onClick={cerrarMenu} aria-label="AiDEN, ir al inicio"><LogotipoAiden alto={30} /></Link>
            <div className="aiden-header-links">{ENLACES.map(enlace)}</div>
            <div className="aiden-header-actions">
              <Link to="/login" className="aiden-header-login">Iniciar sesión</Link>
              <Link to="/#contacto" className="aiden-boton aiden-boton-lima">Agendar presentación</Link>
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              className="aiden-menu"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-controls="aiden-mobile-panel"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
              {menuAbierto ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </nav>
        <div
          id="aiden-mobile-panel"
          ref={menuPanelRef}
          className={`aiden-mobile-panel ${menuAbierto ? "is-visible" : ""}`}
          aria-hidden={!menuAbierto}
          inert={!menuAbierto}
        >
          {ENLACES.map(enlace)}
          <Link to="/#contacto" className="aiden-boton aiden-boton-lima" onClick={cerrarMenu}>Agendar presentación <ArrowRight size={14} /></Link>
          <Link to="/login" className="aiden-boton aiden-boton-borde" onClick={cerrarMenu}>Iniciar sesión</Link>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>{children}</main>

      {flotanteVisible && <CtaFlotante pathname={pathname} />}

      <footer className="aiden-footer">
        <div className="aiden-shell">
          <div className="aiden-footer-cierre">
            <p>El lote de cilantro va por el día {diaCilantro ?? "6"}. <em>Su historia apenas empieza.</em></p>
            <Link to="/#contacto" className="aiden-boton aiden-boton-lima">Agendar presentación <ArrowRight size={14} /></Link>
          </div>
          <div className="aiden-footer-columnas">
            <div className="aiden-footer-firma">
              <span className="aiden-footer-isotipo"><IsotipoAiden tamano={34} placa /></span>
              <p>Registro y seguimiento para viveros e invernaderos. Hecho para el campo colombiano.</p>
            </div>
            <nav aria-label="Recorrido">
              <strong>Recorrido</strong>
              {pathname === "/" ? <a href="#historia">La historia</a> : <Link to="/#historia">La historia</Link>}
              {pathname === "/" ? <a href="#vivero">El vivero</a> : <Link to="/#vivero">El vivero</Link>}
              {pathname === "/" ? <a href="#asistente">Asistente</a> : <Link to="/#asistente">Asistente</Link>}
              {pathname === "/" ? <a href="#roles">Roles</a> : <Link to="/#roles">Roles</Link>}
            </nav>
            <nav aria-label="Cuenta">
              <strong>Cuenta</strong>
              <Link to="/planes" viewTransition>Planes</Link>
              <Link to="/preguntas" viewTransition>Preguntas</Link>
              <Link to="/login">Ingresar</Link>
            </nav>
            <nav aria-label="Legal">
              <strong>Legal</strong>
              <Link to="/terminos">Términos</Link>
              <Link to="/privacidad">Privacidad</Link>
            </nav>
          </div>
          <p className="aiden-footer-marca" aria-hidden="true"><img src={palabraMarcaMoss} alt="" /></p>
          <div className="aiden-footer-banda">
            <span>AiDEN · Vivero en el Cauca, Colombia</span>
            <span>Lotes, nombres y cifras de producción de esta página son ilustrativos.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* El botón que acompaña la lectura: aparece pasado el arranque y se retira
   cuando el formulario de contacto ya está a la vista. */
function CtaFlotante({ pathname }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decidir = () => {
      const contacto = document.getElementById("contacto");
      const contactoVisible = contacto
        ? contacto.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setVisible(window.scrollY > window.innerHeight * 0.85 && !contactoVisible);
    };
    decidir();
    window.addEventListener("scroll", decidir, { passive: true });
    window.addEventListener("resize", decidir, { passive: true });
    return () => {
      window.removeEventListener("scroll", decidir);
      window.removeEventListener("resize", decidir);
    };
  }, [pathname]);

  return (
    <div className={`aiden-flotante ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      {pathname === "/" ? (
        <a href="#contacto" className="aiden-boton aiden-boton-oscuro aiden-boton-grande" tabIndex={visible ? 0 : -1}>
          Agendar presentación <ArrowRight size={15} />
        </a>
      ) : (
        <Link to="/#contacto" className="aiden-boton aiden-boton-oscuro aiden-boton-grande" tabIndex={visible ? 0 : -1}>
          Agendar presentación <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextoComandos } from "../../contexto/comandos";
import { useAcciones } from "../../contexto/acciones";
import { useSesion } from "../../hooks/useSesion";
import { alternarTema } from "../../hooks/useTema";
import { getDashboardPath } from "../../utilidades/autenticacion";
import Modal from "../ui/Modal";
import PaletaComandos from "./PaletaComandos";
import { modulosDeRol, rutaDeModulo } from "./modulos";

/*
  Los atajos de teclado de la app, al estilo de Linear:
  - ⌘K / Ctrl K abre la paleta;
  - G y una letra va a un módulo (G P, Producción);
  - N y una letra abre un registro nuevo (N L, Nuevo lote);
  - ? muestra todos los atajos y ⇧ D cambia el tema.
  Nada se dispara mientras se escribe en un campo o hay un diálogo abierto.
  Tras la G o la N aparece una pista con las letras posibles.
*/

const ESPERA_SECUENCIA = 1400;

function escribiendo(evento) {
  const objetivo = evento.target;
  if (!(objetivo instanceof HTMLElement)) return false;
  return objetivo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(objetivo.tagName);
}

function Tecla({ children }) {
  return <kbd className="aiden-tecla">{children}</kbd>;
}

export default function ProveedorComandos({ children }) {
  const navigate = useNavigate();
  const sesion = useSesion();
  const { abrirAccion, accionesDisponibles } = useAcciones();
  const rol = sesion?.role || "operario";
  const inicio = getDashboardPath(rol);
  const modulos = useMemo(() => modulosDeRol(rol), [rol]);
  const [paleta, setPaleta] = useState({ abierta: false, texto: "" });
  const [atajos, setAtajos] = useState(false);
  const [secuencia, setSecuencia] = useState(null);
  const temporizador = useRef(0);

  const abrirPaleta = useCallback((texto = "") => setPaleta({ abierta: true, texto }), []);
  const cerrarPaleta = useCallback(() => setPaleta({ abierta: false, texto: "" }), []);
  const abrirAtajos = useCallback(() => {
    setPaleta({ abierta: false, texto: "" });
    setAtajos(true);
  }, []);

  useEffect(() => {
    const terminarSecuencia = () => {
      window.clearTimeout(temporizador.current);
      setSecuencia(null);
    };
    const alTeclear = (evento) => {
      const tecla = evento.key;
      if ((evento.metaKey || evento.ctrlKey) && tecla.toLowerCase() === "k") {
        evento.preventDefault();
        setAtajos(false);
        setPaleta((actual) => (actual.abierta ? { abierta: false, texto: "" } : { abierta: true, texto: "" }));
        return;
      }
      if (evento.metaKey || evento.ctrlKey || evento.altKey || escribiendo(evento)) return;
      if (document.querySelector('[aria-modal="true"]')) return;

      if (secuencia) {
        const letra = tecla.toUpperCase();
        evento.preventDefault();
        terminarSecuencia();
        if (secuencia === "G") {
          const modulo = modulos.find((m) => m.atajo === letra);
          if (modulo) navigate(rutaDeModulo(modulo, inicio), { viewTransition: true });
        } else if (secuencia === "N") {
          const accion = accionesDisponibles.find((a) => a.atajo === letra);
          if (accion) abrirAccion(accion.id);
        }
        return;
      }
      if (tecla === "?") {
        evento.preventDefault();
        setAtajos(true);
        return;
      }
      if (tecla === "D" && evento.shiftKey) {
        evento.preventDefault();
        alternarTema();
        return;
      }
      if (!evento.shiftKey && (tecla === "g" || tecla === "n")) {
        evento.preventDefault();
        setSecuencia(tecla.toUpperCase());
        window.clearTimeout(temporizador.current);
        temporizador.current = window.setTimeout(() => setSecuencia(null), ESPERA_SECUENCIA);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [secuencia, modulos, inicio, navigate, accionesDisponibles, abrirAccion]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const valor = useMemo(() => ({ abrirPaleta, abrirAtajos }), [abrirPaleta, abrirAtajos]);
  const opcionesSecuencia = secuencia === "G" ? modulos.map((m) => ({ tecla: m.atajo, nombre: m.nombre })) : secuencia === "N" ? accionesDisponibles.map((a) => ({ tecla: a.atajo, nombre: a.nombre })) : [];

  return (
    <ContextoComandos.Provider value={valor}>
      {children}
      <PaletaComandos abierta={paleta.abierta} textoInicial={paleta.texto} onCerrar={cerrarPaleta} onAtajos={abrirAtajos} />
      {secuencia && (
        <div className="aiden-pista-atajo" role="status">
          <span className="aiden-pista-atajo-titulo">
            <Tecla>{secuencia}</Tecla> {secuencia === "G" ? "Ir a…" : "Nuevo…"}
          </span>
          <ul>
            {opcionesSecuencia.map((opcion) => (
              <li key={opcion.tecla}>
                <Tecla>{opcion.tecla}</Tecla> {opcion.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal abierto={atajos} onCerrar={() => setAtajos(false)} titulo="Atajos de teclado" descripcion="Funcionan en toda la app, salvo mientras escribes en un campo." ancho="lg">
        <div className="aiden-hoja-atajos">
          <section>
            <h3>General</h3>
            <dl>
              <div>
                <dt>Abrir la paleta de comandos</dt>
                <dd>
                  <Tecla>⌘</Tecla>
                  <Tecla>K</Tecla>
                </dd>
              </div>
              <div>
                <dt>Ver estos atajos</dt>
                <dd>
                  <Tecla>?</Tecla>
                </dd>
              </div>
              <div>
                <dt>Cambiar entre modo claro y oscuro</dt>
                <dd>
                  <Tecla>⇧</Tecla>
                  <Tecla>D</Tecla>
                </dd>
              </div>
              <div>
                <dt>Cerrar un diálogo o la paleta</dt>
                <dd>
                  <Tecla>esc</Tecla>
                </dd>
              </div>
              <div>
                <dt>Ficha de un lote: lote anterior o siguiente</dt>
                <dd>
                  <Tecla>J</Tecla>
                  <Tecla>K</Tecla>
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h3>Ir a</h3>
            <dl>
              {modulos.map((m) => (
                <div key={m.ruta}>
                  <dt>{m.nombre}</dt>
                  <dd>
                    <Tecla>G</Tecla>
                    <Tecla>{m.atajo}</Tecla>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h3>Registrar</h3>
            <dl>
              {accionesDisponibles.map((a) => (
                <div key={a.id}>
                  <dt>{a.nombre}</dt>
                  <dd>
                    <Tecla>N</Tecla>
                    <Tecla>{a.atajo}</Tecla>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </Modal>
    </ContextoComandos.Provider>
  );
}

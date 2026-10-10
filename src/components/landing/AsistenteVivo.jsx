import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Insignia from "../ui/Insignia";
import { SUGERENCIAS, responder } from "../../datos/asistente";

/*
  El asistente del producto respondiendo en el navegador con los registros del
  vivero. La respuesta se escribe palabra por palabra tras un instante de
  «pensando»; las piezas verificables (lista y fuente) llegan al final. Quien
  usa lector de pantalla oye la respuesta completa una sola vez, al terminar.
  Con movimiento reducido la respuesta aparece entera.
*/

const PAUSA_PENSANDO = 520;
// Responde como lo vería la supervisora: sin sesión, las alertas (que dependen
// del rol) saldrían vacías y el asistente diría que no hay nada urgente.
const LECTORA = { role: "supervisor", personaId: "PER-002", name: "Laura Méndez" };
const PASO_PALABRA = 26;

function movimientoReducido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AsistenteVivo({ datos, onPensando }) {
  const [charla, setCharla] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [escritura, setEscritura] = useState(null);
  const [anuncio, setAnuncio] = useState("");
  const charlaRef = useRef(null);
  const turnos = useRef(0);

  const bajar = () => {
    window.requestAnimationFrame(() => {
      const nodo = charlaRef.current;
      if (nodo) nodo.scrollTo({ top: nodo.scrollHeight, behavior: movimientoReducido() ? "auto" : "smooth" });
    });
  };

  // Avance de la escritura: pensar, luego palabra a palabra.
  useEffect(() => {
    if (!escritura) return undefined;
    const turno = charla.find((t) => t.id === escritura.id);
    if (!turno) return undefined;
    const total = turno.palabras.length;
    if (escritura.fase === "pensando") {
      const espera = window.setTimeout(() => setEscritura({ id: escritura.id, fase: "escribiendo", n: 0 }), PAUSA_PENSANDO);
      return () => window.clearTimeout(espera);
    }
    if (escritura.n >= total) {
      onPensando?.(false);
      setAnuncio(`${turno.respuesta.texto}${turno.respuesta.fuente ? ` Verificable en: ${turno.respuesta.fuente}.` : ""}`);
      const fin = window.setTimeout(() => setEscritura(null), 0);
      bajar();
      return () => window.clearTimeout(fin);
    }
    const paso = window.setTimeout(() => {
      setEscritura((actual) => (actual && actual.id === escritura.id ? { ...actual, n: Math.min(total, actual.n + 2) } : actual));
      if (escritura.n % 12 === 0) bajar();
    }, PASO_PALABRA);
    return () => window.clearTimeout(paso);
  }, [escritura, charla, onPensando]);

  const preguntar = (texto) => {
    const limpio = texto.trim();
    if (!limpio || escritura) return;
    const respuesta = responder(limpio, datos, LECTORA);
    turnos.current += 1;
    const id = turnos.current;
    setCharla((previa) => [...previa.slice(-5), { id, pregunta: limpio, respuesta, palabras: respuesta.texto.split(" ") }]);
    setPregunta("");
    setAnuncio("");
    if (movimientoReducido()) {
      setAnuncio(`${respuesta.texto}${respuesta.fuente ? ` Verificable en: ${respuesta.fuente}.` : ""}`);
    } else {
      onPensando?.(true);
      setEscritura({ id, fase: "pensando", n: 0 });
    }
    bajar();
  };

  return (
    <div className="aiden-chat">
      <div className="aiden-chat-historial" ref={charlaRef}>
        {charla.length === 0 && (
          <p className="aiden-chat-vacio">Elige una pregunta o escribe la tuya: el asistente responde con los registros del vivero.</p>
        )}
        {charla.map((turno) => {
          const activo = escritura?.id === turno.id;
          const pensando = activo && escritura.fase === "pensando";
          const completo = !activo;
          const visibles = activo ? turno.palabras.slice(0, escritura.n).join(" ") : turno.respuesta.texto;
          return (
            <div key={turno.id} className="aiden-chat-turno">
              <p className="aiden-chat-pregunta">{turno.pregunta}</p>
              <div className={`aiden-chat-respuesta ${activo ? "is-escribiendo" : ""}`} aria-hidden={activo || undefined}>
                {pensando ? (
                  <p className="aiden-chat-pensando" aria-label="El asistente está consultando los registros">
                    <i />
                    <i />
                    <i />
                    <span>Consultando los registros…</span>
                  </p>
                ) : (
                  <p>
                    {visibles}
                    {activo && <span className="aiden-chat-cursor" aria-hidden="true" />}
                  </p>
                )}
                {completo && turno.respuesta.items?.length > 0 && (
                  <ul>
                    {turno.respuesta.items.slice(0, 5).map((item) => (
                      <li key={item.texto}>
                        {item.etiqueta && <Insignia tono="neutral">{String(item.etiqueta).toUpperCase()}</Insignia>}
                        <span>{item.texto}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {completo && turno.respuesta.fuente && <small>Verificable en: {turno.respuesta.fuente}</small>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>
      <div className="aiden-chat-chips" role="group" aria-label="Preguntas sugeridas">
        {SUGERENCIAS.slice(0, 4).map((sugerencia) => (
          <button key={sugerencia} type="button" onClick={() => preguntar(sugerencia)} disabled={Boolean(escritura)}>
            {sugerencia}
          </button>
        ))}
      </div>
      <form
        className="aiden-chat-entrada"
        onSubmit={(evento) => {
          evento.preventDefault();
          preguntar(pregunta);
        }}
      >
        <label className="sr-only" htmlFor="pregunta-asistente">
          Escribe tu pregunta para el asistente
        </label>
        <input
          id="pregunta-asistente"
          value={pregunta}
          onChange={(evento) => setPregunta(evento.target.value)}
          placeholder="Escribe tu pregunta… por ejemplo, LT-2026-012"
          maxLength={160}
          autoComplete="off"
        />
        <button type="submit" className="aiden-boton aiden-boton-oscuro" aria-label="Preguntar al asistente" disabled={Boolean(escritura)}>
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}

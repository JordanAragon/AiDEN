import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BatteryFull,
  Bell,
  Check,
  LayoutDashboard,
  Package,
  RotateCcw,
  Route,
  Search,
  ShieldCheck,
  Signal,
  Sprout,
  Thermometer,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import Insignia from "../ui/Insignia";
import CifraRodante from "../ui/CifraRodante";
import { IsotipoAiden } from "../ui/MarcaAiden";
import { TONO_PRIORIDAD } from "../ui/tonos";
import { estadoIncidencia, ordenarTareas, pulsoDeLaSemana, resumenLote, tareaAbierta } from "../../datos/selectores";
import PasosEtapa from "../lote/PasosEtapa";
import { dinero, fechaCorta, numero, plural, vencimiento } from "../../utilidades/formato";

/*
  «La misma historia, tres pantallas»: el celular de Andrés (operario), el
  portátil de Laura (supervisora) y la tableta de Jordan (administrador),
  dibujados como dispositivos y con la interfaz de AiDEN viva dentro, alimentada
  por los mismos datos del vivero. Al marcar una tarea en el celular, el pulso
  viaja: el portátil la ve cerrada y la tableta suma el registro del día, con
  las mismas reglas de la app (solo una tarea con lote deja evento en la historia).
  Todo ocurre en memoria: la página no escribe nada en el navegador de quien la visita.
*/

const ANDRES = "PER-003";

// El hilo por donde viaja un registro: del celular, por encima del portátil, a la tableta.
const HILO = "M143 70 C 140 -46, 470 -74, 620 -8 C 770 -74, 1012 -50, 1013 326";

function horaAhora() {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

function prepararDatos(datos, lote) {
  const tareasAndres = ordenarTareas(datos.tareas.filter((t) => t.responsableId === ANDRES && tareaAbierta(t))).slice(0, 4);
  const eventosRecientes = [...datos.trazabilidad]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 3)
    .map((e) => ({
      id: e.id,
      quien: datos.personas.find((p) => p.id === e.responsableId)?.nombre || "Equipo",
      que: e.evento,
      lote: e.lote,
      cuando: fechaCorta(e.fecha),
    }));
  const carga = ["PER-003", "PER-004", "PER-005"].map((id) => ({
    id,
    nombre: datos.personas.find((p) => p.id === id)?.nombre || "",
    abiertas: datos.tareas.filter((t) => t.responsableId === id && tareaAbierta(t)).length,
  }));
  const resumen = resumenLote(lote, datos);
  return {
    tareasAndres,
    eventosRecientes,
    carga,
    trabajoAbierto: datos.tareas.filter(tareaAbierta).length,
    lotesActivos: datos.lotes.filter((l) => l.estado === "Activo").length,
    incidenciasAbiertas: datos.calidad.filter((i) => estadoIncidencia(i) !== "Cerrada").length,
    semana: pulsoDeLaSemana(datos),
    costoPlanta: resumen.costoPlanta,
    supervivencia: resumen.supervivencia,
    lote,
  };
}

/* ---------- Marcos de dispositivo ---------- */

function Celular({ children }) {
  return (
    <div className="aiden-disp aiden-disp-celular">
      <div className="aiden-disp-cuerpo">
        <span className="aiden-disp-isla" aria-hidden="true" />
        <div className="aiden-disp-pantalla">{children}</div>
      </div>
    </div>
  );
}

function Portatil({ children }) {
  return (
    <div className="aiden-disp aiden-disp-portatil">
      <div className="aiden-disp-cuerpo">
        <span className="aiden-disp-camara" aria-hidden="true" />
        <div className="aiden-disp-pantalla">{children}</div>
      </div>
      <span className="aiden-disp-base" aria-hidden="true" />
    </div>
  );
}

function Tableta({ children }) {
  return (
    <div className="aiden-disp aiden-disp-tableta">
      <div className="aiden-disp-cuerpo">
        <span className="aiden-disp-camara" aria-hidden="true" />
        <div className="aiden-disp-pantalla">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Pantallas ---------- */

function PantallaOperario({ tareas, hechas, onCompletar, onReiniciar }) {
  const abiertas = tareas.filter((t) => !hechas.has(t.id));
  const todas = abiertas.length === 0;
  return (
    <div className="aiden-app aiden-app-celular">
      <div className="aiden-app-estado" aria-hidden="true">
        <span>9:41</span>
        <span className="aiden-app-estado-iconos">
          <Signal size={12} />
          <Wifi size={12} />
          <BatteryFull size={14} />
        </span>
      </div>
      <header className="aiden-app-celular-cabecera">
        <IsotipoAiden tamano={22} />
        <div>
          <p className="aiden-app-titulo">Mi jornada</p>
          <p className="aiden-app-sub">Andrés Rojas · Operario</p>
        </div>
      </header>
      <div className="aiden-app-celular-resumen">
        <p>
          {todas ? "Jornada al día." : `${plural(abiertas.length, "tarea pendiente", "tareas pendientes")}`}
        </p>
        <span className="aiden-app-avance" aria-hidden="true">
          <i style={{ "--avance": tareas.length ? (tareas.length - abiertas.length) / tareas.length : 0 }} />
        </span>
      </div>
      <ul className="aiden-app-tareas">
        {tareas.map((tarea) => {
          const hecha = hechas.has(tarea.id);
          const venc = vencimiento(tarea.fecha);
          return (
            <li key={tarea.id} className={hecha ? "is-hecha" : ""}>
              <button
                type="button"
                className="aiden-app-check"
                onClick={() => onCompletar(tarea)}
                disabled={hecha}
                aria-label={hecha ? `${tarea.titulo}: completada` : `Marcar como hecha: ${tarea.titulo}`}
              >
                <span className="aiden-app-check-circulo" aria-hidden="true">
                  <Check size={15} strokeWidth={3} />
                </span>
              </button>
              <div className="min-w-0">
                <p className="aiden-app-tarea-titulo">{tarea.titulo}</p>
                <p className="aiden-app-tarea-meta">
                  {tarea.lote ? <span className="aiden-app-codigo">{tarea.lote}</span> : <span>{tarea.modulo}</span>}
                  <span>{hecha ? "Hecha ahora" : venc.texto}</span>
                </p>
              </div>
              {!hecha && <Insignia tono={TONO_PRIORIDAD[tarea.prioridad]}>{tarea.prioridad.toUpperCase()}</Insignia>}
            </li>
          );
        })}
      </ul>
      {todas && (
        <button type="button" className="aiden-app-reiniciar" onClick={onReiniciar}>
          <RotateCcw size={13} aria-hidden="true" /> Volver a la mañana
        </button>
      )}
    </div>
  );
}

const MODULOS_LATERAL = [LayoutDashboard, Sprout, Route, Thermometer, ShieldCheck, Package, Wallet, Users, BarChart3];

function PantallaSupervisor({ base, hechas, nuevos, cargaAndres, pulso }) {
  const abiertas = base.trabajoAbierto - hechas.size;
  return (
    <div className="aiden-app aiden-app-portatil">
      <nav className="aiden-app-lateral" aria-hidden="true">
        <IsotipoAiden tamano={20} />
        {MODULOS_LATERAL.map((Icono, i) => (
          <span key={i} className={i === 0 ? "is-activo" : ""}>
            <Icono size={14} />
          </span>
        ))}
      </nav>
      <div className="aiden-app-cuerpo">
        <div className="aiden-app-barra" aria-hidden="true">
          <span className="aiden-app-buscar">
            <Search size={11} /> Buscar módulos, lotes…
          </span>
          <span className="aiden-app-campana">
            <Bell size={13} />
            <i />
          </span>
          <span className="aiden-app-avatar">LM</span>
        </div>
        <p className="aiden-app-titulo">Centro de supervisión</p>
        <div className="aiden-app-pulso">
          {pulso > 0 && <span className="aiden-app-destello" key={pulso} aria-hidden="true" />}
          <div>
            <span>Trabajo abierto</span>
            <strong>
              <CifraRodante valor={abiertas} />
            </strong>
          </div>
          <div>
            <span>Lotes activos</span>
            <strong>{numero(base.lotesActivos)}</strong>
          </div>
          <div>
            <span>Incidencias</span>
            <strong>{numero(base.incidenciasAbiertas)}</strong>
          </div>
        </div>
        <div className="aiden-app-columnas">
          <section>
            <p className="aiden-app-seccion">Carga de trabajo</p>
            <ul className="aiden-app-carga">
              {base.carga.map((persona) => {
                const abiertasPersona = persona.id === ANDRES ? cargaAndres : persona.abiertas;
                return (
                  <li key={persona.id}>
                    <span>{persona.nombre}</span>
                    <strong>
                      <CifraRodante valor={abiertasPersona} />
                    </strong>
                    <i style={{ "--carga": Math.min(1, abiertasPersona / 6) }} aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <p className="aiden-app-seccion">Actividad reciente</p>
            <ul className="aiden-app-feed">
              {nuevos.map((e) => (
                <li key={e.id} className="is-nuevo">
                  <span className="aiden-app-feed-punto" aria-hidden="true" />
                  <div>
                    <p>
                      <b>{e.quien}</b> completó «{e.titulo}»
                    </p>
                    <p className="aiden-app-feed-meta">
                      {e.lote ? `${e.lote} · ` : ""}
                      {e.cuando}
                    </p>
                  </div>
                </li>
              ))}
              {base.eventosRecientes.slice(0, Math.max(1, 3 - nuevos.length)).map((e) => (
                <li key={e.id}>
                  <span className="aiden-app-feed-punto" aria-hidden="true" />
                  <div>
                    <p>
                      <b>{e.quien}</b> · {e.que}
                    </p>
                    <p className="aiden-app-feed-meta">
                      {e.lote} · {e.cuando}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="aiden-app-despacho">
          <div>
            <p className="aiden-app-seccion">Próximo despacho</p>
            <p className="aiden-app-despacho-lote">
              <span className="aiden-app-codigo">{base.lote.lote}</span> {base.lote.cultivo} · {numero(base.lote.cantidad)} plantas
            </p>
          </div>
          <div className="aiden-app-despacho-pista">
            <PasosEtapa etapa={base.lote.etapa} fechas={{}} compacto />
          </div>
          <span className="aiden-app-despacho-fecha">
            Sale <b>{fechaCorta(base.lote.fechaEstimada)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function PantallaAdmin({ base, registrosHoy, completadasHoy, pulso }) {
  const semana = base.semana.map((dia, i) => (i === base.semana.length - 1 ? { ...dia, registros: dia.registros + registrosHoy } : dia));
  const maximo = Math.max(1, ...semana.map((d) => d.registros));
  const total = semana.reduce((suma, d) => suma + d.registros, 0);
  const completadas = base.semana.reduce((suma, d) => suma + d.completadas, 0) + completadasHoy;
  return (
    <div className="aiden-app aiden-app-tableta">
      <header className="aiden-app-tableta-cabecera">
        <div>
          <p className="aiden-app-titulo">Centro de administración</p>
          <p className="aiden-app-sub">Jordan Aragon · Administrador</p>
        </div>
        <span className="aiden-app-avatar">JA</span>
      </header>
      <div className="aiden-app-cifras">
        <div>
          <span>Costo por planta</span>
          <strong>{base.costoPlanta == null ? "—" : dinero(base.costoPlanta)}</strong>
          <small>LT-2026-011 · tomate</small>
        </div>
        <div>
          <span>Supervivencia</span>
          <strong>{numero(base.supervivencia)} %</strong>
          <small>
            {numero(base.lote.cantidad)} de {numero(base.lote.cantidadInicial)} plantas
          </small>
        </div>
      </div>
      <section className="aiden-app-semana">
        {pulso > 0 && <span className="aiden-app-destello" key={pulso} aria-hidden="true" />}
        <p className="aiden-app-seccion">
          Pulso de la semana
          <span>
            <b>
              <CifraRodante valor={total} />
            </b>{" "}
            registros ·{" "}
            <b>
              <CifraRodante valor={completadas} />
            </b>{" "}
            completadas
          </span>
        </p>
        <div className="aiden-app-barras" aria-hidden="true">
          {semana.map((dia, i) => (
            <span key={dia.dia} className={i === semana.length - 1 ? "is-hoy" : ""}>
              <i style={{ "--alto": Math.max(0.05, dia.registros / maximo) }} />
              <small>{i === semana.length - 1 ? "hoy" : dia.etiqueta}</small>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- El capítulo ---------- */

const LECTURAS = [
  {
    clave: "operario",
    nombre: "Andrés, operario",
    frase: "Riega, fertiliza y reporta desde el celular, con las tareas primero y al alcance del pulgar.",
  },
  {
    clave: "supervisor",
    nombre: "Laura, supervisora",
    frase: "Ve el día ordenado por lo que pide decisión: carga del equipo, riesgos y lo que acaba de pasar.",
  },
  {
    clave: "admin",
    nombre: "Jordan, administrador",
    frase: "Lee el costo por planta y el pulso de la semana sin pedirle la planilla a nadie.",
  },
];

export default function CapituloPantallas({ datos, lote }) {
  const base = useMemo(() => prepararDatos(datos, lote), [datos, lote]);
  const [hechas, setHechas] = useState(() => new Set());
  const [nuevos, setNuevos] = useState([]);
  const [pulso, setPulso] = useState(0);
  const [aviso, setAviso] = useState("");
  const contador = useRef(0);

  const completar = (tarea) => {
    if (hechas.has(tarea.id)) return;
    setHechas((previas) => new Set(previas).add(tarea.id));
    contador.current += 1;
    if (tarea.lote) {
      setNuevos((previos) => [
        { id: `nuevo-${contador.current}`, quien: "Andrés Rojas", titulo: tarea.titulo, lote: tarea.lote, cuando: `hoy, ${horaAhora()}` },
        ...previos,
      ].slice(0, 3));
    }
    setPulso((p) => p + 1);
    setAviso(
      tarea.lote
        ? `Hecha: ${tarea.titulo}. Supervisión la ve cerrada y quedó en la historia de ${tarea.lote}.`
        : `Hecha: ${tarea.titulo}. Supervisión la ve cerrada.`,
    );
  };

  const reiniciar = () => {
    setHechas(new Set());
    setNuevos([]);
    setAviso("La jornada volvió a empezar.");
  };

  const conLote = base.tareasAndres.filter((t) => hechas.has(t.id) && t.lote).length;
  const cargaAndres = (base.carga.find((p) => p.id === ANDRES)?.abiertas || 0) - hechas.size;

  return (
    <section className="aiden-pantallas" id="roles" aria-labelledby="titulo-pantallas">
      <div className="aiden-shell">
        <header className="aiden-pantallas-cabecera">
          <h2 id="titulo-pantallas">
            La misma historia, <em>tres pantallas.</em>
          </h2>
          <p>
            Cada rol entra con su cuenta y ve lo suyo, sobre los mismos registros. Toca una tarea en el celular de Andrés
            y mira cómo llega al portátil de Laura y a la tableta de Jordan.
          </p>
        </header>
      </div>
      <div className="aiden-pantallas-escenario" data-pulso={pulso}>
        <div className="aiden-pantallas-piso" aria-hidden="true" />
        <svg className="aiden-pantallas-hilo" viewBox="0 0 1240 640" preserveAspectRatio="none" aria-hidden="true">
          <path className="aiden-hilo-ruta" d={HILO} pathLength="100" />
          {pulso > 0 && <path className="aiden-hilo-luz" key={pulso} d={HILO} pathLength="100" />}
        </svg>
        <figure className="aiden-pantallas-pieza is-portatil" aria-label="Portátil de Laura con el centro de supervisión">
          <Portatil>
            <PantallaSupervisor base={base} hechas={hechas} nuevos={nuevos} cargaAndres={cargaAndres} pulso={pulso} />
          </Portatil>
        </figure>
        <figure className="aiden-pantallas-pieza is-celular" aria-label="Celular de Andrés con su jornada">
          <Celular>
            <PantallaOperario tareas={base.tareasAndres} hechas={hechas} onCompletar={completar} onReiniciar={reiniciar} />
          </Celular>
          {hechas.size === 0 && (
            <span className="aiden-pantallas-pista" aria-hidden="true">
              Toca una tarea
            </span>
          )}
        </figure>
        <figure className="aiden-pantallas-pieza is-tableta" aria-label="Tableta de Jordan con el centro de administración">
          <Tableta>
            <PantallaAdmin base={base} registrosHoy={conLote} completadasHoy={hechas.size} pulso={pulso} />
          </Tableta>
        </figure>
      </div>
      <div className="aiden-shell">
        <ol className="aiden-pantallas-lecturas">
          {LECTURAS.map((lectura) => (
            <li key={lectura.clave}>
              <h3>{lectura.nombre}</h3>
              <p>{lectura.frase}</p>
            </li>
          ))}
        </ol>
        <p className="sr-only" role="status" aria-live="polite">
          {aviso}
        </p>
      </div>
    </section>
  );
}

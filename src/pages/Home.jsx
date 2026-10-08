import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ClipboardList,
  GitBranch,
  Menu,
  Package,
  ShieldCheck,
  Sprout,
  Thermometer,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeroPreview from "../components/dashboard/DashboardHeroPreview";
import { useTitulo } from "../hooks/useTitulo";
import "../estilos/landing-aiden-redesign.css";
import { LogotipoAiden } from "../components/ui/MarcaAiden";

const modulos = [
  [Sprout, "Producción", "Lotes, etapas y actividades", "Controla qué está ocurriendo con cada lote y en qué punto del proceso se encuentra.", "/produccion", "01"],
  [Package, "Inventario", "Existencias y movimientos", "Mantén visibles entradas, consumos y niveles mínimos antes de que se conviertan en un problema.", "/inventario", "02"],
  [GitBranch, "Trazabilidad", "Historia de cada lote", "Reconstruye el recorrido de un lote y relaciona los eventos que forman parte de su operación.", "/trazabilidad", "03"],
  [Thermometer, "Ambiental", "Condiciones de cultivo", "Registra las variables ambientales que aportan contexto al seguimiento del vivero.", "/ambiental", "04"],
  [ShieldCheck, "Calidad", "Incidencias y seguimiento", "Detecta, registra y da seguimiento a situaciones que requieren atención.", "/calidad", "05"],
  [CircleDollarSign, "Costos", "Gastos operativos", "Lee los costos junto al trabajo que los originó para entender mejor la operación.", "/costos", "06"],
  [Users, "Personal", "Equipo y responsabilidades", "Organiza personas, responsabilidades y carga de trabajo dentro de la operación.", "/personal", "07"],
  [BarChart3, "Reportes", "Lectura operativa", "Convierte los registros del sistema en información útil para el seguimiento.", "/reportes", "08"],
  [ClipboardList, "Configuración", "Contexto del sistema", "Ajusta usuarios y parámetros para que AiDEN responda a la operación real.", "/configuracion", "09"],
];

const roles = [
  ["01", "Administrador", "Visión global", "Usuarios, configuración y control integral del sistema."],
  ["02", "Supervisor", "Seguimiento", "Coordinación, incidencias y lectura de la operación."],
  ["03", "Operario", "Ejecución", "Tareas y registros que forman parte del trabajo diario."],
];

const connections = [
  ["Producción", "El lote define el contexto", "Etapa, actividad y avance se leen desde el mismo lote."],
  ["Inventario", "Los insumos acompañan el proceso", "Entradas, consumos y existencias quedan vinculados al trabajo."],
  ["Ambiental", "El entorno queda registrado", "Las condiciones de cultivo aportan contexto al seguimiento."],
  ["Calidad", "Las incidencias tienen seguimiento", "Cada hallazgo mantiene estado, responsable y relación con la operación."],
  ["Trazabilidad", "Los eventos conservan su historia", "Los cambios forman una secuencia que puede revisarse después."],
  ["Costos", "Los gastos dejan de estar aislados", "Los registros de costo se leen junto al trabajo que los originó."],
];

const intenciones = [
  ["01", "Controlar producción", "Ver lotes, etapas y actividades sin perder el estado de cada proceso.", 0],
  ["02", "Seguir un lote", "Reconstruir qué pasó, qué se usó, quién intervino y qué continúa.", 1],
  ["03", "Detectar incidencias", "Relacionar señales ambientales o de calidad con la operación afectada.", 2],
  ["04", "Entender costos", "Leer los gastos junto al trabajo que los originó, no como cifras aisladas.", 4],
  ["05", "Coordinar el equipo", "Dar a cada persona la información y responsabilidad que necesita.", 3],
];

const demoPasos = [
  ["01", "Alerta ambiental", "Una condición requiere atención.", "La señal entra al contexto operativo."],
  ["02", "Lote afectado", "La señal queda vinculada al contexto.", "Ya no es una alerta aislada."],
  ["03", "Tarea asignada", "El responsable recibe el siguiente paso.", "La operación define quién debe actuar."],
  ["04", "Acción registrada", "El resultado queda en la historia del lote.", "El sistema conserva qué ocurrió."],
  ["05", "Costo y trazabilidad", "La operación conserva sus consecuencias.", "El equipo puede reconstruir la decisión."],
];

export default function Inicio() {
  useTitulo(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [headerCompacto, setHeaderCompacto] = useState(false);
  const [conexionActiva, setConexionActiva] = useState(0);
  const [intencionActiva, setIntencionActiva] = useState(0);
  const [pasoActivo, setPasoActivo] = useState(0);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const cerrarMenu = () => setMenuAbierto(false);

  const seleccionarIntencion = (index) => {
    setIntencionActiva(index);
    setPasoActivo(intenciones[index][3]);
    const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("demostracion")?.scrollIntoView({
      behavior: movimientoReducido ? "auto" : "smooth",
      block: "start",
    });
  };

  const prepararSolicitud = async (event) => {
    event.preventDefault();
    const formulario = event.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());
    setEnviandoSolicitud(true);
    setSolicitudEnviada(false);
    setErrorSolicitud("");

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(datos),
      });

      if (response.status === 503) {
        throw new Error("FORMULARIO_NO_DISPONIBLE");
      }
      if (!response.ok) throw new Error("ENVIO_NO_CONFIRMADO");

      formulario.reset();
      setSolicitudEnviada(true);
    } catch (error) {
      setErrorSolicitud(
        error?.message === "FORMULARIO_NO_DISPONIBLE"
          ? "El formulario no está disponible temporalmente. Inténtalo de nuevo más tarde."
          : "No fue posible enviar la solicitud. Inténtalo de nuevo más tarde.",
      );
    } finally {
      setEnviandoSolicitud(false);
    }
  };

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

  return (
    <div className="aiden-redesign">
      <a className="aiden-skip-link" href="#contenido">Saltar al contenido principal</a>
      <header className={`aiden-header ${headerCompacto ? "is-compact" : ""}`}>
        <nav className="aiden-shell aiden-header-inner" aria-label="Navegación principal">
          <Link to="/" className="aiden-brand" onClick={cerrarMenu} aria-label="AiDEN, ir al inicio"><LogotipoAiden alto={34} /></Link>
          <div className="aiden-header-links">
            <a href="#operacion">La operación</a>
            <a href="#necesidades">Necesidades</a>
            <a href="#sistema">El sistema</a>
            <a href="#modulos">Módulos</a>
            <a href="#roles">Roles</a>
          </div>
          <div className="aiden-header-actions">
            <a href="#contacto" className="aiden-header-login">Solicitar demo</a>
            <Link to="/login" className="aiden-button aiden-button-ghost">Iniciar sesión</Link>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="aiden-menu"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-controls="aiden-mobile-panel"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((open) => !open)}
          >
            {menuAbierto ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>
        <div
          id="aiden-mobile-panel"
          ref={menuPanelRef}
          className={`aiden-mobile-panel ${menuAbierto ? "is-visible" : ""}`}
          aria-hidden={!menuAbierto}
          inert={!menuAbierto}
        >
          <a href="#operacion" onClick={cerrarMenu}>La operación</a>
          <a href="#necesidades" onClick={cerrarMenu}>Necesidades</a>
          <a href="#sistema" onClick={cerrarMenu}>El sistema</a>
          <a href="#modulos" onClick={cerrarMenu}>Módulos</a>
          <a href="#roles" onClick={cerrarMenu}>Roles</a>
          <a href="#contacto" className="aiden-button aiden-button-ghost" onClick={cerrarMenu}>Solicitar demo</a>
          <Link to="/login" className="aiden-button aiden-button-dark" onClick={cerrarMenu}>Iniciar sesión <ArrowRight size={14} /></Link>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>
        <section className="aiden-hero" id="inicio">
          <div className="aiden-shell aiden-hero-grid">
            <article className="aiden-hero-copy">
              <p className="aiden-label"><span className="aiden-live-dot" /> Plataforma operativa para viveros</p>
              <h1>Gestiona cada lote con <em>toda la operación conectada.</em></h1>
              <p className="aiden-hero-lead">Producción, inventario, trazabilidad, ambiente, calidad, costos y personal en un mismo sistema para entender qué está pasando y dónde actuar.</p>
              <div className="aiden-hero-actions">
                <a href="#contacto" className="aiden-button aiden-button-dark aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a>
                <a href="#demostracion" className="aiden-text-link"><span>01</span> Ver AiDEN en acción</a>
              </div>
              <div className="aiden-hero-meta"><span>Por lotes</span><i /><span>Por roles</span><i /><span>Con trazabilidad</span></div>
            </article>
            <figure className="aiden-hero-product" aria-label="Vista del dashboard de AiDEN">
              <div className="aiden-product-frame"><DashboardHeroPreview /><span className="aiden-product-corner">PRODUCT / SYSTEM VIEW</span></div>
              <figcaption><span>Vista real del producto</span><span>Datos de demostración</span></figcaption>
            </figure>
          </div>
          <div className="aiden-shell aiden-trust-strip" aria-label="Resumen del producto">
            <span>UN SISTEMA ESPECIALIZADO</span><i /><strong>09 módulos</strong><i /><strong>03 roles</strong><i /><strong>1 operación conectada</strong><i /><span>DEMO INTERACTIVA</span>
          </div>
        </section>

        <section className="aiden-problem" id="operacion">
          <div className="aiden-shell aiden-problem-grid">
            <header><p className="aiden-index">LA OPERACIÓN</p><h2>El problema no es tener datos. <em>Es tenerlos separados.</em></h2></header>
            <div className="aiden-problem-copy">
              <p className="aiden-kicker">El contexto importa</p>
              <p>Un lote cambia de etapa. Consume insumos. Tiene unas condiciones. Puede generar una incidencia. Una persona registra lo sucedido. Y alguien necesita entender todo eso después.</p>
              <p>AiDEN conecta esas piezas para que la información conserve la historia de la operación y no termine convertida en registros aislados.</p>
              <a href="#sistema" className="aiden-text-link"><span>02</span> Ver cómo se conecta</a>
            </div>
          </div>
          <div className="aiden-shell aiden-problem-strip">
            <article><span>01</span><strong>Registrar</strong><p>Lo que sucede queda documentado.</p></article>
            <article><span>02</span><strong>Conectar</strong><p>Cada registro conserva su contexto.</p></article>
            <article><span>03</span><strong>Seguir</strong><p>Las señales relevantes pueden revisarse.</p></article>
            <article><span>04</span><strong>Decidir</strong><p>La información llega con una historia detrás.</p></article>
          </div>
        </section>

        <section className="aiden-intents" id="necesidades">
          <div className="aiden-shell">
            <header className="aiden-section-header">
              <div><p className="aiden-index">¿QUÉ NECESITAS RESOLVER?</p><h2>Entra por el problema.<br /><em>Nosotros mostramos el sistema.</em></h2></div>
              <p>Empieza desde una necesidad concreta del vivero. Selecciona una ruta y AiDEN te lleva al recorrido operativo que la explica.</p>
            </header>
            <div className="aiden-intent-grid">
              {intenciones.map(([number, title, description], index) => (
                <button key={title} type="button" className={`aiden-intent-card ${intencionActiva === index ? "is-active" : ""}`} onClick={() => seleccionarIntencion(index)} aria-pressed={intencionActiva === index}>
                  <span>{number}</span><strong>{title}</strong><p>{description}</p><ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            <div className="aiden-intent-readout" aria-live="polite">
              <span>RUTA SELECCIONADA</span>
              <strong>{intenciones[intencionActiva][1]}</strong>
              <p>{intenciones[intencionActiva][2]}</p>
              <a href="#demostracion" onClick={() => setPasoActivo(intenciones[intencionActiva][3])}>Ir al recorrido <ArrowRight size={14} /></a>
            </div>
          </div>
        </section>

        <section className="aiden-system" id="sistema">
          <div className="aiden-shell">
            <header className="aiden-section-header aiden-section-header-dark">
              <div><p className="aiden-index">EL SISTEMA</p><h2>Una operación.<br /><em>Un contexto.</em></h2></div>
              <p>El lote funciona como punto de lectura para conectar eventos que, de otra forma, aparecen como registros aislados.</p>
            </header>
            <article className="aiden-operation-map">
              <div className="aiden-map-visual" role="img" aria-label="Relaciones de AiDEN: producción, inventario, ambiente, calidad, trazabilidad y costos conectados alrededor del lote">
                <span className="aiden-map-eyebrow">RELACIONES DEL SISTEMA</span>
                <span className="aiden-map-ring aiden-map-ring-one" /><span className="aiden-map-ring aiden-map-ring-two" />
                {connections.map(([name], index) => <span className={`aiden-map-node aiden-map-node-${index + 1} ${conexionActiva === index ? "is-active" : ""}`} key={name}>{name}</span>)}
                <span className="aiden-map-core"><Sprout size={22} /><small>CONTEXTO</small><strong>Lote</strong><b>Activo</b></span>
              </div>
              <div className="aiden-map-copy">
                <p className="aiden-kicker aiden-kicker-light">Cómo se relaciona la información</p>
                <div className="aiden-connection-list">
                  {connections.map(([name, text, detail], index) => (
                    <button key={name} type="button" aria-pressed={conexionActiva === index} onMouseEnter={() => setConexionActiva(index)} onFocus={() => setConexionActiva(index)} onClick={() => setConexionActiva(index)} className={`aiden-connection-item ${conexionActiva === index ? "is-active" : ""}`}>
                      <span>0{index + 1}</span><span><strong>{name}</strong><p>{text}</p><small>{detail}</small></span><ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </article>
            <div className="aiden-system-readout" aria-label="Capacidades que conecta AiDEN">
              <div><span>Contexto</span><strong>Por lote</strong><small>La operación mantiene su referencia</small></div>
              <div><span>Relación</span><strong>Conectada</strong><small>Registros vinculados al proceso</small></div>
              <div><span>Seguimiento</span><strong>Continuo</strong><small>Cambios y señales quedan visibles</small></div>
              <div><span>Acción</span><strong>Orientada</strong><small>La información apunta al siguiente paso</small></div>
            </div>
          </div>
        </section>

        <section className="aiden-demo-flow" id="demostracion">
          <div className="aiden-shell">
            <header className="aiden-section-header aiden-section-header-dark">
              <div><p className="aiden-index">DEMO / CASO OPERATIVO</p><h2>De una alerta a una decisión. <em>Sin perder el contexto.</em></h2></div>
              <p>Selecciona cada etapa para ver cómo cambia la lectura. Este recorrido convierte una situación concreta en una historia operativa visible.</p>
            </header>
            <div className="aiden-flow">
              {demoPasos.map(([number, title, description, detail], index) => (
                <div className="aiden-flow-step" key={title}>
                  <button type="button" className={`aiden-flow-card ${pasoActivo === index ? "is-active" : ""}`} onClick={() => setPasoActivo(index)} aria-pressed={pasoActivo === index}>
                    <span>{number}</span><strong>{title}</strong><p>{description}</p><ArrowUpRight size={15} />
                  </button>
                  {index < demoPasos.length - 1 && <i aria-hidden="true">→</i>}
                </div>
              ))}
            </div>
            <div className="aiden-demo-readout" aria-live="polite" aria-atomic="true">
              <div><span>PASO {demoPasos[pasoActivo][0]}</span><strong>{demoPasos[pasoActivo][1]}</strong></div>
              <p>{demoPasos[pasoActivo][3]}</p>
            </div>
          </div>
        </section>

        <section className="aiden-evidence">
          <div className="aiden-shell aiden-evidence-grid">
            <p className="aiden-index">PRUEBA DE PRODUCTO</p>
            <header><h2>No se trata de mostrar más. <em>Se trata de entender mejor.</em></h2><p>Mientras AiDEN evoluciona hacia una plataforma comercial, la evidencia más honesta es el producto: sus relaciones, sus vistas y la forma en que organiza una operación real.</p></header>
            <div className="aiden-evidence-cards">
              <article><span>01</span><h3>Estado</h3><p>Qué está activo, qué está pendiente y qué necesita atención.</p><div className="aiden-evidence-detail"><b>Lectura inmediata</b><span>Activos · pendientes · alertas</span></div></article>
              <article><span>02</span><h3>Relación</h3><p>Qué registro pertenece a qué lote, etapa, responsable o evento.</p><div className="aiden-evidence-detail"><b>Contexto conectado</b><span>Lote · etapa · actividad · responsable</span></div></article>
              <article><span>03</span><h3>Seguimiento</h3><p>Qué cambió, qué sigue y qué información necesita revisión.</p><div className="aiden-evidence-detail"><b>Continuidad operativa</b><span>Último registro · próxima actividad · incidencia</span></div></article>
              <article><span>04</span><h3>Acción</h3><p>Dónde intervenir y qué parte de la operación necesita atención.</p><div className="aiden-evidence-detail"><b>Siguiente paso</b><span>Qué revisar · quién responde · qué continúa</span></div></article>
            </div>
          </div>
        </section>

        <section className="aiden-complexity">
          <div className="aiden-shell aiden-complexity-grid">
            <p className="aiden-index aiden-index-light">MENOS FRICCIÓN</p>
            <div>
              <h2>Menos registros. <em>Más control.</em></h2>
              <p>Una sola operación puede producir decenas de registros. AiDEN los organiza alrededor del contexto que les da sentido.</p>
              <div className="aiden-complexity-metrics"><div><strong>01</strong><span>operación</span></div><div><strong>09</strong><span>áreas conectadas</span></div><div><strong>03</strong><span>perspectivas</span></div></div>
            </div>
            <div className="aiden-complexity-line"><span>Producción</span><i /><span>Inventario</span><i /><span>Calidad</span><i /><span>Costos</span><i /><span>Trazabilidad</span></div>
          </div>
        </section>

        <section className="aiden-modules" id="modulos">
          <div className="aiden-shell">
            <header className="aiden-section-header">
              <div><p className="aiden-index">MÓDULOS</p><h2>Todo el sistema.<br /><em>Cada pieza tiene trabajo.</em></h2></div>
              <p>Las nueve áreas forman una misma operación. El objetivo no es llenar la interfaz de funciones, sino poner cada una donde aporta contexto.</p>
            </header>
            <div className="aiden-bento">{modulos.map(([Icon, nombre, subtitulo, descripcion, ruta, number], index) => <Link to={ruta} key={nombre} className={`aiden-bento-card bento-${index + 1}`}><span className="aiden-bento-number">{number}</span><span className="aiden-bento-icon"><Icon size={18} /></span><span className="aiden-bento-kind">{subtitulo}</span><h3>{nombre}</h3><p>{descripcion}</p><ArrowUpRight size={16} className="aiden-bento-arrow" /></Link>)}</div>
          </div>
        </section>

        <section className="aiden-roles" id="roles">
          <div className="aiden-shell">
            <header className="aiden-section-header aiden-section-header-compact">
              <div><p className="aiden-index">ROLES</p><h2>La misma operación.<br /><em>La vista que corresponde.</em></h2></div>
              <p>La experiencia cambia según la responsabilidad dentro del vivero, evitando cargar a cada perfil con el mismo nivel de información.</p>
            </header>
            <div className="aiden-role-table">{roles.map(([number, role, focus, description]) => <Link key={role} to="/login" className="aiden-role-row" aria-label={`${role}: ${description} Ver opciones de acceso.`}><span className="aiden-role-number">{number}</span><h3>{role}</h3><strong>{focus}</strong><p>{description}</p><Check size={15} aria-hidden="true" /></Link>)}</div>
          </div>
        </section>

        <section className="aiden-clarity">
          <div className="aiden-shell aiden-clarity-grid">
            <p className="aiden-index">ANTES DE ENTRAR</p>
            <header><h2>Las preguntas importantes deberían responderse <em>antes del botón.</em></h2></header>
            <div className="aiden-clarity-list">
              <article><span>¿Qué es AiDEN?</span><p>Una plataforma de gestión operativa para organizar y seguir la actividad de un vivero.</p></article>
              <article><span>¿Para quién está pensada?</span><p>Para equipos que participan en la operación y necesitan distintas vistas según su responsabilidad.</p></article>
              <article><span>¿Qué conecta?</span><p>Producción, inventario, trazabilidad, ambiente, calidad, costos, personal, reportes y configuración.</p></article>
              <article><span>¿Qué se ve primero?</span><p>El estado de la operación y las señales que requieren seguimiento, usando los registros existentes del sistema.</p></article>
              <article><span>¿Qué no estamos prometiendo todavía?</span><p>Integraciones, automatizaciones, métricas comerciales o capacidades de backend que todavía no forman parte del producto validado.</p></article>
            </div>
          </div>
        </section>

        <section className="aiden-contact" id="contacto">
          <div className="aiden-shell aiden-contact-grid">
            <div>
              <p className="aiden-index">SOLICITAR DEMO</p>
              <h2 id="contacto-titulo">Cuéntanos qué necesitas <em>ordenar en tu vivero.</em></h2>
              <p className="aiden-contact-lead">Cuéntanos qué quieres mejorar y prepara una conversación comercial. La landing entrega la solicitud al receptor configurado mediante un webhook seguro en el despliegue.</p>
              <div className="aiden-contact-points"><span>01 <b>Conversación orientada</b></span><span>02 <b>Necesidad concreta</b></span><span>03 <b>Demo del producto</b></span></div>
            </div>
            <form className="aiden-lead-form" onSubmit={prepararSolicitud} aria-label="Solicitud de demostración de AiDEN" aria-busy={enviandoSolicitud}>
              <label>Nombre<input name="nombre" required minLength="2" maxLength="120" autoComplete="name" placeholder="Tu nombre" /></label>
              <label>Empresa o vivero<input name="empresa" required minLength="2" maxLength="160" autoComplete="organization" placeholder="Nombre de la organización" /></label>
              <label>Correo electrónico<input name="email" type="email" required maxLength="254" autoComplete="email" placeholder="correo@empresa.com" /></label>
              <label>¿Qué quieres resolver?<textarea name="mensaje" rows="4" maxLength="2000" placeholder="Producción, trazabilidad, inventario, costos..." /></label>
              <button type="submit" className="aiden-button aiden-button-dark aiden-button-large" disabled={enviandoSolicitud}>{enviandoSolicitud ? "Enviando..." : "Solicitar demo"} <ArrowRight size={15} /></button>
              <p className="aiden-lead-privacy">Al enviar estos datos, solicitas que el equipo te contacte. Consulta la <Link to="/privacidad">Política de privacidad</Link>.</p>
              {solicitudEnviada && <p className="aiden-form-status is-success" role="status" aria-live="polite">Solicitud recibida. El equipo puede continuar la conversación.</p>}
              {errorSolicitud && <p className="aiden-form-status" role="alert">{errorSolicitud}</p>}
            </form>
          </div>
        </section>

        <section className="aiden-final">
          <div className="aiden-shell aiden-final-inner">
            <div className="aiden-final-copy">
              <p className="aiden-index aiden-index-light">ENTRAR</p>
              <h2>Cuando el vivero se entiende como un sistema, <em>la interfaz deja de ser un laberinto.</em></h2>
              <p>Explora el producto o prepara una conversación para revisar cómo AiDEN encaja en la operación de tu vivero.</p>
              <div className="aiden-final-actions"><a href="#contacto" className="aiden-button aiden-button-light aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a><a href="#demostracion" className="aiden-final-link">Ver el recorrido operativo <ArrowUpRight size={14} /></a></div>
            </div>
            <aside className="aiden-final-stamp" aria-label="Resumen de AiDEN"><span>AiDEN</span><strong>09</strong><small>módulos conectados</small><i /><strong>03</strong><small>roles operativos</small><i /><b>01</b><small>experiencia de operación</small></aside>
          </div>
        </section>
      </main>

      <footer className="aiden-footer">
        <div className="aiden-shell aiden-footer-inner">
          <Link to="/" className="aiden-brand" aria-label="AiDEN, ir al inicio"><LogotipoAiden alto={28} /></Link>
          <span>Gestión operativa para viveros</span>
          <div><Link to="/terminos">Términos</Link><Link to="/privacidad">Privacidad</Link><Link to="/login">Ingresar</Link></div>
        </div>
      </footer>
    </div>
  );
}
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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeroPreview from "../components/dashboard/DashboardHeroPreview";
import { useTitulo } from "../hooks/useTitulo";
import "../estilos/landing-aiden-redesign.css";
import { LogotipoAiden } from "../components/ui/MarcaAiden";

const modulos = [
  [Sprout, "Producción", "Lotes, etapas y actividades", "Saber qué está ocurriendo con cada lote y en qué punto del proceso se encuentra.", "/produccion", "01"],
  [Package, "Inventario", "Existencias y movimientos", "Mantener el stock visible para registrar consumos, entradas y niveles mínimos.", "/inventario", "02"],
  [GitBranch, "Trazabilidad", "Historia de cada lote", "Conservar el recorrido de un lote y relacionar los eventos que forman parte de su operación.", "/trazabilidad", "03"],
  [Thermometer, "Ambiental", "Condiciones de cultivo", "Registrar las variables ambientales que acompañan el seguimiento del vivero.", "/ambiental", "04"],
  [ShieldCheck, "Calidad", "Incidencias y seguimiento", "Detectar, registrar y dar seguimiento a situaciones que requieren atención.", "/calidad", "05"],
  [CircleDollarSign, "Costos", "Gastos operativos", "Tener una lectura de los costos registrados para entender el comportamiento de la operación.", "/costos", "06"],
  [Users, "Personal", "Equipo y responsabilidades", "Organizar personas, responsabilidades y carga de trabajo dentro de la operación.", "/personal", "07"],
  [BarChart3, "Reportes", "Lectura operativa", "Convertir los registros del sistema en información que facilite el seguimiento.", "/reportes", "08"],
  [ClipboardList, "Configuración", "Contexto del sistema", "Ajustar usuarios y parámetros para que AiDEN responda a la operación real.", "/configuracion", "09"],
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

export default function Inicio() {
  useTitulo(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [headerCompacto, setHeaderCompacto] = useState(false);
  const [conexionActiva, setConexionActiva] = useState(0);
  const cerrarMenu = () => setMenuAbierto(false);

  const enviarSolicitud = async (event) => {
    event.preventDefault();
    setEnviandoSolicitud(true);
    setSolicitudEnviada(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contacto", { method: "POST", body: form });
      if (!response.ok) throw new Error("No se pudo enviar");
      event.currentTarget.reset();
      setSolicitudEnviada(true);
    } catch {
      setSolicitudEnviada(false);
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

  return (
    <div className="aiden-redesign">
      <header className={`aiden-header ${headerCompacto ? "is-compact" : ""}`}>
        <nav className="aiden-shell aiden-header-inner" aria-label="Navegación principal">
          <Link to="/" className="aiden-brand" onClick={cerrarMenu} aria-label="AiDEN, ir al inicio">
            <LogotipoAiden alto={34} />
          </Link>
          <div className="aiden-header-links"><a href="#operacion">La operación</a><a href="#sistema">El sistema</a><a href="#modulos">Módulos</a><a href="#roles">Roles</a></div>
          <div className="aiden-header-actions"><a href="#contacto" className="aiden-header-login">Solicitar demo</a><Link to="/login" className="aiden-button aiden-button-ghost">Iniciar sesión</Link></div>
          <button type="button" className="aiden-menu" aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuAbierto} onClick={() => setMenuAbierto((open) => !open)}>{menuAbierto ? <X size={19} /> : <Menu size={19} />}</button>
        </nav>
        <div className={`aiden-mobile-panel ${menuAbierto ? "is-visible" : ""}`} aria-hidden={!menuAbierto}>
          <a href="#operacion" onClick={cerrarMenu}>La operación</a><a href="#sistema" onClick={cerrarMenu}>El sistema</a><a href="#modulos" onClick={cerrarMenu}>Módulos</a><a href="#roles" onClick={cerrarMenu}>Roles</a>
          <a href="#contacto" className="aiden-button aiden-button-ghost" onClick={cerrarMenu}>Solicitar demo</a>
          <Link to="/login" className="aiden-button aiden-button-dark" onClick={cerrarMenu}>Iniciar sesión <ArrowRight size={14} /></Link>
        </div>
      </header>

      <main>
        <section className="aiden-hero" id="inicio">
          <div className="aiden-shell aiden-hero-grid">
            <article className="aiden-hero-copy">
              <p className="aiden-label"><span className="aiden-live-dot" /> Plataforma operativa para viveros</p>
              <h1>Controla cada lote y entiende <em>qué necesita atención.</em></h1>
              <p className="aiden-hero-lead">AiDEN conecta producción, inventario, trazabilidad, ambiente, calidad, costos y personal para que el equipo deje de buscar información dispersa y pueda actuar con contexto.</p>
              <div className="aiden-hero-actions"><a href="#contacto" className="aiden-button aiden-button-dark aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a><a href="#demostracion" className="aiden-text-link"><span>01</span> Ver AiDEN en acción</a></div>
                </article>
            <figure className="aiden-hero-product" aria-label="Vista del dashboard de AiDEN basada en los datos de la operación">
              <div className="aiden-product-frame"><DashboardHeroPreview /><span className="aiden-product-corner">PRODUCT / SYSTEM VIEW</span></div>
              <figcaption><span>Vista del producto</span><span>Lectura basada en datos registrados</span></figcaption>
            </figure>
          </div>
          <div className="aiden-shell aiden-trust-strip" aria-label="Qué puede explorar un visitante en AiDEN">
            <span>UN SISTEMA ESPECIALIZADO</span><i /><strong>09 módulos</strong><i /><strong>03 roles</strong><i /><strong>1 operación conectada</strong><i /><span>DEMO INTERACTIVA</span>
          </div>
        </section>

        <section className="aiden-problem" id="operacion">
          <div className="aiden-shell aiden-problem-grid">
            <header><p className="aiden-index">LA OPERACIÓN</p><h2>El problema no es tener datos. <em>Es tenerlos separados.</em></h2></header>
            <div className="aiden-problem-copy"><p className="aiden-kicker">Lo que AiDEN intenta ordenar</p><p>Un lote cambia de etapa. Consume insumos. Tiene unas condiciones. Puede generar una incidencia. Una persona registra lo sucedido. Y alguien necesita entender todo eso después.</p><p>La propuesta de AiDEN parte de esa relación: registrar cada pieza sin perder el contexto que permite leer la operación completa.</p><a href="#sistema" className="aiden-text-link"><span>03</span> Ver cómo se conecta</a></div>
          </div>
          <div className="aiden-shell aiden-problem-strip"><article><span>01</span><strong>Registro</strong><p>Lo que sucede queda documentado.</p></article><article><span>02</span><strong>Contexto</strong><p>Cada registro pertenece a una operación.</p></article><article><span>03</span><strong>Seguimiento</strong><p>Las señales relevantes pueden revisarse.</p></article><article><span>04</span><strong>Decisión</strong><p>La información llega con una historia detrás.</p></article></div>
        </section>

        <section className="aiden-intents" id="necesidades">
          <div className="aiden-shell">
            <header className="aiden-section-header">
              <div><p className="aiden-index">¿QUÉ NECESITAS RESOLVER?</p><h2>Entra por el problema.<br /><em>Nosotros mostramos el sistema.</em></h2></div>
              <p>AiDEN no debería obligar a un visitante a entender primero la arquitectura del producto. Estas rutas llevan directamente a situaciones reales de la operación.</p>
            </header>
            <div className="aiden-intent-grid">
              <a href="#demostracion"><span>01</span><strong>Controlar producción</strong><p>Ver lotes, etapas y actividades sin perder el estado de cada proceso.</p><ArrowUpRight size={16} /></a>
              <a href="#demostracion"><span>02</span><strong>Seguir un lote</strong><p>Reconstruir qué pasó, qué se usó, quién intervino y qué continúa.</p><ArrowUpRight size={16} /></a>
              <a href="#demostracion"><span>03</span><strong>Detectar incidencias</strong><p>Relacionar señales ambientales o de calidad con la operación afectada.</p><ArrowUpRight size={16} /></a>
              <a href="#demostracion"><span>04</span><strong>Entender costos</strong><p>Leer los gastos junto al trabajo que los originó, no como cifras aisladas.</p><ArrowUpRight size={16} /></a>
              <a href="#demostracion"><span>05</span><strong>Coordinar el equipo</strong><p>Dar a cada persona la información y responsabilidad que necesita.</p><ArrowUpRight size={16} /></a>
            </div>
          </div>
        </section>

        <section className="aiden-system" id="sistema">
          <div className="aiden-shell">
            <header className="aiden-section-header aiden-section-header-dark"><div><p className="aiden-index">EL SISTEMA</p><h2>Una operación.<br /><em>Un contexto.</em></h2></div><p>El lote funciona como punto de lectura para conectar eventos que, de otra forma, aparecen como registros aislados.</p></header>
            <article className="aiden-operation-map">
              <div className="aiden-map-visual"><span className="aiden-map-eyebrow">RELACIONES DEL SISTEMA</span><span className="aiden-map-ring aiden-map-ring-one" /><span className="aiden-map-ring aiden-map-ring-two" />{connections.map(([name], index) => <span className={`aiden-map-node aiden-map-node-${index + 1} ${conexionActiva === index ? "is-active" : ""}`} key={name}>{name}</span>)}<span className="aiden-map-core"><Sprout size={22} /><small>CONTEXTO</small><strong>Lote</strong><b>Activo</b></span></div>
              <div className="aiden-map-copy"><p className="aiden-kicker aiden-kicker-light">Cómo se relaciona la información</p><div className="aiden-connection-list">{connections.map(([name, text, detail], index) => <button key={name} type="button" aria-pressed={conexionActiva === index} onMouseEnter={() => setConexionActiva(index)} onFocus={() => setConexionActiva(index)} onClick={() => setConexionActiva(index)} className={`aiden-connection-item ${conexionActiva === index ? "is-active" : ""}`}><span>0{index + 1}</span><span><strong>{name}</strong><p>{text}</p><small>{detail}</small></span><ArrowUpRight size={14} aria-hidden="true" /></button>)}</div></div>
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
              <p>Este es el recorrido que debe entender un comprador en pocos segundos: una señal entra al sistema y termina convertida en una acción trazable.</p>
            </header>
            <div className="aiden-flow">
              <article><span>01</span><strong>Alerta ambiental</strong><p>Una condición requiere atención.</p></article>
              <i>→</i><article><span>02</span><strong>Lote afectado</strong><p>La señal queda vinculada al contexto.</p></article>
              <i>→</i><article><span>03</span><strong>Tarea asignada</strong><p>El responsable recibe el siguiente paso.</p></article>
              <i>→</i><article><span>04</span><strong>Acción registrada</strong><p>El resultado queda en la historia del lote.</p></article>
              <i>→</i><article><span>05</span><strong>Costo y trazabilidad</strong><p>La operación conserva sus consecuencias.</p></article>
            </div>
          </div>
        </section>

        <section className="aiden-evidence"><div className="aiden-shell aiden-evidence-grid"><p className="aiden-index">DE LA INFORMACIÓN A LA ACCIÓN</p><header><h2>No se trata de mostrar más. <em>Se trata de entender mejor.</em></h2><p>En un vivero, lo importante no es mostrar más: es hacer visible lo que importa, reducir la búsqueda manual y dejar claro dónde mirar después.</p></header><div className="aiden-evidence-cards">
          <article><span>01</span><h3>Estado</h3><p>Qué está activo, qué está pendiente y qué necesita atención.</p><div className="aiden-evidence-detail"><b>Lectura inmediata</b><span>Activos · pendientes · alertas</span></div></article>
          <article><span>02</span><h3>Relación</h3><p>Qué registro pertenece a qué lote, etapa, responsable o evento.</p><div className="aiden-evidence-detail"><b>Contexto conectado</b><span>Lote · etapa · actividad · responsable</span></div></article>
          <article><span>03</span><h3>Seguimiento</h3><p>Qué cambió, qué sigue y qué información necesita revisión.</p><div className="aiden-evidence-detail"><b>Continuidad operativa</b><span>Último registro · próxima actividad · incidencia</span></div></article>
          <article><span>04</span><h3>Acción</h3><p>Dónde intervenir y qué parte de la operación necesita atención.</p><div className="aiden-evidence-detail"><b>Siguiente paso</b><span>Qué revisar · quién responde · qué continúa</span></div></article>
        </div></div></section>

        <section className="aiden-modules" id="modulos"><div className="aiden-shell"><header className="aiden-section-header"><div><p className="aiden-index">MÓDULOS</p><h2>Todo el sistema.<br /><em>Cada pieza tiene trabajo.</em></h2></div><p>Las nueve áreas forman una misma operación. El objetivo no es llenar la interfaz de funciones, sino poner cada una donde aporta contexto.</p></header><div className="aiden-bento">{modulos.map(([Icon, nombre, subtitulo, descripcion, ruta, number], index) => <Link to={ruta} key={nombre} className={`aiden-bento-card bento-${index + 1}`}><span className="aiden-bento-number">{number}</span><span className="aiden-bento-icon"><Icon size={18} /></span><span className="aiden-bento-kind">{subtitulo}</span><h3>{nombre}</h3><p>{descripcion}</p><ArrowUpRight size={16} className="aiden-bento-arrow" /></Link>)}</div></div></section>

        <section className="aiden-roles" id="roles"><div className="aiden-shell"><header className="aiden-section-header aiden-section-header-compact"><div><p className="aiden-index">ROLES</p><h2>La misma operación.<br /><em>La vista que corresponde.</em></h2></div><p>La experiencia cambia según la responsabilidad dentro del vivero, evitando cargar a cada perfil con el mismo nivel de información.</p></header><div className="aiden-role-table">{roles.map(([number, role, focus, description]) => <Link key={role} to="/login" className="aiden-role-row" aria-label={`${role}: ${description} Ver opciones de acceso.`}><span className="aiden-role-number">{number}</span><h3>{role}</h3><strong>{focus}</strong><p>{description}</p><Check size={15} aria-hidden="true" /></Link>)}</div></div></section>

        <section className="aiden-clarity"><div className="aiden-shell aiden-clarity-grid"><p className="aiden-index">ANTES DE ENTRAR</p><header><h2>Las preguntas importantes deberían responderse <em>antes del botón.</em></h2></header><div className="aiden-clarity-list"><article><span>¿Qué es AiDEN?</span><p>Una plataforma de gestión operativa para organizar y seguir la actividad de un vivero.</p></article><article><span>¿Para quién está pensada?</span><p>Para equipos que participan en la operación y necesitan distintas vistas según su responsabilidad.</p></article><article><span>¿Qué conecta?</span><p>Producción, inventario, trazabilidad, ambiente, calidad, costos, personal, reportes y configuración.</p></article><article><span>¿Qué se ve primero?</span><p>El estado de la operación y las señales que requieren seguimiento, usando los registros existentes del sistema.</p></article></div></div></section>

        <section className="aiden-contact" id="contacto">
          <div className="aiden-shell aiden-contact-grid">
            <div>
              <p className="aiden-index">SOLICITAR DEMO</p>
              <h2>Cuéntanos qué necesitas <em>ordenar en tu vivero.</em></h2>
              <p className="aiden-contact-lead">Déjanos los datos básicos y prepara una conversación sobre la operación. El formulario está conectado a un endpoint preparado para el receptor comercial de AiDEN.</p>
            </div>
            <form className="aiden-lead-form" onSubmit={enviarSolicitud}>
              <label>Nombre<input name="nombre" required autoComplete="name" placeholder="Tu nombre" /></label>
              <label>Empresa o vivero<input name="empresa" required autoComplete="organization" placeholder="Nombre de la organización" /></label>
              <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="correo@empresa.com" /></label>
              <label>¿Qué quieres resolver?<textarea name="mensaje" rows="4" placeholder="Producción, trazabilidad, inventario, costos..." /></label>
              <button type="submit" className="aiden-button aiden-button-dark aiden-button-large" disabled={enviandoSolicitud}>{enviandoSolicitud ? "Enviando..." : "Solicitar demo"} <ArrowRight size={15} /></button>
              {solicitudEnviada && <p className="aiden-form-status is-success" role="status">Solicitud recibida. Nos pondremos en contacto contigo.</p>}
              {!solicitudEnviada && !enviandoSolicitud && <p className="aiden-form-status">La recepción comercial requiere configurar el endpoint de leads antes de producción.</p>}
            </form>
          </div>
        </section>

        <section className="aiden-final"><div className="aiden-shell aiden-final-inner"><div className="aiden-final-copy"><p className="aiden-index aiden-index-light">ENTRAR</p><h2>Cuando el vivero se entiende como un sistema, <em>la interfaz deja de ser un laberinto.</em></h2><p>Explora el sistema o solicita una demo para revisar cómo encaja en la operación de tu vivero.</p><a href="#contacto" className="aiden-button aiden-button-light aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a></div><aside className="aiden-final-stamp" aria-label="Resumen de AiDEN"><span>AiDEN</span><strong>09</strong><small>módulos conectados</small><i /><strong>03</strong><small>roles operativos</small><i /><b>01</b><small>experiencia</small></aside></div></section>
      </main>

      <footer className="aiden-footer"><div className="aiden-shell aiden-footer-inner"><Link to="/" className="aiden-brand" aria-label="AiDEN, ir al inicio"><LogotipoAiden alto={28} /></Link><span>Gestión operativa para viveros</span><div><Link to="/terminos">Términos</Link><Link to="/privacidad">Privacidad</Link><Link to="/login">Ingresar</Link></div></div></footer>
    </div>
  );
}

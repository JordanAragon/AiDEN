import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ClipboardList,
  GitBranch,
  Leaf,
  Menu,
  Package,
  ShieldCheck,
  Sprout,
  Thermometer,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeroPreview from "../components/dashboard/DashboardHeroPreview";
import "../estilos/landing-aiden-redesign.css";

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
  ["Producción", "El lote define el contexto"],
  ["Inventario", "Los insumos acompañan el proceso"],
  ["Ambiental", "El entorno queda registrado"],
  ["Calidad", "Las incidencias tienen seguimiento"],
  ["Trazabilidad", "Los eventos conservan su historia"],
  ["Costos", "Los gastos dejan de estar aislados"],
];

export default function Inicio() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="aiden-redesign">
      <header className="aiden-header">
        <nav className="aiden-shell aiden-header-inner" aria-label="Navegación principal">
          <Link to="/" className="aiden-brand" onClick={cerrarMenu}>
            <span className="aiden-brand-mark" aria-hidden="true"><Leaf size={15} strokeWidth={2.4} /></span>
            <span>AiDEN</span>
          </Link>
          <div className="aiden-header-links"><a href="#operacion">La operación</a><a href="#sistema">El sistema</a><a href="#modulos">Módulos</a><a href="#roles">Roles</a></div>
          <div className="aiden-header-actions"><Link to="/login" className="aiden-header-login">Iniciar sesión</Link><Link to="/signup" className="aiden-button aiden-button-dark">Entrar a AiDEN <ArrowRight size={14} /></Link></div>
          <button type="button" className="aiden-menu" aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuAbierto} onClick={() => setMenuAbierto((open) => !open)}>{menuAbierto ? <X size={19} /> : <Menu size={19} />}</button>
        </nav>
        <div className={`aiden-mobile-panel ${menuAbierto ? "is-visible" : ""}`} aria-hidden={!menuAbierto}>
          <a href="#operacion" onClick={cerrarMenu}>La operación</a><a href="#sistema" onClick={cerrarMenu}>El sistema</a><a href="#modulos" onClick={cerrarMenu}>Módulos</a><a href="#roles" onClick={cerrarMenu}>Roles</a>
          <Link to="/login" className="aiden-button aiden-button-ghost" onClick={cerrarMenu}>Iniciar sesión</Link>
          <Link to="/signup" className="aiden-button aiden-button-dark" onClick={cerrarMenu}>Entrar a AiDEN <ArrowRight size={14} /></Link>
        </div>
      </header>

      <main>
        <section className="aiden-hero" id="inicio">
          <div className="aiden-shell aiden-hero-grid">
            <article className="aiden-hero-copy">
              <p className="aiden-label"><span className="aiden-live-dot" /> Plataforma operativa para viveros</p>
              <h1>El vivero no es una colección de datos. <em>Es una operación.</em></h1>
              <p className="aiden-hero-lead">AiDEN reúne producción, inventario, trazabilidad, ambiente, calidad, costos y personal en una sola experiencia para entender qué está pasando y actuar con contexto.</p>
              <div className="aiden-hero-actions"><Link to="/signup" className="aiden-button aiden-button-dark aiden-button-large">Explorar AiDEN <ArrowRight size={15} /></Link><a href="#operacion" className="aiden-text-link"><span>01</span> Entender la operación</a></div>
              <div className="aiden-hero-meta" aria-label="Características de la plataforma"><span>03 roles</span><i /><span>09 módulos</span><i /><span>01 contexto operativo</span></div>
            </article>
            <figure className="aiden-hero-product" aria-label="Vista real del dashboard de AiDEN">
              <div className="aiden-product-frame"><DashboardHeroPreview /><span className="aiden-product-corner">LIVE / PRODUCT VIEW</span></div>
              <figcaption><span>Interfaz real del sistema</span><span>El contenido depende de los datos registrados</span></figcaption>
            </figure>
          </div>
          <div className="aiden-hero-rule" aria-hidden="true"><span>PRODUCCIÓN</span><i /><span>CONTEXTO</span><i /><span>CONTROL</span><i /><span>ACCIÓN</span></div>
        </section>

        <section className="aiden-problem" id="operacion">
          <div className="aiden-shell aiden-problem-grid">
            <header><p className="aiden-index">02 / LA OPERACIÓN</p><h2>El problema no es tener datos. <em>Es tenerlos separados.</em></h2></header>
            <div className="aiden-problem-copy"><p className="aiden-kicker">Lo que AiDEN intenta ordenar</p><p>Un lote cambia de etapa. Consume insumos. Tiene unas condiciones. Puede generar una incidencia. Una persona registra lo sucedido. Y alguien necesita entender todo eso después.</p><p>La propuesta de AiDEN parte de esa relación: registrar cada pieza sin perder el contexto que permite leer la operación completa.</p><a href="#sistema" className="aiden-text-link"><span>03</span> Ver cómo se conecta</a></div>
          </div>
          <div className="aiden-shell aiden-problem-strip"><article><span>01</span><strong>Registro</strong><p>Lo que sucede queda documentado.</p></article><article><span>02</span><strong>Contexto</strong><p>Cada registro pertenece a una operación.</p></article><article><span>03</span><strong>Seguimiento</strong><p>Las señales relevantes pueden revisarse.</p></article><article><span>04</span><strong>Decisión</strong><p>La información llega con una historia detrás.</p></article></div>
        </section>

        <section className="aiden-system" id="sistema">
          <div className="aiden-shell">
            <header className="aiden-section-header aiden-section-header-dark"><div><p className="aiden-index">03 / EL SISTEMA</p><h2>Una operación.<br /><em>Un contexto.</em></h2></div><p>El lote funciona como punto de lectura para conectar eventos que, de otra forma, aparecen como registros aislados.</p></header>
            <article className="aiden-operation-map">
              <div className="aiden-map-visual"><span className="aiden-map-ring aiden-map-ring-one" /><span className="aiden-map-ring aiden-map-ring-two" />{connections.map(([name], index) => <span className={`aiden-map-node aiden-map-node-${index + 1}`} key={name}>{name}</span>)}<span className="aiden-map-core"><Sprout size={22} /><small>CONTEXTO</small><strong>Lote</strong><b>024</b></span></div>
              <div className="aiden-map-copy"><p className="aiden-kicker aiden-kicker-light">Cómo se relaciona la información</p><div className="aiden-connection-list">{connections.map(([name, text], index) => <article key={name}><span>0{index + 1}</span><div><strong>{name}</strong><p>{text}</p></div><ArrowUpRight size={14} /></article>)}</div></div>
            </article>
          </div>
        </section>

        <section className="aiden-evidence"><div className="aiden-shell aiden-evidence-grid"><p className="aiden-index">04 / DE LA INFORMACIÓN A LA ACCIÓN</p><header><h2>No se trata de mostrar más. <em>Se trata de entender mejor.</em></h2><p>La interfaz debe hacer visible lo que importa, reducir la búsqueda manual y dejar claro dónde mirar después.</p></header><div className="aiden-evidence-cards"><article><span>01</span><h3>Estado</h3><p>Qué está activo, qué está pendiente y qué necesita atención.</p></article><article><span>02</span><h3>Relación</h3><p>Qué registro pertenece a qué lote, etapa, responsable o evento.</p></article><article><span>03</span><h3>Seguimiento</h3><p>Qué información puede revisarse para continuar el trabajo.</p></article></div></div></section>

        <section className="aiden-modules" id="modulos"><div className="aiden-shell"><header className="aiden-section-header"><div><p className="aiden-index">05 / MÓDULOS</p><h2>Todo el sistema.<br /><em>Cada pieza tiene trabajo.</em></h2></div><p>Las nueve áreas forman una misma operación. El objetivo no es llenar la interfaz de funciones, sino poner cada una donde aporta contexto.</p></header><div className="aiden-bento">{modulos.map(([Icon, nombre, subtitulo, descripcion, ruta, number], index) => <Link to={ruta} key={nombre} className={`aiden-bento-card bento-${index + 1}`}><span className="aiden-bento-number">{number}</span><span className="aiden-bento-icon"><Icon size={18} /></span><span className="aiden-bento-kind">{subtitulo}</span><h3>{nombre}</h3><p>{descripcion}</p><ArrowUpRight size={16} className="aiden-bento-arrow" /></Link>)}</div></div></section>

        <section className="aiden-roles" id="roles"><div className="aiden-shell"><header className="aiden-section-header aiden-section-header-compact"><div><p className="aiden-index">06 / ROLES</p><h2>La misma operación.<br /><em>La vista que corresponde.</em></h2></div><p>La experiencia cambia según la responsabilidad dentro del vivero, evitando cargar a cada perfil con el mismo nivel de información.</p></header><div className="aiden-role-table">{roles.map(([number, role, focus, description]) => <article key={role} className="aiden-role-row"><span className="aiden-role-number">{number}</span><h3>{role}</h3><strong>{focus}</strong><p>{description}</p><Check size={15} aria-hidden="true" /></article>)}</div></div></section>

        <section className="aiden-clarity"><div className="aiden-shell aiden-clarity-grid"><p className="aiden-index">07 / ANTES DE ENTRAR</p><header><h2>Las preguntas importantes deberían responderse <em>antes del botón.</em></h2></header><div className="aiden-clarity-list"><article><span>¿Qué es AiDEN?</span><p>Una plataforma de gestión operativa para organizar y seguir la actividad de un vivero.</p></article><article><span>¿Para quién está pensada?</span><p>Para equipos que participan en la operación y necesitan distintas vistas según su responsabilidad.</p></article><article><span>¿Qué conecta?</span><p>Producción, inventario, trazabilidad, ambiente, calidad, costos, personal, reportes y configuración.</p></article><article><span>¿Qué se ve primero?</span><p>El estado de la operación y las señales que requieren seguimiento, usando los registros existentes del sistema.</p></article></div></div></section>

        <section className="aiden-final"><div className="aiden-shell aiden-final-inner"><div className="aiden-final-copy"><p className="aiden-index aiden-index-light">08 / ENTRAR</p><h2>Cuando el vivero se entiende como un sistema, <em>la interfaz deja de ser un laberinto.</em></h2><p>Explora AiDEN y recorre la operación desde el dato hasta el contexto.</p><Link to="/signup" className="aiden-button aiden-button-light aiden-button-large">Entrar a AiDEN <ArrowRight size={15} /></Link></div><aside className="aiden-final-stamp" aria-label="Resumen de AiDEN"><span>AiDEN</span><strong>09</strong><small>módulos conectados</small><i /><strong>03</strong><small>roles operativos</small><i /><b>01</b><small>experiencia</small></aside></div></section>
      </main>

      <footer className="aiden-footer"><div className="aiden-shell aiden-footer-inner"><Link to="/" className="aiden-brand"><span className="aiden-brand-mark" aria-hidden="true"><Leaf size={14} /></span><span>AiDEN</span></Link><span>Gestión operativa para viveros</span><div><Link to="/terminos">Términos</Link><Link to="/privacidad">Privacidad</Link><Link to="/login">Ingresar</Link></div><small>Proyecto académico · 2026</small></div></footer>
    </div>
  );
}

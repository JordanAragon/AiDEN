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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardHeroPreview from "../components/dashboard/DashboardHeroPreview";
import { useTitulo } from "../hooks/useTitulo";
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
  const [headerCompacto, setHeaderCompacto] = useState(false);
  const [conexionActiva, setConexionActiva] = useState(0);
  const [estadoSolicitud, setEstadoSolicitud] = useState(null);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  const enviarSolicitud = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || enviandoSolicitud) return;

    const endpoint = import.meta.env.VITE_LEADS_ENDPOINT;
    if (!endpoint) {
      setEstadoSolicitud({ tipo: "error", mensaje: "El canal para recibir solicitudes aún no está configurado. Define VITE_LEADS_ENDPOINT antes de publicar esta campaña." });
      return;
    }

    setEnviandoSolicitud(true);
    setEstadoSolicitud(null);
    const datos = Object.fromEntries(new FormData(form).entries());
    try {
      const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, origen: "landing", enviadoEn: new Date().toISOString() }),
      });
      if (!respuesta.ok) throw new Error("No fue posible enviar la solicitud.");
      form.reset();
      setEstadoSolicitud({ tipo: "exito", mensaje: "Recibimos tu solicitud. El equipo de AiDEN se pondrá en contacto contigo." });
    } catch {
      setEstadoSolicitud({ tipo: "error", mensaje: "No pudimos enviar tu solicitud. Inténtalo nuevamente o contáctanos por el canal habitual." });
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
          <Link to="/" className="aiden-brand" onClick={cerrarMenu}>
            <span className="aiden-brand-mark" aria-hidden="true"><Leaf size={15} strokeWidth={2.4} /></span>
            <span>AiDEN</span>
          </Link>
          <div className="aiden-header-links"><a href="#soluciones">Soluciones</a><a href="#sistema">Cómo funciona</a><a href="#roles">Para tu equipo</a><a href="#contacto">Contacto</a></div>
          <div className="aiden-header-actions"><Link to="/login" className="aiden-header-login">Entrar a la demo</Link><a href="#contacto" className="aiden-button aiden-button-dark">Solicitar demo <ArrowRight size={14} /></a></div>
          <button type="button" className="aiden-menu" aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuAbierto} onClick={() => setMenuAbierto((open) => !open)}>{menuAbierto ? <X size={19} /> : <Menu size={19} />}</button>
        </nav>
        <div className={`aiden-mobile-panel ${menuAbierto ? "is-visible" : ""}`} aria-hidden={!menuAbierto}>
          <a href="#soluciones" onClick={cerrarMenu}>Soluciones</a><a href="#sistema" onClick={cerrarMenu}>Cómo funciona</a><a href="#roles" onClick={cerrarMenu}>Para tu equipo</a><a href="#contacto" onClick={cerrarMenu}>Contacto</a>
          <Link to="/login" className="aiden-button aiden-button-ghost" onClick={cerrarMenu}>Entrar a la demo</Link>
          <a href="#contacto" className="aiden-button aiden-button-dark" onClick={cerrarMenu}>Solicitar demo <ArrowRight size={14} /></a>
        </div>
      </header>

      <main>
        <section className="aiden-hero" id="inicio">
          <div className="aiden-shell aiden-hero-grid">
            <article className="aiden-hero-copy">
              <p className="aiden-label"><span className="aiden-live-dot" /> Gestión operativa para viveros e invernaderos</p>
              <h1>Controla cada lote. <em>Anticípate a lo que importa.</em></h1>
              <p className="aiden-hero-lead">AiDEN conecta producción, inventario, trazabilidad, ambiente, calidad y costos para que tu equipo detecte prioridades, actúe a tiempo y conserve la historia de cada lote.</p>
              <div className="aiden-hero-actions"><a href="#contacto" className="aiden-button aiden-button-dark aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a><a href="#soluciones" className="aiden-text-link"><span>01</span> Ver soluciones</a></div>
              <ul className="aiden-hero-proof" aria-label="Beneficios principales"><li>Trazabilidad por lote</li><li>Vistas por rol</li><li>Decisiones con contexto</li></ul>
                </article>
            <figure className="aiden-hero-product" aria-label="Vista del dashboard de AiDEN basada en los datos de la operación">
              <div className="aiden-product-frame"><DashboardHeroPreview /><span className="aiden-product-corner">PRODUCT / SYSTEM VIEW</span></div>
              <figcaption><span>Vista del producto</span><span>Lectura basada en datos registrados</span></figcaption>
            </figure>
          </div>
        </section>

        <section className="aiden-problem" id="soluciones">
          <div className="aiden-shell aiden-problem-grid">
            <header><p className="aiden-index">PROBLEMAS QUE RESUELVE</p><h2>El problema no es tener datos. <em>Es no poder actuar con ellos.</em></h2></header>
            <div className="aiden-problem-copy"><p className="aiden-kicker">Una sola lectura de la operación</p><p>Un lote cambia de etapa, consume insumos, responde a sus condiciones ambientales y puede requerir una acción correctiva. AiDEN mantiene esas señales en el mismo contexto.</p><p>En lugar de perseguir hojas, mensajes y registros aislados, cada persona sabe qué revisar, qué sigue y cuál fue la historia detrás de una decisión.</p><a href="#sistema" className="aiden-text-link"><span>02</span> Ver cómo funciona</a></div>
          </div>
          <div className="aiden-shell aiden-problem-strip"><article><span>01</span><strong>Registro</strong><p>Lo que sucede queda documentado.</p></article><article><span>02</span><strong>Contexto</strong><p>Cada registro pertenece a una operación.</p></article><article><span>03</span><strong>Seguimiento</strong><p>Las señales relevantes pueden revisarse.</p></article><article><span>04</span><strong>Decisión</strong><p>La información llega con una historia detrás.</p></article></div>
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

        <section className="aiden-evidence"><div className="aiden-shell aiden-evidence-grid"><p className="aiden-index">DE LA INFORMACIÓN A LA ACCIÓN</p><header><h2>No se trata de mostrar más. <em>Se trata de entender mejor.</em></h2><p>En un vivero, lo importante no es mostrar más: es hacer visible lo que importa, reducir la búsqueda manual y dejar claro dónde mirar después.</p></header><div className="aiden-evidence-cards">
          <article><span>01</span><h3>Estado</h3><p>Qué está activo, qué está pendiente y qué necesita atención.</p><div className="aiden-evidence-detail"><b>Lectura inmediata</b><span>Activos · pendientes · alertas</span></div></article>
          <article><span>02</span><h3>Relación</h3><p>Qué registro pertenece a qué lote, etapa, responsable o evento.</p><div className="aiden-evidence-detail"><b>Contexto conectado</b><span>Lote · etapa · actividad · responsable</span></div></article>
          <article><span>03</span><h3>Seguimiento</h3><p>Qué cambió, qué sigue y qué información necesita revisión.</p><div className="aiden-evidence-detail"><b>Continuidad operativa</b><span>Último registro · próxima actividad · incidencia</span></div></article>
          <article><span>04</span><h3>Acción</h3><p>Dónde intervenir y qué parte de la operación necesita atención.</p><div className="aiden-evidence-detail"><b>Siguiente paso</b><span>Qué revisar · quién responde · qué continúa</span></div></article>
        </div></div></section>

        <section className="aiden-modules" id="modulos"><div className="aiden-shell"><header className="aiden-section-header"><div><p className="aiden-index">TODO LO QUE NECESITAS VER</p><h2>Una plataforma.<br /><em>Una operación conectada.</em></h2></div><p>Empieza por el problema que quieres resolver y descubre las áreas de AiDEN que ayudan a tu equipo a tomar el control.</p></header><div className="aiden-bento">{modulos.map(([Icon, nombre, subtitulo, descripcion, ruta, number], index) => <Link to={ruta} key={nombre} className={`aiden-bento-card bento-${index + 1}`}><span className="aiden-bento-number">{number}</span><span className="aiden-bento-icon"><Icon size={18} /></span><span className="aiden-bento-kind">{subtitulo}</span><h3>{nombre}</h3><p>{descripcion}</p><ArrowUpRight size={16} className="aiden-bento-arrow" /></Link>)}</div></div></section>

        <section className="aiden-roles" id="roles"><div className="aiden-shell"><header className="aiden-section-header aiden-section-header-compact"><div><p className="aiden-index">PARA TODO EL EQUIPO</p><h2>La misma operación.<br /><em>La vista que corresponde.</em></h2></div><p>Cada persona encuentra información útil para su trabajo, sin cargar a operarios, supervisores o administradores con lo que no necesitan ver.</p></header><div className="aiden-role-table">{roles.map(([number, role, focus, description]) => <Link key={role} to="/login" className="aiden-role-row" aria-label={`${role}: ${description} Explorar la demo.`}><span className="aiden-role-number">{number}</span><h3>{role}</h3><strong>{focus}</strong><p>{description}</p><span className="aiden-role-demo">Explorar demo</span><Check size={15} aria-hidden="true" /></Link>)}</div></div></section>

        <section className="aiden-clarity"><div className="aiden-shell aiden-clarity-grid"><p className="aiden-index">ANTES DE ENTRAR</p><header><h2>Las preguntas importantes deberían responderse <em>antes del botón.</em></h2></header><div className="aiden-clarity-list"><article><span>¿Qué es AiDEN?</span><p>Una plataforma de gestión operativa para organizar y seguir la actividad de un vivero.</p></article><article><span>¿Para quién está pensada?</span><p>Para equipos que participan en la operación y necesitan distintas vistas según su responsabilidad.</p></article><article><span>¿Qué conecta?</span><p>Producción, inventario, trazabilidad, ambiente, calidad, costos, personal, reportes y configuración.</p></article><article><span>¿Qué se ve primero?</span><p>El estado de la operación y las señales que requieren seguimiento, usando los registros existentes del sistema.</p></article></div></div></section>

        <section className="aiden-contact" id="contacto"><div className="aiden-shell aiden-contact-grid"><header><p className="aiden-index">HABLEMOS DE TU OPERACIÓN</p><h2>Menos tiempo buscando información. <em>Más tiempo cultivando decisiones.</em></h2><p>Cuéntanos cómo opera tu vivero y agenda una demostración enfocada en los procesos que hoy necesitan más visibilidad.</p><div className="aiden-contact-points"><span>✓ Demostración por rol</span><span>✓ Recorrido por lote</span><span>✓ Sin compromiso</span></div></header><form className="aiden-lead-form" onSubmit={enviarSolicitud}><div className="aiden-lead-form-title"><p>Solicita una demostración</p><span>Respondemos a tu solicitud con el siguiente paso.</span></div><label>Nombre completo<input name="nombre" autoComplete="name" required placeholder="Tu nombre" /></label><label>Correo de trabajo<input name="email" type="email" autoComplete="email" required placeholder="nombre@vivero.com" /></label><div className="aiden-lead-form-row"><label>Empresa o vivero<input name="empresa" autoComplete="organization" required placeholder="Nombre de la empresa" /></label><label>Teléfono <input name="telefono" type="tel" autoComplete="tel" placeholder="Opcional" /></label></div><label>¿Qué necesitas mejorar?<select name="interes" required defaultValue=""><option value="" disabled>Selecciona una prioridad</option><option>Producción y seguimiento por lote</option><option>Trazabilidad y calidad</option><option>Inventario y costos</option><option>Coordinación del equipo</option><option>Quiero conocer AiDEN</option></select></label><label className="aiden-lead-consent"><input name="consentimiento" type="checkbox" required value="aceptado" /><span>Acepto que AiDEN use estos datos para responder mi solicitud, según su <Link to="/privacidad">política de privacidad</Link>.</span></label>{estadoSolicitud && <p className={`aiden-lead-status is-${estadoSolicitud.tipo}`} role="status">{estadoSolicitud.mensaje}</p>}<button type="submit" className="aiden-button aiden-button-light aiden-button-large" disabled={enviandoSolicitud}>{enviandoSolicitud ? "Enviando solicitud…" : <>Solicitar mi demo <ArrowRight size={15} /></>}</button></form></div></section>

        <section className="aiden-final"><div className="aiden-shell aiden-final-inner"><div className="aiden-final-copy"><p className="aiden-index aiden-index-light">EMPIEZA CON VISIBILIDAD</p><h2>Cuando cada lote tiene contexto, <em>las decisiones dejan de esperar.</em></h2><p>Explora la demo de AiDEN y descubre una forma más clara de gestionar la operación diaria del vivero.</p><a href="#contacto" className="aiden-button aiden-button-light aiden-button-large">Solicitar una demo <ArrowRight size={15} /></a></div><aside className="aiden-final-stamp" aria-label="Resumen de AiDEN"><span>AiDEN</span><strong>09</strong><small>módulos conectados</small><i /><strong>03</strong><small>roles operativos</small><i /><b>01</b><small>experiencia</small></aside></div></section>
      </main>

      <footer className="aiden-footer"><div className="aiden-shell aiden-footer-inner"><Link to="/" className="aiden-brand"><span className="aiden-brand-mark" aria-hidden="true"><Leaf size={14} /></span><span>AiDEN</span></Link><span>Gestión operativa para viveros</span><div><Link to="/terminos">Términos</Link><Link to="/privacidad">Privacidad</Link><Link to="/login">Ingresar</Link></div></div></footer>
    </div>
  );
}

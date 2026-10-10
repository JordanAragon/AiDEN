import { ArrowDown, ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { generarSemilla } from "../datos/semilla";
import { resumenLote, ultimasLecturas } from "../datos/selectores";
import { ETAPAS } from "../datos/catalogos";
import { dinero, dineroOGuion, fechaCorta, hoyISO, numero } from "../utilidades/formato";
import { useTitulo } from "../hooks/useTitulo";
import { IsotipoAiden, LogotipoAiden } from "../components/ui/MarcaAiden";
import palabraMarca from "../assets/marca/aiden-palabra.svg";
import palabraMarcaMoss from "../assets/marca/aiden-palabra-moss.svg";
import Insignia from "../components/ui/Insignia";
import BarraRango from "../components/ui/BarraRango";
import PasosEtapa from "../components/lote/PasosEtapa";
import LineaTiempo from "../components/lote/LineaTiempo";
import { TONO_INCIDENCIA, TONO_PRIORIDAD } from "../components/ui/tonos";
import "../estilos/landing.css";

/*
  La landing rebobina la historia real del lote de tomate de los datos de ejemplo:
  del despacho (día 68) a la siembra (día 0). Cada estación muestra una ventana del
  módulo real del sistema que escribió ese registro, con los mismos componentes de
  la app (Insignia, PasosEtapa, LineaTiempo, BarraRango). Nada se inventa:
  generarSemilla es pura y determinista respecto a hoy.
*/

const diasEntre = (isoA, isoB) => {
  const [a, b] = [isoA, isoB].map((iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  });
  return Math.round((a - b) / 86_400_000);
};

const hora = (fecha) => {
  if (!fecha.includes("T")) return "";
  const [h, m] = fecha.split("T")[1].slice(0, 5).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
};

function construirHistoria() {
  const datos = generarSemilla();
  const lote = datos.lotes.find((l) => l.id === "LT-2026-011") || datos.lotes.find((l) => l.estado === "Activo");
  if (!lote) return null;
  const dia = (fecha) => diasEntre(fecha, lote.fecha);
  const evento = (id) => datos.trazabilidad.find((e) => e.id === id);
  const tarea = (id) => datos.tareas.find((t) => t.id === id);
  const costoDe = (id) => datos.costos.find((c) => c.id === id);
  const resumen = resumenLote(lote, datos);
  const cerrado = datos.lotes.find((l) => l.estado === "Cerrado");
  const eventoCierre = cerrado && datos.trazabilidad.find((e) => e.lote === cerrado.id && e.evento === "Despacho");
  const joven = [...datos.lotes].filter((l) => l.estado === "Activo").sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const incidenciaJoven = joven && datos.calidad.find((i) => i.lote === joven.id && i.estado !== "Cerrada");

  const registro = evento("TRZ-010");
  const consumo = evento("TRZ-011");
  const aAdaptacion = evento("TRZ-012");
  const aDesarrollo = evento("TRZ-013");
  const fertilizacion = evento("TRZ-014");
  const aCosecha = evento("TRZ-015");
  const incidencia = datos.calidad.find((i) => i.lote === lote.id && i.estado === "Abierta");
  const anticipo = costoDe("CST-018");
  const deshoje = tarea("TSK-001");
  const validacion = tarea("TSK-010");
  const despacho = tarea("TSK-004");
  const lecturasZona = datos.ambiental.filter((l) => l.zona === lote.ubicacion);
  const ultimaLectura = [...ultimasLecturas(datos.ambiental)].find(([zona]) => zona === lote.ubicacion)?.[1];
  const movimientosDia0 = datos.movimientos.filter((m) => m.lote === lote.id && m.fecha === lote.fecha);

  const estaciones = [
    incidencia && {
      dia: dia(incidencia.fecha) + 1,
      etapa: "Cosecha",
      titulo: "La víspera no está limpia.",
      cuerpo: `Ayer a las 8:45 a. m., Andrés Rojas reportó hojas amarillas en el tercio inferior de las plantas. Quedó como incidencia de prioridad alta, y el sistema ya tiene agendado lo que sigue: mañana la validación, pasado mañana las canastillas.`,
      ventana: { ruta: "Calidad / Incidencias", meta: lote.lote, tipo: "incidencia", incidencia, tareas: [deshoje, validacion, despacho].filter(Boolean) },
    },
    aCosecha && {
      dia: dia(aCosecha.fecha),
      etapa: "Cosecha",
      titulo: `${numero(lote.cantidad)} de ${numero(lote.cantidadInicial)}.`,
      cuerpo: "El lote pasó a Cosecha con 30 plantas menos de las que empezaron. La merma no se maquilla: queda contada, con fecha y responsable, y la ficha cambió para todo el equipo a la vez.",
      ventana: { ruta: "Producción / Lotes", meta: `${aCosecha.responsable} · ${hora(aCosecha.fecha)}`, tipo: "etapa", lote, vivas: lote.cantidad, iniciales: lote.cantidadInicial },
    },
    anticipo && {
      dia: dia(anticipo.fecha),
      etapa: "Cosecha",
      titulo: "El pedido llegó con anticipo.",
      cuerpo: "La Asociación Campesina de Timbío apartó su pedido. El ingreso quedó escrito en Costos, junto al lote que lo gana: ni en un bolsillo, ni en otra planilla.",
      ventana: { ruta: "Costos / Movimientos", meta: fechaCorta(anticipo.fecha), tipo: "costo", costo: anticipo },
    },
    fertilizacion && {
      dia: dia(fertilizacion.fecha),
      etapa: "Desarrollo",
      titulo: "Fertilización, 7:30 de la mañana.",
      cuerpo: `${fertilizacion.responsable} aplicó NPK en todas las camas y lo dejó en la historia del lote antes de guardar la bomba. Sin cuaderno, sin pasar en limpio por la noche.`,
      ventana: { ruta: "Trazabilidad / Historia del lote", meta: lote.lote, tipo: "eventos", eventos: [fertilizacion] },
    },
    aDesarrollo && {
      dia: dia(aDesarrollo.fecha),
      etapa: "Desarrollo",
      titulo: "Cambio de etapa, visible para todos.",
      cuerpo: "Laura movió el lote a Desarrollo: el operario ve sus tareas del lote, el administrador ve el costo acumulado, y la línea de tiempo lo guarda con hora y responsable.",
      ventana: { ruta: "Trazabilidad / Historia del lote", meta: lote.lote, tipo: "eventos", eventos: [aDesarrollo, aAdaptacion].filter(Boolean) },
    },
    ultimaLectura && {
      dia: dia(aAdaptacion ? aAdaptacion.fecha : lote.fecha),
      etapa: "Adaptación",
      titulo: "Las lecturas siguieron entrando.",
      cuerpo: "Primer cambio de etapa. Mientras tanto, el Invernadero 1 registró temperatura, humedad y luz cada cuatro horas; si una zona sale del rango configurado, la alerta señala los lotes que están en ella.",
      ventana: {
        ruta: "Ambiental / Zonas",
        meta: lote.ubicacion,
        tipo: "lectura",
        lectura: ultimaLectura,
        historico: lecturasZona.map((l) => l.temperatura),
        cfg: datos.configuracion,
      },
    },
    registro && {
      dia: 0,
      etapa: "Germinación",
      titulo: `${numero(lote.cantidadInicial)} plantas, ${hora(registro.fecha)}`,
      cuerpo: `${registro.responsable} registró el lote. Cincuenta minutos después, ${consumo ? consumo.responsable : "el operario"} sacó dos bultos de sustrato y cuatro bandejas: el inventario los descontó y el costo quedó escrito solo, sin una segunda planilla.`,
      ventana: { ruta: "Producción / Lotes", meta: fechaCorta(lote.fecha), tipo: "registro", lote, movimientos: movimientosDia0 },
    },
  ].filter(Boolean);

  return {
    lote,
    resumen,
    estaciones,
    totalDias: diasEntre(lote.fechaEstimada, lote.fecha),
    hoyDia: dia(hoyISO()),
    cerrado,
    eventoCierre,
    joven,
    incidenciaJoven,
    lotesActivos: datos.lotes.filter((l) => l.estado === "Activo"),
    registros: datos.trazabilidad.filter((e) => e.lote === lote.id).length,
    validadora: validacion ? nombreCorto(datos, validacion.responsableId) : "",
    personas: datos.personas,
  };
}

function nombreCorto(datos, personaId) {
  const persona = datos.personas.find((p) => p.id === personaId);
  return persona ? persona.nombre : "";
}

function PistaEtapas({ etapa }) {
  const indice = Math.max(0, ETAPAS.indexOf(etapa));
  return (
    <span className="aiden-pista" role="img" aria-label={`Etapa ${etapa}, ${indice + 1} de ${ETAPAS.length}`}>
      {ETAPAS.map((nombre, i) => (
        <i key={nombre} className={i < indice ? "is-hecha" : i === indice ? "is-actual" : ""} />
      ))}
    </span>
  );
}

/* La ventana del módulo: la misma anatomía con la que la app muestra sus pantallas. */
function VentanaModulo({ ruta, meta, children }) {
  return (
    <div className="aiden-ventana">
      <div className="aiden-ventana-barra">
        <span className="aiden-ventana-puntos" aria-hidden="true"><i /><i /><i /></span>
        <span className="aiden-ventana-marca" aria-hidden="true"><IsotipoAiden tamano={15} /></span>
        <span className="aiden-ventana-ruta">{ruta}</span>
        <span className="aiden-ventana-meta">{meta}</span>
      </div>
      <div className="aiden-ventana-cuerpo">{children}</div>
    </div>
  );
}

function ContenidoVentana({ ventana, historia }) {
  const { tipo } = ventana;
  if (tipo === "incidencia") {
    const inc = ventana.incidencia;
    return (
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900">{inc.descripcion}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{inc.codigo} · Reportada por Andrés Rojas · {fechaCorta(inc.fecha)}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Insignia tono={TONO_INCIDENCIA[inc.estado]}>{inc.estado.toUpperCase()}</Insignia>
            <Insignia tono={TONO_PRIORIDAD[inc.prioridad]}>{inc.prioridad.toUpperCase()}</Insignia>
          </div>
        </div>
        <ul className="grid gap-1.5">
          {ventana.tareas.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="min-w-0 truncate text-[12.5px] font-medium text-slate-800">{t.titulo}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500">
                <span className="tabular-nums">{fechaCorta(t.fecha)}</span>
                <Insignia tono={TONO_PRIORIDAD[t.prioridad]}>{t.prioridad.toUpperCase()}</Insignia>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (tipo === "etapa") {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-slate-900">{ventana.lote.lote} · {ventana.lote.cultivo}</p>
            <p className="text-[11px] text-slate-500">{ventana.lote.ubicacion}</p>
          </div>
          <Insignia tono="exito">ACTIVO</Insignia>
        </div>
        <PasosEtapa etapa="Cosecha" fechas={{}} compacto />
        <div className="flex gap-6 border-t border-slate-100 pt-3">
          <div><p className="text-[11px] font-semibold text-slate-500">Plantas vivas</p><p className="text-lg font-bold tabular-nums text-slate-900">{numero(ventana.vivas)}</p></div>
          <div><p className="text-[11px] font-semibold text-slate-500">Iniciales</p><p className="text-lg font-bold tabular-nums text-slate-900">{numero(ventana.iniciales)}</p></div>
          <div><p className="text-[11px] font-semibold text-slate-500">Merma contada</p><p className="text-lg font-bold tabular-nums text-amber-700">{numero(ventana.iniciales - ventana.vivas)}</p></div>
        </div>
      </div>
    );
  }
  if (tipo === "costo") {
    const c = ventana.costo;
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">{c.concepto}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{historia.lote.lote} · {fechaCorta(c.fecha)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Insignia tono="neutral">{c.categoria.toUpperCase()}</Insignia>
          <span className="text-[15px] font-bold tabular-nums text-emerald-700">+{dinero(c.valor)}</span>
        </div>
      </div>
    );
  }
  if (tipo === "eventos") {
    return <LineaTiempo eventos={ventana.eventos} />;
  }
  if (tipo === "lectura") {
    return (
      <div className="grid gap-3">
        <BarraRango
          etiqueta={`${historia.lote.ubicacion} · Temperatura`}
          unidad="°C"
          valor={ventana.lectura.temperatura}
          minimo={ventana.cfg.tempMin}
          maximo={ventana.cfg.tempMax}
          historico={ventana.historico}
        />
        <p className="text-[11px] text-slate-500">Última lectura: {numero(ventana.lectura.humedad)} % de humedad · registrada por {ventana.lectura.registradoPor}.</p>
      </div>
    );
  }
  if (tipo === "registro") {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-slate-900">{ventana.lote.lote} · {ventana.lote.cultivo}</p>
            <p className="text-[11px] text-slate-500">{numero(ventana.lote.cantidadInicial)} plantas · {ventana.lote.ubicacion}</p>
          </div>
          <Insignia tono="exito">ACTIVO</Insignia>
        </div>
        <PasosEtapa etapa="Germinación" fechas={{}} compacto />
        <ul className="grid gap-1.5 border-t border-slate-100 pt-3">
          {ventana.movimientos.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="min-w-0 truncate font-medium text-slate-800">{m.item} · {numero(m.cantidad)}</span>
              <span className="shrink-0 tabular-nums font-semibold text-slate-600">−{dinero(m.valor)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

export default function Inicio() {
  useTitulo(null);
  const historia = useMemo(() => construirHistoria(), []);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [headerCompacto, setHeaderCompacto] = useState(false);
  const [estacionActiva, setEstacionActiva] = useState(0);
  const [diaRiel, setDiaRiel] = useState(null);
  const [vistas, setVistas] = useState(() => new Set());
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const estacionesRef = useRef([]);
  const rielRef = useRef(null);
  const formularioMontado = useRef(0);
  const cerrarMenu = () => setMenuAbierto(false);

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

  // El riel marca la estación centrada y las ventanas se revelan una sola vez.
  useEffect(() => {
    const nodos = estacionesRef.current.filter(Boolean);
    if (!nodos.length) return undefined;
    if (!("IntersectionObserver" in window)) {
      setVistas(new Set(nodos.map((_, i) => i)));
      return undefined;
    }
    const revelador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          const indice = Number(entrada.target.dataset.indice);
          setVistas((previas) => (previas.has(indice) ? previas : new Set(previas).add(indice)));
          revelador.unobserve(entrada.target);
        }
      },
      { threshold: 0.2 },
    );
    const marcador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setEstacionActiva(Number(entrada.target.dataset.indice));
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    nodos.forEach((nodo) => {
      revelador.observe(nodo);
      marcador.observe(nodo);
    });
    return () => {
      revelador.disconnect();
      marcador.disconnect();
    };
  }, []);

  /*
    La interacción firma: el día del riel rebobina de forma continua con el scroll,
    interpolando entre los días de las estaciones vecinas al centro del viewport.
    Con movimiento reducido no corre: el riel queda estático por estación (IO).
  */
  useEffect(() => {
    if (!historia) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const dias = historia.estaciones.map((e) => e.dia);
    let cuadro = 0;
    const recalcular = () => {
      cuadro = 0;
      const nodos = estacionesRef.current.filter(Boolean);
      if (!nodos.length) return;
      const centro = window.innerHeight / 2;
      const centros = nodos.map((nodo) => {
        const caja = nodo.getBoundingClientRect();
        return caja.top + caja.height / 2;
      });
      // El progreso también se escribe como variable CSS: es el respaldo de la
      // línea que se llena donde animation-timeline no existe (Safari, Firefox).
      const pintarAvance = (fraccion) => {
        rielRef.current?.style.setProperty("--avance", String(Math.min(1, Math.max(0, fraccion))));
      };
      if (centro <= centros[0]) {
        pintarAvance(0);
        return setDiaRiel(dias[0]);
      }
      if (centro >= centros[centros.length - 1]) {
        pintarAvance(1);
        return setDiaRiel(dias[dias.length - 1]);
      }
      for (let i = 0; i < centros.length - 1; i += 1) {
        if (centro >= centros[i] && centro <= centros[i + 1]) {
          const avance = (centro - centros[i]) / (centros[i + 1] - centros[i] || 1);
          pintarAvance((i + avance) / (centros.length - 1));
          return setDiaRiel(Math.round(dias[i] + (dias[i + 1] - dias[i]) * avance));
        }
      }
    };
    const alScroll = () => {
      if (!cuadro) cuadro = window.requestAnimationFrame(recalcular);
    };
    recalcular();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
      if (cuadro) window.cancelAnimationFrame(cuadro);
    };
  }, [historia]);

  const prepararSolicitud = async (event) => {
    event.preventDefault();
    const formulario = event.currentTarget;
    const campos = Object.fromEntries(new FormData(formulario).entries());
    const cuerpo = { ...campos, consentimiento: campos.consentimiento === "si", transcurrido: Date.now() - formularioMontado.current };
    setEnviandoSolicitud(true);
    setSolicitudEnviada(false);
    setErrorSolicitud("");
    try {
      const respuesta = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (respuesta.status === 503) throw new Error("FORMULARIO_NO_DISPONIBLE");
      if (!respuesta.ok) throw new Error("ENVIO_NO_CONFIRMADO");
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

  if (!historia) return null;
  const { lote, resumen, estaciones, totalDias, hoyDia, cerrado, eventoCierre, joven, incidenciaJoven, lotesActivos, registros, validadora } = historia;
  const activa = estaciones[estacionActiva] || estaciones[0];

  return (
    <div className="aiden-landing">
      <a className="aiden-skip-link" href="#contenido">Saltar al contenido principal</a>
      <header className={`aiden-header ${headerCompacto ? "is-compact" : ""}`}>
        <nav className="aiden-shell" aria-label="Navegación principal">
          <div className="aiden-header-inner">
            <Link to="/" className="aiden-brand" onClick={cerrarMenu} aria-label="AiDEN, ir al inicio"><LogotipoAiden alto={30} /></Link>
            <div className="aiden-header-links">
              <a href="#historia">La historia</a>
              <a href="#vivero">El vivero</a>
              <a href="#roles">Roles</a>
              <a href="#preguntas">Preguntas</a>
            </div>
            <div className="aiden-header-actions">
              <Link to="/login" className="aiden-header-login">Iniciar sesión</Link>
              <a href="#contacto" className="aiden-boton aiden-boton-lima">Solicitar demo</a>
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
          <a href="#historia" onClick={cerrarMenu}>La historia</a>
          <a href="#vivero" onClick={cerrarMenu}>El vivero</a>
          <a href="#roles" onClick={cerrarMenu}>Roles</a>
          <a href="#preguntas" onClick={cerrarMenu}>Preguntas</a>
          <a href="#contacto" className="aiden-boton aiden-boton-lima" onClick={cerrarMenu}>Solicitar demo <ArrowRight size={14} /></a>
          <Link to="/login" className="aiden-boton aiden-boton-borde" onClick={cerrarMenu}>Iniciar sesión</Link>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>
        {/* Día 66: la marca corona el marco y la escena abre en la víspera del despacho. */}
        <section className="aiden-despacho" aria-labelledby="titulo-despacho">
          <div className="aiden-shell">
            <p className="aiden-marca-monumental" aria-hidden="true"><img src={palabraMarca} alt="" /></p>
            <div className="aiden-escena">
              <a href="#historia" className="aiden-circulo" aria-label="Bajar a la historia del lote"><ArrowDown size={20} /></a>
              <div className="aiden-escena-copy">
                <h1 id="titulo-despacho">
                  Pasado mañana salen 400 plantas de tomate <em>hacia Timbío.</em>
                </h1>
                <p className="aiden-despacho-lead">
                  AiDEN, el sistema de registro del vivero, escribió los {numero(totalDias)} días que las trajeron
                  hasta el camión. Esta página rebobina esa historia.
                </p>
                <div className="aiden-despacho-acciones">
                  <a href="#contacto" className="aiden-boton aiden-boton-lima aiden-boton-grande">Solicitar una demo <ArrowRight size={15} /></a>
                  <a href="#historia" className="aiden-boton aiden-boton-fantasma aiden-boton-grande">Rebobinar la historia</a>
                </div>
              </div>
              <figure className="aiden-guia" aria-label="Guía de despacho del lote de ejemplo">
                <div className="aiden-guia-papel">
                  <header>
                    <span className="aiden-guia-doc">Guía de despacho</span>
                    <span className="aiden-guia-folio">{lote.lote}</span>
                  </header>
                  <dl>
                    <div><dt>Cultivo</dt><dd>{lote.cultivo}</dd></div>
                    <div><dt>Destino</dt><dd>Asociación Campesina de Timbío</dd></div>
                    <div><dt>Cantidad</dt><dd>400 de {numero(lote.cantidad)} vivas</dd></div>
                    <div><dt>Sale</dt><dd>{fechaCorta(lote.fechaEstimada)} · valida {validadora || "Supervisión"}</dd></div>
                  </dl>
                  <div className="aiden-guia-sello" aria-label={`Día ${numero(hoyDia)} de ${numero(totalDias)} del lote`}>
                    <span>Día</span>
                    <strong>{numero(hoyDia)}</strong>
                    <span>de {numero(totalDias)}</span>
                  </div>
                </div>
              </figure>
            </div>
            <p className="aiden-escena-nota">Historia tomada de los datos de ejemplo del sistema.</p>
          </div>
        </section>

        {/* La pregunta que el ICA y el comprador hacen igual. */}
        <section className="aiden-pregunta" aria-labelledby="titulo-pregunta">
          <div className="aiden-shell aiden-pregunta-marco"><div className="aiden-pregunta-inner">
            <h2 id="titulo-pregunta">¿Podría tu vivero reconstruir la historia <em>de cada planta que vende?</em></h2>
            <div className="aiden-pregunta-copy">
              <p>
                El ICA lo exige desde 2020: la Resolución 780006 obliga a registrar el vivero y a que su capacidad
                anual cuadre con las compras de semilla y de material. Y el que compra pregunta lo mismo con otras
                palabras: de qué lote salió, qué se le aplicó, quién lo revisó.
              </p>
              <p>
                Según Colviveros, en Colombia unas 35.000 familias viven de producir y vender plantas, y solo una de
                cada diez lo hace desde una empresa formalmente constituida. En la mayoría de los viveros la respuesta
                está repartida entre cuadernos, planillas y la memoria de quien hizo el trabajo.
              </p>
              <p className="aiden-fuentes">
                Fuentes: <a href="https://www.ica.gov.co/normatividad/normas-ica/resoluciones-oficinas-nacionales" target="_blank" rel="noopener noreferrer">Resolución ICA 780006 de 2020</a> ·{" "}
                <a href="https://www.agronegocios.co/agricultura/productores-viveristas-mueven-180-000-millones-al-ano-con-apoyo-de-minagricultura-2920306" target="_blank" rel="noopener noreferrer">Colviveros / Agronegocios</a> ·{" "}
                <a href="https://www.elespectador.com/la-huerta/mirelo-sin-compromiso-el-negocio-detras-de-los-viveros/" target="_blank" rel="noopener noreferrer">El Espectador</a>
              </p>
            </div>
          </div></div>
        </section>

        {/* El rebobinado: cada evento clavado a su día, en la ventana del módulo que lo escribió. */}
        <section className="aiden-rebobinado" id="historia" aria-labelledby="titulo-historia">
          <div className="aiden-shell">
            <header className="aiden-rebobinado-cabecera">
              <p className="aiden-capitulo"><i aria-hidden="true" />La historia</p>
              <h2 id="titulo-historia">Rebobinemos el <span className="aiden-sin-corte">{lote.lote}</span>, <em>del camión a la semilla.</em></h2>
              <p>Lo que sigue no es un guion: son los registros del lote en los datos de ejemplo, leídos de atrás hacia adelante en el módulo que los escribió.</p>
            </header>
            <div className="aiden-rebobinado-grid">
              <aside className="aiden-riel" aria-hidden="true">
                <div className="aiden-riel-interno" ref={rielRef}>
                  <span className="aiden-riel-rotulo">Día</span>
                  <strong className="aiden-riel-dia">{numero(diaRiel ?? activa.dia)}</strong>
                  <span className="aiden-riel-etapa">{activa.etapa}</span>
                  <PistaEtapas etapa={activa.etapa} />
                  <i className="aiden-riel-linea"><b className="aiden-riel-progreso" /></i>
                </div>
              </aside>
              <ol className="aiden-estaciones">
                {estaciones.map((estacion, indice) => (
                  <li
                    key={estacion.titulo}
                    data-indice={indice}
                    ref={(nodo) => { estacionesRef.current[indice] = nodo; }}
                    className={`aiden-estacion ${vistas.has(indice) ? "is-vista" : ""} ${indice === estacionActiva ? "is-actual" : ""}`}
                  >
                    <div className="aiden-estacion-dia">
                      <span>Día {numero(estacion.dia)}</span>
                      <PistaEtapas etapa={estacion.etapa} />
                    </div>
                    <article>
                      <h3>{estacion.titulo}</h3>
                      <p>{estacion.cuerpo}</p>
                      <VentanaModulo ruta={estacion.ventana.ruta} meta={estacion.ventana.meta}>
                        <ContenidoVentana ventana={estacion.ventana} historia={historia} />
                      </VentanaModulo>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* El saldo de la historia y la prueba de que no es la primera. */}
        <section className="aiden-saldo" aria-labelledby="titulo-saldo">
          <div className="aiden-shell aiden-saldo-grid">
            <h2 id="titulo-saldo">{numero(totalDias)} días, {numero(registros)} registros, <em>un costo por planta.</em></h2>
            <div className="aiden-liquidacion" role="group" aria-label={`Liquidación del lote ${lote.lote}`}>
              <header>
                <span className="aiden-guia-doc">Liquidación del lote</span>
                <span className="aiden-guia-folio">{lote.lote}</span>
              </header>
              <dl>
                <div>
                  <dt>Plantas vivas al despacho</dt>
                  <dd>{numero(lote.cantidad)} de {numero(lote.cantidadInicial)}</dd>
                </div>
                <div>
                  <dt>Eventos en su historia</dt>
                  <dd>{numero(registros)}</dd>
                </div>
                <div>
                  <dt>Gasto acumulado</dt>
                  <dd>{dinero(resumen.gasto)}</dd>
                </div>
                <div className="aiden-liquidacion-total">
                  <dt>Costo por planta viva</dt>
                  <dd>{dineroOGuion(resumen.costoPlanta)}</dd>
                </div>
              </dl>
              <small>Cada línea con fecha, hora y responsable; la merma quedó contada.</small>
            </div>
            {cerrado && eventoCierre && (
              <p className="aiden-saldo-antecedente">
                Y no es la primera: la lechuga del Invernadero 2 ya hizo este viaje. {eventoCierre.detalle.replace("Lote cerrado: ", "")}{" "}
                Su historia quedó cerrada y se puede releer completa en Trazabilidad.
              </p>
            )}
            <a href="#contacto" className="aiden-boton aiden-boton-oscuro aiden-boton-grande">Quiero esto para mi vivero <ArrowRight size={15} /></a>
          </div>
        </section>

        {/* El vivero completo, leído de un barrido. */}
        <section className="aiden-vivero" id="vivero" aria-labelledby="titulo-vivero">
          <div className="aiden-shell">
            <header className="aiden-vivero-cabecera">
              <p className="aiden-capitulo"><i aria-hidden="true" />El vivero</p>
              <h2 id="titulo-vivero">El resto del vivero, <em>de un barrido.</em></h2>
              <p>Siete lotes a la vez en los datos de ejemplo. La fila se lee entera: cultivo, etapa, plantas vivas y zona, sin abrir ficha por ficha.</p>
            </header>
            <ul className="aiden-fila-lotes">
              {lotesActivos.map((l) => (
                <li key={l.id} className={l.id === lote.id ? "is-protagonista" : ""}>
                  <span className="aiden-lote-codigo">{l.lote}</span>
                  <strong className="aiden-lote-cultivo">{l.cultivo}</strong>
                  <span className="aiden-lote-etapa"><PistaEtapas etapa={l.etapa} />{l.etapa}</span>
                  <span className="aiden-lote-vivas">{numero(l.cantidad)} vivas</span>
                  <span className="aiden-lote-zona">{l.ubicacion}</span>
                </li>
              ))}
            </ul>
            <p className="aiden-modulos-indice">
              Nueve módulos comparten estos mismos lotes, personas y zonas: <strong>Producción</strong>, <strong>Inventario</strong>,{" "}
              <strong>Trazabilidad</strong>, <strong>Ambiental</strong>, <strong>Calidad</strong>, <strong>Costos</strong>,{" "}
              <strong>Personal</strong>, <strong>Reportes</strong> y <strong>Configuración</strong>. Lo que se escribe en uno
              aparece donde hace falta en los demás.
            </p>
          </div>
        </section>

        {/* Los roles, contados por lo que hicieron en la historia. */}
        <section className="aiden-roles" id="roles" aria-labelledby="titulo-roles">
          <div className="aiden-shell">
            <p className="aiden-capitulo"><i aria-hidden="true" />Roles</p>
            <h2 id="titulo-roles">La misma historia, <em>tres lecturas.</em></h2>
            <div className="aiden-roles-lista">
              <article>
                <h3>Laura, supervisora</h3>
                <p>Registró el lote, movió las etapas y mañana valida sanidad y altura antes de autorizar la salida. Su vista ordena el día por lo que requiere decisión.</p>
              </article>
              <article>
                <h3>Andrés, operario</h3>
                <p>Regó, fertilizó y reportó las hojas amarillas desde el celular, entre mesas. Su vista pone las tareas primero y las acciones al alcance del pulgar.</p>
              </article>
              <article>
                <h3>Jordan, administrador</h3>
                <p>Lee el costo por planta y el saldo del mes sin pedirle la planilla a nadie. Su vista junta costos, accesos y el pulso de la semana.</p>
              </article>
            </div>
            <p className="aiden-roles-pie">Cada rol entra a su propia vista con su propia cuenta. <Link to="/login">Iniciar sesión</Link></p>
          </div>
        </section>

        {/* Respuestas directas antes del formulario. */}
        <section className="aiden-preguntas" id="preguntas" aria-labelledby="titulo-preguntas">
          <div className="aiden-shell aiden-preguntas-grid">
            <div>
              <p className="aiden-capitulo"><i aria-hidden="true" />Preguntas</p>
              <h2 id="titulo-preguntas">Preguntas directas, <em>respuestas directas.</em></h2>
            </div>
            <dl>
              <div>
                <dt>¿Qué es AiDEN?</dt>
                <dd>Un sistema de registro y seguimiento para viveros e invernaderos: lotes por etapas, tareas, inventario, lecturas ambientales, incidencias, costos y personal, con la historia de cada lote escrita de principio a fin.</dd>
              </div>
              <div>
                <dt>¿Qué incluye hoy?</dt>
                <dd>Los nueve módulos funcionan en el navegador y guardan los datos en ese equipo, también sin conexión. Sensores, sincronización entre equipos e integraciones todavía no están disponibles.</dd>
              </div>
              <div>
                <dt>¿La historia de esta página es real?</dt>
                <dd>Son los datos de ejemplo que trae el sistema: un vivero del Cauca con siete lotes, cuatro zonas y cinco personas. Sin clientes inventados ni cifras de humo; lo que ves es lo que el producto registra.</dd>
              </div>
              <div>
                <dt>¿Qué pasa con los datos que dejo aquí?</dt>
                <dd>El formulario pide lo mínimo para responderte y el tratamiento sigue la Ley 1581 de 2012. Los detalles están en la <Link to="/privacidad">política de privacidad</Link>.</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Solicitar demo: el formulario es la acción, no un adorno. */}
        <section className="aiden-contacto" id="contacto" aria-labelledby="titulo-contacto">
          <div className="aiden-shell aiden-contacto-marco"><div className="aiden-contacto-grid">
            <div className="aiden-contacto-copy">
              <h2 id="titulo-contacto">Muéstranos <em>tu vivero.</em></h2>
              <p>
                Cuéntanos cómo llevas hoy los registros —cuaderno, planilla, memoria— y qué quieres poder responder.
                Te escribimos al correo que dejes para mostrarte AiDEN sobre una operación como la tuya.
              </p>
              {joven && incidenciaJoven && (
                <p className="aiden-contacto-guino">
                  Mientras tanto, en el vivero de ejemplo: el {joven.cultivo.toLowerCase()} va por el día {numero(diasEntre(hoyISO(), joven.fecha))} y
                  esta mañana reportaron volcamiento en tres bandejas. Esa historia también quedará escrita.
                </p>
              )}
            </div>
            <form
              className="aiden-formulario"
              onSubmit={prepararSolicitud}
              onFocus={() => { if (!formularioMontado.current) formularioMontado.current = Date.now(); }}
              aria-label="Solicitud de demostración de AiDEN"
              aria-busy={enviandoSolicitud}
            >
              <label>Nombre<input name="nombre" required minLength="2" maxLength="120" autoComplete="name" placeholder="Tu nombre" /></label>
              <label>Empresa o vivero<input name="empresa" required minLength="2" maxLength="160" autoComplete="organization" placeholder="Nombre del vivero" /></label>
              <label>Correo electrónico<input name="email" type="email" required maxLength="254" autoComplete="email" placeholder="correo@vivero.com" /></label>
              <label>¿Qué quieres poder responder?<textarea name="mensaje" rows="4" maxLength="2000" placeholder="De qué lote salió, cuánto costó, qué se le aplicó..." /></label>
              <label className="aiden-campo-trampa" aria-hidden="true">Sitio web<input name="sitio_web" tabIndex={-1} autoComplete="off" /></label>
              <label className="aiden-consentimiento">
                <input type="checkbox" name="consentimiento" value="si" required />
                <span>Autorizo el tratamiento de mis datos para responder esta solicitud, según la <Link to="/privacidad">Política de privacidad</Link>.</span>
              </label>
              <button type="submit" className="aiden-boton aiden-boton-oscuro aiden-boton-grande" disabled={enviandoSolicitud}>
                {enviandoSolicitud ? "Enviando..." : "Solicitar demo"} <ArrowRight size={15} />
              </button>
              {solicitudEnviada && <p className="aiden-form-estado is-exito" role="status" aria-live="polite">Solicitud recibida. Te escribiremos al correo que dejaste para coordinar la demostración.</p>}
              {errorSolicitud && <p className="aiden-form-estado" role="alert">{errorSolicitud}</p>}
            </form>
          </div></div>
        </section>
      </main>

      {/* El pie: la marca cierra la página como la abrió. */}
      <footer className="aiden-footer">
        <div className="aiden-shell">
          <div className="aiden-footer-cierre">
            <p>El lote de cilantro va por el día {joven ? numero(diasEntre(hoyISO(), joven.fecha)) : "6"}. <em>Su historia apenas empieza.</em></p>
            <a href="#contacto" className="aiden-boton aiden-boton-lima">Solicitar demo <ArrowRight size={14} /></a>
          </div>
          <div className="aiden-footer-columnas">
            <div className="aiden-footer-firma">
              <span className="aiden-footer-isotipo"><IsotipoAiden tamano={34} placa /></span>
              <p>Registro y seguimiento para viveros e invernaderos. Hecho para el campo colombiano.</p>
            </div>
            <nav aria-label="Recorrido">
              <strong>Recorrido</strong>
              <a href="#historia">La historia</a>
              <a href="#vivero">El vivero</a>
              <a href="#roles">Roles</a>
              <a href="#preguntas">Preguntas</a>
            </nav>
            <nav aria-label="Cuenta">
              <strong>Cuenta</strong>
              <Link to="/login">Ingresar</Link>
              <a href="#contacto">Solicitar demo</a>
            </nav>
            <nav aria-label="Legal">
              <strong>Legal</strong>
              <Link to="/terminos">Términos</Link>
              <Link to="/privacidad">Privacidad</Link>
            </nav>
          </div>
          <p className="aiden-footer-marca" aria-hidden="true"><img src={palabraMarcaMoss} alt="" loading="lazy" /></p>
          <div className="aiden-footer-banda">
            <span>AiDEN · Vivero en el Cauca, Colombia</span>
            <span>Los datos de esta página son los de ejemplo del sistema.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

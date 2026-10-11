import { ArrowDown, ArrowRight, Check, Minus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { generarSemilla } from "../datos/semilla";
import { resumenLote, ultimasLecturas } from "../datos/selectores";
import { ETAPAS } from "../datos/catalogos";
import { dinero, dineroOGuion, fechaCorta, hoyISO, numero } from "../utilidades/formato";
import { useTitulo } from "../hooks/useTitulo";
import MarcoPublico from "../components/landing/MarcoPublico";
import { IsotipoAiden } from "../components/ui/MarcaAiden";
import Insignia from "../components/ui/Insignia";
import BarraRango from "../components/ui/BarraRango";
import PasosEtapa from "../components/lote/PasosEtapa";
import LineaTiempo from "../components/lote/LineaTiempo";
import { TONO_INCIDENCIA, TONO_PRIORIDAD } from "../components/ui/tonos";
import WordmarkAiden from "../components/landing/WordmarkAiden";
import TituloVivo from "../components/landing/TituloVivo";
import CapituloPantallas from "../components/landing/CapituloPantallas";
import AsistenteVivo from "../components/landing/AsistenteVivo";
import CapituloVivero from "../components/landing/CapituloVivero";
import SiembraExito from "../components/landing/SiembraExito";
import LienzoVivo from "../components/vivo/LienzoVivo";
import SembradoIsotipo from "../components/vivo/SembradoIsotipo";
import { diferida } from "../utilidades/cargaDiferida";
import "../estilos/landing-vivo.css";
import "../estilos/landing-estudio.css";

const EscenaInvernadero = diferida(() => import("../components/vivo/escenas/EscenaInvernadero"));
const EscenaTopografia = diferida(() => import("../components/vivo/escenas/EscenaTopografia"));
const EscenaVidrio = diferida(() => import("../components/vivo/escenas/EscenaVidrio"));
const EscenaAsistente = diferida(() => import("../components/vivo/escenas/EscenaAsistente"));

/*
  La landing rebobina la historia del lote de tomate del vivero que trae AiDEN:
  del despacho (día 68) a la siembra (día 0). Cada estación muestra una ventana del
  módulo real del sistema, y el asistente del producto responde en vivo. Nada se
  inventa: generarSemilla es pura y determinista respecto a hoy.
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

const MODULOS = ["Producción", "Inventario", "Trazabilidad", "Ambiental", "Calidad", "Costos", "Personal", "Reportes", "Configuración"];

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
      cuerpo: "Ayer, hojas amarillas en el tercio inferior: incidencia de prioridad alta. El sistema ya agendó lo que sigue.",
      ventana: { ruta: "Calidad / Incidencias", meta: lote.lote, tipo: "incidencia", incidencia, tareas: [deshoje, validacion, despacho].filter(Boolean) },
    },
    aCosecha && {
      dia: dia(aCosecha.fecha),
      etapa: "Cosecha",
      titulo: `${numero(lote.cantidad)} de ${numero(lote.cantidadInicial)}.`,
      cuerpo: "El lote pasó a Cosecha con 30 plantas menos. La merma no se maquilla: queda contada, con fecha y responsable.",
      ventana: { ruta: "Producción / Lotes", meta: `${aCosecha.responsable} · ${hora(aCosecha.fecha)}`, tipo: "etapa", lote, vivas: lote.cantidad, iniciales: lote.cantidadInicial },
    },
    anticipo && {
      dia: dia(anticipo.fecha),
      etapa: "Cosecha",
      titulo: "El pedido llegó con anticipo.",
      cuerpo: "El ingreso quedó escrito junto al lote que lo gana: ni en un bolsillo, ni en otra planilla.",
      ventana: { ruta: "Costos / Movimientos", meta: fechaCorta(anticipo.fecha), tipo: "costo", costo: anticipo },
    },
    fertilizacion && {
      dia: dia(fertilizacion.fecha),
      etapa: "Desarrollo",
      titulo: "Fertilización, 7:30 de la mañana.",
      cuerpo: `${fertilizacion.responsable} la dejó en la historia del lote antes de guardar la bomba. Sin pasar en limpio por la noche.`,
      ventana: { ruta: "Trazabilidad / Historia del lote", meta: lote.lote, tipo: "eventos", eventos: [fertilizacion] },
    },
    aDesarrollo && {
      dia: dia(aDesarrollo.fecha),
      etapa: "Desarrollo",
      titulo: "Cambio de etapa, visible para todos.",
      cuerpo: "Laura movió la etapa y la ficha cambió para todo el equipo a la vez: tareas para el operario, costo para el administrador.",
      ventana: { ruta: "Trazabilidad / Historia del lote", meta: lote.lote, tipo: "eventos", eventos: [aDesarrollo, aAdaptacion].filter(Boolean) },
    },
    ultimaLectura && {
      dia: dia(aAdaptacion ? aAdaptacion.fecha : lote.fecha),
      etapa: "Adaptación",
      titulo: "Las lecturas siguieron entrando.",
      cuerpo: "Temperatura, humedad y luz cada cuatro horas; si una zona sale del rango, la alerta señala los lotes que están en ella.",
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
      cuerpo: `${registro.responsable} registró el lote; el sustrato y las bandejas salieron del inventario y el costo quedó escrito solo.`,
      ventana: { ruta: "Producción / Lotes", meta: fechaCorta(lote.fecha), tipo: "registro", lote, movimientos: movimientosDia0 },
    },
  ].filter(Boolean);

  return {
    datos,
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
        <div className="rounded-xl border border-slate-200 bg-white p-3"><PasosEtapa etapa="Cosecha" fechas={{}} compacto /></div>
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
        <div className="rounded-xl border border-slate-200 bg-white p-3"><PasosEtapa etapa="Germinación" fechas={{}} compacto /></div>
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

/* Una cifra que cuenta hasta su valor al entrar en pantalla (y queda quieta
   con movimiento reducido o sin IntersectionObserver). */
function CifraViva({ hasta, formatear = numero, sufijo = "" }) {
  const [valor, setValor] = useState(hasta);
  const nodoRef = useRef(null);
  const corrido = useRef(false);

  useEffect(() => {
    const nodo = nodoRef.current;
    if (!nodo || corrido.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!("IntersectionObserver" in window)) return undefined;
    const observador = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting) || corrido.current) return;
      corrido.current = true;
      observador.disconnect();
      const inicio = performance.now();
      const durar = 850;
      const paso = (ahora) => {
        const t = Math.min(1, (ahora - inicio) / durar);
        const suavizado = 1 - (1 - t) ** 3;
        setValor(Math.round(hasta * suavizado));
        if (t < 1) window.requestAnimationFrame(paso);
      };
      setValor(0);
      window.requestAnimationFrame(paso);
    }, { threshold: 0.6 });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [hasta]);

  return <span ref={nodoRef}>{formatear(valor)}{sufijo}</span>;
}

export default function Inicio() {
  useTitulo(null);
  const historia = useMemo(() => construirHistoria(), []);
  const [estacionActiva, setEstacionActiva] = useState(0);
  const [diaRiel, setDiaRiel] = useState(null);
  const [vistas, setVistas] = useState(() => new Set());
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [asistentePensando, setAsistentePensando] = useState(false);
  const estacionesRef = useRef([]);
  const rielRef = useRef(null);
  const fichaRef = useRef(null);
  const formularioMontado = useRef(0);

  // La ficha del hero se inclina siguiendo el puntero (solo puntero fino y sin movimiento reducido).
  useEffect(() => {
    const ficha = fichaRef.current;
    if (!ficha) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;
    let cuadro = 0;
    const mover = (evento) => {
      if (cuadro) return;
      cuadro = window.requestAnimationFrame(() => {
        cuadro = 0;
        const caja = ficha.getBoundingClientRect();
        const nx = (evento.clientX - caja.left) / caja.width - 0.5;
        const ny = (evento.clientY - caja.top) / caja.height - 0.5;
        ficha.style.setProperty("--inclina-x", `${(-ny * 7).toFixed(2)}deg`);
        ficha.style.setProperty("--inclina-y", `${(nx * 9).toFixed(2)}deg`);
      });
    };
    const soltar = () => {
      ficha.style.setProperty("--inclina-x", "0deg");
      ficha.style.setProperty("--inclina-y", "0deg");
    };
    ficha.addEventListener("pointermove", mover, { passive: true });
    ficha.addEventListener("pointerleave", soltar, { passive: true });
    return () => {
      ficha.removeEventListener("pointermove", mover);
      ficha.removeEventListener("pointerleave", soltar);
      if (cuadro) window.cancelAnimationFrame(cuadro);
    };
  }, []);

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

  // La luz que sigue al cursor dentro de los botones (solo con ratón o trackpad).
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;
    const mover = (evento) => {
      const boton = evento.target instanceof Element ? evento.target.closest(".aiden-boton") : null;
      if (!boton) return;
      const caja = boton.getBoundingClientRect();
      boton.style.setProperty("--luz-x", `${evento.clientX - caja.left}px`);
      boton.style.setProperty("--luz-y", `${evento.clientY - caja.top}px`);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);

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
  const { datos, lote, resumen, estaciones, totalDias, cerrado, eventoCierre, joven, incidenciaJoven, lotesActivos, registros, validadora } = historia;
  const activa = estaciones[estacionActiva] || estaciones[0];
  const diaCilantro = joven ? numero(diasEntre(hoyISO(), joven.fecha)) : null;
  const plantasVivero = lotesActivos.reduce((suma, l) => suma + l.cantidad, 0);

  return (
    <MarcoPublico diaCilantro={diaCilantro}>
        {/* Día 66: la marca corona el marco y la escena abre en la víspera del despacho. */}
        <section className="aiden-despacho" aria-labelledby="titulo-despacho">
          <div className="aiden-shell">
            <p className="aiden-marca-monumental" aria-hidden="true"><WordmarkAiden className="aiden-wordmark" /></p>
            <div className="aiden-escena" data-sembrado-marco>
              <LienzoVivo escena={EscenaInvernadero} />
              <SembradoIsotipo plantas={plantasVivero} className="aiden-escena-sembrado" />
              <a href="#historia" className="aiden-circulo" aria-label="Bajar a la historia del lote"><ArrowDown size={20} /></a>
              <p className="aiden-enjambre-leyenda"><i aria-hidden="true" /><span><strong>{numero(plantasVivero)}</strong> plantas vivas en el vivero, un punto por cada una</span></p>
              <div className="aiden-escena-copy">
                <TituloVivo
                  id="titulo-despacho"
                  retraso={0.35}
                  partes={[{ texto: "Pasado mañana salen 400 plantas de tomate" }, { texto: "hacia Timbío.", em: true }]}
                />
                <p className="aiden-despacho-lead">
                  AiDEN, el sistema de registro del vivero, escribió los {numero(totalDias)} días que las trajeron
                  hasta el camión. Esta página rebobina esa historia.
                </p>
                <div className="aiden-despacho-acciones">
                  <a href="#contacto" className="aiden-boton aiden-boton-lima aiden-boton-grande">Agendar una presentación <ArrowRight size={15} /></a>
                  <a href="#historia" className="aiden-boton aiden-boton-fantasma aiden-boton-grande">Rebobinar la historia</a>
                </div>
              </div>
              <figure className="aiden-guia" ref={fichaRef} aria-label={`Ficha del lote ${lote.lote} en AiDEN`}>
                <VentanaModulo ruta="Producción / Ficha del lote" meta={lote.lote}>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">{lote.cultivo}</p>
                        <p className="text-[11px] text-slate-600">{lote.ubicacion} · {numero(lote.cantidadInicial)} sembradas</p>
                      </div>
                      <Insignia tono="exito">ACTIVO</Insignia>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3"><PasosEtapa etapa={lote.etapa} fechas={{}} compacto /></div>
                    <dl className="aiden-ficha-lineas">
                      <div><dt>Plantas vivas</dt><dd>{numero(lote.cantidad)} de {numero(lote.cantidadInicial)}</dd></div>
                      <div><dt>Pedido</dt><dd>400 · Asociación de Timbío</dd></div>
                      <div><dt>Salida</dt><dd>{fechaCorta(lote.fechaEstimada)}</dd></div>
                      <div><dt>Valida</dt><dd>{validadora || "Supervisión"}</dd></div>
                    </dl>
                  </div>
                </VentanaModulo>
              </figure>
            </div>
          </div>
        </section>

        {/* La pregunta que el ICA y el comprador hacen igual, en tres datos. */}
        <section className="aiden-pregunta" aria-labelledby="titulo-pregunta">
          <div className="aiden-shell aiden-pregunta-marco"><LienzoVivo escena={EscenaTopografia} /><div className="aiden-pregunta-inner">
            <div>
              <h2 id="titulo-pregunta">¿Podría tu vivero reconstruir la historia <em>de cada planta que vende?</em></h2>
              <p className="aiden-pregunta-bajada">
                El ICA lo exige y el que compra lo pregunta con otras palabras: de qué lote salió, qué se le aplicó,
                quién lo revisó. En la mayoría de los viveros la respuesta vive en cuadernos y en la memoria.
              </p>
            </div>
            <dl className="aiden-datos-sector">
              <div>
                <dt><CifraViva hasta={35000} /></dt>
                <dd>familias viven de producir y vender plantas en Colombia <a href="https://www.agronegocios.co/agricultura/productores-viveristas-mueven-180-000-millones-al-ano-con-apoyo-de-minagricultura-2920306" target="_blank" rel="noopener noreferrer">Colviveros</a></dd>
              </div>
              <div>
                <dt>1 de 10</dt>
                <dd>lo hace desde una empresa formalmente constituida <a href="https://www.elespectador.com/la-huerta/mirelo-sin-compromiso-el-negocio-detras-de-los-viveros/" target="_blank" rel="noopener noreferrer">El Espectador</a></dd>
              </div>
              <div>
                <dt>780006</dt>
                <dd>la resolución del ICA que obliga a registrar el vivero desde 2020 <a href="https://www.ica.gov.co/normatividad/normas-ica/resoluciones-oficinas-nacionales" target="_blank" rel="noopener noreferrer">ICA</a></dd>
              </div>
            </dl>
          </div></div>
        </section>

        {/* El rebobinado: cada evento clavado a su día, en la ventana del módulo que lo escribió. */}
        <section className="aiden-rebobinado" id="historia" aria-labelledby="titulo-historia">
          <div className="aiden-shell">
            <header className="aiden-rebobinado-cabecera">
              <h2 id="titulo-historia">Rebobinemos el <span className="aiden-sin-corte">{lote.lote}</span>, <em>del camión a la semilla.</em></h2>
              <p>Cada registro, leído de atrás hacia adelante en el módulo que lo escribió.</p>
            </header>
            <div className="aiden-rebobinado-grid">
              <aside className="aiden-riel" aria-hidden="true">
                <div className="aiden-riel-interno" ref={rielRef}>
                  <span className="aiden-riel-rotulo">Día</span>
                  <strong className="aiden-riel-dia">{numero(diaRiel ?? activa.dia)}</strong>
                  <span className="aiden-riel-etapa">{activa.etapa}</span>
                  <PistaEtapas etapa={activa.etapa} />
                  <svg className="aiden-enredadera" viewBox="0 0 28 150" aria-hidden="true">
                    <path className="aiden-enredadera-tallo" d="M14 2 C 20 20, 8 32, 14 50 C 20 68, 8 80, 14 98 C 19 113, 10 128, 14 148" pathLength="100" />
                    {[18, 44, 66, 90, 114, 136].map((y, i) => {
                      const lado = i % 2 ? 1 : -1;
                      return (
                        <path
                          key={y}
                          className="aiden-enredadera-hoja"
                          style={{ "--brote": (i + 1) / 7 }}
                          d={`M14 ${y} q ${9 * lado} -2 ${11 * lado} -8 q ${-9 * lado} 1 ${-11 * lado} 8`}
                        />
                      );
                    })}
                  </svg>
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

        {/* El saldo de la historia, contado en vivo. */}
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
                  <dd><CifraViva hasta={lote.cantidad} /> de {numero(lote.cantidadInicial)}</dd>
                </div>
                <div>
                  <dt>Eventos en su historia</dt>
                  <dd><CifraViva hasta={registros} /></dd>
                </div>
                <div>
                  <dt>Gasto acumulado</dt>
                  <dd><CifraViva hasta={resumen.gasto} formatear={dinero} /></dd>
                </div>
                <div className="aiden-liquidacion-total">
                  <dt>Costo por planta viva</dt>
                  <dd>{resumen.costoPlanta == null ? dineroOGuion(resumen.costoPlanta) : <CifraViva hasta={resumen.costoPlanta} formatear={dinero} />}</dd>
                </div>
              </dl>
              <small>Cada línea con fecha, hora y responsable; la merma quedó contada.</small>
            </div>
            {cerrado && eventoCierre && (
              <p className="aiden-saldo-antecedente">
                Y no es la primera: la lechuga del Invernadero 2 ya hizo este viaje, con su historia cerrada y
                releíble completa en Trazabilidad.
              </p>
            )}
          </div>
        </section>


        {/* El manifiesto: tres verdades del campo, encendidas palabra a palabra. */}
        <section className="aiden-manifiesto" aria-label="Por qué registrar">
          <div className="aiden-shell aiden-manifiesto-marco">
            <LienzoVivo escena={EscenaVidrio} />
            <p>
              {["El", "cuaderno", "se", "moja."].map((palabra) => <span key={`a-${palabra}`}>{palabra} </span>)}
              {["La", "memoria", "se", "va."].map((palabra) => <span key={`b-${palabra}`}>{palabra} </span>)}
              <em>{["Los", "registros", "se", "quedan."].map((palabra) => <span key={`c-${palabra}`}>{palabra} </span>)}</em>
            </p>
          </div>
        </section>

        {/* El vivero completo, leído de un barrido, y los módulos como cinta. */}
        <section className="aiden-vivero" id="vivero" aria-labelledby="titulo-vivero">
          <div className="aiden-shell">
            <header className="aiden-vivero-cabecera">
              <h2 id="titulo-vivero">El resto del vivero, <em>de un barrido.</em></h2>
              <p>Cada planta viva en su cama, su zona y su etapa. Baja despacio: el recorrido para en cada zona.</p>
            </header>
            <CapituloVivero datos={datos} protagonista={lote.lote} />
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
          </div>
          <div className="aiden-marquee" aria-label="Los nueve módulos de AiDEN">
            <div className="aiden-marquee-pista">
              {[false, true].map((copia) => (
                <ul key={String(copia)} aria-hidden={copia}>
                  {MODULOS.map((modulo) => (
                    <li key={modulo}><i aria-hidden="true" />{modulo}</li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
          <div className="aiden-shell">
            <div className="aiden-comparativa-cabecera">
              <h3 id="titulo-comparativa">Lo que solo AiDEN pone sobre la mesa</h3>
              <p>Comparado con cómo se lleva hoy el registro en la mayoría de los viveros.</p>
            </div>
            <div className="aiden-comparativa-placa">
            <header className="aiden-comparativa-doc">
              <span className="aiden-guia-doc">Comparativa de campo</span>
              <span className="aiden-guia-folio">Hoja 1 de 1</span>
            </header>
            <table className="aiden-comparativa" aria-labelledby="titulo-comparativa">
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Capacidad</span></th>
                  <th scope="col">El cuaderno</th>
                  <th scope="col">Software genérico</th>
                  <th scope="col" className="is-aiden">AiDEN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Funciona sin señal, en el campo</th>
                  <td><Check size={15} aria-label="Sí" /></td>
                  <td><Minus size={15} aria-label="Normalmente no" /></td>
                  <td className="is-aiden"><span className="aiden-sello-check"><Check size={13} aria-label="Sí" /></span></td>
                </tr>
                <tr>
                  <th scope="row">Asistente que responde con tus lotes y tus registros</th>
                  <td><Minus size={15} aria-label="No" /></td>
                  <td><Minus size={15} aria-label="Normalmente no" /></td>
                  <td className="is-aiden"><span className="aiden-sello-check"><Check size={13} aria-label="Sí" /></span></td>
                </tr>
                <tr>
                  <th scope="row">La historia del lote, del registro al despacho</th>
                  <td><Minus size={15} aria-label="Depende de quien escribe" /></td>
                  <td><Check size={15} aria-label="En algunos" /></td>
                  <td className="is-aiden"><span className="aiden-sello-check"><Check size={13} aria-label="Sí" /></span></td>
                </tr>
                <tr>
                  <th scope="row">El costo por planta se calcula solo</th>
                  <td><Minus size={15} aria-label="No" /></td>
                  <td><Minus size={15} aria-label="Normalmente no" /></td>
                  <td className="is-aiden"><span className="aiden-sello-check"><Check size={13} aria-label="Sí" /></span></td>
                </tr>
                <tr>
                  <th scope="row">En el idioma del vivero colombiano</th>
                  <td><Check size={15} aria-label="Sí" /></td>
                  <td><Minus size={15} aria-label="Normalmente no" /></td>
                  <td className="is-aiden"><span className="aiden-sello-check"><Check size={13} aria-label="Sí" /></span></td>
                </tr>
              </tbody>
            </table>
            </div>
            <p className="aiden-comparativa-nota">«Software genérico»: sistemas de gestión no pensados para viveros; lo usual, no un producto concreto.</p>
          </div>
        </section>

        {/* El asistente de IA, respondiendo en vivo con los registros del vivero. */}
        <section className="aiden-ia" id="asistente" aria-labelledby="titulo-ia">
          <div className="aiden-shell aiden-ia-marco"><LienzoVivo escena={EscenaAsistente} datos={{ pensando: asistentePensando }} /><div className="aiden-ia-grid">
            <div className="aiden-ia-copy">
              <h2 id="titulo-ia">Pregúntale <em>al vivero.</em></h2>
              <p>
                El asistente responde con los registros, no con promesas. Corre aquí mismo, en tu navegador, con
                las mismas reglas del módulo de inteligencia artificial de AiDEN.
              </p>
              <p className="aiden-ia-pista">
                Prueba con un código de lote ({lote.lote}) o con un insumo: «¿cuánto sustrato queda?».
              </p>
            </div>
            <VentanaModulo ruta="Inteligencia artificial / Asistente" meta="Vivero · Cauca">
              <AsistenteVivo datos={datos} onPensando={setAsistentePensando} />
            </VentanaModulo>
          </div></div>
        </section>

        {/* Tres pantallas, una historia: el registro viaja del celular al portátil y a la tableta. */}
        <CapituloPantallas datos={datos} lote={lote} />

        {/* Agendar presentación: el formulario es la acción, no un adorno. */}
        <section className="aiden-contacto" id="contacto" aria-labelledby="titulo-contacto">
          <div className="aiden-shell aiden-contacto-marco"><LienzoVivo escena={EscenaInvernadero} /><div className="aiden-contacto-grid">
            <div className="aiden-contacto-copy">
              <h2 id="titulo-contacto">Muéstranos <em>tu vivero.</em></h2>
              <p>
                Cuéntanos cómo llevas hoy los registros —cuaderno, planilla, memoria— y qué quieres poder responder.
                Te escribimos al correo que dejes para mostrarte AiDEN sobre una operación como la tuya.
              </p>
              {joven && incidenciaJoven && (
                <p className="aiden-contacto-guino">
                  Mientras tanto, en el vivero: el {joven.cultivo.toLowerCase()} va por el día {diaCilantro} y
                  esta mañana reportaron volcamiento en tres bandejas. Esa historia también quedará escrita.
                </p>
              )}
            </div>
            <form
              className="aiden-formulario"
              onSubmit={prepararSolicitud}
              onFocus={() => { if (!formularioMontado.current) formularioMontado.current = Date.now(); }}
              aria-label="Solicitud de presentación de AiDEN"
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
              <span className="aiden-envio">
                <button type="submit" className="aiden-boton aiden-boton-oscuro aiden-boton-grande" disabled={enviandoSolicitud}>
                  {enviandoSolicitud ? "Enviando…" : "Agendar presentación"} <ArrowRight size={15} />
                </button>
                <SiembraExito activa={solicitudEnviada} />
              </span>
              {solicitudEnviada && <p className="aiden-form-estado is-exito" role="status" aria-live="polite">Solicitud recibida. Te escribiremos al correo que dejaste para coordinar la presentación.</p>}
              {errorSolicitud && <p className="aiden-form-estado" role="alert">{errorSolicitud}</p>}
            </form>
          </div></div>
        </section>
    </MarcoPublico>
  );
}

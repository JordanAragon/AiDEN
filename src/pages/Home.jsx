import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { generarSemilla } from "../datos/semilla";
import { SUGERENCIAS, responder } from "../datos/asistente";
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
import palabraMarca from "../assets/marca/aiden-palabra.svg";

/*
  La landing rebobina la historia real del lote de tomate de los datos de ejemplo:
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

/* La demo del asistente: el módulo de IA real respondiendo en el navegador. */
function DemoAsistente({ datos }) {
  const [charla, setCharla] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const charlaRef = useRef(null);

  const preguntar = (texto) => {
    const limpio = texto.trim();
    if (!limpio) return;
    setCharla((previa) => [...previa.slice(-5), { pregunta: limpio, respuesta: responder(limpio, datos, null) }]);
    setPregunta("");
    window.requestAnimationFrame(() => {
      charlaRef.current?.scrollTo({ top: charlaRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  return (
    <div className="aiden-chat">
      <div className="aiden-chat-historial" ref={charlaRef} aria-live="polite">
        {charla.length === 0 && (
          <p className="aiden-chat-vacio">Elige una pregunta o escribe la tuya. El asistente responde con los registros del vivero de ejemplo.</p>
        )}
        {charla.map((turno, indice) => (
          <div key={`${turno.pregunta}-${indice}`} className="aiden-chat-turno">
            <p className="aiden-chat-pregunta">{turno.pregunta}</p>
            <div className="aiden-chat-respuesta">
              <p>{turno.respuesta.texto}</p>
              {turno.respuesta.items?.length > 0 && (
                <ul>
                  {turno.respuesta.items.slice(0, 5).map((item) => (
                    <li key={item.texto}>
                      {item.etiqueta && <Insignia tono="neutral">{String(item.etiqueta).toUpperCase()}</Insignia>}
                      <span>{item.texto}</span>
                    </li>
                  ))}
                </ul>
              )}
              {turno.respuesta.fuente && <small>Verificable en: {turno.respuesta.fuente}</small>}
            </div>
          </div>
        ))}
      </div>
      <div className="aiden-chat-chips" role="group" aria-label="Preguntas sugeridas">
        {SUGERENCIAS.slice(0, 4).map((sugerencia) => (
          <button key={sugerencia} type="button" onClick={() => preguntar(sugerencia)}>{sugerencia}</button>
        ))}
      </div>
      <form
        className="aiden-chat-entrada"
        onSubmit={(evento) => {
          evento.preventDefault();
          preguntar(pregunta);
        }}
      >
        <label className="sr-only" htmlFor="pregunta-asistente">Escribe tu pregunta para el asistente</label>
        <input
          id="pregunta-asistente"
          value={pregunta}
          onChange={(evento) => setPregunta(evento.target.value)}
          placeholder="Escribe tu pregunta… por ejemplo, LT-2026-012"
          maxLength={160}
          autoComplete="off"
        />
        <button type="submit" className="aiden-boton aiden-boton-oscuro" aria-label="Preguntar al asistente"><ArrowRight size={15} /></button>
      </form>
    </div>
  );
}

const ROLES = [
  {
    nombre: "Laura, supervisora",
    tono: "noche",
    frase: "Registró el lote, movió las etapas y mañana valida el despacho.",
    detalle: "Su vista ordena el día por lo que requiere decisión.",
    hizo: ["Registro del lote", "Cambios de etapa", "Validación de salida"],
  },
  {
    nombre: "Andrés, operario",
    tono: "lima",
    frase: "Regó, fertilizó y reportó las hojas amarillas desde el celular.",
    detalle: "Su vista pone las tareas primero, al alcance del pulgar.",
    hizo: ["Riego y fertilización", "Reporte de incidencia", "Tareas del día"],
  },
  {
    nombre: "Jordan, administrador",
    tono: "papel",
    frase: "Lee el costo por planta sin pedirle la planilla a nadie.",
    detalle: "Su vista junta costos, accesos y el pulso de la semana.",
    hizo: ["Costo por planta", "Saldo del mes", "Cuentas y accesos"],
  },
];

export default function Inicio() {
  useTitulo(null);
  const historia = useMemo(() => construirHistoria(), []);
  const [estacionActiva, setEstacionActiva] = useState(0);
  const [diaRiel, setDiaRiel] = useState(null);
  const [vistas, setVistas] = useState(() => new Set());
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const estacionesRef = useRef([]);
  const rielRef = useRef(null);
  const formularioMontado = useRef(0);

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
  const { datos, lote, resumen, estaciones, totalDias, hoyDia, cerrado, eventoCierre, joven, incidenciaJoven, lotesActivos, registros, validadora } = historia;
  const activa = estaciones[estacionActiva] || estaciones[0];
  const diaCilantro = joven ? numero(diasEntre(hoyISO(), joven.fecha)) : null;

  return (
    <MarcoPublico diaCilantro={diaCilantro}>
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

        {/* La pregunta que el ICA y el comprador hacen igual, en tres datos. */}
        <section className="aiden-pregunta" aria-labelledby="titulo-pregunta">
          <div className="aiden-shell aiden-pregunta-marco"><div className="aiden-pregunta-inner">
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
              <p className="aiden-capitulo"><i aria-hidden="true" />La historia</p>
              <h2 id="titulo-historia">Rebobinemos el <span className="aiden-sin-corte">{lote.lote}</span>, <em>del camión a la semilla.</em></h2>
              <p>Registros reales de los datos de ejemplo, leídos de atrás hacia adelante en el módulo que los escribió.</p>
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

        {/* El vivero completo, leído de un barrido, y los módulos como cinta. */}
        <section className="aiden-vivero" id="vivero" aria-labelledby="titulo-vivero">
          <div className="aiden-shell">
            <header className="aiden-vivero-cabecera">
              <p className="aiden-capitulo"><i aria-hidden="true" />El vivero</p>
              <h2 id="titulo-vivero">El resto del vivero, <em>de un barrido.</em></h2>
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
            <dl className="aiden-fuertes">
              <div>
                <dt>La historia completa de cada lote</dt>
                <dd>Del registro al despacho, con fecha, hora y responsable: lo que el ICA y el comprador preguntan.</dd>
              </div>
              <div>
                <dt>Costo por planta sin planillas</dt>
                <dd>Cada consumo y cada jornal caen al lote que los gasta; el costo se calcula solo.</dd>
              </div>
              <div>
                <dt>Funciona sin señal, en el campo</dt>
                <dd>Abre y guarda sin conexión en el equipo del vivero, lista en la pantalla del celular.</dd>
              </div>
              <div>
                <dt>Un asistente que responde con registros</dt>
                <dd>Pregunta por costos, cargas o incidencias: responde con los datos y cita su fuente.</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* El asistente de IA, respondiendo en vivo con los datos de ejemplo. */}
        <section className="aiden-ia" id="asistente" aria-labelledby="titulo-ia">
          <div className="aiden-shell aiden-ia-marco"><div className="aiden-ia-grid">
            <div className="aiden-ia-copy">
              <h2 id="titulo-ia">Pregúntale <em>al vivero.</em></h2>
              <p>
                El asistente responde con los registros, no con promesas. Esta demostración corre en tu navegador
                con las mismas reglas del módulo de inteligencia artificial del producto.
              </p>
              <p className="aiden-ia-pista">
                Prueba con un código de lote ({lote.lote}) o con un insumo: «¿cuánto sustrato queda?».
              </p>
            </div>
            <VentanaModulo ruta="Inteligencia artificial / Asistente" meta="Datos de ejemplo">
              <DemoAsistente datos={datos} />
            </VentanaModulo>
          </div></div>
        </section>

        {/* Los roles, apilados: cada tarjeta tapa a la anterior al bajar. */}
        <section className="aiden-roles" id="roles" aria-labelledby="titulo-roles">
          <div className="aiden-shell">
            <p className="aiden-capitulo"><i aria-hidden="true" />Roles</p>
            <h2 id="titulo-roles">La misma historia, <em>tres lecturas.</em></h2>
            <div className="aiden-roles-pila">
              {ROLES.map((rol, indice) => (
                <article key={rol.nombre} className={`aiden-rol aiden-rol-${rol.tono}`} style={{ "--indice": indice }}>
                  <div className="aiden-rol-copy">
                    <h3>{rol.nombre}</h3>
                    <p className="aiden-rol-frase">{rol.frase}</p>
                    <p className="aiden-rol-detalle">{rol.detalle}</p>
                  </div>
                  <ul className="aiden-rol-hizo">
                    {rol.hizo.map((cosa) => <li key={cosa}>{cosa}</li>)}
                  </ul>
                </article>
              ))}
            </div>
            <p className="aiden-roles-pie">Cada rol entra a su propia vista con su propia cuenta. <Link to="/login">Iniciar sesión</Link></p>
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
                  Mientras tanto, en el vivero de ejemplo: el {joven.cultivo.toLowerCase()} va por el día {diaCilantro} y
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
    </MarcoPublico>
  );
}

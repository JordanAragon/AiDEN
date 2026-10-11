import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  CornerDownLeft,
  Keyboard,
  LogOut,
  Moon,
  Package,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  User,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { useDatos } from "../../datos/almacen";
import {
  esGestor,
  estadoIncidencia,
  evaluarLectura,
  incidenciasVisibles,
  lotesVisibles,
  nombrePersona,
  resumenLote,
  tareasVisibles,
  ultimasLecturas,
} from "../../datos/selectores";
import { useFichaLote } from "../../contexto/ficha";
import { useAcciones } from "../../contexto/acciones";
import { useSesion } from "../../hooks/useSesion";
import { alternarTema, useTema } from "../../hooks/useTema";
import { getDashboardPath, logout } from "../../utilidades/autenticacion";
import { coincide, dinero, fechaCorta, numero, plural, vencimiento } from "../../utilidades/formato";
import { modulosDeRol, rutaDeModulo } from "./modulos";
import PasosEtapa from "../lote/PasosEtapa";
import AnilloProgreso from "../ui/AnilloProgreso";
import Insignia from "../ui/Insignia";
import { TONO_INCIDENCIA, TONO_PRIORIDAD } from "../ui/tonos";

/*
  La paleta de AiDEN (⌘K / Ctrl K), al estilo de Raycast y Linear: un solo
  lugar para ir a un módulo, abrir un registro o ejecutar una acción. Enter
  hace lo principal; ⌘/Ctrl + Enter, lo secundario (ver la trazabilidad de un
  lote, ir al módulo de un registro). A la derecha, la vista previa del elemento
  activo con datos reales. Recuerda los últimos registros abiertos por cuenta.
*/

const ICONO_TIPO = { Lote: Sprout, Calidad: ShieldCheck, Tarea: ClipboardCheck, Inventario: Package, Personal: User, Costos: Wallet };

function claveRecientes(sesion) {
  return `aiden-recientes:${sesion?.id || "anonimo"}`;
}

function leerRecientes(sesion) {
  try {
    const valor = JSON.parse(window.localStorage.getItem(claveRecientes(sesion)) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function guardarReciente(sesion, clave) {
  try {
    const lista = [clave, ...leerRecientes(sesion).filter((c) => c !== clave)].slice(0, 5);
    window.localStorage.setItem(claveRecientes(sesion), JSON.stringify(lista));
  } catch {
    // Sin almacenamiento, la paleta funciona igual; solo no recuerda.
  }
}

function Tecla({ children }) {
  return <kbd className="aiden-tecla">{children}</kbd>;
}

function VistaPrevia({ item, datos }) {
  if (!item) return null;
  if (item.tipo === "Lote") {
    const lote = item.registro;
    const r = resumenLote(lote, datos);
    const lectura = ultimasLecturas(datos.ambiental).get(lote.ubicacion);
    const zona = evaluarLectura(lectura, datos.configuracion);
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">
          {lote.lote} · {lote.ubicacion}
        </p>
        <p className="aiden-paleta-previa-titulo">{lote.cultivo}</p>
        <div className="mt-3">
          <PasosEtapa etapa={lote.etapa} fechas={{}} compacto cerrado={lote.estado === "Cerrado"} />
        </div>
        <dl className="aiden-paleta-previa-datos">
          <div>
            <dt>Plantas vivas</dt>
            <dd>
              {numero(r.plantas)} <span>de {numero(r.inicial)}</span>
            </dd>
          </div>
          <div>
            <dt>{lote.estado === "Cerrado" ? "Cierre" : "Salida"}</dt>
            <dd>{lote.estado === "Cerrado" ? fechaCorta(lote.cierre) : r.diasParaSalida === null ? "Sin fecha" : r.diasParaSalida < 0 ? `${-r.diasParaSalida} días tarde` : `en ${plural(r.diasParaSalida, "día", "días")}`}</dd>
          </div>
          <div>
            <dt>Tareas abiertas</dt>
            <dd>{numero(r.tareasAbiertas.length)}</dd>
          </div>
          <div>
            <dt>Incidencias</dt>
            <dd className={r.incidenciasAbiertas.length ? "is-alerta" : ""}>{r.incidenciasAbiertas.length ? plural(r.incidenciasAbiertas.length, "abierta", "abiertas") : "Ninguna"}</dd>
          </div>
        </dl>
        {lectura && (
          <p className={`aiden-paleta-previa-zona ${zona.fuera ? "is-alerta" : ""}`}>
            {lote.ubicacion}: {String(lectura.temperatura).replace(".", ",")} °C · {lectura.humedad} % · {zona.fuera ? "fuera de rango" : "en rango"}
          </p>
        )}
      </div>
    );
  }
  if (item.tipo === "Inventario") {
    const insumo = item.registro;
    const minimo = Number(insumo.minimo) || 0;
    const stock = Number(insumo.stock) || 0;
    const bajo = stock <= minimo;
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">{insumo.categoria}</p>
        <p className="aiden-paleta-previa-titulo">{insumo.nombre}</p>
        <div className="mt-4 flex items-center gap-3">
          <AnilloProgreso valor={stock} maximo={Math.max(minimo * 2, stock, 1)} tamano={52} grosor={5} tono={bajo ? "critico" : "verde"} etiqueta={`Existencias de ${insumo.nombre}`} />
          <p className="text-sm text-slate-600">
            <b className="block text-lg tabular-nums text-slate-900">
              {numero(stock)} {insumo.unidad}
            </b>
            {bajo ? `Por debajo del mínimo (${numero(minimo)})` : `Mínimo ${numero(minimo)}`}
          </p>
        </div>
      </div>
    );
  }
  if (item.tipo === "Tarea") {
    const tarea = item.registro;
    const v = vencimiento(tarea.fecha);
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">
          {tarea.modulo}
          {tarea.lote ? ` · ${tarea.lote}` : ""}
        </p>
        <p className="aiden-paleta-previa-titulo">{tarea.titulo}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Insignia tono={TONO_PRIORIDAD[tarea.prioridad]}>{tarea.prioridad}</Insignia>
          <Insignia tono={tarea.estado === "Completada" ? "exito" : v.tono}>{tarea.estado === "Completada" ? "Completada" : v.texto}</Insignia>
        </div>
        <p className="mt-3 text-sm text-slate-600">Responsable: {nombrePersona(datos.personas, tarea.responsableId)}</p>
        {tarea.descripcion && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{tarea.descripcion}</p>}
      </div>
    );
  }
  if (item.tipo === "Calidad") {
    const incidencia = item.registro;
    const estado = estadoIncidencia(incidencia);
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">
          {incidencia.codigo} · {incidencia.lote}
        </p>
        <p className="aiden-paleta-previa-titulo">{incidencia.descripcion}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Insignia tono={TONO_PRIORIDAD[incidencia.prioridad]}>{incidencia.prioridad}</Insignia>
          <Insignia tono={TONO_INCIDENCIA[estado]}>{estado}</Insignia>
        </div>
        {incidencia.accion && <p className="mt-3 text-sm text-slate-600">Acción: {incidencia.accion}</p>}
      </div>
    );
  }
  if (item.tipo === "Personal") {
    const persona = item.registro;
    const abiertas = datos.tareas.filter((t) => t.responsableId === persona.id && t.estado !== "Completada").length;
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">{persona.departamento}</p>
        <p className="aiden-paleta-previa-titulo">{persona.nombre}</p>
        <p className="mt-2 text-sm text-slate-600">
          {persona.cargo} · {persona.estado}
        </p>
        <p className="mt-1 text-sm text-slate-600">{abiertas ? plural(abiertas, "tarea abierta", "tareas abiertas") : "Sin tareas abiertas"}</p>
      </div>
    );
  }
  if (item.tipo === "Costos") {
    const costo = item.registro;
    return (
      <div className="aiden-paleta-previa-cuerpo">
        <p className="aiden-paleta-previa-meta">
          {costo.categoria} · {fechaCorta(costo.fecha)}
        </p>
        <p className="aiden-paleta-previa-titulo">{costo.concepto}</p>
        <p className={`mt-3 text-xl font-semibold tabular-nums ${costo.tipo === "ingreso" ? "text-emerald-700" : "text-slate-900"}`}>
          {costo.tipo === "ingreso" ? "+" : "−"}
          {dinero(costo.valor)}
        </p>
        <p className="mt-1 text-sm text-slate-500">{costo.lote || "Gasto general"}</p>
      </div>
    );
  }
  const Icono = item.icono;
  return (
    <div className="aiden-paleta-previa-cuerpo">
      {Icono && (
        <span className="aiden-paleta-previa-icono">
          <Icono size={20} aria-hidden="true" />
        </span>
      )}
      <p className="aiden-paleta-previa-titulo">{item.texto}</p>
      {item.detalle && <p className="mt-1 text-sm text-slate-600">{item.detalle}</p>}
      {item.atajo && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          Atajo {item.atajo.split(" ").map((tecla) => <Tecla key={tecla}>{tecla}</Tecla>)}
        </p>
      )}
    </div>
  );
}

export default function PaletaComandos({ abierta, onCerrar, textoInicial = "", onAtajos }) {
  const navigate = useNavigate();
  const datos = useDatos();
  const sesion = useSesion();
  const oscuro = useTema();
  const { abrirLote } = useFichaLote();
  const { abrirAccion, accionesDisponibles } = useAcciones();
  const rol = sesion?.role || "operario";
  const gestor = esGestor(sesion);
  const [busqueda, setBusqueda] = useState(textoInicial);
  const [activo, setActivo] = useState(0);
  const [recientes, setRecientes] = useState(() => leerRecientes(sesion));
  const entrada = useRef(null);
  const listaRef = useRef(null);
  const idBase = useId();

  // Al abrir: foco en la búsqueda, texto que se haya traído y recientes al día.
  useEffect(() => {
    if (!abierta) return undefined;
    setBusqueda(textoInicial);
    setActivo(0);
    setRecientes(leerRecientes(sesion));
    const previo = document.activeElement;
    const cuadro = requestAnimationFrame(() => entrada.current?.focus());
    return () => {
      cancelAnimationFrame(cuadro);
      if (previo && typeof previo.focus === "function" && document.contains(previo) && !document.querySelector('[aria-modal="true"]')) previo.focus({ preventScroll: true });
    };
  }, [abierta, textoInicial, sesion]);

  const inicio = getDashboardPath(rol);

  const indice = useMemo(() => {
    const registros = [];
    for (const lote of lotesVisibles(datos, sesion)) {
      registros.push({ clave: `lote:${lote.id}`, tipo: "Lote", registro: lote, texto: `${lote.lote} · ${lote.cultivo}`, detalle: `${lote.estado === "Cerrado" ? "Cerrado" : lote.etapa} · ${lote.ubicacion} · ${numero(lote.cantidad)} plantas`, buscar: `${lote.lote} ${lote.cultivo} ${lote.ubicacion} ${lote.etapa}`, abrir: () => abrirLote(lote.lote), secundaria: { texto: "Ver trazabilidad", ir: `/trazabilidad?lote=${encodeURIComponent(lote.lote)}` } });
    }
    for (const i of incidenciasVisibles(datos, sesion)) {
      registros.push({ clave: `cal:${i.id}`, tipo: "Calidad", registro: i, texto: `${i.codigo} · ${i.descripcion}`, detalle: `${estadoIncidencia(i)} · ${i.lote}`, buscar: `${i.codigo} ${i.descripcion} ${i.lote}`, ir: `/calidad?incidencia=${i.id}`, secundaria: i.lote ? { texto: "Abrir el lote", abrir: () => abrirLote(i.lote) } : null });
    }
    for (const t of tareasVisibles(datos, sesion)) {
      registros.push({ clave: `tarea:${t.id}`, tipo: "Tarea", registro: t, texto: t.titulo, detalle: `${t.estado} · ${nombrePersona(datos.personas, t.responsableId)}`, buscar: `${t.titulo} ${t.lote} ${nombrePersona(datos.personas, t.responsableId)}`, ir: gestor ? `/personal?vista=tareas&tarea=${t.id}` : "/dashboard-operario", secundaria: t.lote ? { texto: "Abrir el lote", abrir: () => abrirLote(t.lote) } : null });
    }
    if (gestor) {
      for (const insumo of datos.inventario) {
        registros.push({ clave: `ins:${insumo.id}`, tipo: "Inventario", registro: insumo, texto: insumo.nombre, detalle: `${numero(insumo.stock)} ${insumo.unidad} · mínimo ${numero(insumo.minimo)}`, buscar: `${insumo.nombre} ${insumo.categoria} ${insumo.id}`, ir: `/inventario?insumo=${insumo.id}`, secundaria: { texto: "Registrar entrada", ir: `/inventario?insumo=${insumo.id}&accion=entrada` } });
      }
      for (const persona of datos.personas) {
        registros.push({ clave: `per:${persona.id}`, tipo: "Personal", registro: persona, texto: persona.nombre, detalle: `${persona.cargo} · ${persona.departamento}`, buscar: `${persona.nombre} ${persona.cargo}`, ir: `/personal?persona=${persona.id}` });
      }
      for (const c of datos.costos.slice(0, 200)) {
        registros.push({ clave: `cos:${c.id}`, tipo: "Costos", registro: c, texto: c.concepto, detalle: `${c.lote || "General"} · ${dinero(c.valor)}`, buscar: `${c.concepto} ${c.lote}`, ir: "/costos" });
      }
    }
    return registros;
  }, [datos, sesion, gestor, abrirLote]);

  const grupos = useMemo(() => {
    const valor = busqueda.trim();
    const modulos = modulosDeRol(rol).map((m) => ({ clave: `mod:${m.ruta}`, tipo: "Módulo", texto: m.nombre, detalle: m.detalle, icono: m.icono, atajo: `G ${m.atajo}`, ir: rutaDeModulo(m, inicio), buscar: `${m.nombre} ${m.detalle}` }));
    const acciones = accionesDisponibles.map((a) => ({ clave: `acc:${a.id}`, tipo: "Acción", texto: a.nombre, detalle: a.detalle, icono: a.icono, atajo: `N ${a.atajo}`, accion: () => abrirAccion(a.id), buscar: `${a.nombre} ${a.detalle}` }));
    const ajustes = [
      { clave: "aj:tema", tipo: "Ajuste", texto: oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro", detalle: "El tema se guarda en este dispositivo", icono: oscuro ? Sun : Moon, atajo: "⇧ D", accion: () => alternarTema(), buscar: "tema modo oscuro claro noche día apariencia" },
      { clave: "aj:perfil", tipo: "Ajuste", texto: "Mi perfil", detalle: "Tus datos y tu contraseña", icono: UserCircle2, ir: "/perfil", buscar: "perfil cuenta contraseña datos" },
      { clave: "aj:atajos", tipo: "Ajuste", texto: "Atajos de teclado", detalle: "Todo lo que se hace sin el ratón", icono: Keyboard, atajo: "?", accion: () => onAtajos?.(), buscar: "atajos teclado ayuda comandos" },
      { clave: "aj:salir", tipo: "Ajuste", texto: "Cerrar sesión", detalle: sesion?.email || "", icono: LogOut, accion: () => { navigate("/login", { replace: true, state: null }); logout(); }, buscar: "cerrar sesión salir" },
    ];
    if (!valor) {
      const porClave = new Map(indice.map((r) => [r.clave, r]));
      const vistos = recientes.map((clave) => porClave.get(clave)).filter(Boolean);
      return [
        { id: "recientes", nombre: "Abiertos hace poco", items: vistos },
        { id: "acciones", nombre: "Acciones", items: acciones },
        { id: "modulos", nombre: "Ir a", items: modulos },
        { id: "ajustes", nombre: "Ajustes", items: ajustes },
      ].filter((g) => g.items.length);
    }
    const filtrar = (lista) => lista.filter((item) => coincide(item.buscar, valor));
    return [
      { id: "modulos", nombre: "Ir a", items: filtrar(modulos).slice(0, 6) },
      { id: "acciones", nombre: "Acciones", items: filtrar(acciones) },
      { id: "registros", nombre: "Registros", items: filtrar(indice).slice(0, 8) },
      { id: "ajustes", nombre: "Ajustes", items: filtrar(ajustes) },
    ].filter((g) => g.items.length);
  }, [busqueda, rol, inicio, accionesDisponibles, abrirAccion, oscuro, onAtajos, sesion, navigate, indice, recientes]);

  const planos = useMemo(() => grupos.flatMap((g) => g.items), [grupos]);
  const actual = planos[Math.min(activo, planos.length - 1)];

  // Mantiene visible la opción activa al moverse con las flechas.
  useEffect(() => {
    if (!abierta) return;
    listaRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activo, abierta]);

  if (!abierta) return null;

  const ejecutar = (item, secundaria = false) => {
    if (!item) return;
    onCerrar();
    if (item.tipo !== "Módulo" && item.tipo !== "Acción" && item.tipo !== "Ajuste") {
      guardarReciente(sesion, item.clave);
    }
    const objetivo = secundaria && item.secundaria ? item.secundaria : item;
    if (objetivo.accion) objetivo.accion();
    else if (objetivo.abrir) objetivo.abrir();
    else if (objetivo.ir) navigate(objetivo.ir);
  };

  const alTeclear = (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActivo((i) => (planos.length ? (i + 1) % planos.length : 0));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActivo((i) => (planos.length ? (i - 1 + planos.length) % planos.length : 0));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      ejecutar(actual, evento.metaKey || evento.ctrlKey);
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      onCerrar();
    } else if (evento.key === "Tab") {
      evento.preventDefault();
    }
  };

  let posicion = -1;
  const idOpcion = (i) => `${idBase}-opcion-${i}`;

  return createPortal(
    <div className="aiden-paleta-fondo" onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}>
      <section role="dialog" aria-modal="true" aria-label="Paleta de comandos" className="aiden-paleta">
        <header className="aiden-paleta-busqueda">
          <Search size={18} aria-hidden="true" />
          <input
            ref={entrada}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${idBase}-lista`}
            aria-activedescendant={actual ? idOpcion(planos.indexOf(actual)) : undefined}
            aria-autocomplete="list"
            aria-label="Busca un módulo, un registro o una acción"
            placeholder="Busca un lote, un insumo, una persona o escribe una acción…"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setActivo(0);
            }}
            onKeyDown={alTeclear}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" className="aiden-tecla aiden-paleta-cerrar" onClick={onCerrar}>
            esc
          </button>
        </header>
        <div className="aiden-paleta-cuerpo">
          <div ref={listaRef} id={`${idBase}-lista`} role="listbox" aria-label="Resultados" className="aiden-paleta-lista">
            {grupos.map((grupo) => (
              <div key={grupo.id} role="group" aria-labelledby={`${idBase}-${grupo.id}`} className="aiden-paleta-grupo">
                <p id={`${idBase}-${grupo.id}`} className="aiden-paleta-grupo-nombre">
                  {grupo.nombre}
                </p>
                {grupo.items.map((item) => {
                  posicion += 1;
                  const indiceItem = posicion;
                  const seleccionada = actual === item;
                  const Icono = item.icono || ICONO_TIPO[item.tipo] || ArrowRight;
                  return (
                    <div
                      key={item.clave}
                      id={idOpcion(indiceItem)}
                      role="option"
                      aria-selected={seleccionada}
                      className="aiden-paleta-opcion"
                      onMouseMove={() => activo !== indiceItem && setActivo(indiceItem)}
                      onClick={(evento) => ejecutar(item, evento.metaKey || evento.ctrlKey)}
                    >
                      <span className="aiden-paleta-opcion-icono">
                        <Icono size={16} aria-hidden="true" />
                      </span>
                      <span className="aiden-paleta-opcion-texto">
                        <span className="aiden-paleta-opcion-titulo">{item.texto}</span>
                        {item.detalle && <span className="aiden-paleta-opcion-detalle">{item.detalle}</span>}
                      </span>
                      <span className="aiden-paleta-opcion-final">
                        {item.atajo ? (
                          item.atajo.split(" ").map((tecla) => <Tecla key={tecla}>{tecla}</Tecla>)
                        ) : (
                          <span className="aiden-paleta-opcion-tipo">{item.tipo}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            {!planos.length && (
              <div className="aiden-paleta-vacia" aria-live="polite">
                <p>Nada coincide con «{busqueda.trim()}».</p>
                <span>Prueba con el código de un lote (LT-2026-011), un cultivo, un insumo o el nombre de una persona.</span>
              </div>
            )}
          </div>
          <aside className="aiden-paleta-previa" aria-label="Vista previa">
            <VistaPrevia item={actual} datos={datos} />
          </aside>
        </div>
        <footer className="aiden-paleta-pie">
          <span>
            <Tecla>↑</Tecla>
            <Tecla>↓</Tecla> Moverse
          </span>
          <span>
            <Tecla>
              <CornerDownLeft size={11} aria-hidden="true" />
            </Tecla>{" "}
            {actual?.tipo === "Acción" || actual?.tipo === "Ajuste" ? "Ejecutar" : "Abrir"}
          </span>
          {actual?.secundaria && (
            <span>
              <Tecla>⌘</Tecla>
              <Tecla>
                <CornerDownLeft size={11} aria-hidden="true" />
              </Tecla>{" "}
              {actual.secundaria.texto}
            </span>
          )}
          <span className="aiden-paleta-pie-fin">
            <Tecla>?</Tecla> Atajos
          </span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

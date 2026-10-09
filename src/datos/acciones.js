import { crearId, guardar, importarRespaldo, inicializarDatos, obtener } from "./almacen";
import { CARGO_A_ROL, ETAPAS, EVENTOS_MANUALES, PRIORIDADES, ROLES, indiceEtapa } from "./catalogos";
import { estadoIncidencia, siguienteCodigo } from "./selectores";
import { actualizarUsuario, asignarContrasena, cambiarContrasena, listarUsuarios, register } from "../utilidades/autenticacion";
import { ahoraLocal, aFecha, dinero, hoyISO, numero, cantidadConUnidad } from "../utilidades/formato";

/*
  Reglas de negocio de AiDEN. Cada función valida su entrada, lanza un Error con
  un mensaje que se puede mostrar tal cual al usuario y registra en trazabilidad
  lo que le pasa a cada lote. La interfaz no escribe en el almacén directamente.
*/

function fallo(mensaje) {
  throw new Error(mensaje);
}

function texto(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function entero(valor, campo, minimo = 0) {
  const n = Number(valor);
  if (!Number.isFinite(n) || !Number.isInteger(n)) fallo(`${campo} debe ser un número entero.`);
  if (n < minimo) fallo(`${campo} debe ser mayor o igual a ${minimo}.`);
  return n;
}

function decimal(valor, campo, minimo, maximo) {
  if (valor === "" || valor === null || valor === undefined) fallo(`Escribe ${campo.toLowerCase()}.`);
  const n = Number(valor);
  if (!Number.isFinite(n)) fallo(`${campo} debe ser un número.`);
  if (minimo !== undefined && n < minimo) fallo(`${campo} no puede ser menor que ${minimo}.`);
  if (maximo !== undefined && n > maximo) fallo(`${campo} no puede ser mayor que ${maximo}.`);
  return n;
}

function fechaValida(valor, campo) {
  if (!valor || Number.isNaN(aFecha(valor).getTime())) fallo(`Elige ${campo}.`);
  return valor;
}

// Lo que ya ocurrió (siembra, gasto, movimiento) no puede tener fecha futura: deja la
// historia del lote en desorden y la ficha mostraría días negativos.
function fechaPasada(valor, campo) {
  fechaValida(valor, campo);
  if (String(valor).slice(0, 10) > hoyISO()) fallo(`${campo[0].toUpperCase()}${campo.slice(1)} no puede ser posterior a hoy.`);
  return valor;
}

function exigirActivo(sesion) {
  if (!sesion?.id) fallo("No hay una sesión activa.");
  if (sesion.personaId && persona(sesion.personaId)?.estado === "Inactivo") {
    fallo("Tu ficha está inactiva. Pide a administración que la reactive.");
  }
}

function exigirGestor(sesion) {
  if (sesion?.role !== "admin" && sesion?.role !== "supervisor") {
    fallo("Esta acción la realiza supervisión o administración.");
  }
  exigirActivo(sesion);
}

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function persona(id) {
  return obtener("personas").find((p) => p.id === id);
}

function nombreDe(id) {
  return persona(id)?.nombre || "Sin asignar";
}

function responsableActivo(id) {
  const p = persona(id);
  if (!p) fallo("Elige un responsable.");
  if (p.estado === "Inactivo") fallo(`${p.nombre} está inactivo. Elige otra persona.`);
  return p;
}

function buscarLote(codigo) {
  const lote = obtener("lotes").find((item) => item.lote === codigo);
  if (!lote) fallo(`El lote ${codigo} no existe.`);
  return lote;
}

function exigirLoteActivo(lote) {
  if (lote.estado === "Cerrado") fallo(`El lote ${lote.lote} está cerrado.`);
  return lote;
}

function loteDeOperario(codigo, sesion) {
  exigirActivo(sesion);
  const lote = buscarLote(codigo);
  if (sesion?.role === "operario" && lote.responsableId !== sesion.personaId) {
    fallo(`El lote ${codigo} no está asignado a ti.`);
  }
  return lote;
}

function evento({ lote, tipo, detalle, sesion, origen, fecha = ahoraLocal() }) {
  return {
    id: crearId("TRZ"),
    lote,
    evento: tipo,
    fecha,
    responsableId: sesion?.personaId || null,
    responsable: sesion?.name || "Sistema",
    detalle,
    origen,
  };
}

function conEventos(cambios, eventos) {
  const lista = eventos.filter(Boolean);
  if (!lista.length) return cambios;
  return { ...cambios, trazabilidad: [...lista, ...obtener("trazabilidad")] };
}

/* ---------- Producción ---------- */

export function sugerirCodigoLote() {
  const anio = new Date().getFullYear();
  return siguienteCodigo("LT", obtener("lotes").map((l) => l.lote), anio);
}

export function crearLote(formulario, sesion) {
  exigirGestor(sesion);
  const codigo = texto(formulario.lote).toUpperCase();
  if (!/^LT-\d{4}-\d{3,}$/.test(codigo)) fallo("El código debe tener la forma LT-2026-018.");
  if (obtener("lotes").some((l) => l.lote === codigo)) fallo(`Ya existe un lote con el código ${codigo}.`);
  const cultivo = texto(formulario.cultivo);
  if (cultivo.length < 3) fallo("Escribe el cultivo o la variedad.");
  const cantidad = entero(formulario.cantidad, "La cantidad de plantas", 1);
  const responsable = responsableActivo(formulario.responsableId);
  if (!obtener("zonas").some((z) => z.nombre === formulario.ubicacion)) fallo("Elige la zona donde estará el lote.");
  const fecha = fechaPasada(formulario.fecha, "la fecha de siembra");
  if (formulario.fechaEstimada && formulario.fechaEstimada < fecha) fallo("La salida estimada no puede ser anterior a la siembra.");
  const etapa = ETAPAS.includes(formulario.etapa) ? formulario.etapa : ETAPAS[0];

  const nuevo = {
    id: codigo,
    lote: codigo,
    cultivo,
    ubicacion: formulario.ubicacion,
    cantidadInicial: cantidad,
    cantidad,
    etapa,
    responsableId: responsable.id,
    fecha,
    fechaEstimada: formulario.fechaEstimada || "",
    estado: "Activo",
    notas: texto(formulario.notas),
  };

  guardar(
    conEventos({ lotes: [nuevo, ...obtener("lotes")] }, [
      evento({
        lote: codigo,
        tipo: "Registro de lote",
        detalle: `Lote creado: ${numero(cantidad)} plantas de ${cultivo} en ${nuevo.ubicacion}, a cargo de ${responsable.nombre}.`,
        sesion,
        origen: "Producción",
        fecha: `${fecha}T${ahoraLocal().slice(11)}`,
      }),
    ]),
  );
  return nuevo;
}

export function editarLote(codigo, cambios, sesion) {
  exigirGestor(sesion);
  const actual = exigirLoteActivo(buscarLote(codigo));
  const siguiente = { ...actual };
  const eventos = [];

  if (cambios.cultivo !== undefined) {
    const cultivo = texto(cambios.cultivo);
    if (cultivo.length < 3) fallo("Escribe el cultivo o la variedad.");
    siguiente.cultivo = cultivo;
  }
  if (cambios.cantidad !== undefined) {
    const cantidad = entero(cambios.cantidad, "Las plantas vivas", 0);
    if (cantidad > Number(actual.cantidadInicial)) {
      fallo(`Las plantas vivas no pueden superar las ${numero(actual.cantidadInicial)} sembradas.`);
    }
    if (cantidad !== Number(actual.cantidad)) {
      const diferencia = Number(actual.cantidad) - cantidad;
      eventos.push(
        evento({
          lote: codigo,
          tipo: "Observación",
          detalle:
            diferencia > 0
              ? `Se registran ${numero(diferencia)} plantas perdidas. Quedan ${numero(cantidad)} vivas.`
              : `Conteo corregido: ${numero(cantidad)} plantas vivas.`,
          sesion,
          origen: "Producción",
        }),
      );
    }
    siguiente.cantidad = cantidad;
  }
  if (cambios.responsableId !== undefined && cambios.responsableId !== actual.responsableId) {
    const responsable = responsableActivo(cambios.responsableId);
    siguiente.responsableId = responsable.id;
    eventos.push(
      evento({ lote: codigo, tipo: "Observación", detalle: `Responsable cambia de ${nombreDe(actual.responsableId)} a ${responsable.nombre}.`, sesion, origen: "Producción" }),
    );
  }
  if (cambios.ubicacion !== undefined && cambios.ubicacion !== actual.ubicacion) {
    if (!obtener("zonas").some((z) => z.nombre === cambios.ubicacion)) fallo("Elige una zona válida.");
    siguiente.ubicacion = cambios.ubicacion;
    eventos.push(evento({ lote: codigo, tipo: "Traslado", detalle: `Traslado de ${actual.ubicacion} a ${cambios.ubicacion}.`, sesion, origen: "Producción" }));
  }
  if (cambios.fechaEstimada !== undefined) {
    if (cambios.fechaEstimada && cambios.fechaEstimada < actual.fecha) fallo("La salida estimada no puede ser anterior a la siembra.");
    siguiente.fechaEstimada = cambios.fechaEstimada;
  }
  if (cambios.notas !== undefined) siguiente.notas = texto(cambios.notas);

  guardar(conEventos({ lotes: obtener("lotes").map((l) => (l.lote === codigo ? siguiente : l)) }, eventos));
  return siguiente;
}

export function avanzarEtapa(codigo, sesion) {
  exigirGestor(sesion);
  const lote = buscarLote(codigo);
  if (lote.estado === "Cerrado") fallo("El lote está cerrado.");
  const indice = indiceEtapa(lote.etapa);
  if (indice >= ETAPAS.length - 1) fallo("El lote ya está en Cosecha. Ciérralo cuando se despache.");
  const etapa = ETAPAS[indice + 1];
  guardar(
    conEventos({ lotes: obtener("lotes").map((l) => (l.lote === codigo ? { ...l, etapa } : l)) }, [
      evento({
        lote: codigo,
        tipo: "Cambio de etapa",
        detalle: `Pasa de ${lote.etapa} a ${etapa}. ${numero(lote.cantidad)} plantas vivas de ${numero(lote.cantidadInicial)}.`,
        sesion,
        origen: "Producción",
      }),
    ]),
  );
  return etapa;
}

/*
  Un lote se despacha desde Cosecha y se descarta desde cualquier etapa. No se
  cierra con tareas abiertas (quedarían como alertas sin salida); al descartarlo,
  sus incidencias abiertas se cierran con el descarte como acción documentada.
*/
export function cerrarLote(codigo, { motivo, detalle }, sesion) {
  exigirGestor(sesion);
  const lote = buscarLote(codigo);
  if (lote.estado === "Cerrado") fallo("El lote ya está cerrado.");
  if (!["Despachado", "Descartado"].includes(motivo)) fallo("Elige si el lote se despachó o se descartó.");
  if (motivo === "Despachado" && lote.etapa !== ETAPAS[ETAPAS.length - 1]) {
    fallo(`Solo se despachan lotes en ${ETAPAS[ETAPAS.length - 1]}. Si el lote se perdió, descártalo.`);
  }
  const tareasAbiertas = obtener("tareas").filter((t) => t.lote === codigo && t.estado !== "Completada");
  if (tareasAbiertas.length) {
    fallo(`Antes de cerrar ${codigo}, completa o elimina ${plural(tareasAbiertas.length, "tarea abierta", "tareas abiertas")}: ${tareasAbiertas.map((t) => t.titulo).join(", ")}.`);
  }
  const incidenciasAbiertas = obtener("calidad").filter((i) => i.lote === codigo && estadoIncidencia(i) !== "Cerrada");
  if (motivo === "Despachado" && incidenciasAbiertas.length) {
    fallo(`${codigo} tiene ${plural(incidenciasAbiertas.length, "incidencia abierta", "incidencias abiertas")} (${incidenciasAbiertas.map((i) => i.codigo).join(", ")}). Ciérralas antes de despachar.`);
  }
  const nota = texto(detalle);
  const cambios = {
    lotes: obtener("lotes").map((l) => (l.lote === codigo ? { ...l, estado: "Cerrado", cierre: hoyISO(), motivoCierre: motivo, detalleCierre: nota } : l)),
  };
  const eventos = [
    evento({
      lote: codigo,
      tipo: motivo === "Despachado" ? "Despacho" : "Observación",
      detalle: `Lote cerrado (${motivo.toLowerCase()}) con ${numero(lote.cantidad)} plantas.${nota ? ` ${nota}` : ""}`,
      sesion,
      origen: "Producción",
    }),
  ];
  if (incidenciasAbiertas.length) {
    // Se conserva la acción que ya estaba documentada y se deja constancia del descarte.
    const cierre = `Cerrada por descarte del lote${nota ? `: ${nota}` : "."}`;
    const accionDe = (i) => (i.accion ? `${i.accion} ${cierre}` : cierre);
    const ids = new Set(incidenciasAbiertas.map((i) => i.id));
    cambios.calidad = obtener("calidad").map((i) => (ids.has(i.id) ? { ...i, estado: "Cerrada", accion: accionDe(i), cierre: hoyISO() } : i));
    for (const incidencia of incidenciasAbiertas) {
      eventos.push(evento({ lote: codigo, tipo: "Cierre de incidencia", detalle: `${incidencia.codigo} cerrada: ${accionDe(incidencia)}`, sesion, origen: "Calidad" }));
    }
  }
  guardar(conEventos(cambios, eventos));
}

/* ---------- Tareas ---------- */

function validarTarea(formulario, actual) {
  const titulo = texto(formulario.titulo);
  if (titulo.length < 3) fallo("Escribe qué hay que hacer.");
  const responsable =
    actual && formulario.responsableId === actual.responsableId ? persona(actual.responsableId) || responsableActivo(formulario.responsableId) : responsableActivo(formulario.responsableId);
  if (!PRIORIDADES.includes(formulario.prioridad)) fallo("Elige la prioridad.");
  const fecha = fechaValida(formulario.fecha, "la fecha límite");
  if (formulario.lote && formulario.lote !== actual?.lote) exigirLoteActivo(buscarLote(formulario.lote));
  return {
    titulo,
    responsableId: responsable.id,
    prioridad: formulario.prioridad,
    fecha,
    modulo: formulario.modulo || "Producción",
    lote: formulario.lote || "",
    descripcion: texto(formulario.descripcion),
  };
}

export function crearTarea(formulario, sesion) {
  exigirGestor(sesion);
  const nueva = { id: crearId("TSK"), ...validarTarea(formulario), estado: "Pendiente", creada: hoyISO(), creadaPor: sesion.personaId };
  guardar({ tareas: [nueva, ...obtener("tareas")] });
  return nueva;
}

export function editarTarea(id, formulario, sesion) {
  exigirGestor(sesion);
  const actual = obtener("tareas").find((t) => t.id === id);
  if (!actual) fallo("La tarea ya no existe.");
  const siguiente = { ...actual, ...validarTarea({ ...actual, ...formulario }, actual) };
  guardar({ tareas: obtener("tareas").map((t) => (t.id === id ? siguiente : t)) });
  return siguiente;
}

export function cambiarEstadoTarea(id, estado, sesion, nota = "") {
  const tarea = obtener("tareas").find((t) => t.id === id);
  if (!tarea) fallo("La tarea ya no existe.");
  if (!["Pendiente", "En curso", "Completada"].includes(estado)) fallo("Estado de tarea no válido.");
  exigirActivo(sesion);
  if (sesion?.role === "operario" && tarea.responsableId !== sesion.personaId) fallo("Solo puedes actualizar tus propias tareas.");
  const notaLimpia = texto(nota);
  const siguiente = {
    ...tarea,
    estado,
    completada: estado === "Completada" ? ahoraLocal() : undefined,
    nota: estado === "Completada" ? notaLimpia || tarea.nota || "" : tarea.nota,
  };
  const eventos = [];
  if (estado === "Completada" && tarea.estado !== "Completada" && tarea.lote) {
    eventos.push(
      evento({
        lote: tarea.lote,
        tipo: "Tarea completada",
        detalle: `${tarea.titulo}${notaLimpia ? `: ${notaLimpia}` : "."}`,
        sesion,
        origen: "Personal",
      }),
    );
  }
  if (tarea.estado === "Completada" && estado !== "Completada" && tarea.lote) {
    eventos.push(evento({ lote: tarea.lote, tipo: "Observación", detalle: `Se reabre la tarea «${tarea.titulo}».`, sesion, origen: "Personal" }));
  }
  guardar(conEventos({ tareas: obtener("tareas").map((t) => (t.id === id ? siguiente : t)) }, eventos));
  return siguiente;
}

export function eliminarTarea(id, sesion) {
  exigirGestor(sesion);
  guardar({ tareas: obtener("tareas").filter((t) => t.id !== id) });
}

/* ---------- Personal y accesos ---------- */

function validarPersona(formulario, idActual) {
  const nombre = texto(formulario.nombre);
  if (nombre.length < 3) fallo("Escribe nombre y apellido.");
  if (obtener("personas").some((p) => p.id !== idActual && p.nombre.toLowerCase() === nombre.toLowerCase())) {
    fallo(`Ya existe una persona llamada ${nombre}.`);
  }
  if (!CARGO_A_ROL[formulario.cargo]) fallo("Elige el cargo.");
  const contacto = texto(formulario.contacto);
  if (contacto && !/^[\d\s+()-]{7,}$/.test(contacto)) fallo("El contacto debe ser un teléfono, por ejemplo 310 555 0101.");
  return { nombre, cargo: formulario.cargo, departamento: formulario.departamento || "Producción", contacto };
}

export function crearPersona(formulario, sesion) {
  exigirGestor(sesion);
  const nueva = { id: crearId("PER"), ...validarPersona(formulario), estado: "Activo" };
  guardar({ personas: [...obtener("personas"), nueva] });
  return nueva;
}

function cuentaDePersona(id) {
  return listarUsuarios().find((u) => u.personaId === id);
}

export function editarPersona(id, formulario, sesion) {
  exigirGestor(sesion);
  const actual = persona(id);
  if (!actual) fallo("La persona ya no existe.");
  const cuenta = cuentaDePersona(id);
  if (cuenta?.role === "admin" && sesion.role !== "admin") fallo("Solo administración puede editar la ficha de una persona administradora.");
  const siguiente = { ...actual, ...validarPersona({ ...actual, ...formulario }, id) };
  // Con cuenta de acceso, el cargo es el rol: cambiarlo es cambiar sus permisos.
  if (cuenta && CARGO_A_ROL[siguiente.cargo] !== cuenta.role) {
    if (sesion.role !== "admin") fallo("El cargo de una persona con cuenta lo cambia administración, porque cambia sus permisos.");
    cambiarRolUsuario(cuenta.id, CARGO_A_ROL[siguiente.cargo], sesion);
  }
  guardar({ personas: obtener("personas").map((p) => (p.id === id ? siguiente : p)) });
  if (cuenta && cuenta.name !== siguiente.nombre) actualizarUsuario(cuenta.id, { name: siguiente.nombre });
  return siguiente;
}

export function cambiarEstadoPersona(id, estado, sesion) {
  exigirGestor(sesion);
  const actual = persona(id);
  if (!actual) fallo("La persona ya no existe.");
  if (id === sesion.personaId) fallo("No puedes desactivar tu propio perfil.");
  if (!["Activo", "Inactivo"].includes(estado)) fallo("Estado no válido.");
  if (cuentaDePersona(id)?.role === "admin" && sesion.role !== "admin") fallo("Solo administración puede cambiar el estado de una persona administradora.");
  if (estado === "Inactivo") {
    const tareas = obtener("tareas").filter((t) => t.responsableId === id && t.estado !== "Completada").length;
    const lotes = obtener("lotes").filter((l) => l.responsableId === id && l.estado !== "Cerrado").length;
    const incidencias = obtener("calidad").filter((i) => i.responsableId === id && estadoIncidencia(i) !== "Cerrada").length;
    if (tareas || lotes || incidencias) {
      const partes = [
        tareas && plural(tareas, "tarea abierta", "tareas abiertas"),
        lotes && plural(lotes, "lote activo", "lotes activos"),
        incidencias && plural(incidencias, "incidencia abierta", "incidencias abiertas"),
      ].filter(Boolean);
      fallo(`Antes de desactivar a ${actual.nombre}, reasigna ${partes.join(", ").replace(/, ([^,]*)$/, " y $1")}.`);
    }
  }
  guardar({ personas: obtener("personas").map((p) => (p.id === id ? { ...p, estado } : p)) });
}

export function pendientesDePersona(id) {
  return {
    tareas: obtener("tareas").filter((t) => t.responsableId === id && t.estado !== "Completada"),
    lotes: obtener("lotes").filter((l) => l.responsableId === id && l.estado !== "Cerrado"),
    incidencias: obtener("calidad").filter((i) => i.responsableId === id && estadoIncidencia(i) !== "Cerrada"),
  };
}

// Pasa todo el trabajo abierto de una persona a otra y la desactiva en una sola operación.
export function reasignarYDesactivar(id, destinoId, sesion) {
  exigirGestor(sesion);
  const actual = persona(id);
  if (!actual) fallo("La persona ya no existe.");
  if (id === sesion.personaId) fallo("No puedes desactivar tu propio perfil.");
  if (cuentaDePersona(id)?.role === "admin" && sesion.role !== "admin") fallo("Solo administración puede cambiar el estado de una persona administradora.");
  if (destinoId === id) fallo("Elige a otra persona para recibir el trabajo.");
  const destino = responsableActivo(destinoId);
  const { tareas, lotes, incidencias } = pendientesDePersona(id);
  const idsTareas = new Set(tareas.map((t) => t.id));
  const idsLotes = new Set(lotes.map((l) => l.lote));
  const idsIncidencias = new Set(incidencias.map((i) => i.id));
  const eventos = lotes.map((l) =>
    evento({ lote: l.lote, tipo: "Observación", detalle: `Responsable cambia de ${actual.nombre} a ${destino.nombre} al desactivar a ${actual.nombre}.`, sesion, origen: "Personal" }),
  );
  guardar(
    conEventos(
      {
        tareas: obtener("tareas").map((t) => (idsTareas.has(t.id) ? { ...t, responsableId: destino.id } : t)),
        lotes: obtener("lotes").map((l) => (idsLotes.has(l.lote) ? { ...l, responsableId: destino.id } : l)),
        calidad: obtener("calidad").map((i) => (idsIncidencias.has(i.id) ? { ...i, responsableId: destino.id } : i)),
        personas: obtener("personas").map((p) => (p.id === id ? { ...p, estado: "Inactivo" } : p)),
      },
      eventos,
    ),
  );
  return { tareas: tareas.length, lotes: lotes.length, incidencias: incidencias.length, destino };
}

export function cambiarRolUsuario(usuarioId, rol, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede cambiar accesos.");
  if (usuarioId === sesion.id) fallo("No puedes cambiar tu propio rol.");
  if (!ROLES[rol]) fallo("Elige un rol válido.");
  const usuario = actualizarUsuario(usuarioId, { role: rol, revisado: true });
  if (usuario.personaId) {
    const cargo = ROLES[rol];
    guardar({ personas: obtener("personas").map((p) => (p.id === usuario.personaId ? { ...p, cargo } : p)) });
  }
  return usuario;
}

export function marcarCuentaRevisada(usuarioId, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede revisar cuentas.");
  return actualizarUsuario(usuarioId, { revisado: true });
}

/*
  Cada cuenta tiene su ficha en Personal. Una cuenta nueva NUNCA se une a una ficha
  existente por coincidir el nombre (alguien podría registrarse como otra persona y
  heredar sus lotes y tareas); solo administración puede pedirlo al crear la cuenta,
  y solo con una ficha que no tenga ya otra cuenta.
*/
export function asegurarPersonasDeUsuarios({ vincularPorNombre = [] } = {}) {
  const personas = obtener("personas");
  const nuevas = [];
  const usuarios = listarUsuarios();
  const conCuenta = new Set(usuarios.map((u) => u.personaId).filter(Boolean));
  for (const usuario of usuarios) {
    if (usuario.personaId && personas.some((p) => p.id === usuario.personaId)) continue;
    const existente = vincularPorNombre.includes(usuario.id)
      ? personas.find((p) => !conCuenta.has(p.id) && p.nombre.toLowerCase() === usuario.name.toLowerCase())
      : null;
    if (existente) {
      conCuenta.add(existente.id);
      actualizarUsuario(usuario.id, { personaId: existente.id });
      continue;
    }
    const nueva = {
      id: crearId("PER"),
      nombre: usuario.name,
      cargo: ROLES[usuario.role] || "Operario",
      departamento: "Producción",
      contacto: "",
      estado: "Activo",
    };
    nuevas.push(nueva);
    actualizarUsuario(usuario.id, { personaId: nueva.id });
  }
  if (nuevas.length) guardar({ personas: [...personas, ...nuevas] });
}

export function registrarCuenta(formulario) {
  const resultado = register(formulario);
  if (!resultado.ok) return resultado;
  asegurarPersonasDeUsuarios();
  return resultado;
}

export function actualizarMiPerfil(formulario, sesion) {
  if (!sesion?.id) fallo("No hay una sesión activa.");
  const nombre = texto(formulario.nombre);
  const email = texto(formulario.email).toLowerCase();
  if (nombre.length < 3) fallo("Escribe nombre y apellido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fallo("Escribe un correo válido.");
  if (listarUsuarios().some((u) => u.id !== sesion.id && u.email.toLowerCase() === email)) {
    fallo("Ya existe una cuenta con ese correo.");
  }

  const usuario = actualizarUsuario(sesion.id, { name: nombre, email });
  if (usuario.personaId) {
    const actual = persona(usuario.personaId);
    if (actual && actual.nombre !== nombre) {
      guardar({ personas: obtener("personas").map((p) => (p.id === usuario.personaId ? { ...p, nombre } : p)) });
    }
  }
  return usuario;
}

export function cambiarMiContrasena({ actual, nueva, confirmacion }, sesion) {
  if (!sesion?.id) fallo("No hay una sesión activa.");
  if (!actual) fallo("Escribe tu contraseña actual.");
  if (nueva !== confirmacion) fallo("La confirmación no coincide con la contraseña nueva.");
  const resultado = cambiarContrasena(sesion.id, actual, nueva);
  if (!resultado.ok) fallo(resultado.message);
  return resultado;
}

export function restablecerContrasenaUsuario(usuarioId, { nueva, confirmacion }, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede restablecer contraseñas.");
  if (usuarioId === sesion.id) fallo("Cambia tu propia contraseña desde Mi perfil.");
  if (nueva !== confirmacion) fallo("La confirmación no coincide con la contraseña nueva.");
  const resultado = asignarContrasena(usuarioId, nueva);
  if (!resultado.ok) fallo(resultado.message);
  return resultado;
}

export function crearCuentaAdministrativa(formulario, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede crear cuentas.");
  if (!ROLES[formulario.role]) fallo("Elige un rol válido.");
  const resultado = register(formulario);
  if (!resultado.ok) fallo(resultado.message);
  asegurarPersonasDeUsuarios({ vincularPorNombre: [resultado.user.id] });
  const usuario = listarUsuarios().find((u) => u.id === resultado.user.id);
  if (!usuario) fallo("La cuenta se creó, pero no se pudo recuperar.");
  cambiarRolUsuario(usuario.id, formulario.role, sesion);
  return listarUsuarios().find((u) => u.id === usuario.id) || usuario;
}

/* ---------- Inventario ---------- */

function validarInsumo(formulario, idActual) {
  const nombre = texto(formulario.nombre);
  if (nombre.length < 3) fallo("Escribe el nombre del insumo.");
  if (obtener("inventario").some((i) => i.id !== idActual && i.nombre.toLowerCase() === nombre.toLowerCase())) {
    fallo(`Ya existe un insumo llamado ${nombre}.`);
  }
  return {
    nombre,
    categoria: formulario.categoria,
    unidad: formulario.unidad,
    minimo: entero(formulario.minimo, "El mínimo", 0),
    precio: entero(formulario.precio, "El precio unitario", 0),
  };
}

export function crearInsumo(formulario, sesion) {
  exigirGestor(sesion);
  const datos = validarInsumo(formulario);
  const nuevo = { id: siguienteCodigo("INV", obtener("inventario").map((i) => i.id)), ...datos, stock: entero(formulario.stock, "El stock inicial", 0) };
  guardar({ inventario: [...obtener("inventario"), nuevo] });
  return nuevo;
}

export function editarInsumo(id, formulario, sesion) {
  exigirGestor(sesion);
  const actual = obtener("inventario").find((i) => i.id === id);
  if (!actual) fallo("El insumo ya no existe.");
  const siguiente = { ...actual, ...validarInsumo({ ...actual, ...formulario }, id) };
  guardar({ inventario: obtener("inventario").map((i) => (i.id === id ? siguiente : i)) });
  return siguiente;
}

export function eliminarInsumo(id, sesion) {
  exigirGestor(sesion);
  const movimientos = obtener("movimientos").filter((m) => m.itemId === id);
  if (movimientos.length) {
    fallo("No puedes eliminar un insumo que ya tiene movimientos registrados. Conserva su historial o deja su stock en cero.");
  }
  guardar({ inventario: obtener("inventario").filter((i) => i.id !== id) });
}

export function registrarMovimiento(formulario, sesion) {
  exigirGestor(sesion);
  const insumo = obtener("inventario").find((i) => i.id === formulario.itemId);
  if (!insumo) fallo("Elige el insumo.");
  if (!["entrada", "salida"].includes(formulario.tipo)) fallo("Elige si es entrada o salida.");
  const cantidad = entero(formulario.cantidad, "La cantidad", 1);
  if (formulario.tipo === "salida" && cantidad > Number(insumo.stock)) {
    fallo(`Solo hay ${cantidadConUnidad(insumo.stock, insumo.unidad)} de ${insumo.nombre}.`);
  }
  const fecha = fechaPasada(formulario.fecha, "la fecha");
  if (formulario.lote) exigirLoteActivo(buscarLote(formulario.lote));
  const valor = cantidad * Number(insumo.precio || 0);
  const movimiento = {
    id: crearId("MOV"),
    itemId: insumo.id,
    item: insumo.nombre,
    tipo: formulario.tipo,
    cantidad,
    fecha,
    motivo: texto(formulario.motivo) || (formulario.tipo === "entrada" ? "Entrada" : "Salida"),
    lote: formulario.lote || "",
    responsableId: sesion.personaId,
    valor,
  };
  const delta = formulario.tipo === "entrada" ? cantidad : -cantidad;
  const cambios = {
    inventario: obtener("inventario").map((i) => (i.id === insumo.id ? { ...i, stock: Number(i.stock) + delta } : i)),
    movimientos: [movimiento, ...obtener("movimientos")],
  };
  const eventos = [];
  if (formulario.tipo === "salida" && formulario.lote) {
    eventos.push(
      evento({
        lote: formulario.lote,
        tipo: "Consumo de insumo",
        detalle: `Salida de ${cantidadConUnidad(cantidad, insumo.unidad)} de ${insumo.nombre}${formulario.cargarCosto ? ` (${dinero(valor)} cargados al lote)` : ""}.`,
        sesion,
        origen: "Inventario",
        fecha: `${fecha}T${ahoraLocal().slice(11)}`,
      }),
    );
    if (formulario.cargarCosto && valor > 0) {
      cambios.costos = [
        {
          id: crearId("CST"),
          tipo: "gasto",
          concepto: `${insumo.nombre} (${cantidadConUnidad(cantidad, insumo.unidad)})`,
          categoria: "Insumos",
          valor,
          fecha,
          lote: formulario.lote,
          origen: "inventario",
          movimientoId: movimiento.id,
        },
        ...obtener("costos"),
      ];
    }
  }
  guardar(conEventos(cambios, eventos));
  return movimiento;
}

/*
  Corrige un movimiento sin borrar la historia: crea el movimiento inverso, marca el
  original como anulado, retira el costo que había cargado al lote y lo deja en la
  trazabilidad del lote.
*/
export function anularMovimiento(id, sesion) {
  exigirGestor(sesion);
  const original = obtener("movimientos").find((m) => m.id === id);
  if (!original) fallo("El movimiento ya no existe.");
  if (original.anulado) fallo("Este movimiento ya fue anulado.");
  if (original.anulaA) fallo("Este movimiento es una anulación y no se puede anular.");
  const insumo = obtener("inventario").find((i) => i.id === original.itemId);
  if (!insumo) fallo("El insumo de este movimiento ya no existe.");
  const cantidad = Number(original.cantidad) || 0;
  const delta = original.tipo === "entrada" ? -cantidad : cantidad;
  if (Number(insumo.stock) + delta < 0) {
    fallo(`No se puede anular la entrada: solo quedan ${cantidadConUnidad(insumo.stock, insumo.unidad)} de ${insumo.nombre} y ya se usaron.`);
  }
  const inverso = {
    id: crearId("MOV"),
    itemId: insumo.id,
    item: insumo.nombre,
    tipo: original.tipo === "entrada" ? "salida" : "entrada",
    cantidad,
    fecha: hoyISO(),
    motivo: `Anulación: ${original.motivo}`,
    lote: original.lote || "",
    responsableId: sesion.personaId,
    valor: Number(original.valor) || 0,
    anulaA: original.id,
  };
  const cambios = {
    inventario: obtener("inventario").map((i) => (i.id === insumo.id ? { ...i, stock: Number(i.stock) + delta } : i)),
    movimientos: [inverso, ...obtener("movimientos").map((m) => (m.id === id ? { ...m, anulado: true, anuladoPor: inverso.id } : m))],
  };
  const costo = obtener("costos").find((c) => c.movimientoId === id);
  if (costo) cambios.costos = obtener("costos").filter((c) => c.id !== costo.id);
  const eventos = [];
  if (original.lote && obtener("lotes").some((l) => l.lote === original.lote)) {
    eventos.push(
      evento({
        lote: original.lote,
        tipo: "Observación",
        detalle: `Se anula la ${original.tipo} de ${cantidadConUnidad(cantidad, insumo.unidad)} de ${insumo.nombre}${costo ? ` y se retiran ${dinero(costo.valor)} del costo del lote` : ""}.`,
        sesion,
        origen: "Inventario",
      }),
    );
  }
  guardar(conEventos(cambios, eventos));
  return inverso;
}

/* ---------- Costos ---------- */

function validarCosto(formulario) {
  const concepto = texto(formulario.concepto);
  if (concepto.length < 3) fallo("Describe el concepto del movimiento.");
  if (!["gasto", "ingreso"].includes(formulario.tipo)) fallo("Elige si es gasto o ingreso.");
  const valor = entero(formulario.valor, "El valor", 1);
  if (valor > 10_000_000_000) fallo("El valor supera los 10.000 millones de pesos. Revisa que no sobren ceros.");
  const fecha = fechaPasada(formulario.fecha, "la fecha");
  if (formulario.lote) buscarLote(formulario.lote);
  return { tipo: formulario.tipo, concepto, categoria: formulario.categoria, valor, fecha, lote: formulario.lote || "" };
}

export function crearCosto(formulario, sesion) {
  exigirGestor(sesion);
  const nuevo = { id: crearId("CST"), ...validarCosto(formulario) };
  guardar({ costos: [nuevo, ...obtener("costos")] });
  return nuevo;
}

export function editarCosto(id, formulario, sesion) {
  exigirGestor(sesion);
  const actual = obtener("costos").find((c) => c.id === id);
  if (!actual) fallo("El movimiento ya no existe.");
  if (actual.origen === "inventario") fallo("Este costo viene de una salida de inventario y no se edita aquí: anula el movimiento en Inventario › Movimientos y registra la salida correcta.");
  const siguiente = { ...actual, ...validarCosto({ ...actual, ...formulario }) };
  guardar({ costos: obtener("costos").map((c) => (c.id === id ? siguiente : c)) });
  return siguiente;
}

export function eliminarCosto(id, sesion) {
  exigirGestor(sesion);
  const actual = obtener("costos").find((c) => c.id === id);
  if (!actual) fallo("El movimiento ya no existe.");
  if (actual.origen === "inventario") fallo("Este costo viene de una salida de inventario: anula ese movimiento en Inventario › Movimientos y el costo se retira con él.");
  guardar({ costos: obtener("costos").filter((c) => c.id !== id) });
}

/* ---------- Calidad ---------- */

export function crearIncidencia(formulario, sesion) {
  const lote = exigirLoteActivo(loteDeOperario(formulario.lote, sesion));
  const descripcion = texto(formulario.descripcion);
  if (descripcion.length < 8) fallo("Describe lo que observaste con un poco más de detalle.");
  if (!PRIORIDADES.includes(formulario.prioridad)) fallo("Elige la prioridad.");
  const responsableId = sesion.role === "operario" ? sesion.personaId : responsableActivo(formulario.responsableId).id;
  const codigo = siguienteCodigo("INC", obtener("calidad").map((i) => i.codigo));
  const nueva = {
    id: codigo,
    codigo,
    lote: lote.lote,
    prioridad: formulario.prioridad,
    descripcion,
    responsableId,
    reportadoPor: sesion.personaId,
    estado: "Abierta",
    accion: "",
    fecha: hoyISO(),
  };
  guardar(
    conEventos({ calidad: [nueva, ...obtener("calidad")] }, [
      evento({ lote: lote.lote, tipo: "Incidencia", detalle: `${codigo} · ${descripcion} (prioridad ${formulario.prioridad.toLowerCase()}).`, sesion, origen: "Calidad" }),
    ]),
  );
  return nueva;
}

export function actualizarIncidencia(id, cambios, sesion) {
  exigirGestor(sesion);
  const actual = obtener("calidad").find((i) => i.id === id);
  if (!actual) fallo("La incidencia ya no existe.");
  const siguiente = { ...actual };
  const eventos = [];
  if (cambios.accion !== undefined) siguiente.accion = texto(cambios.accion);
  if (cambios.prioridad !== undefined) {
    if (!PRIORIDADES.includes(cambios.prioridad)) fallo("Elige una prioridad válida.");
    siguiente.prioridad = cambios.prioridad;
  }
  // Solo se valida el responsable si cambia: una incidencia de alguien que ya no está
  // activo debe poder cerrarse o reabrirse sin reasignarla primero.
  if (cambios.responsableId !== undefined && cambios.responsableId !== actual.responsableId) {
    const responsable = responsableActivo(cambios.responsableId);
    siguiente.responsableId = responsable.id;
    eventos.push(evento({ lote: actual.lote, tipo: "Observación", detalle: `${actual.codigo}: responsable cambia de ${nombreDe(actual.responsableId)} a ${responsable.nombre}.`, sesion, origen: "Calidad" }));
  }
  if (cambios.estado !== undefined && !["Abierta", "En revisión", "Cerrada"].includes(cambios.estado)) fallo("El estado de la incidencia no es válido.");
  const estadoFinal = cambios.estado ?? estadoIncidencia(actual);
  if (estadoFinal === "Cerrada" && (siguiente.accion || "").length < 5) {
    fallo("Una incidencia cerrada necesita su acción correctiva documentada.");
  }
  if (cambios.estado !== undefined && cambios.estado !== estadoIncidencia(actual)) {
    siguiente.estado = cambios.estado;
    siguiente.cierre = cambios.estado === "Cerrada" ? hoyISO() : undefined;
    eventos.push(
      evento({
        lote: actual.lote,
        tipo: cambios.estado === "Cerrada" ? "Cierre de incidencia" : "Observación",
        detalle:
          cambios.estado === "Cerrada"
            ? `${actual.codigo} cerrada: ${siguiente.accion}`
            : `${actual.codigo} pasa a ${cambios.estado.toLowerCase()}.`,
        sesion,
        origen: "Calidad",
      }),
    );
  }
  guardar(conEventos({ calidad: obtener("calidad").map((i) => (i.id === id ? siguiente : i)) }, eventos));
  return siguiente;
}

/* ---------- Ambiental ---------- */

export function registrarLectura(formulario, sesion, zonasPermitidas) {
  exigirActivo(sesion);
  if (!obtener("zonas").some((z) => z.nombre === formulario.zona)) fallo("Elige la zona de la lectura.");
  if (zonasPermitidas && !zonasPermitidas.includes(formulario.zona)) fallo("Solo puedes registrar lecturas en las zonas de tus lotes.");
  const temperatura = decimal(formulario.temperatura, "La temperatura", -5, 50);
  const humedad = decimal(formulario.humedad, "La humedad", 0, 100);
  const sinLuz = formulario.iluminacion === "" || formulario.iluminacion === undefined || formulario.iluminacion === null;
  const iluminacion = sinLuz ? null : decimal(formulario.iluminacion, "La iluminación", 0, 150000);
  const fecha = fechaValida(formulario.fecha, "la fecha y hora");
  if (aFecha(fecha).getTime() > Date.now() + 5 * 60_000) fallo("La lectura no puede tener una hora futura.");
  const nueva = {
    id: crearId("AMB"),
    zona: formulario.zona,
    temperatura: Math.round(temperatura * 10) / 10,
    humedad: Math.round(humedad),
    iluminacion: iluminacion === null ? null : Math.round(iluminacion),
    fecha,
    registradoPor: sesion?.name || "Sin registrar",
  };
  guardar({ ambiental: [...obtener("ambiental"), nueva] });
  return nueva;
}

/* ---------- Trazabilidad ---------- */

export function registrarEvento(formulario, sesion) {
  const lote = exigirLoteActivo(loteDeOperario(formulario.lote, sesion));
  if (!EVENTOS_MANUALES.includes(formulario.evento)) fallo("Elige el tipo de actividad.");
  const detalle = texto(formulario.detalle);
  if (detalle.length < 5) fallo("Describe lo que se hizo.");
  const fecha = fechaValida(formulario.fecha, "la fecha");
  if (aFecha(fecha).getTime() > Date.now() + 5 * 60_000) fallo("La actividad no puede tener una fecha futura.");
  const nuevo = evento({ lote: lote.lote, tipo: formulario.evento, detalle, sesion, origen: "Manual", fecha });
  guardar({ trazabilidad: [nuevo, ...obtener("trazabilidad")] });
  return nuevo;
}

/* ---------- Configuración ---------- */

export function guardarConfiguracion(formulario, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede cambiar la configuración.");
  const cfg = {
    tempMin: decimal(formulario.tempMin, "La temperatura mínima", -5, 45),
    tempMax: decimal(formulario.tempMax, "La temperatura máxima", 0, 50),
    humMin: decimal(formulario.humMin, "La humedad mínima", 0, 100),
    humMax: decimal(formulario.humMax, "La humedad máxima", 0, 100),
    notificaciones: formulario.notificaciones === "Desactivadas" ? "Desactivadas" : "Activadas",
  };
  if (cfg.tempMin >= cfg.tempMax) fallo("La temperatura mínima debe ser menor que la máxima.");
  if (cfg.humMin >= cfg.humMax) fallo("La humedad mínima debe ser menor que la máxima.");
  guardar({ configuracion: cfg });
  return cfg;
}

export function crearZona(formulario, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede crear zonas.");
  const nombre = texto(formulario.nombre);
  if (nombre.length < 3) fallo("Escribe el nombre de la zona.");
  if (obtener("zonas").some((z) => z.nombre.toLowerCase() === nombre.toLowerCase())) fallo(`La zona ${nombre} ya existe.`);
  const nueva = { id: crearId("ZON"), nombre, descripcion: texto(formulario.descripcion) };
  guardar({ zonas: [...obtener("zonas"), nueva] });
  return nueva;
}

export function eliminarZona(id, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede eliminar zonas.");
  const zona = obtener("zonas").find((z) => z.id === id);
  if (!zona) fallo("La zona ya no existe.");
  const activos = obtener("lotes").filter((l) => l.ubicacion === zona.nombre && l.estado !== "Cerrado").length;
  if (activos) fallo(`${zona.nombre} tiene ${activos} lote${activos === 1 ? "" : "s"} activo${activos === 1 ? "" : "s"}. Trasládalos antes de eliminarla.`);
  guardar({ zonas: obtener("zonas").filter((z) => z.id !== id) });
}

export function restaurarRespaldo(texto, sesion) {
  if (sesion?.role !== "admin") fallo("Solo administración puede restaurar respaldos.");
  importarRespaldo(texto);
  asegurarPersonasDeUsuarios();
}

export function restablecerDatosBase(sesion) {
  if (sesion && sesion.role !== "admin") fallo("Solo administración puede restablecer los datos.");
  inicializarDatos({ forzar: true });
  asegurarPersonasDeUsuarios();
}

import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, OPERARIO, SUPERVISOR, reiniciar } from "./entorno.mjs";
import { guardar, obtener } from "../../src/datos/almacen.js";
import {
  actualizarIncidencia,
  anularMovimiento,
  cambiarEstadoPersona,
  cambiarEstadoTarea,
  cerrarLote,
  crearCuentaAdministrativa,
  editarPersona,
  editarTarea,
  registrarCuenta,
  registrarEvento,
  registrarMovimiento,
} from "../../src/datos/acciones.js";
import { getSession, listarUsuarios, login } from "../../src/utilidades/autenticacion.js";
import { hoyISO } from "../../src/utilidades/formato.js";

beforeEach(reiniciar);

const persona = (id) => obtener("personas").find((p) => p.id === id);
const lote = (codigo) => obtener("lotes").find((l) => l.lote === codigo);
const marcarInactiva = (id) => guardar({ personas: obtener("personas").map((p) => (p.id === id ? { ...p, estado: "Inactivo" } : p)) });

test("solo se despacha un lote en Cosecha", () => {
  assert.throws(() => cerrarLote("LT-2026-012", { motivo: "Despachado" }, SUPERVISOR), /Solo se despachan lotes en Cosecha/);
});

test("no se cierra un lote con tareas abiertas y el mensaje las nombra", () => {
  assert.throws(() => cerrarLote("LT-2026-011", { motivo: "Despachado" }, SUPERVISOR), /Preparar despacho de tomate/);
});

test("descartar un lote cierra sus incidencias con el descarte como acción", () => {
  cambiarEstadoTarea("TSK-006", "Completada", SUPERVISOR);
  cerrarLote("LT-2026-017", { motivo: "Descartado", detalle: "Damping-off en todas las bandejas" }, SUPERVISOR);
  assert.equal(lote("LT-2026-017").estado, "Cerrado");
  assert.equal(lote("LT-2026-017").detalleCierre, "Damping-off en todas las bandejas");
  const incidencia = obtener("calidad").find((i) => i.id === "INC-032");
  assert.equal(incidencia.estado, "Cerrada");
  assert.match(incidencia.accion, /^Retirar bandejas afectadas.*Cerrada por descarte del lote: Damping-off/);
  assert.ok(obtener("trazabilidad").some((e) => e.lote === "LT-2026-017" && e.evento === "Cierre de incidencia"));
});

test("cerrar un lote conserva sus notas", () => {
  const notas = lote("LT-2026-011").notas;
  for (const id of ["TSK-001", "TSK-004", "TSK-010"]) cambiarEstadoTarea(id, "Completada", SUPERVISOR);
  actualizarIncidencia("INC-031", { accion: "Retiro de hojas afectadas y fungicida", estado: "Cerrada" }, SUPERVISOR);
  cerrarLote("LT-2026-011", { motivo: "Despachado", detalle: "Entregado a la asociación" }, SUPERVISOR);
  assert.equal(lote("LT-2026-011").notas, notas);
});

test("una tarea de un lote ya cerrado se puede reasignar sin cambiar el lote", () => {
  guardar({ tareas: [{ id: "TSK-X", titulo: "Revisar canastillas", lote: "LT-2026-009", responsableId: "PER-003", prioridad: "Media", fecha: hoyISO(), estado: "Pendiente" }, ...obtener("tareas")] });
  const tarea = editarTarea("TSK-X", { responsableId: "PER-004" }, SUPERVISOR);
  assert.equal(tarea.responsableId, "PER-004");
});

test("el registro público no hereda la ficha de otra persona por el nombre", () => {
  const resultado = registrarCuenta({ name: "andrés rojas", email: "otro@vivero.com", password: "clave12345" });
  assert.ok(resultado.ok);
  const cuenta = listarUsuarios().find((u) => u.email === "otro@vivero.com");
  assert.notEqual(cuenta.personaId, "PER-003");
});

test("administración sí puede crear la cuenta de una persona que ya tiene ficha", () => {
  const cuenta = crearCuentaAdministrativa({ name: "Camila Pardo", email: "camila@vivero.com", password: "clave12345", role: "supervisor" }, ADMIN);
  assert.equal(cuenta.personaId, "PER-004");
  assert.equal(persona("PER-004").cargo, "Supervisor");
});

test("supervisión no puede editar ni desactivar a una persona administradora", () => {
  assert.throws(() => editarPersona("PER-001", { cargo: "Operario" }, SUPERVISOR), /Solo administración/);
  assert.throws(() => cambiarEstadoPersona("PER-001", "Inactivo", SUPERVISOR), /Solo administración/);
});

test("para desactivar a alguien hay que reasignar también sus incidencias", () => {
  assert.throws(() => cambiarEstadoPersona("PER-005", "Inactivo", ADMIN), /incidencia abierta/);
});

test("una incidencia de alguien inactivo se puede cerrar sin reasignarla", () => {
  marcarInactiva("PER-004");
  const cerrada = actualizarIncidencia("INC-032", { responsableId: "PER-004", accion: "Bandejas retiradas y desinfectadas", estado: "Cerrada" }, SUPERVISOR);
  assert.equal(cerrada.estado, "Cerrada");
});

test("una incidencia cerrada no puede quedarse sin acción ni con prioridad inventada", () => {
  actualizarIncidencia("INC-031", { accion: "Retiro de hojas afectadas", estado: "Cerrada" }, SUPERVISOR);
  assert.throws(() => actualizarIncidencia("INC-031", { accion: "" }, SUPERVISOR), /acción correctiva/);
  assert.throws(() => actualizarIncidencia("INC-030", { prioridad: "Urgentísima" }, SUPERVISOR), /prioridad válida/);
});

test("una persona inactiva no puede seguir registrando trabajo", () => {
  marcarInactiva("PER-003");
  assert.throws(() => registrarEvento({ lote: "LT-2026-011", evento: "Riego", detalle: "Riego por goteo", fecha: hoyISO() }, OPERARIO), /inactiva/);
});

test("anular una salida devuelve el stock y retira el costo del lote", () => {
  const stockAntes = obtener("inventario").find((i) => i.id === "INV-004").stock;
  const original = obtener("movimientos").find((m) => m.id === "MOV-003");
  anularMovimiento("MOV-003", SUPERVISOR);
  const insumo = obtener("inventario").find((i) => i.id === original.itemId);
  if (original.itemId === "INV-004") assert.equal(insumo.stock, stockAntes + original.cantidad);
  assert.ok(!obtener("costos").some((c) => c.movimientoId === "MOV-003"));
  assert.ok(obtener("movimientos").find((m) => m.id === "MOV-003").anulado);
  assert.throws(() => anularMovimiento("MOV-003", SUPERVISOR), /ya fue anulado/);
});

test("no se anula una entrada cuyo insumo ya se consumió", () => {
  const entrada = registrarMovimiento({ itemId: "INV-005", tipo: "entrada", cantidad: 5, fecha: hoyISO() }, SUPERVISOR);
  registrarMovimiento({ itemId: "INV-005", tipo: "salida", cantidad: 7, fecha: hoyISO() }, SUPERVISOR);
  assert.throws(() => anularMovimiento(entrada.id, SUPERVISOR), /ya se usaron/);
});

test("la sesión vence", () => {
  assert.ok(login("operario@aiden.com", "aiden123").ok);
  assert.ok(getSession());
  const guardada = JSON.parse(sessionStorage.getItem("aiden_session"));
  sessionStorage.setItem("aiden_session", JSON.stringify({ ...guardada, exp: Date.now() - 1 }));
  assert.equal(getSession(), null);
});

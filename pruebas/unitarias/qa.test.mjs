import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, SUPERVISOR, reiniciar } from "./entorno.mjs";
import { obtener } from "../../src/datos/almacen.js";
import { crearCosto, crearCuentaAdministrativa, crearLote, reasignarYDesactivar, registrarMovimiento, sugerirCodigoLote } from "../../src/datos/acciones.js";
import { cantidadConUnidad, fechaCorta, sumarDias, hoyISO } from "../../src/utilidades/formato.js";

beforeEach(reiniciar);

test("una cuenta nueva inválida lanza su error en vez de cerrar el formulario", () => {
  assert.throws(() => crearCuentaAdministrativa({ name: "", email: "", password: "", role: "operario" }, ADMIN), /nombre/i);
  assert.throws(() => crearCuentaAdministrativa({ name: "Ana Ruiz", email: "operario@aiden.com", password: "clave12345", role: "operario" }, ADMIN), /Ya existe/);
});

test("siembra, costos y movimientos no aceptan fechas futuras", () => {
  const manana = sumarDias(hoyISO(), 1);
  assert.throws(() => crearLote({ lote: sugerirCodigoLote(), cultivo: "Lechuga crespa", cantidad: 100, responsableId: "PER-003", ubicacion: "Invernadero 1", fecha: manana }, SUPERVISOR), /posterior a hoy/);
  assert.throws(() => crearCosto({ tipo: "gasto", concepto: "Jornal", categoria: "Mano de obra", valor: 50000, fecha: manana }, SUPERVISOR), /posterior a hoy/);
  assert.throws(() => registrarMovimiento({ itemId: "INV-002", tipo: "entrada", cantidad: 5, fecha: manana }, SUPERVISOR), /posterior a hoy/);
  assert.throws(() => crearCosto({ tipo: "gasto", concepto: "Jornal", categoria: "Mano de obra", valor: 99_999_999_999, fecha: hoyISO() }, SUPERVISOR), /sobren ceros/);
});

test("desactivar con reasignación pasa tareas, lotes e incidencias en un paso", () => {
  const r = reasignarYDesactivar("PER-005", "PER-004", SUPERVISOR);
  assert.ok(r.tareas > 0 && r.lotes > 0 && r.incidencias > 0);
  assert.equal(obtener("personas").find((p) => p.id === "PER-005").estado, "Inactivo");
  assert.ok(!obtener("tareas").some((t) => t.responsableId === "PER-005" && t.estado !== "Completada"));
  assert.ok(!obtener("lotes").some((l) => l.responsableId === "PER-005" && l.estado !== "Cerrado"));
  assert.ok(obtener("trazabilidad").some((e) => /Julián Gómez a Camila Pardo/.test(e.detalle)));
  assert.throws(() => reasignarYDesactivar("PER-001", "PER-004", SUPERVISOR), /Solo administración/);
});

test("las cantidades usan la unidad en singular o plural", () => {
  assert.equal(cantidadConUnidad(1, "litros"), "1 litro");
  assert.equal(cantidadConUnidad(3, "litros"), "3 litros");
  assert.equal(cantidadConUnidad(1, "unidades"), "1 unidad");
});

test("las fechas de otros años muestran el año", () => {
  assert.doesNotMatch(fechaCorta(hoyISO()), /\d{4}/);
  assert.match(fechaCorta("2024-03-08"), /2024/);
});

import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { reiniciar } from "./entorno.mjs";
import {
  CLAVE_RESPALDO_AUTOMATICO,
  COLECCIONES,
  crearId,
  exportarRespaldo,
  importarRespaldo,
  inicializarDatos,
  obtenerDatos,
} from "../../src/datos/almacen.js";

beforeEach(reiniciar);

test("siembra datos de ejemplo cuando el navegador está vacío", () => {
  localStorage.clear();
  inicializarDatos();
  assert.ok(obtenerDatos().lotes.length > 0);
});

test("un cambio de versión conserva los datos y guarda un respaldo automático", () => {
  const lotes = obtenerDatos().lotes.filter((l) => l.lote !== "LT-2026-017");
  localStorage.setItem(COLECCIONES.lotes, JSON.stringify(lotes));
  localStorage.setItem("aiden-datos-version", JSON.stringify("2025.9"));
  inicializarDatos();
  assert.equal(obtenerDatos().lotes.length, lotes.length, "no debe volver a sembrar");
  const respaldo = JSON.parse(localStorage.getItem(CLAVE_RESPALDO_AUTOMATICO));
  assert.equal(respaldo.version, "2025.9");
  assert.equal(respaldo.datos.lotes.length, lotes.length);
});

test("una colección ilegible se copia aparte antes de que una escritura la pise", () => {
  localStorage.setItem(COLECCIONES.trazabilidad, "{esto no es json");
  inicializarDatos();
  assert.equal(localStorage.getItem(`${COLECCIONES.trazabilidad}:corrupto`), "{esto no es json");
  assert.deepEqual(obtenerDatos().trazabilidad, []);
});

test("el respaldo rechaza registros nulos, ids repetidos y versiones desconocidas", () => {
  const base = JSON.parse(exportarRespaldo());
  const conNulo = structuredClone(base);
  conNulo.datos.calidad.push(null);
  assert.throws(() => importarRespaldo(JSON.stringify(conNulo)), /formato esperado/);

  const repetido = structuredClone(base);
  repetido.datos.lotes.push(repetido.datos.lotes[0]);
  assert.throws(() => importarRespaldo(JSON.stringify(repetido)), /repite el registro/);

  const futuro = { ...structuredClone(base), version: "2099.1" };
  assert.throws(() => importarRespaldo(JSON.stringify(futuro)), /no reconoce/);

  const sinConfig = structuredClone(base);
  sinConfig.datos.configuracion = null;
  assert.throws(() => importarRespaldo(JSON.stringify(sinConfig)), /configuración/);
});

test("un respaldo válido se importa y deja copia de los datos anteriores", () => {
  const respaldo = JSON.parse(exportarRespaldo());
  respaldo.datos.zonas = respaldo.datos.zonas.slice(0, 2);
  importarRespaldo(JSON.stringify(respaldo));
  assert.equal(obtenerDatos().zonas.length, 2);
  assert.equal(JSON.parse(localStorage.getItem(CLAVE_RESPALDO_AUTOMATICO)).datos.zonas.length, 4);
});

test("los ids no se repiten aunque se generen en el mismo milisegundo", () => {
  const ids = new Set(Array.from({ length: 5000 }, () => crearId("TRZ")));
  assert.equal(ids.size, 5000);
});

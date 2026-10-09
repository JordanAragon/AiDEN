import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, reiniciar } from "./entorno.mjs";
import { guardar, obtener, obtenerDatos } from "../../src/datos/almacen.js";
import { alertas, costoPorPlanta } from "../../src/datos/selectores.js";
import { responder } from "../../src/datos/asistente.js";
import { celdaCSV, contenidoCSV } from "../../src/utilidades/exportar.js";

beforeEach(reiniciar);

test("sin plantas vivas no hay costo por planta", () => {
  assert.equal(costoPorPlanta(1_176_100, 0), null);
  assert.equal(costoPorPlanta(1000, 4), 250);
});

test("una zona sin lectura reciente o sin lecturas cuenta como alerta", () => {
  const viejas = obtener("ambiental").map((l) => (l.zona === "Umbráculo" ? { ...l, fecha: "2026-01-02T08:00" } : l)).filter((l) => l.zona !== "Área de germinación");
  guardar({ ambiental: viejas });
  const titulos = alertas(obtenerDatos(), ADMIN).map((a) => a.titulo);
  assert.ok(titulos.includes("Umbráculo sin lectura reciente"));
  assert.ok(titulos.includes("Área de germinación sin lecturas"));
});

test("un insumo con mínimo 0 no genera alerta y en el mínimo no dice «bajo»", () => {
  guardar({
    inventario: obtener("inventario").map((i) => (i.id === "INV-005" ? { ...i, stock: 0, minimo: 0 } : i.id === "INV-006" ? { ...i, stock: 5, minimo: 5 } : i)),
  });
  const titulos = alertas(obtenerDatos(), ADMIN).map((a) => a.titulo);
  assert.ok(!titulos.some((t) => t.startsWith("Semilla de tomate chonto")));
  assert.ok(titulos.includes("Fungicida preventivo en el mínimo"));
});

test("el CSV neutraliza fórmulas y usa coma decimal", () => {
  assert.equal(celdaCSV('=HYPERLINK("http://x.co","ver")'), `"'=HYPERLINK(""http://x.co"",""ver"")"`);
  assert.equal(celdaCSV("@SUMA(A1)"), "'@SUMA(A1)");
  assert.equal(celdaCSV(23.4), "23,4");
  assert.equal(celdaCSV(-1500), "-1500");
  assert.equal(celdaCSV("texto; con punto y coma"), '"texto; con punto y coma"');
  assert.equal(contenidoCSV([{ Lote: "LT-2026-011", Valor: 9600 }]), "Lote;Valor\r\nLT-2026-011;9600");
});

const fuente = (pregunta) => responder(pregunta, obtenerDatos(), ADMIN);

test("el asistente responde la pregunta que se le hizo", () => {
  assert.match(fuente("¿Cuál es el resultado del mes?").fuente, /últimos tres meses/);
  assert.equal(fuente("¿Quién reportó la plaga?").fuente, "Calidad");
  assert.match(fuente("¿Cuánto stock de sustrato queda hoy?").fuente, /Inventario/);
  assert.match(fuente("¿Cuántas plantas vivas hay?").fuente, /plantas vivas y sembradas/);
  assert.match(fuente("¿Cuánto cuesta cada planta por lote?").fuente, /Costos asociados/);
});

test("el asistente pide aclaración ante un empate y reconoce cuando no sabe", () => {
  assert.ok(fuente("ambiente y plagas").aclaracion);
  assert.ok(fuente("cuéntame un chiste").sinRegla);
});

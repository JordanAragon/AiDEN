import { test } from "node:test";
import assert from "node:assert/strict";
import { generarSemilla } from "../../src/datos/semilla.js";
import { FLOTANTES_POR_PLANTA, MAXIMO_INSTANCIAS, planoVivero, tipoZona, vistaGeneral, vistaZona } from "../../src/components/vivero3d/planoVivero.js";
import { estacionesVivero } from "../../src/components/vivero3d/estaciones.js";
import { mallaEstatica, mallaPlanta, FLOTANTES_VERTICE_ESTATICO, FLOTANTES_VERTICE_PLANTA } from "../../src/components/vivero3d/geometriaVivero.js";
import { camara, proyectar } from "../../src/components/vivero3d/matematica.js";

const semilla = generarSemilla();

test("una instancia por planta viva de la semilla (4.894)", () => {
  const plano = planoVivero(semilla);
  const vivas = semilla.lotes.filter((l) => l.estado !== "Cerrado").reduce((s, l) => s + l.cantidad, 0);
  assert.equal(vivas, 4894);
  assert.equal(plano.totalPlantas, 4894);
  assert.equal(plano.cantidad, 4894);
  assert.equal(plano.representa, 1);
  assert.equal(plano.plantas.length, 4894 * FLOTANTES_POR_PLANTA);
});

test("cada planta cae dentro de su lote y de su zona", () => {
  const plano = planoVivero(semilla);
  for (let i = 0; i < plano.cantidad; i += 1) {
    const o = i * FLOTANTES_POR_PLANTA;
    const lote = plano.lotes[plano.plantas[o + 5]];
    const zona = plano.zonas.find((z) => z.nombre === lote.zona);
    const [x, , z] = [plano.plantas[o], plano.plantas[o + 1], plano.plantas[o + 2]];
    assert.ok(x >= zona.x0 && x <= zona.x1 && z >= zona.z0 && z <= zona.z1, `planta ${i} fuera de ${zona.nombre}`);
    assert.ok(x >= lote.x0 - 0.2 && x <= lote.x1 + 0.2, `planta ${i} fuera de ${lote.codigo}`);
  }
});

test("las zonas no se pisan y el lote cerrado no aparece", () => {
  const plano = planoVivero(semilla);
  assert.ok(!plano.lotes.some((l) => l.codigo === "LT-2026-009"));
  for (const a of plano.zonas) {
    for (const b of plano.zonas) {
      if (a === b) continue;
      const pisan = a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
      assert.ok(!pisan, `${a.nombre} pisa ${b.nombre}`);
    }
  }
});

test("el plano es determinista", () => {
  assert.deepEqual(planoVivero(semilla).plantas, planoVivero(semilla).plantas);
});

test("un vivero enorme se resume: nunca más de 40.000 instancias", () => {
  const datos = { ...semilla, lotes: [...semilla.lotes, { ...semilla.lotes[2], id: "X", lote: "LT-X", cantidad: 250000, cantidadInicial: 250000 }] };
  const plano = planoVivero(datos);
  assert.ok(plano.cantidad <= MAXIMO_INSTANCIAS);
  assert.ok(plano.representa > 1);
});

test("sin lotes ni zonas el plano sigue siendo válido", () => {
  const plano = planoVivero({ lotes: [], zonas: [] });
  assert.equal(plano.cantidad, 0);
  assert.ok(Number.isFinite(plano.limites.radio));
});

test("zonas desconocidas y lotes en zonas borradas tienen estructura", () => {
  assert.equal(tipoZona("Invernadero 3"), "invernadero");
  assert.equal(tipoZona("Umbráculo norte"), "umbraculo");
  assert.equal(tipoZona("Área de germinación"), "germinacion");
  assert.equal(tipoZona("Lote al aire libre"), "campo");
  const datos = { ...semilla, zonas: semilla.zonas.slice(0, 1) };
  const plano = planoVivero(datos);
  assert.equal(plano.cantidad, 4894);
});

test("las paradas salen de los datos: alerta en el Invernadero 2", () => {
  const plano = planoVivero(semilla);
  const paradas = estacionesVivero(semilla, plano, { protagonista: "LT-2026-011" });
  assert.equal(`${paradas[0].titulo} ${paradas[0].remate}`, "4.894 plantas vivas, cada una en su lugar.");
  assert.equal(paradas[1].nombre, "Invernadero 1");
  assert.equal(paradas[1].remate, "701 plantas.");
  const invernadero2 = paradas.find((p) => p.nombre === "Invernadero 2");
  assert.ok(invernadero2.alerta);
  assert.match(invernadero2.cuerpo, /fuera del rango/);
});

test("mallas con el tamaño de vértice que espera el motor", () => {
  const planta = mallaPlanta();
  assert.equal(planta.datos.length % FLOTANTES_VERTICE_PLANTA, 0);
  const estatica = mallaEstatica(planoVivero(semilla));
  assert.equal(estatica.opaca.length % FLOTANTES_VERTICE_ESTATICO, 0);
  assert.equal(estatica.vidrio.length % FLOTANTES_VERTICE_ESTATICO, 0);
  assert.ok(estatica.vidrio.length > 0);
});

test("la cámara general ve el centro del vivero", () => {
  const plano = planoVivero(semilla);
  const pose = vistaGeneral(plano, 16 / 9);
  const { vp } = camara({ ...pose, aspecto: 16 / 9 });
  const p = proyectar(vp, plano.limites.centro, 1600, 900);
  assert.ok(p.visible && !p.detras);
  for (const zona of plano.zonas) {
    const vz = vistaZona(zona, 16 / 9);
    const cz = camara({ ...vz, aspecto: 16 / 9 });
    assert.ok(proyectar(cz.vp, zona.centro, 1600, 900).visible, `${zona.nombre} visible en su parada`);
  }
});

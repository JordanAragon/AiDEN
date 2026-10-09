import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, OPERARIO, SUPERVISOR, reiniciar } from "./entorno.mjs";
import handler from "../../api/contacto.js";
import { cambiarMiContrasena, restablecerContrasenaUsuario } from "../../src/datos/acciones.js";
import { login, resetPassword } from "../../src/utilidades/autenticacion.js";

beforeEach(reiniciar);

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  delete process.env.AIDEN_LEADS_WEBHOOK_URL;
});

function llamar({ headers = {}, body = {}, method = "POST" } = {}) {
  const respuesta = { estado: 200, cuerpo: null, cabeceras: {} };
  const res = {
    setHeader: (k, v) => (respuesta.cabeceras[k] = v),
    status(codigo) {
      respuesta.estado = codigo;
      return this;
    },
    json(datos) {
      respuesta.cuerpo = datos;
      return this;
    },
  };
  return handler({ method, headers: { "content-type": "application/json", origin: "https://aidencol.vercel.app", ...headers }, body }, res).then(() => respuesta);
}

const valido = { nombre: "María González", empresa: "Vivero del Sur", email: "maria@vivero.co", mensaje: "Lotes", consentimiento: true, transcurrido: 9000, sitio_web: "" };

test("la API rechaza otros orígenes y formatos distintos de JSON", async () => {
  assert.equal((await llamar({ headers: { origin: "https://evil.example" }, body: valido })).estado, 403);
  assert.equal((await llamar({ headers: { "content-type": "application/x-www-form-urlencoded" }, body: valido })).estado, 415);
  assert.equal((await llamar({ method: "GET" })).estado, 405);
});

test("un bot que llena el campo trampa o envía al instante se descarta en silencio", async () => {
  let llamadas = 0;
  process.env.AIDEN_LEADS_WEBHOOK_URL = "https://receptor.example/leads";
  globalThis.fetch = async () => (llamadas++, new Response("{}", { status: 200 }));
  assert.equal((await llamar({ body: { ...valido, sitio_web: "spam.com" } })).estado, 200);
  assert.equal((await llamar({ body: { ...valido, transcurrido: 300 } })).estado, 200);
  assert.equal(llamadas, 0);
});

test("sin autorización de datos no se envía nada", async () => {
  const r = await llamar({ body: { ...valido, consentimiento: false } });
  assert.equal(r.estado, 400);
  assert.match(r.cuerpo.error, /autorizar el tratamiento/);
});

test("la solicitud llega limpia y con la prueba de la autorización", async () => {
  process.env.AIDEN_LEADS_WEBHOOK_URL = "https://receptor.example/leads";
  let enviado = null;
  globalThis.fetch = async (_url, opciones) => {
    enviado = JSON.parse(opciones.body);
    return new Response("{}", { status: 200 });
  };
  const r = await llamar({ body: { ...valido, nombre: '=HYPERLINK("http://x.co")', empresa: "Vivero\r\nBcc: otro@x.co" } });
  assert.equal(r.estado, 200);
  assert.equal(enviado.nombre, `'=HYPERLINK("http://x.co")`);
  assert.ok(!/[\r\n]/.test(enviado.empresa));
  assert.equal(enviado.consentimiento.aceptado, true);
  assert.ok(enviado.consentimiento.politica);
});

test("sin receptor configurado responde 503 sin revelar detalles", async () => {
  const r = await llamar({ body: valido });
  assert.equal(r.estado, 503);
  assert.doesNotMatch(r.cuerpo.error, /webhook|receptor|configurad/i);
});

test("la recuperación por correo no sirve para cuentas con permisos", () => {
  assert.equal(resetPassword("jordanaragon@aiden.com", "otraclave123").ok, false);
  assert.equal(resetPassword("supervisor@aiden.com", "otraclave123").ok, false);
  assert.equal(resetPassword("operario@aiden.com", "otraclave123").ok, true);
});

test("cambiar la propia contraseña exige la actual y una confirmación igual", () => {
  assert.throws(() => cambiarMiContrasena({ actual: "mal", nueva: "nuevaclave1", confirmacion: "nuevaclave1" }, OPERARIO), /actual no es correcta/);
  assert.throws(() => cambiarMiContrasena({ actual: "aiden123", nueva: "nuevaclave1", confirmacion: "otra" }, OPERARIO), /confirmación/);
  cambiarMiContrasena({ actual: "aiden123", nueva: "nuevaclave1", confirmacion: "nuevaclave1" }, OPERARIO);
  assert.ok(login("operario@aiden.com", "nuevaclave1").ok);
});

test("solo administración restablece la contraseña de otra cuenta", () => {
  assert.throws(() => restablecerContrasenaUsuario("usr-operario", { nueva: "clave12345", confirmacion: "clave12345" }, SUPERVISOR), /Solo administración/);
  assert.throws(() => restablecerContrasenaUsuario("usr-admin", { nueva: "clave12345", confirmacion: "clave12345" }, ADMIN), /Mi perfil/);
  restablecerContrasenaUsuario("usr-supervisor", { nueva: "clave12345", confirmacion: "clave12345" }, ADMIN);
  assert.ok(login("supervisor@aiden.com", "clave12345").ok);
});

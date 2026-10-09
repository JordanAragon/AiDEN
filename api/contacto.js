/* global process */
const LIMITES = {
  nombre: 120,
  empresa: 160,
  email: 254,
  mensaje: 2000,
};
const TAMANO_MAXIMO = 8 * 1024;
// Fecha de la versión de la política de privacidad que acepta quien envía el formulario.
export const VERSION_POLITICA = "2026-10-09";
const TIEMPO_MINIMO_MS = 2500;
const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/*
  Limpia lo que llega del formulario antes de reenviarlo: quita caracteres de control
  (evita cabeceras inyectadas si el receptor arma un correo) y neutraliza fórmulas si
  termina en una hoja de cálculo.
*/
function texto(valor, multilinea = false) {
  if (typeof valor !== "string") return "";
  // eslint-disable-next-line no-control-regex -- se buscan justamente caracteres de control para quitarlos
  const limpio = valor.replace(multilinea ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ").trim();
  return /^[=+\-@]/.test(limpio) ? `'${limpio}` : limpio;
}

function origenesPermitidos() {
  const lista = ["https://aidencol.vercel.app"];
  if (process.env.VERCEL_URL) lista.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) lista.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.AIDEN_ORIGENES_EXTRA) lista.push(...process.env.AIDEN_ORIGENES_EXTRA.split(",").map((o) => o.trim()).filter(Boolean));
  if (process.env.VERCEL_ENV === "development") lista.push("http://localhost:3000", "http://localhost:5173");
  return new Set(lista);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  // Solo JSON y desde el propio sitio: un formulario de otro dominio no puede usar
  // a los visitantes de ese sitio para llenar el receptor de solicitudes falsas.
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "Formato no admitido." });
  }
  if (!origenesPermitidos().has(req.headers.origin)) {
    return res.status(403).json({ error: "Origen no permitido." });
  }
  if (Number(req.headers["content-length"] || 0) > TAMANO_MAXIMO) {
    return res.status(413).json({ error: "La solicitud es demasiado grande." });
  }

  const cuerpo = req.body && typeof req.body === "object" ? req.body : {};
  // Campo trampa invisible y tiempo mínimo de llenado: a un bot se le responde como si
  // todo hubiera salido bien, pero su envío se descarta.
  if (texto(cuerpo.sitio_web) || !(Number(cuerpo.transcurrido) >= TIEMPO_MINIMO_MS)) {
    return res.status(200).json({ ok: true });
  }
  if (cuerpo.consentimiento !== true) {
    return res.status(400).json({ error: "Para enviar la solicitud debes autorizar el tratamiento de tus datos." });
  }

  const datos = {
    nombre: texto(cuerpo.nombre),
    empresa: texto(cuerpo.empresa),
    email: texto(cuerpo.email).toLowerCase(),
    mensaje: texto(cuerpo.mensaje, true),
  };

  if (!datos.nombre || !datos.empresa || !datos.email) {
    return res.status(400).json({ error: "Nombre, empresa y correo son obligatorios." });
  }
  if (Object.entries(datos).some(([campo, valor]) => valor.length > LIMITES[campo])) {
    return res.status(400).json({ error: "Uno de los campos supera la longitud permitida." });
  }
  if (!CORREO.test(datos.email)) {
    return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  }

  const webhook = process.env.AIDEN_LEADS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({ error: "El formulario no está disponible en este momento." });
  }

  const ahora = new Date().toISOString();
  const cabeceras = { "Content-Type": "application/json" };
  if (process.env.AIDEN_LEADS_WEBHOOK_SECRET) cabeceras.Authorization = `Bearer ${process.env.AIDEN_LEADS_WEBHOOK_SECRET}`;

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify({
        source: "aiden-landing",
        ...datos,
        // Prueba de la autorización (Ley 1581 de 2012, Decreto 1377 de 2013, art. 8).
        consentimiento: { aceptado: true, politica: VERSION_POLITICA, fecha: ahora },
        createdAt: ahora,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`El receptor respondió ${response.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    // Sin datos personales en el registro: solo el motivo técnico.
    console.error("Solicitud de demo no entregada:", error?.message || error);
    return res.status(502).json({ error: "No fue posible entregar la solicitud." });
  }
}

/* global process */
const LIMITES = {
  nombre: 120,
  empresa: 160,
  email: 254,
  mensaje: 2000,
};

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }

  const cuerpo = req.body && typeof req.body === "object" ? req.body : {};
  const datos = {
    nombre: texto(cuerpo.nombre),
    empresa: texto(cuerpo.empresa),
    email: texto(cuerpo.email).toLowerCase(),
    mensaje: texto(cuerpo.mensaje),
  };

  if (!datos.nombre || !datos.empresa || !datos.email) {
    return res.status(400).json({ error: "Nombre, empresa y correo son obligatorios." });
  }

  if (Object.entries(datos).some(([campo, valor]) => valor.length > LIMITES[campo])) {
    return res.status(400).json({ error: "Uno de los campos supera la longitud permitida." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(datos.email)) {
    return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  }

  const webhook = process.env.AIDEN_LEADS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({ error: "El receptor comercial todavía no está configurado." });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "aiden-landing",
        ...datos,
        createdAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error("Webhook rejected the lead");
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "No fue posible entregar la solicitud." });
  }
}

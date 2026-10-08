/* global process */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const { nombre, empresa, email, mensaje = "" } = req.body || {};

  if (!nombre || !empresa || !email) {
    return res.status(400).json({ error: "Nombre, empresa y correo son obligatorios." });
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
        nombre,
        empresa,
        email,
        mensaje,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Webhook rejected the lead");
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "No fue posible entregar la solicitud." });
  }
}

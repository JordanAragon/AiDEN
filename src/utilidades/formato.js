const LOCALE = "es-CO";

const formatoDinero = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

export function dinero(valor) {
  return formatoDinero.format(Number(valor) || 0);
}

export function dineroCorto(valor) {
  const n = Number(valor) || 0;
  const abs = Math.abs(n);
  const signo = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${signo}$ ${formatoNumero.format(abs / 1_000_000)} M`;
  if (abs >= 1_000) return `${signo}$ ${formatoNumero.format(abs / 1_000)} mil`;
  return dinero(n);
}

export function numero(valor) {
  return formatoNumero.format(Number(valor) || 0);
}

function dosDigitos(n) {
  return String(n).padStart(2, "0");
}

export function aISOLocal(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function hoyISO() {
  return aISOLocal(new Date());
}

export function ahoraLocal() {
  const d = new Date();
  return `${aISOLocal(d)}T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
}

export function sumarDias(iso, dias) {
  const base = aFecha(iso);
  base.setDate(base.getDate() + dias);
  return aISOLocal(base);
}

export function aFecha(valor) {
  if (valor instanceof Date) return new Date(valor.getTime());
  const texto = String(valor || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [a, m, d] = texto.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(texto);
}

export function diasEntre(desde, hasta = hoyISO()) {
  const a = aFecha(String(desde).slice(0, 10));
  const b = aFecha(String(hasta).slice(0, 10));
  return Math.round((b - a) / 86_400_000);
}

export function fechaCorta(valor) {
  if (!valor) return "—";
  return aFecha(valor).toLocaleDateString(LOCALE, { day: "numeric", month: "short" }).replace(".", "");
}

export function fechaLarga(valor) {
  if (!valor) return "—";
  return aFecha(valor).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
}

export function fechaHora(valor) {
  if (!valor) return "—";
  const d = aFecha(valor);
  return `${fechaCorta(d)}, ${d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })}`;
}

export function hora(valor) {
  if (!valor) return "—";
  return aFecha(valor).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
}

export function vencimiento(fecha) {
  if (!fecha) return { texto: "Sin fecha", tono: "neutral" };
  const dias = diasEntre(hoyISO(), fecha);
  if (dias < 0) return { texto: dias === -1 ? "Venció ayer" : `Venció hace ${-dias} días`, tono: "critico" };
  if (dias === 0) return { texto: "Vence hoy", tono: "alerta" };
  if (dias === 1) return { texto: "Vence mañana", tono: "neutral" };
  return { texto: `Vence ${fechaCorta(fecha)}`, tono: "neutral" };
}

export function haceTiempo(valor) {
  if (!valor) return "";
  const minutos = Math.round((Date.now() - aFecha(valor).getTime()) / 60_000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

export function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${numero(n)} ${Number(n) === 1 ? singular : pluralTexto}`;
}

export function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function coincide(texto, consulta) {
  const q = normalizar(consulta).trim();
  if (!q) return true;
  return normalizar(texto).includes(q);
}

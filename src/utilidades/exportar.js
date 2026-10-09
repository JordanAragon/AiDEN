function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/*
  - Decimales con coma: con punto, Excel en español los toma como texto o fecha.
  - Un texto que empieza por = + - @ se abriría como fórmula (por ejemplo un
    =HYPERLINK que envía datos a otro sitio): se antepone un apóstrofo.
*/
export function celdaCSV(valor) {
  let texto;
  if (typeof valor === "number") {
    texto = Number.isFinite(valor) ? (Number.isInteger(valor) ? String(valor) : String(valor).replace(".", ",")) : "";
  } else {
    texto = String(valor ?? "");
    if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  }
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function contenidoCSV(filas) {
  const columnas = Object.keys(filas[0]);
  return [columnas.map(celdaCSV).join(";"), ...filas.map((fila) => columnas.map((c) => celdaCSV(fila[c])).join(";"))].join("\r\n");
}

/*
  CSV con BOM y punto y coma: Excel en español lo abre con tildes y columnas
  correctas sin pasos extra. Devuelve la cantidad de filas exportadas.
*/
export function descargarCSV(nombre, filas) {
  if (!filas.length) throw new Error("No hay filas para exportar con los filtros actuales.");
  descargar(`${nombre}.csv`, `\uFEFF${contenidoCSV(filas)}`, "text/csv;charset=utf-8");
  return filas.length;
}

export function descargarTexto(nombre, contenido, tipo = "application/json") {
  descargar(nombre, contenido, tipo);
}

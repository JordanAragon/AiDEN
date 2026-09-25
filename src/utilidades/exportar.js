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

function celda(valor) {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/*
  CSV con BOM y punto y coma: Excel en español lo abre con tildes y columnas
  correctas sin pasos extra. Devuelve la cantidad de filas exportadas.
*/
export function descargarCSV(nombre, filas) {
  if (!filas.length) throw new Error("No hay filas para exportar con los filtros actuales.");
  const columnas = Object.keys(filas[0]);
  const contenido = [columnas.map(celda).join(";"), ...filas.map((fila) => columnas.map((c) => celda(fila[c])).join(";"))].join("\r\n");
  descargar(`${nombre}.csv`, `\uFEFF${contenido}`, "text/csv;charset=utf-8");
  return filas.length;
}

export function descargarTexto(nombre, contenido, tipo = "application/json") {
  descargar(nombre, contenido, tipo);
}

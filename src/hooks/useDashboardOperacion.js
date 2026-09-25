import { useDatos } from "../datos/almacen";
import { alertas as calcularAlertas, lotesActivos, tareaVencida } from "../datos/selectores";

const VISTA_GENERAL = { role: "admin" };

export function useDashboardOperacion() {
  const datos = useDatos();
  const activos = lotesActivos(datos.lotes).map((lote) => ({ ...lote, codigo: lote.lote, nombre: lote.cultivo }));
  const pendientes = datos.tareas.filter((task) => task.estado !== "Completada");
  const alertas = calcularAlertas(datos, VISTA_GENERAL).map((a) => ({ id: a.id, text: `${a.tipo}: ${a.titulo}`, ruta: a.ruta, tipo: a.tipo }));
  return {
    lotes: datos.lotes,
    inventario: datos.inventario,
    calidad: datos.calidad,
    tareas: datos.tareas,
    ambiental: datos.ambiental,
    cfg: datos.configuracion,
    pendientes,
    atrasadas: pendientes.filter((task) => tareaVencida(task)),
    alertas,
    bajoMinimo: datos.inventario.filter((row) => Number(row.stock) <= Number(row.minimo)),
    lotesActivos: activos,
    lotesCosecha: activos.filter((lot) => lot.etapa === "Cosecha"),
  };
}

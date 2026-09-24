import { useEffect, useState } from "react";
import {
  leerConfiguracion,
  leerDato,
  obtenerAlertasAmbientales,
  suscribirseADatos,
} from "../utilidades/datosOperativos";

export function useDashboardOperacion() {
  const [, forceUpdate] = useState(0);

  useEffect(() => suscribirseADatos(() => forceUpdate((value) => value + 1)), []);

  const lotes = leerDato("aiden-produccion", []);
  const inventario = leerDato("aiden-inventario", []);
  const calidad = leerDato("aiden-calidad", []);
  const tareas = leerDato("aiden-tareas", []);
  const ambiental = leerDato("aiden-ambiental", []);
  const cfg = leerConfiguracion();
  const hoy = new Date().toISOString().slice(0, 10);

  const pendientes = tareas.filter((task) => task.estado !== "Completada");
  const atrasadas = pendientes.filter((task) => task.fecha && task.fecha < hoy);
  const bajoMinimo = inventario.filter(
    (row) => Number(row.stock) <= Number(row.minimo),
  );

  const alertas = [
    ...calidad
      .filter(
        (row) =>
          (row.estado ?? row.estadoManual) !== "Cerrada" &&
          row.prioridad === "Alta",
      )
      .map((row) => ({
        id: `cal-${row.id || row.codigo}`,
        text: `Calidad: ${row.codigo || row.id} · ${row.descripcion || "Requiere revisión"}`,
        ruta: "/calidad",
        tipo: "Calidad",
      })),
    ...bajoMinimo.map((row) => ({
      id: `inv-${row.id}`,
      text: `Inventario: ${row.nombre} bajo mínimo`,
      ruta: "/inventario",
      tipo: "Inventario",
    })),
    ...obtenerAlertasAmbientales(ambiental, cfg),
  ];

  const carga = [...new Set(tareas.map((task) => task.responsable).filter(Boolean))].map(
    (nombre) => ({
      nombre,
      total: tareas.filter(
        (task) =>
          task.responsable === nombre && task.estado !== "Completada",
      ).length,
    }),
  );

  return {
    lotes,
    inventario,
    calidad,
    tareas,
    ambiental,
    cfg,
    pendientes,
    atrasadas,
    alertas,
    carga,
    bajoMinimo,
    lotesActivos: lotes.filter((lot) => lot.estado !== "Inactivo"),
    lotesCosecha: lotes.filter((lot) => lot.etapa === "Cosecha"),
  };
}

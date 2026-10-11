import { useCallback, useMemo, useState } from "react";
import { ClipboardList, FlagTriangleRight, ListPlus, Sprout, Thermometer } from "lucide-react";
import { ContextoAcciones } from "../../contexto/acciones";
import { esGestor } from "../../datos/selectores";
import { useSesion } from "../../hooks/useSesion";
import ModalLote from "../formularios/ModalLote";
import ModalTarea from "../formularios/ModalTarea";
import ModalIncidencia from "../formularios/ModalIncidencia";
import ModalEvento from "../formularios/ModalEvento";
import ModalLectura from "../formularios/ModalLectura";

// Qué puede registrar cada rol. El atajo es la tecla que sigue a «N» (nuevo).
const ACCIONES = [
  { id: "lote", nombre: "Nuevo lote", detalle: "Registrar un lote con su cultivo, zona y plantas", icono: Sprout, atajo: "L", gestion: true },
  { id: "tarea", nombre: "Asignar tarea", detalle: "Encargar trabajo a una persona del equipo", icono: ClipboardList, atajo: "T", gestion: true },
  { id: "lectura", nombre: "Registrar lectura ambiental", detalle: "Temperatura, humedad y luz de una zona", icono: Thermometer, atajo: "R" },
  { id: "incidencia", nombre: "Reportar incidencia", detalle: "Una plaga, un daño o algo fuera de lo normal", icono: FlagTriangleRight, atajo: "I" },
  { id: "evento", nombre: "Registrar actividad", detalle: "Riego, fertilización, inspección o trasplante en un lote", icono: ListPlus, atajo: "A" },
];

export default function ProveedorAcciones({ children }) {
  const sesion = useSesion();
  const gestor = esGestor(sesion);
  const [abierta, setAbierta] = useState(null);

  const accionesDisponibles = useMemo(() => ACCIONES.filter((accion) => !accion.gestion || gestor), [gestor]);
  const abrirAccion = useCallback(
    (id, inicial) => {
      if (!accionesDisponibles.some((accion) => accion.id === id)) return;
      setAbierta({ id, inicial });
    },
    [accionesDisponibles],
  );
  const cerrar = useCallback(() => setAbierta(null), []);
  const valor = useMemo(() => ({ abrirAccion, accionesDisponibles }), [abrirAccion, accionesDisponibles]);
  const inicial = abierta?.inicial;

  return (
    <ContextoAcciones.Provider value={valor}>
      {children}
      {gestor && <ModalLote abierto={abierta?.id === "lote"} onCerrar={cerrar} />}
      {gestor && <ModalTarea abierto={abierta?.id === "tarea"} onCerrar={cerrar} inicial={inicial} />}
      <ModalLectura abierto={abierta?.id === "lectura"} onCerrar={cerrar} inicial={inicial} />
      <ModalIncidencia abierto={abierta?.id === "incidencia"} onCerrar={cerrar} inicial={inicial} />
      <ModalEvento abierto={abierta?.id === "evento"} onCerrar={cerrar} inicial={inicial} />
    </ContextoAcciones.Provider>
  );
}

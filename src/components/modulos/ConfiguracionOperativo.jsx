import { useRef, useState } from "react";
import { Bell, Database, Download, Gauge, MapPin, RotateCcw, Save, ShieldCheck, Trash2, Upload } from "lucide-react";
import { Boton, BotonIcono } from "../ui/Boton";
import { Entrada } from "../ui/Campo";
import EncabezadoPagina from "../ui/EncabezadoPagina";
import Insignia from "../ui/Insignia";
import Panel from "../ui/Panel";
import AlertaFormulario from "../ui/AlertaFormulario";
import { exportarRespaldo, importarRespaldo, useDatos } from "../../datos/almacen";
import { CONFIG_INICIAL } from "../../datos/catalogos";
import { crearZona, eliminarZona, guardarConfiguracion, restablecerDemo } from "../../datos/acciones";
import { evaluarLectura, ultimasLecturas } from "../../datos/selectores";
import { useAccion, useAviso, useConfirmar, useEnvio } from "../../contexto/retroalimentacion";
import { useSesion } from "../../hooks/useSesion";
import { useTitulo } from "../../hooks/useTitulo";
import { descargarTexto } from "../../utilidades/exportar";
import { hoyISO, numero, plural } from "../../utilidades/formato";

const CAMPOS = [
  ["tempMin", "Temperatura mínima (°C)"],
  ["tempMax", "Temperatura máxima (°C)"],
  ["humMin", "Humedad mínima (%)"],
  ["humMax", "Humedad máxima (%)"],
];

const desde = (cfg) => ({ tempMin: String(cfg.tempMin), tempMax: String(cfg.tempMax), humMin: String(cfg.humMin), humMax: String(cfg.humMax), notificaciones: cfg.notificaciones || "Activadas" });

function Zonas() {
  const datos = useDatos();
  const sesion = useSesion();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const { error, enviar } = useEnvio(() => {
    setNombre("");
    setDescripcion("");
  });

  const borrar = async (zona) => {
    const ok = await confirmar({ titulo: `Eliminar ${zona.nombre}`, mensaje: "Sus lecturas pasadas se conservan en el historial, pero la zona deja de aparecer para nuevos lotes y lecturas.", confirmar: "Eliminar zona", peligro: true });
    if (ok) ejecutar(() => eliminarZona(zona.id, sesion), `${zona.nombre} eliminada`);
  };

  return (
    <Panel icono={MapPin} titulo="Zonas del vivero" descripcion="Donde se ubican los lotes y se toman las lecturas." cuerpo="">
      <ul className="divide-y divide-slate-100">
        {datos.zonas.map((zona) => {
          const lotes = datos.lotes.filter((l) => l.ubicacion === zona.nombre && l.estado !== "Cerrado").length;
          return (
            <li key={zona.id} className="flex items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{zona.nombre}</span>
                {zona.descripcion && <span className="block truncate text-xs text-slate-500">{zona.descripcion}</span>}
              </span>
              <Insignia tono={lotes ? "exito" : "neutral"}>{plural(lotes, "lote activo", "lotes activos")}</Insignia>
              <BotonIcono icono={Trash2} etiqueta={`Eliminar ${zona.nombre}`} tamano="sm" onClick={() => borrar(zona)} className="hover:!bg-red-50 hover:!text-red-600" />
            </li>
          );
        })}
      </ul>
      <form
        noValidate
        className="border-t border-slate-200 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(() => crearZona({ nombre, descripcion }, sesion), (z) => `${z.nombre} agregada`);
        }}
      >
        <AlertaFormulario mensaje={error} />
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <Entrada etiqueta="Nueva zona" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Invernadero 3" />
          <Entrada etiqueta="Descripción" opcional value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Tipo de cubierta, uso o capacidad" />
          <Boton variante="secundario" type="submit">
            Agregar
          </Boton>
        </div>
      </form>
    </Panel>
  );
}

function Formulario({ cfg }) {
  const datos = useDatos();
  const sesion = useSesion();
  const [f, setF] = useState(() => desde(cfg));
  const { error, enviar } = useEnvio();
  const numericos = { tempMin: Number(f.tempMin), tempMax: Number(f.tempMax), humMin: Number(f.humMin), humMax: Number(f.humMax) };
  const validos = CAMPOS.every(([k]) => f[k] !== "" && Number.isFinite(Number(f[k])));
  const cambios = CAMPOS.some(([k]) => Number(f[k]) !== Number(cfg[k])) || f.notificaciones !== (cfg.notificaciones || "Activadas");
  const ultimas = ultimasLecturas(datos.ambiental);
  const enAlerta = validos ? datos.zonas.filter((z) => evaluarLectura(ultimas.get(z.nombre), numericos).fuera).map((z) => z.nombre) : [];
  const guardar = () => enviar(() => guardarConfiguracion(f, sesion), "Cambios guardados");

  return (
    <>
      <EncabezadoPagina
        rotulo="AiDEN / sistema"
        titulo="Configuración"
        descripcion="Define reglas que sí afectan la operación. Los umbrales ambientales se usan para calcular las alertas del módulo Ambiental, las notificaciones y los tableros."
        acciones={
          <Boton variante="primario" icono={Save} onClick={guardar} disabled={!cambios}>
            Guardar cambios
          </Boton>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [Gauge, `${cfg.tempMin}–${cfg.tempMax} °C`, "Temperatura"],
          [Gauge, `${cfg.humMin}–${cfg.humMax}%`, "Humedad"],
          [Bell, cfg.notificaciones === "Desactivadas" ? "Desactivadas" : "Activadas", "Alertas"],
        ].map(([Icono, valor, etiqueta]) => (
          <article key={etiqueta} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icono size={17} aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-950">{valor}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{etiqueta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <header className="flex items-center gap-2">
            <Gauge size={18} className="text-emerald-700" aria-hidden="true" />
            <section>
              <h2 className="font-semibold text-slate-900">Umbrales ambientales</h2>
              <p className="text-xs text-slate-500">Estos valores determinan cuándo una zona aparece en alerta.</p>
            </section>
          </header>
          <div className="mt-5">
            <AlertaFormulario mensaje={error} />
          </div>
          <section className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(([campo, etiqueta]) => (
              <Entrada key={campo} etiqueta={etiqueta} type="number" step="0.5" inputMode="decimal" value={f[campo]} onChange={(e) => setF((a) => ({ ...a, [campo]: e.target.value }))} />
            ))}
          </section>
          <p className={`mt-4 rounded-xl p-3 text-xs font-medium ${!validos || Number(f.tempMin) >= Number(f.tempMax) || Number(f.humMin) >= Number(f.humMax) ? "bg-red-50 text-red-600" : enAlerta.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`} role="status">
            {!validos
              ? "Completa los cuatro valores para ver el efecto."
              : Number(f.tempMin) >= Number(f.tempMax) || Number(f.humMin) >= Number(f.humMax)
                ? "Cada mínimo debe ser menor que su máximo."
                : enAlerta.length
                  ? `Con este rango, ${plural(enAlerta.length, "zona quedaría", "zonas quedarían")} en alerta según su última lectura: ${enAlerta.join(", ")}.`
                  : "Con este rango, todas las zonas quedarían dentro según su última lectura."}
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Boton variante="fantasma" tamano="sm" onClick={() => setF((a) => ({ ...a, ...desde(CONFIG_INICIAL), notificaciones: a.notificaciones }))}>
              Usar valores recomendados
            </Boton>
          </div>
        </form>
        <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
          <header className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-300" aria-hidden="true" />
            <h2 className="font-semibold">Comportamiento del sistema</h2>
          </header>
          <section className="mt-5 space-y-3 text-sm text-white/70">
            <p>Ambiental, las notificaciones y los tableros usan los umbrales guardados aquí.</p>
            <p>El centro de notificaciones muestra alertas de calidad, ambiente, inventario y tareas vencidas mientras esté activado.</p>
            <p>La configuración queda almacenada en este navegador y se comparte entre módulos al instante.</p>
          </section>
          <label className="mt-5 block text-sm font-medium text-white/80">
            Notificaciones
            <select value={f.notificaciones} onChange={(e) => setF((a) => ({ ...a, notificaciones: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none">
              <option>Activadas</option>
              <option>Desactivadas</option>
            </select>
          </label>
          {cambios && <p className="mt-3 text-xs text-emerald-300">Hay cambios sin guardar. Usa “Guardar cambios”.</p>}
        </article>
      </section>
    </>
  );
}

export default function ConfiguracionOperativo() {
  const datos = useDatos();
  const aviso = useAviso();
  const ejecutar = useAccion();
  const confirmar = useConfirmar();
  const archivo = useRef(null);
  const [version, setVersion] = useState(0);
  useTitulo("Configuración");
  const registros = ["lotes", "tareas", "trazabilidad", "inventario", "movimientos", "costos", "calidad", "ambiental", "personas"].reduce((s, k) => s + (datos[k]?.length || 0), 0);
  const cfg = datos.configuracion;

  const importar = async (evento) => {
    const file = evento.target.files?.[0];
    evento.target.value = "";
    if (!file) return;
    const ok = await confirmar({ titulo: "Importar respaldo", mensaje: `Los datos actuales de este navegador se reemplazan por los de “${file.name}”. Las cuentas de acceso no cambian.`, confirmar: "Reemplazar datos", peligro: true });
    if (!ok) return;
    try {
      importarRespaldo(await file.text());
      setVersion((v) => v + 1);
      aviso({ tipo: "exito", titulo: "Respaldo importado", detalle: file.name });
    } catch (error) {
      aviso({ tipo: "error", titulo: "No se pudo importar", detalle: error.message });
    }
  };

  const restablecer = async () => {
    const ok = await confirmar({ titulo: "Restablecer datos de demostración", mensaje: "Se borran los lotes, tareas, movimientos y registros de este navegador y se cargan los datos de ejemplo con fechas de hoy. Las cuentas de acceso se conservan.", confirmar: "Restablecer", peligro: true });
    if (ok && ejecutar(() => restablecerDemo(), "Datos de demostración restablecidos")) setVersion((v) => v + 1);
  };

  return (
    <section className="space-y-6">
      <Formulario key={`cfg-${version}-${cfg.tempMin}-${cfg.tempMax}-${cfg.humMin}-${cfg.humMax}-${cfg.notificaciones}`} cfg={cfg} />

      <section className="grid gap-4 xl:grid-cols-2">
        <Zonas />
        <Panel icono={Database} titulo="Datos de este navegador" descripcion={`AiDEN funciona sin servidor: ${numero(registros)} registros guardados localmente. Si borras los datos del navegador, se pierden.`}>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Descarga una copia para guardarla o llevarla a otro equipo.</p>
              <Boton variante="secundario" tamano="sm" icono={Download} onClick={() => ejecutar(() => descargarTexto(`aiden-respaldo-${hoyISO()}.json`, exportarRespaldo()), "Respaldo descargado")}>
                Exportar respaldo
              </Boton>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Carga un respaldo exportado desde AiDEN.</p>
              <input ref={archivo} type="file" accept="application/json,.json" onChange={importar} className="hidden" aria-label="Archivo de respaldo" tabIndex={-1} />
              <Boton variante="secundario" tamano="sm" icono={Upload} onClick={() => archivo.current?.click()}>
                Importar respaldo
              </Boton>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-3">
              <p className="text-sm text-red-600">Vuelve a los datos de ejemplo, con fechas relativas a hoy.</p>
              <Boton variante="secundario" tamano="sm" icono={RotateCcw} onClick={restablecer}>
                Restablecer demo
              </Boton>
            </div>
          </section>
        </Panel>
      </section>
    </section>
  );
}

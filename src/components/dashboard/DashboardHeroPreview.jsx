import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Leaf,
  Package,
  Sprout,
  Thermometer,
  TrendingUp,
} from "lucide-react";
import { useDashboardOperacion } from "../../hooks/useDashboardOperacion";
import "../../estilos/dashboard-hero-preview.css";

const chartHeights = [28, 42, 35, 58, 52, 72, 64, 84];

function MiniChart({ value }) {
  return (
    <div className="aiden-live-chart" aria-hidden="true">
      {chartHeights.map((height, index) => (
        <span
          key={index}
          style={{
            height: `${Math.max(18, Math.min(100, height + Number(value || 0) * 1.5))}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function DashboardHeroPreview() {
  const data = useDashboardOperacion();
  const activos = data.lotesActivos.length;
  const pendientes = data.pendientes.length;
  const alertas = data.alertas.length;
  const cosecha = data.lotesCosecha.length;
  const completadas = data.tareas.filter((task) => task.estado === "Completada").length;
  const totalTareas = data.tareas.length;
  const rendimiento = totalTareas ? Math.round((completadas / totalTareas) * 100) : 0;
  const lote = data.lotesActivos[0];
  const actividad = Math.min(24, Math.max(1, totalTareas));

  return (
    <div className="aiden-live-preview" aria-label="Vista previa del dashboard real de AiDEN">
      <header className="aiden-product-topbar">
        <div className="aiden-product-brand">
          <span><Leaf size={11} /></span>
          AiDEN
        </div>
        <div className="aiden-product-path">Operación / Resumen</div>
        <div className="aiden-product-status"><span /> Datos locales</div>
      </header>

      <div className="aiden-product-main">
        <aside className="aiden-product-sidebar" aria-hidden="true">
          <span className="active" />
          <span />
          <span />
          <span />
          <span />
          <span />
        </aside>

        <div className="aiden-product-content">
          <div className="aiden-product-heading">
            <div>
              <small>Centro de supervisión</small>
              <h2>Resumen de operación</h2>
            </div>
            <span className="aiden-product-date">Sincronizado ahora</span>
          </div>

          <div className="aiden-stat-grid">
            <article>
              <small>Lotes activos</small>
              <strong>{String(activos).padStart(2, "0")}</strong>
              <span>{cosecha} en cosecha</span>
            </article>
            <article>
              <small>Trabajo pendiente</small>
              <strong>{String(pendientes).padStart(2, "0")}</strong>
              <span>{data.atrasadas.length} atrasadas</span>
            </article>
            <article>
              <small>Alertas</small>
              <strong>{String(alertas).padStart(2, "0")}</strong>
              <span>{data.bajoMinimo.length} insumos bajo mínimo</span>
            </article>
          </div>

          <div className="aiden-dashboard-lower">
            <article className="aiden-lote-card">
              <header>
                <div>
                  <small>Lote destacado</small>
                  <h3>{lote?.codigo || lote?.nombre || "Sin lote"}</h3>
                </div>
                <span className="aiden-chip">
                  {lote?.etapa || (lote ? "Activo" : "Sin datos")}
                </span>
              </header>
              <div className="aiden-lote-meta">
                <span>{lote?.cultivo || lote?.variedad || "Operación productiva"}</span>
                <span>{lote?.ubicacion || lote?.zona || "Vivero principal"}</span>
              </div>
              <div className="aiden-progress-row">
                <span>Actividad registrada</span>
                <strong>{rendimiento}%</strong>
              </div>
              <div className="aiden-progress">
                <span style={{ width: `${rendimiento}%` }} />
              </div>
              <div className="aiden-live-tags">
                <span><Sprout size={9} /> {activos} activos</span>
                <span><ClipboardList size={9} /> {actividad} registros</span>
              </div>
            </article>

            <article className="aiden-chart-card">
              <header>
                <div>
                  <small>Actividad</small>
                  <strong>Estado actual</strong>
                </div>
                <TrendingUp size={14} />
              </header>
              <MiniChart value={rendimiento} />
              <footer>
                <span><i /> Tareas registradas</span>
                <b>{totalTareas}</b>
              </footer>
            </article>
          </div>

          <div className="aiden-live-alert">
            <span className="aiden-live-alert-icon">
              {alertas ? <AlertTriangle size={12} /> : <Thermometer size={12} />}
            </span>
            <div>
              <strong>{alertas ? "Atención requerida" : "Operación estable"}</strong>
              <span>
                {alertas
                  ? data.alertas[0].text
                  : "No hay alertas activas en los registros actuales."}
              </span>
            </div>
            {alertas ? <ArrowRight size={12} /> : <Package size={12} />}
          </div>
        </div>
      </div>
    </div>
  );
}

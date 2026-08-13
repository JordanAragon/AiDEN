(function () {
    const modal = document.createElement("section");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
        <article class="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header>
                <section>
                    <p class="eyebrow" id="modal-kicker">Accion rapida</p>
                    <h2 id="modal-title">Detalle</h2>
                </section>
                <button class="modal-close" type="button" aria-label="Cerrar">x</button>
            </header>
            <section class="modal-body" id="modal-body"></section>
        </article>
    `;
    document.body.appendChild(modal);

    const toast = document.createElement("p");
    toast.className = "toast";
    document.body.appendChild(toast);

    let toastTimer;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("open");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("open"), 2600);
    }

    function openModal(title, body, kicker = "AiDEN MVP") {
        modal.querySelector("#modal-kicker").textContent = kicker;
        modal.querySelector("#modal-title").textContent = title;
        modal.querySelector("#modal-body").innerHTML = body;
        modal.classList.add("open");
        modal.querySelector(".modal-close").focus();
    }

    function form(fields, submitLabel) {
        const controls = fields.map((field) => {
            const full = field.full ? " full" : "";
            if (field.type === "select") {
                return `<label class="field${full}">${field.label}<select required>${field.options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
            }
            if (field.type === "textarea") {
                return `<label class="field${full}">${field.label}<textarea required>${field.value || ""}</textarea></label>`;
            }
            return `<label class="field${full}">${field.label}<input type="${field.type || "text"}" value="${field.value || ""}" required></label>`;
        }).join("");

        return `
            <form data-modal-form>
                <section class="form-grid">${controls}</section>
                <section class="modal-actions" style="margin-top: 1rem;">
                    <button class="btn-outline modal-close" type="button">Cancelar</button>
                    <button class="btn" type="submit">${submitLabel}</button>
                </section>
            </form>
        `;
    }

    const actions = {
        "nuevo-insumo": {
            title: "Nuevo insumo",
            body: form([
                { label: "Insumo", value: "Micorrizas granulares" },
                { label: "Categoria", type: "select", options: ["Fertilizantes", "Sustratos", "Fitosanitario", "Herramientas"] },
                { label: "Cantidad", type: "number", value: "20" },
                { label: "Unidad", type: "select", options: ["kg", "bultos", "L", "unidad"] },
                { label: "Stock minimo", type: "number", value: "8" },
                { label: "Observaciones", type: "textarea", value: "Registro inicial para vivero norte.", full: true }
            ], "Guardar insumo")
        },
        "nuevo-lote": {
            title: "Nuevo lote de produccion",
            body: form([
                { label: "Numero de lote", value: "L-006" },
                { label: "Especie", type: "select", options: ["Cafe Castillo", "Aguacate Hass", "Cacao CCN-51"] },
                { label: "Fecha de siembra", type: "date", value: "2026-08-10" },
                { label: "Cantidad", type: "number", value: "400" },
                { label: "Etapa inicial", type: "select", options: ["Siembra", "Germinacion", "Crecimiento"] },
                { label: "Responsable", type: "select", options: ["Juan Perez", "Maria Lopez", "Carlos Rivas"] }
            ], "Crear lote")
        },
        "ver-lote": {
            title: "Detalle del lote L-003",
            body: `
                <section class="grid-two">
                    <article>
                        <h3>Informacion general</h3>
                        <p>Cafe Castillo · 500 plantas · Responsable: Juan Perez.</p>
                        <p>Estado actual: Crecimiento con inspeccion pendiente.</p>
                    </article>
                    <article>
                        <h3>Progreso del cultivo</h3>
                        <p>Avance estimado</p>
                        <div class="progress"><span style="width: 64%;"></span></div>
                    </article>
                </section>
                <ul class="activity-list">
                    <li>08/08/2026 · Humedad del suelo revisada.</li>
                    <li>07/08/2026 · Fertilizacion NPK aplicada.</li>
                    <li>05/08/2026 · Inspeccion visual sin perdida relevante.</li>
                </ul>
            `
        },
        "registrar-incidencia": {
            title: "Registrar incidencia de calidad",
            body: form([
                { label: "Lote", type: "select", options: ["L-003", "L-005", "L-002"] },
                { label: "Tipo de problema", type: "select", options: ["Roya", "Plaga", "Deficiencia nutricional", "Hongos"] },
                { label: "Severidad", type: "select", options: ["Baja", "Media", "Alta"] },
                { label: "Fecha", type: "date", value: "2026-08-10" },
                { label: "Descripcion", type: "textarea", value: "Sintomas visibles en hojas jovenes.", full: true },
                { label: "Observaciones", type: "textarea", value: "Programar revision en 48 horas.", full: true }
            ], "Registrar incidencia")
        },
        "consultar-trazabilidad": {
            title: "Trazabilidad del lote L-003",
            body: `
                <p><strong>Lote:</strong> L-003 · <strong>Especie:</strong> Cafe Castillo · <strong>Responsable:</strong> Juan Perez</p>
                <ul class="timeline">
                    <li><small>12/05/2026</small><strong>Siembra</strong><p>500 semillas registradas.</p></li>
                    <li><small>18/05/2026</small><strong>Germinacion</strong><p>420 plantas germinadas.</p></li>
                    <li><small>25/05/2026</small><strong>Fertilizacion</strong><p>Aplicacion de fertilizante NPK.</p></li>
                    <li><small>02/06/2026</small><strong>Inspeccion</strong><p>Sin incidencias.</p></li>
                </ul>
            `
        },
        "generar-reporte": {
            title: "Vista previa del reporte",
            body: `
                <section class="summary-grid">
                    <article class="metric-card"><span class="metric-label">Lotes</span><strong class="metric-value">18</strong><p class="metric-note">12 activos, 4 en seguimiento.</p></article>
                    <article class="metric-card"><span class="metric-label">Inventario</span><strong class="metric-value">86%</strong><p class="metric-note">Disponibilidad general.</p></article>
                    <article class="metric-card"><span class="metric-label">Alertas</span><strong class="metric-value">5</strong><p class="metric-note">2 ambientales, 2 calidad, 1 stock.</p></article>
                    <article class="metric-card"><span class="metric-label">Periodo</span><strong class="metric-value">30d</strong><p class="metric-note">Resumen simulado.</p></article>
                </section>
                <p>El MVP muestra esta vista previa antes de exportar PDF.</p>
            `
        }
    };

    document.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        const action = actions[actionButton.dataset.action];
        if (action) {
            openModal(action.title, action.body);
            return;
        }

        if (actionButton.dataset.action === "exportar-pdf") {
            showToast("PDF simulado listo para descargar.");
        }
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest(".modal-close")) {
            modal.classList.remove("open");
        }
    });

    modal.addEventListener("submit", (event) => {
        if (!event.target.matches("[data-modal-form]")) {
            return;
        }
        event.preventDefault();
        modal.classList.remove("open");
        showToast("Registro guardado en el prototipo AiDEN.");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            modal.classList.remove("open");
        }
    });
})();

(function () {
    const roles = {
        administrador: {
            label: "Administrador",
            short: "AD",
            name: "Ana Torres",
            subtitle: "Administracion general",
            alerts: 2,
            home: "dashboard-admin.html",
            modules: ["dashboard-admin.html", "configuracion.html", "inventario.html", "produccion.html", "ambiental.html", "calidad-alertas.html", "trazabilidad.html", "personal.html", "costos.html", "reportes-dashboard.html"]
        },
        supervisor: {
            label: "Supervisor",
            short: "SV",
            name: "Juan Perez",
            subtitle: "Vivero Popayan",
            alerts: 3,
            home: "dashboard.html",
            modules: ["dashboard.html", "inventario.html", "produccion.html", "ambiental.html", "calidad-alertas.html", "trazabilidad.html", "personal.html", "costos.html", "reportes-dashboard.html"]
        },
        operario: {
            label: "Operario",
            short: "OP",
            name: "Maria Lopez",
            subtitle: "Actividades asignadas",
            alerts: 1,
            home: "dashboard-operario.html",
            modules: ["dashboard-operario.html", "produccion.html", "ambiental.html", "calidad-alertas.html", "trazabilidad.html", "personal.html"]
        }
    };

    const modules = [
        { href: "dashboard-admin.html", label: "Panel admin", icon: "bi-speedometer2", roles: ["administrador"] },
        { href: "dashboard.html", label: "Dashboard", icon: "bi-grid-1x2", roles: ["supervisor"] },
        { href: "dashboard-operario.html", label: "Mi jornada", icon: "bi-clipboard-check", roles: ["operario"] },
        { href: "configuracion.html", label: "Configuracion", icon: "bi-gear", roles: ["administrador"] },
        { href: "inventario.html", label: "Inventario", icon: "bi-box-seam", roles: ["administrador", "supervisor"] },
        { href: "produccion.html", label: "Produccion", icon: "bi-flower1", roles: ["administrador", "supervisor", "operario"] },
        { href: "ambiental.html", label: "Ambiental", icon: "bi-thermometer-sun", roles: ["administrador", "supervisor", "operario"] },
        { href: "calidad-alertas.html", label: "Calidad", icon: "bi-shield-check", roles: ["administrador", "supervisor", "operario"] },
        { href: "trazabilidad.html", label: "Trazabilidad", icon: "bi-diagram-3", roles: ["administrador", "supervisor", "operario"] },
        { href: "personal.html", label: "Personal", icon: "bi-people", roles: ["administrador", "supervisor", "operario"] },
        { href: "costos.html", label: "Costos", icon: "bi-cash-coin", roles: ["administrador", "supervisor"] },
        { href: "reportes-dashboard.html", label: "Reportes", icon: "bi-file-earmark-bar-graph", roles: ["administrador", "supervisor"] }
    ];

    const actionIcons = {
        "nuevo-insumo": "bi-plus-lg",
        "nuevo-lote": "bi-plus-lg",
        "ver-lote": "bi-eye",
        "registrar-incidencia": "bi-clipboard-plus",
        "consultar-trazabilidad": "bi-search",
        "generar-reporte": "bi-file-earmark-bar-graph",
        "nuevo-usuario": "bi-person-plus",
        "nuevo-centro-costo": "bi-plus-lg",
        "restablecer-contrasena": "bi-key",
        "agregar-costo": "bi-plus-lg",
        "cierre-mensual": "bi-calendar-check",
        "asignar-tarea": "bi-person-check",
        "actualizar-datos": "bi-arrow-clockwise",
        "exportar-pdf": "bi-filetype-pdf",
        "exportar-excel": "bi-filetype-xlsx",
        "ver-alertas": "bi-bell",
        "ver-perfil": "bi-person-circle"
    };

    const pageName = window.location.pathname.split("/").pop() || "dashboard.html";
    const isModulePage = Boolean(document.querySelector(".top-nav") && document.querySelector(".main-content"));
    const savedRole = localStorage.getItem("aiden-role");
    let currentRole = roles[savedRole] ? savedRole : pageName.includes("admin") || pageName === "configuracion.html" ? "administrador" : pageName.includes("operario") ? "operario" : "supervisor";

    function ensureIcons() {
        if (document.querySelector("link[href*='bootstrap-icons']")) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
        document.head.appendChild(link);
    }

    function icon(name) {
        return `<i class="bi ${name}" aria-hidden="true"></i>`;
    }

    function renderShell() {
        if (!isModulePage) return;
        const role = roles[currentRole];
        const nav = document.querySelector(".top-nav");
        nav.innerHTML = `
            <a href="${role.home}" class="nav-brand">AiDEN</a>
            <nav aria-label="Navegacion principal">
                <ul class="nav-menu">
                    ${modules.filter((item) => item.roles.includes(currentRole)).map((item) => `
                        <li><a href="${item.href}" class="${item.href === pageName ? "active" : ""}"><span class="nav-icon">${icon(item.icon)}</span>${item.label}</a></li>
                    `).join("")}
                </ul>
            </nav>
            <nav class="nav-bottom" aria-label="Sesion">
                <label class="role-switcher">
                    <span>Rol demo</span>
                    <select aria-label="Cambiar rol">
                        <option value="administrador"${currentRole === "administrador" ? " selected" : ""}>Administrador</option>
                        <option value="supervisor"${currentRole === "supervisor" ? " selected" : ""}>Supervisor</option>
                        <option value="operario"${currentRole === "operario" ? " selected" : ""}>Operario</option>
                    </select>
                </label>
                <a href="login.html" class="logout-link"><span class="nav-icon">${icon("bi-box-arrow-right")}</span>Cerrar sesion</a>
            </nav>
        `;

        const headerActions = document.querySelector(".app-header .header-actions");
        if (headerActions) {
            headerActions.innerHTML = `
                <button class="notification" data-action="ver-alertas" type="button" aria-label="Ver alertas">${icon("bi-bell")}<span>${role.alerts}</span></button>
                <button class="profile-pill" data-action="ver-perfil" type="button">
                    <span class="avatar">${role.short}</span>
                    <span class="profile-copy"><strong>${role.label}</strong><span>${role.name}</span></span>
                </button>
            `;
        }

        document.body.dataset.role = currentRole;
        nav.querySelector(".role-switcher select").addEventListener("change", (event) => {
            currentRole = event.target.value;
            localStorage.setItem("aiden-role", currentRole);
            showToast(`Rol activo: ${roles[currentRole].label}`);
            setTimeout(() => {
                window.location.href = roles[currentRole].home;
            }, 500);
        });

        enforceAccess();
    }

    function enforceAccess() {
        const allowed = roles[currentRole].modules.includes(pageName);
        if (allowed) return;
        const main = document.querySelector(".main-content");
        if (!main) return;
        const role = roles[currentRole];
        main.innerHTML = `
            <section class="access-state">
                <span class="state-icon">${icon("bi-lock")}</span>
                <p class="eyebrow">Permisos del rol</p>
                <h1>Modulo no disponible para ${role.label}</h1>
                <p>Este rol solo ve los modulos que le corresponden.</p>
                <section class="compact-actions">
                    <a class="btn" href="${role.home}">${icon("bi-house")} Ir a su dashboard</a>
                    ${role.modules.slice(1, 4).map((href) => {
                        const item = modules.find((mod) => mod.href === href);
                        return `<a class="btn-outline" href="${href}">${icon(item.icon)} ${item.label}</a>`;
                    }).join("")}
                </section>
            </section>
        `;
    }

    const modal = document.createElement("section");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
        <article class="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header>
                <section>
                    <p class="eyebrow" id="modal-kicker">Accion rapida</p>
                    <h2 id="modal-title">Detalle</h2>
                </section>
                <button class="modal-close" type="button" aria-label="Cerrar">${icon("bi-x-lg")}</button>
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

    function openModal(title, body, kicker = "AiDEN") {
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
                <section class="modal-actions action-gap">
                    <button class="btn-outline modal-close" type="button">${icon("bi-x-lg")} Cancelar</button>
                    <button class="btn" type="submit">${icon("bi-check2")} ${submitLabel}</button>
                </section>
            </form>
        `;
    }

    function profileBody() {
        const role = roles[currentRole];
        const taskLabel = currentRole === "administrador" ? "Usuarios" : currentRole === "operario" ? "Tareas" : "Alertas";
        const taskValue = currentRole === "administrador" ? "9" : currentRole === "operario" ? "4" : "3";
        return `
            <section class="profile-detail">
                <section class="profile-main">
                    <span class="avatar avatar-large">${role.short}</span>
                    <section>
                        <h3>${role.label}</h3>
                        <p>${role.name} · ${role.subtitle}</p>
                    </section>
                </section>
                <section class="summary-grid">
                    <article class="metric-card"><span class="metric-label">Rol</span><strong class="metric-value">${role.label}</strong><p class="metric-note">Sesion demo activa.</p></article>
                    <article class="metric-card"><span class="metric-label">${taskLabel}</span><strong class="metric-value">${taskValue}</strong><p class="metric-note">Prioridad visible para el rol.</p></article>
                    <article class="metric-card"><span class="metric-label">Alertas</span><strong class="metric-value">${role.alerts}</strong><p class="metric-note">Asignadas al usuario.</p></article>
                    <article class="metric-card"><span class="metric-label">Sede</span><strong class="metric-value">Norte</strong><p class="metric-note">Vivero Popayan.</p></article>
                </section>
            </section>
        `;
    }

    const actions = {
        "nuevo-insumo": { title: "Nuevo insumo", body: form([{ label: "Insumo", value: "Micorrizas granulares" }, { label: "Categoria", type: "select", options: ["Fertilizantes", "Sustratos", "Fitosanitario", "Herramientas"] }, { label: "Cantidad", type: "number", value: "20" }, { label: "Unidad", type: "select", options: ["kg", "bultos", "L", "unidad"] }, { label: "Stock minimo", type: "number", value: "8" }, { label: "Observaciones", type: "textarea", value: "Registro inicial para vivero norte.", full: true }], "Guardar insumo") },
        "nuevo-lote": { title: "Nuevo lote de produccion", body: form([{ label: "Numero de lote", value: "L-006" }, { label: "Especie", type: "select", options: ["Cafe Castillo", "Aguacate Hass", "Cacao CCN-51"] }, { label: "Fecha de siembra", type: "date", value: "2026-08-10" }, { label: "Cantidad", type: "number", value: "400" }, { label: "Etapa inicial", type: "select", options: ["Siembra", "Germinacion", "Crecimiento"] }, { label: "Responsable", type: "select", options: ["Juan Perez", "Maria Lopez", "Carlos Rivas"] }], "Crear lote") },
        "ver-lote": { title: "Detalle del lote L-003", body: `<section class="grid-two"><article><h3>Informacion general</h3><p>Cafe Castillo · 500 plantas · Responsable: Juan Perez.</p><p>Estado actual: Crecimiento con inspeccion pendiente.</p></article><article><h3>Progreso del cultivo</h3><p>Avance estimado</p><section class="progress"><span style="width: 64%;"></span></section></article></section><ul class="activity-list"><li>08/08/2026 · Humedad del suelo revisada.</li><li>07/08/2026 · Fertilizacion NPK aplicada.</li><li>05/08/2026 · Inspeccion visual sin perdida relevante.</li></ul>` },
        "registrar-incidencia": { title: "Registrar incidencia de calidad", body: form([{ label: "Lote", type: "select", options: ["L-003", "L-005", "L-002"] }, { label: "Tipo de problema", type: "select", options: ["Roya", "Plaga", "Deficiencia nutricional", "Hongos"] }, { label: "Severidad", type: "select", options: ["Baja", "Media", "Alta"] }, { label: "Fecha", type: "date", value: "2026-08-10" }, { label: "Descripcion", type: "textarea", value: "Sintomas visibles en hojas jovenes.", full: true }, { label: "Observaciones", type: "textarea", value: "Programar revision en 48 horas.", full: true }], "Registrar incidencia") },
        "consultar-trazabilidad": { title: "Trazabilidad del lote L-003", body: `<p><strong>Lote:</strong> L-003 · <strong>Especie:</strong> Cafe Castillo · <strong>Responsable:</strong> Juan Perez</p><ul class="timeline"><li><small>12/05/2026</small><strong>Siembra</strong><p>500 semillas registradas.</p></li><li><small>18/05/2026</small><strong>Germinacion</strong><p>420 plantas germinadas.</p></li><li><small>25/05/2026</small><strong>Fertilizacion</strong><p>Aplicacion de fertilizante NPK.</p></li><li><small>02/06/2026</small><strong>Inspeccion</strong><p>Sin incidencias.</p></li></ul>` },
        "generar-reporte": { title: "Vista previa del reporte", body: `<section class="summary-grid"><article class="metric-card"><span class="metric-label">Lotes</span><strong class="metric-value">18</strong><p class="metric-note">12 activos, 4 en seguimiento.</p></article><article class="metric-card"><span class="metric-label">Inventario</span><strong class="metric-value">86%</strong><p class="metric-note">Disponibilidad general.</p></article><article class="metric-card"><span class="metric-label">Alertas</span><strong class="metric-value">5</strong><p class="metric-note">2 ambientales, 2 calidad, 1 stock.</p></article><article class="metric-card"><span class="metric-label">Periodo</span><strong class="metric-value">30d</strong><p class="metric-note">Resumen.</p></article></section>` },
        "nuevo-usuario": { title: "Nuevo usuario", body: form([{ label: "Nombre completo", value: "Laura Martinez" }, { label: "Correo", type: "email", value: "laura@aiden.co" }, { label: "Rol", type: "select", options: ["Administrador", "Supervisor", "Operario"] }, { label: "Estado", type: "select", options: ["Activo", "Pendiente", "Inactivo"] }, { label: "Contrasena temporal", type: "password", value: "Aiden2026" }, { label: "Notas", type: "textarea", value: "Acceso inicial al vivero norte.", full: true }], "Guardar usuario") },
        "nuevo-centro-costo": { title: "Nuevo centro de costo", body: form([{ label: "Nombre", value: "Produccion cacao" }, { label: "Codigo", value: "CC-008" }, { label: "Modulo principal", type: "select", options: ["Produccion", "Calidad", "Inventario", "Ambiental"] }, { label: "Responsable", type: "select", options: ["Supervisor Vivero", "Administrador AiDEN", "Ana Calidad"] }, { label: "Descripcion", type: "textarea", value: "Costos asociados a lotes de cacao en etapa de crecimiento.", full: true }], "Crear centro") },
        "restablecer-contrasena": { title: "Restablecer contrasena", body: form([{ label: "Usuario", type: "select", options: ["Laura Martinez", "Juan Perez", "Maria Lopez", "Carlos Rivas"] }, { label: "Correo", type: "email", value: "laura@aiden.co" }, { label: "Motivo", type: "select", options: ["Solicitud del usuario", "Bloqueo por intentos", "Actualizacion de seguridad"] }], "Enviar enlace") },
        "agregar-costo": { title: "Agregar costo operativo", body: form([{ label: "Origen", type: "select", options: ["Compra inventario", "Jornada", "Tratamiento", "Transporte", "Servicio externo"] }, { label: "Lote", type: "select", options: ["LOT-2026-001", "LOT-2026-002", "LOT-2026-006"] }, { label: "Centro de costo", type: "select", options: ["Produccion cafe", "Calidad fitosanitaria", "Inventario"] }, { label: "Valor", type: "number", value: "60000" }, { label: "Descripcion", type: "textarea", value: "Transporte de sustrato desde proveedor.", full: true }], "Guardar costo") },
        "cierre-mensual": { title: "Cierre mensual", body: `<section class="summary-grid"><article class="metric-card"><span class="metric-label">Periodo</span><strong class="metric-value">Jun</strong><p class="metric-note">2026 listo para validar.</p></article><article class="metric-card"><span class="metric-label">Costos</span><strong class="metric-value">$8.4M</strong><p class="metric-note">3 registros por validar.</p></article><article class="metric-card"><span class="metric-label">Lotes</span><strong class="metric-value">18</strong><p class="metric-note">12 activos, 6 cerrados.</p></article><article class="metric-card"><span class="metric-label">Estado</span><strong class="metric-value">95%</strong><p class="metric-note">Conciliacion simulada.</p></article></section><p>Revise los costos por validar antes de confirmar el cierre del periodo.</p><section class="modal-actions"><button class="btn-outline modal-close" type="button">${icon("bi-arrow-left")} Volver</button><button class="btn" data-action="confirmar-cierre" type="button">${icon("bi-check2-circle")} Confirmar cierre</button></section>` },
        "asignar-tarea": { title: "Asignar tarea", body: form([{ label: "Responsable", type: "select", options: ["Maria Lopez", "Carlos Rivas", "Juan Perez"] }, { label: "Lote", type: "select", options: ["L-003", "L-002", "L-005"] }, { label: "Tipo de tarea", type: "select", options: ["Inspeccion", "Riego", "Fertilizacion", "Verificacion ambiental"] }, { label: "Fecha", type: "date", value: "2026-08-13" }, { label: "Detalle", type: "textarea", value: "Revisar estado del lote y registrar evidencia.", full: true }], "Asignar tarea") },
        "actualizar-datos": { title: "Lecturas actualizadas", body: `<section class="summary-grid"><article class="metric-card"><span class="metric-label">Temperatura</span><strong class="metric-value">24 C</strong><p class="metric-note">Dato recibido hace 1 min.</p></article><article class="metric-card"><span class="metric-label">Humedad</span><strong class="metric-value">72%</strong><p class="metric-note">Dentro del rango.</p></article><article class="metric-card"><span class="metric-label">Suelo</span><strong class="metric-value">61%</strong><p class="metric-note">Lote L-003 en observacion.</p></article><article class="metric-card"><span class="metric-label">Luminosidad</span><strong class="metric-value">680</strong><p class="metric-note">Lux promedio.</p></article></section>` },
        "ver-perfil": { title: "Perfil de usuario", body: profileBody },
        "ver-alertas": { title: "Centro de alertas", body: `<ul class="alert-list"><li class="danger">Lote L-005 con incidencia de calidad alta.</li><li class="warning">Sustrato organico por debajo del stock minimo.</li><li class="warning">Humedad del suelo en L-003 requiere revision.</li><li>Reporte semanal listo para validar.</li></ul>` }
    };

    function enhanceActionButtons() {
        document.querySelectorAll("[data-action]").forEach((button) => {
            const action = button.dataset.action;
            if (!actionIcons[action] || button.dataset.enhanced) return;
            const label = button.textContent.trim() || button.getAttribute("aria-label") || "Accion";
            const tableCell = button.closest("td");
            button.dataset.enhanced = "true";
            button.title = label;
            button.setAttribute("aria-label", label);
            if (tableCell) {
                button.classList.add("icon-btn");
                button.innerHTML = icon(action.includes("ver") || label.toLowerCase().includes("ver") ? "bi-eye" : actionIcons[action]);
                return;
            }
            button.innerHTML = `${icon(actionIcons[action])}<span>${label.replace(/^\+\s*/, "")}</span>`;
        });
    }

    function enableTableSearch() {
        document.querySelectorAll(".panel-card").forEach((panel) => {
            const input = panel.querySelector('input[type="search"]');
            const table = panel.querySelector(".data-table tbody");
            if (!input || !table || input.dataset.searchReady) return;
            input.dataset.searchReady = "true";
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "No hay registros que coincidan con la busqueda.";
            table.closest(".table-wrap").after(empty);
            input.addEventListener("input", () => {
                const term = input.value.trim().toLowerCase();
                let visible = 0;
                table.querySelectorAll("tr").forEach((row) => {
                    const match = row.textContent.toLowerCase().includes(term);
                    row.hidden = !match;
                    if (match) visible += 1;
                });
                empty.classList.toggle("open", visible === 0);
            });
        });
    }

    function simulateLoading(button, done) {
        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Procesando</span>`;
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = original;
            done();
        }, 650);
    }

    ensureIcons();
    renderShell();
    enhanceActionButtons();
    enableTableSearch();

    document.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        const action = actions[actionButton.dataset.action];
        if (action) {
            const open = () => openModal(action.title, typeof action.body === "function" ? action.body() : action.body);
            if (["generar-reporte", "actualizar-datos"].includes(actionButton.dataset.action)) {
                simulateLoading(actionButton, open);
                return;
            }
            open();
            return;
        }

        if (actionButton.dataset.action === "exportar-pdf") {
            simulateLoading(actionButton, () => showToast("PDF simulado listo para descargar."));
            return;
        }

        if (actionButton.dataset.action === "exportar-excel") {
            simulateLoading(actionButton, () => showToast("Excel simulado listo para descargar."));
            return;
        }

        if (actionButton.dataset.action === "confirmar-cierre") {
            modal.classList.remove("open");
            showToast("Cierre mensual confirmado en el prototipo.");
        }
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest(".modal-close")) {
            modal.classList.remove("open");
        }
    });

    modal.addEventListener("submit", (event) => {
        if (!event.target.matches("[data-modal-form]")) return;
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

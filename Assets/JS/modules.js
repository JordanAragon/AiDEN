(function () {
    const userNav = document.querySelector(".user-logout");
    if (userNav) {
        const sessionLink = userNav.querySelector("a");
        const rawSession = sessionLink ? sessionLink.textContent.trim() : "Usuario · Cerrar sesión";
        const role = rawSession.split("·")[0].trim() || "Usuario";
        const profileName = role === "Administrador" ? "Administrador AiDEN" : role === "Operario" ? "Operario Campo" : "Supervisor Vivero";
        const initials = profileName
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();

        userNav.innerHTML = `
            <button class="profile-trigger" type="button" aria-haspopup="true" aria-expanded="false">
                <span class="avatar" aria-hidden="true">${initials}</span>
                <span class="profile-copy">
                    <strong>${profileName}</strong>
                    <span>${role}</span>
                </span>
            </button>
            <section class="profile-menu" aria-label="Opciones de perfil">
                <button type="button" data-action="switch-user">Cambiar de usuario</button>
                <a class="logout-link" href="login.html">Cerrar sesión</a>
            </section>
        `;

        const trigger = userNav.querySelector(".profile-trigger");
        const menu = userNav.querySelector(".profile-menu");

        trigger.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("open");
            trigger.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", (event) => {
            if (!userNav.contains(event.target)) {
                menu.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            }
        });

        const roleMap = {
            Operario: ["produccion.html", "trazabilidad.html", "ambiental.html", "personal.html"],
            Supervisor: ["inventario.html", "produccion.html", "trazabilidad.html", "ambiental.html", "calidad-alertas.html", "personal.html", "costos.html", "reportes-dashboard.html"],
            Administrador: ["configuracion.html", "inventario.html", "produccion.html", "trazabilidad.html", "ambiental.html", "calidad-alertas.html", "personal.html", "costos.html", "reportes-dashboard.html"]
        };
        const reportLink = document.querySelector('.nav-menu a[href="reportes-dashboard.html"]');
        if (reportLink && !document.querySelector('.nav-menu a[href="costos.html"]')) {
            const costItem = document.createElement("li");
            costItem.innerHTML = '<a href="costos.html">Costos</a>';
            reportLink.closest("li").before(costItem);
        }
        const allowed = roleMap[role] || roleMap.Supervisor;
        const currentPage = window.location.pathname.split("/").pop();
        document.querySelectorAll(".nav-menu a").forEach((link) => {
            const page = link.getAttribute("href");
            const label = link.textContent.trim();
            link.setAttribute("title", label);
            link.setAttribute("aria-label", label);
            if (page === currentPage) {
                link.classList.add("active");
            }
            if (link.classList.contains("active")) {
                link.setAttribute("aria-current", "page");
            }
            if (page === "calidad-alertas.html" && !link.querySelector(".nav-badge, .badge-danger")) {
                const badge = document.createElement("span");
                badge.className = "nav-badge";
                badge.textContent = "4";
                badge.setAttribute("aria-label", "4 alertas críticas");
                link.appendChild(badge);
            }
            if (!allowed.includes(page)) {
                link.closest("li").setAttribute("data-role-hidden", "true");
            }
        });
    }

    const modal = document.createElement("section");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
        <article class="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header>
                <section>
                    <p class="eyebrow" id="modal-kicker">Acción rápida</p>
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

    function openModal(title, body, kicker = "Acción rápida") {
        modal.querySelector("#modal-kicker").textContent = kicker;
        modal.querySelector("#modal-title").textContent = title;
        modal.querySelector("#modal-body").innerHTML = body;
        modal.classList.add("open");
        modal.querySelector(".modal-close").focus();
    }

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function modalForm(fields, submitLabel = "Guardar", note = "") {
        const fieldMarkup = fields.map((field) => {
            const full = field.full ? " full" : "";
            const value = field.value || "";
            const safeLabel = escapeHTML(field.label);
            const safeValue = escapeHTML(value);
            if (field.type === "select") {
                const options = field.options.map((option) => `<option${option === value ? " selected" : ""}>${escapeHTML(option)}</option>`).join("");
                return `<label class="field${full}">${safeLabel}<select required>${options}</select></label>`;
            }
            if (field.type === "textarea") {
                return `<label class="field${full}">${safeLabel}<textarea required>${safeValue}</textarea></label>`;
            }
            return `<label class="field${full}">${safeLabel}<input type="${field.type || "text"}" value="${safeValue}" ${field.readonly ? "readonly" : ""} required></label>`;
        }).join("");

        return `
            <form class="modal-form" data-modal-form>
                <section class="form-grid">${fieldMarkup}</section>
                ${note ? `<p class="form-note">${note}</p>` : ""}
                <section class="modal-actions">
                    <button class="btn-outline modal-close" type="button">Cancelar</button>
                    <button class="btn" type="submit">${submitLabel}</button>
                </section>
            </form>
        `;
    }

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
        showToast("Acción registrada y visible en auditoría del módulo.");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            modal.classList.remove("open");
            document.querySelector(".profile-menu.open")?.classList.remove("open");
        }
    });

    const actionTexts = {
        "Nuevo usuario": {
            title: "Nuevo usuario",
            body: modalForm([
                { label: "Nombre completo", value: "María López Campo" },
                { label: "Correo único", type: "email", value: "maria@vivero.com" },
                { label: "Rol", type: "select", value: "Operario", options: ["Operario", "Supervisor", "Administrador"] },
                { label: "Estado", type: "select", value: "Activo", options: ["Activo", "Inactivo"] },
                { label: "Contraseña temporal", type: "password", value: "Temporal123" },
                { label: "Acción segura", type: "select", value: "Generar temporal de un solo uso", options: ["Generar temporal de un solo uso", "Mantener contraseña actual"] }
            ], "Guardar usuario", "Permiso: solo Administrador. El cambio queda auditado.")
        },
        "Nuevo centro de costo": {
            title: "Nuevo centro de costo",
            body: modalForm([
                { label: "Código", value: "CC-PROD-CAF" },
                { label: "Nombre", value: "Producción café" },
                { label: "Vivero / sede", type: "select", value: "Vivero Popayán · Sede Norte", options: ["Vivero Popayán · Sede Norte", "Vivero Popayán · Sede Sur"] },
                { label: "Responsable", type: "select", value: "Supervisor Vivero", options: ["Supervisor Vivero", "Administrador AiDEN"] },
                { label: "Estado", type: "select", value: "Activo", options: ["Activo", "Inactivo"] },
                { label: "Uso ERP", type: "textarea", value: "Imputación de insumos, jornadas, tratamientos y otros costos de lotes de café.", full: true }
            ], "Guardar centro de costo", "El centro queda disponible para compras, inventario, personal, costos y reportes.")
        },
        "Guardar usuario": {
            title: "Usuario guardado",
            body: "<p>Los cambios quedan auditados con usuario responsable, fecha, campo anterior y valor nuevo.</p>"
        },
        "Restablecer contraseña": {
            title: "Contraseña temporal generada",
            body: "<p>El usuario deberá cambiarla al iniciar sesión. La contraseña no se guarda en texto plano.</p>"
        },
        "Abrir": {
            title: "Perfil rápido del registro",
            body: `
                <dl class="detail-list">
                    <div><dt>Producto</dt><dd>Sustrato orgánico</dd></div>
                    <div><dt>Stock</dt><dd>18 sacos · umbral mínimo 20</dd></div>
                    <div><dt>Último movimiento</dt><dd>Entrada compra · 2026-06-03</dd></div>
                    <div><dt>Acciones por rol</dt><dd>Supervisor puede registrar entrada o ajuste; Operario solo consulta.</dd></div>
                </dl>
                <section class="modal-actions"><button class="btn" type="button" data-toast="Movimiento revisado">Marcar revisado</button></section>
            `
        },
        "Registrar entrada": {
            title: "Registrar entrada",
            body: modalForm([
                { label: "Tipo de movimiento", type: "select", value: "Compra", options: ["Compra", "Ajuste positivo", "Donación"] },
                { label: "Cantidad recibida", type: "number", value: "20" },
                { label: "Proveedor", type: "select", value: "BioTierra", options: ["BioTierra", "AgroAndes", "CampoVerde"] },
                { label: "Factura o remisión", value: "FAC-2480" },
                { label: "Vencimiento agroquímico", type: "date", value: "2026-06-25" },
                { label: "Justificación", type: "textarea", value: "Compra recibida y verificada contra factura.", full: true }
            ], "Registrar entrada", "El movimiento no se edita después; cualquier corrección crea un ajuste justificado.")
        },
        "Nuevo insumo": {
            title: "Nuevo insumo y proveedor",
            body: modalForm([
                { label: "Proveedor", value: "AgroAndes S.A.S." },
                { label: "Correo", type: "email", value: "compras@agroandes.com" },
                { label: "Tipo proveedor", type: "select", value: "Insumos químicos", options: ["Insumos químicos", "Sustratos", "Semillas"] },
                { label: "Insumo", value: "Fungicida cobre 1L" },
                { label: "Stock inicial", type: "number", value: "12" },
                { label: "Precio referencia", type: "number", value: "38000" },
                { label: "Datos técnicos", type: "textarea", value: "Periodo de carencia 7 días. Clase toxicológica III.", full: true }
            ], "Crear insumo")
        },
        "Registrar inventario vivo": {
            title: "Registrar inventario vivo",
            body: modalForm([
                { label: "Tipo", type: "select", value: "Plántulas", options: ["Plantas", "Plántulas", "Lote de cultivo"] },
                { label: "Especie", type: "select", value: "Café Castillo", options: ["Café Castillo", "Tomate", "Lechuga"] },
                { label: "Código", value: "VIV-CAF-001" },
                { label: "Cantidad viva", type: "number", value: "1240" },
                { label: "Ubicación", type: "select", value: "Cama 3", options: ["Cama 3", "Germinación norte", "Crecimiento sur"] },
                { label: "Valor unitario", type: "number", value: "1250" },
                { label: "Estado sanitario", type: "select", value: "Activo", options: ["Activo", "Seguimiento", "Perdido"] },
                { label: "Observaciones", type: "textarea", value: "Plántulas aptas para seguimiento productivo.", full: true }
            ], "Guardar inventario vivo", "El registro queda disponible para valorización, trazabilidad y reportes.")
        },
        "Registrar compra": {
            title: "Registrar compra",
            body: modalForm([
                { label: "Proveedor", type: "select", value: "AgroAndes", options: ["AgroAndes", "BioTierra", "CampoVerde"] },
                { label: "Insumo", type: "select", value: "Fertilizante NPK", options: ["Fertilizante NPK", "Sustrato orgánico", "Bandejas germinadoras"] },
                { label: "Cantidad", type: "number", value: "50" },
                { label: "Costo unitario", type: "number", value: "4200" },
                { label: "Factura", value: "FAC-2591" },
                { label: "Fecha de compra", type: "date", value: "2026-06-05" },
                { label: "Soporte y observaciones", type: "textarea", value: "Compra para restablecer stock mínimo y prevenir agotamiento.", full: true }
            ], "Guardar compra", "La compra crea entrada de inventario, actualiza valorización y conserva proveedor.")
        },
        "Abrir lote": {
            title: "Abrir lote",
            body: modalForm([
                { label: "Tipo de cultivo", type: "select", value: "Tomate", options: ["Tomate", "Lechuga", "Café"] },
                { label: "Ciclo asociado", value: "Tomate estándar", readonly: true },
                { label: "Código de lote", value: "LOT-2026-001" },
                { label: "Zona", type: "select", value: "Germinación norte", options: ["Germinación norte", "Crecimiento sur"] },
                { label: "Unidades sembradas", type: "number", value: "500" },
                { label: "Responsable", type: "select", value: "Operario Campo", options: ["Operario Campo", "María López"] },
                { label: "Observaciones iniciales", type: "textarea", value: "Semilla lote S-248, sustrato BioTierra.", full: true }
            ], "Crear lote", "El código y QR quedan permanentes durante todo el ciclo.")
        },
        "Clonar ciclo": {
            title: "Clonar ciclo productivo",
            body: "<p>Se crea una copia editable del ciclo seleccionado sin alterar lotes activos ni el historial previo.</p>"
        },
        "Registrar actividad": {
            title: "Registrar actividad",
            body: modalForm([
                { label: "Lote", type: "select", value: "LOT-2026-001", options: ["LOT-2026-001", "LOT-2026-002"] },
                { label: "Fase actual", value: "Germinación", readonly: true },
                { label: "Tipo actividad", type: "select", value: "Riego", options: ["Riego", "Fertilización", "Corrección"] },
                { label: "Fecha y hora", type: "datetime-local", value: "2026-06-05T09:00" },
                { label: "Insumo consumido", type: "select", value: "Solución nutritiva A", options: ["Solución nutritiva A", "Sustrato orgánico"] },
                { label: "Cantidad", type: "number", value: "2" },
                { label: "Descripción", type: "textarea", value: "Riego de germinación con solución nutritiva controlada.", full: true }
            ], "Registrar actividad", "El consumo genera movimiento en Inventario, pero se origina desde Cultivos.")
        },
        "Registrar cosecha": {
            title: "Registrar cosecha",
            body: modalForm([
                { label: "Lote", type: "select", value: "LOT-2026-006", options: ["LOT-2026-006", "L-2026-001"] },
                { label: "Especie", value: "Tomate", readonly: true },
                { label: "Fecha de cosecha", type: "date", value: "2026-06-30" },
                { label: "Cantidad cosechada", type: "number", value: "476" },
                { label: "Estado final", type: "select", value: "Cosechado", options: ["Producción", "Cosechado", "Perdido"] },
                { label: "Evidencias", value: "cosecha-1.jpg, cosecha-2.jpg" },
                { label: "Observaciones", type: "textarea", value: "Cosecha parcial con calidad A predominante.", full: true }
            ], "Guardar cosecha", "Actualiza producción, inventario vivo, trazabilidad y reportes.")
        },
        "Predicción IA": {
            title: "Predicción de cosecha mediante IA",
            body: `
                <dl class="detail-list">
                    <div><dt>Lote</dt><dd>L-2026-001 · Café Castillo</dd></div>
                    <div><dt>Cosecha estimada</dt><dd>2026-11-08 con rango de confianza del 82%.</dd></div>
                    <div><dt>Factores</dt><dd>Ciclo de 180 días, humedad estable, crecimiento normal y sin incidencias críticas.</dd></div>
                    <div><dt>Recomendación</dt><dd>Mantener inspección semanal y revisar trasplante programado.</dd></div>
                </dl>
            `
        },
        "Registrar justificación": {
            title: "Justificar avance de fase",
            body: modalForm([
                { label: "Lote", type: "select", value: "LOT-2026-001", options: ["LOT-2026-001", "LOT-2026-002"] },
                { label: "Limitante", value: "Humedad de sustrato fuera de rango", readonly: true },
                { label: "Justificación", type: "textarea", value: "Se autoriza avance por revisión agronómica presencial y corrección aplicada al sustrato.", full: true }
            ], "Guardar justificación")
        },
        "Registrar merma": {
            title: "Registrar baja o merma",
            body: modalForm([
                { label: "Cantidad", type: "number", value: "24" },
                { label: "Motivo", type: "select", value: "Plagas", options: ["Plagas", "Condiciones ambientales adversas", "Error operativo", "Descarte por calidad"] },
                { label: "Fecha ocurrencia", type: "date", value: "2026-06-05" },
                { label: "Pérdida total", type: "select", value: "No aplica", options: ["No aplica", "Confirmo cierre por pérdida"] },
                { label: "Descripción", type: "textarea", value: "Plántulas con daño irreversible en cama 2, evidencia fotográfica adjunta.", full: true }
            ], "Registrar merma")
        },
        "Descargar QR PNG": {
            title: "QR descargado",
            body: "<p>Se prepara la etiqueta del lote consultado con código, cultivo, fecha de inicio y zona.</p>"
        },
        "Generar informe PDF": {
            title: "Informe generado",
            body: "<p>El PDF consolida origen, responsables, línea de tiempo, evidencias y estado final del lote.</p>"
        },
        "Reporte ICA": {
            title: "Reporte ICA",
            body: modalForm([
                { label: "Lote", type: "select", value: "LOT-2026-001", options: ["LOT-2026-001", "L-2026-001", "B-003"] },
                { label: "Periodo", value: "2026-06-01 a 2026-06-30" },
                { label: "Incluir", type: "select", value: "Eventos fitosanitarios y cosechas", options: ["Eventos fitosanitarios y cosechas", "Historia completa", "Solo aplicaciones"] },
                { label: "Responsable", type: "select", value: "Supervisor Vivero", options: ["Supervisor Vivero", "Ana Calidad"] },
                { label: "Observaciones", type: "textarea", value: "Reporte con identificación única, fechas, aplicaciones, responsables y evidencias.", full: true }
            ], "Generar reporte ICA", "El informe queda disponible en PDF y conserva auditoría de generación.")
        },
        "Histórico": {
            title: "Histórico ambiental",
            body: "<p>Se abre la consulta por sensor, zona, variable y rango de fechas para comparación entre periodos.</p>"
        },
        "Historial": {
            title: "Historial del módulo",
            body: modalForm([
                { label: "Tipo de evento", type: "select", value: "Todos", options: ["Todos", "Alertas", "Incidencias", "Tratamientos", "Auditoría"] },
                { label: "Estado", type: "select", value: "Todos", options: ["Todos", "Pendiente", "Atendida", "Cerrada"] },
                { label: "Fecha inicial", type: "date", value: "2026-06-01" },
                { label: "Fecha final", type: "date", value: "2026-06-30" }
            ], "Consultar historial")
        },
        "Nuevo sensor": {
            title: "Nuevo sensor",
            body: modalForm([
                { label: "Alias", value: "S-03 Humedad Germinación" },
                { label: "Variable", type: "select", value: "Humedad del sustrato", options: ["Temperatura ambiental", "Humedad relativa", "Humedad del sustrato", "pH del suelo", "Luminosidad PAR", "CO2"] },
                { label: "Unidad", value: "%" },
                { label: "Zona", type: "select", value: "Germinación norte", options: ["Germinación norte", "Crecimiento sur"] },
                { label: "Serial", value: "SEN-GER-03" },
                { label: "Estado", type: "select", value: "Activo", options: ["Activo", "Inactivo", "En mantenimiento"] }
            ], "Guardar sensor")
        },
        "Automatizar riego": {
            title: "Automatización de riego",
            body: modalForm([
                { label: "Zona", type: "select", value: "Germinación norte", options: ["Germinación norte", "Crecimiento sur"] },
                { label: "Sensor disparador", type: "select", value: "S-03 Humedad Germinación", options: ["S-03 Humedad Germinación", "S-04 Humedad Germinación"] },
                { label: "Umbral de activación", value: "Menor a 55%" },
                { label: "Duración", value: "18 minutos" },
                { label: "Modo", type: "select", value: "Confirmación supervisor", options: ["Confirmación supervisor", "Automático", "Solo recomendación"] },
                { label: "Regla IA", type: "textarea", value: "Activar si la tendencia baja se mantiene y no hay lluvia o saturación detectada.", full: true }
            ], "Guardar regla de riego", "La regla genera eventos ambientales y queda vinculada al lote activo.")
        },
        "Configurar umbral": {
            title: "Configurar umbral",
            body: modalForm([
                { label: "Cultivo", type: "select", value: "Tomate", options: ["Tomate", "Lechuga"] },
                { label: "Fase", type: "select", value: "Germinación", options: ["Germinación", "Crecimiento"] },
                { label: "Variable", type: "select", value: "Humedad del sustrato", options: ["Humedad del sustrato", "Conductividad eléctrica"] },
                { label: "Rango óptimo", value: "65% - 78%" },
                { label: "Advertencia", value: "55-64% / 79-85%" },
                { label: "Crítico", value: "<55% / >85%" }
            ], "Guardar umbral")
        },
        "Nueva limitante": {
            title: "Nueva limitante técnica",
            body: modalForm([
                { label: "Nombre", value: "Riego nutritivo cada 48 horas" },
                { label: "Tipo", type: "select", value: "Actividad obligatoria", options: ["Actividad obligatoria", "Consumo mínimo de insumo", "Condición ambiental"] },
                { label: "Cultivo", type: "select", value: "Tomate", options: ["Tomate", "Lechuga"] },
                { label: "Fase", type: "select", value: "Germinación", options: ["Germinación", "Crecimiento"] },
                { label: "Criticidad", type: "select", value: "Crítico", options: ["Crítico", "Advertencia"] },
                { label: "Valor o condición", value: "Actividad Riego registrada antes del cierre", full: true }
            ], "Guardar limitante")
        },
        "Atender alerta": {
            title: "Atender alerta",
            body: modalForm([
                { label: "Estado", type: "select", value: "Atendida", options: ["Pendiente", "Atendida", "Cerrada"] },
                { label: "Responsable", type: "select", value: "Supervisor Vivero", options: ["Supervisor Vivero", "Administrador AiDEN"] },
                { label: "Seguimiento", type: "textarea", value: "Compra urgente programada o revisión inmediata asignada.", full: true }
            ], "Guardar seguimiento", "El historial conserva cada comentario y cambio de estado.")
        },
        "Reportar incidencia": {
            title: "Reportar incidencia",
            body: modalForm([
                { label: "Lote afectado", type: "select", value: "LOT-2026-002", options: ["LOT-2026-002", "LOT-2026-001"] },
                { label: "Tipo", type: "select", value: "Plaga", options: ["Plaga", "Enfermedad fúngica", "Deficiencia nutricional", "Daño ambiental"] },
                { label: "Porcentaje afectado", type: "number", value: "12" },
                { label: "Fecha y hora", type: "datetime-local", value: "2026-06-05T08:40" },
                { label: "Síntomas observados", type: "textarea", value: "Manchas circulares y presencia visible de insecto en hojas jóvenes.", full: true },
                { label: "Evidencias", value: "plaga-1.jpg, plaga-2.jpg", full: true }
            ], "Crear alerta crítica")
        },
        "Nueva inspección": {
            title: "Nueva inspección de calidad",
            body: modalForm([
                { label: "Lote", type: "select", value: "B-003", options: ["B-003", "LOT-2026-002", "LOT-2026-001"] },
                { label: "Inspector", type: "select", value: "Ana Calidad", options: ["Ana Calidad", "Supervisor Vivero"] },
                { label: "Tipo", type: "select", value: "Evaluación fitosanitaria", options: ["Evaluación fitosanitaria", "Clasificación de plantas", "Seguimiento de tratamiento"] },
                { label: "Severidad", type: "select", value: "Media", options: ["Baja", "Media", "Alta"] },
                { label: "Evidencias", value: "roya-b003-1.jpg, roya-b003-2.jpg" },
                { label: "Hallazgos", type: "textarea", value: "Síntomas compatibles con roya en hojas medias. Requiere tratamiento preventivo.", full: true }
            ], "Guardar inspección", "La inspección puede crear incidencia, tratamiento o recomendación IA.")
        },
        "Clasificar plantas": {
            title: "Clasificar plantas",
            body: modalForm([
                { label: "Lote", type: "select", value: "B-003", options: ["B-003", "LOT-2026-002"] },
                { label: "Muestra evaluada", type: "number", value: "120" },
                { label: "Clasificación", type: "select", value: "B", options: ["A", "B", "C", "Descarte"] },
                { label: "Motivo", value: "Roya con severidad media" },
                { label: "Recomendación IA", value: "Fungicida X y revisión en 7 días", readonly: true },
                { label: "Observaciones", type: "textarea", value: "Mantener separado del lote sano hasta confirmar respuesta al tratamiento.", full: true }
            ], "Guardar clasificación")
        },
        "Nuevo tratamiento": {
            title: "Tratamiento aplicado",
            body: modalForm([
                { label: "Incidencia", type: "select", value: "INC-18 · LOT-2026-002", options: ["INC-18 · LOT-2026-002"] },
                { label: "Insumo", type: "select", value: "Fungicida cobre", options: ["Fungicida cobre", "Corrector nutricional Ca"] },
                { label: "Cantidad y unidad", value: "1.5 L" },
                { label: "Método", type: "select", value: "Aspersión", options: ["Aspersión", "Drench", "Fertirriego", "Aplicación foliar"] },
                { label: "Fecha revisión", type: "date", value: "2026-06-12" },
                { label: "Despacho más temprano", type: "date", value: "2026-06-19", readonly: true }
            ], "Registrar tratamiento")
        },
        "Nueva tarea": {
            title: "Nueva tarea",
            body: modalForm([
                { label: "Operario", type: "select", value: "María López", options: ["María López", "Juan Riego", "Ana Calidad"] },
                { label: "Actividad", type: "select", value: "Riego", options: ["Riego", "Inspección visual", "Fertilización"] },
                { label: "Lote o zona", value: "LOT-2026-001" },
                { label: "Prioridad", type: "select", value: "Alta", options: ["Alta", "Media", "Baja"] },
                { label: "Hora", type: "time", value: "08:00" },
                { label: "Fecha límite", type: "date", value: "2026-06-05" },
                { label: "Observaciones", type: "textarea", value: "Revisar humedad antes de aplicar.", full: true }
            ], "Asignar tarea")
        },
        "Nuevo trabajador": {
            title: "Nuevo trabajador",
            body: modalForm([
                { label: "Nombre completo", value: "María López Campo" },
                { label: "Cargo", type: "select", value: "Operario", options: ["Operario", "Técnico", "Supervisor"] },
                { label: "Zona habitual", type: "select", value: "Germinación norte", options: ["Germinación norte", "Crecimiento sur"] },
                { label: "Teléfono", type: "tel", value: "310 000 0000" },
                { label: "Fecha ingreso", type: "date", value: "2026-01-15" },
                { label: "Usuario vinculado", type: "select", value: "maria@vivero.com", options: ["maria@vivero.com", "Sin usuario"] },
                { label: "Observaciones", type: "textarea", value: "Turno mañana, fuerte en trasplante.", full: true }
            ], "Guardar trabajador")
        },
        "Registrar jornada": {
            title: "Registrar jornada",
            body: modalForm([
                { label: "Operario", type: "select", value: "Juan Riego", options: ["Juan Riego", "Ana Calidad", "María López"] },
                { label: "Rol", value: "Operario", readonly: true },
                { label: "Entrada", type: "time", value: "07:00" },
                { label: "Salida", type: "time", value: "15:30" },
                { label: "Actividades realizadas", value: "5 riegos, 2 inspecciones, 1 fertilización" },
                { label: "Novedades", type: "textarea", value: "Sin novedades de seguridad. Actividades enlazadas a lotes asignados.", full: true }
            ], "Guardar jornada", "Actualiza productividad, historial de acciones y reportes de personal.")
        },
        "Agregar otro costo": {
            title: "Agregar otro costo del lote",
            body: modalForm([
                { label: "Lote", type: "select", value: "LOT-2026-001", options: ["LOT-2026-001", "LOT-2026-006", "L-2026-001"] },
                { label: "Centro de costo", type: "select", value: "Producción tomate", options: ["Producción tomate", "Producción café", "Calidad fitosanitaria"] },
                { label: "Tipo", type: "select", value: "Transporte", options: ["Transporte", "Servicio externo", "Arriendo de equipo", "Mantenimiento"] },
                { label: "Valor", type: "number", value: "60000" },
                { label: "Documento soporte", value: "OC-0605-001" },
                { label: "Descripción", type: "textarea", value: "Transporte de sustrato desde proveedor hacia bodega de producción.", full: true }
            ], "Guardar costo", "El costo se imputa al lote y queda disponible para cierre mensual.")
        },
        "Cierre mensual": {
            title: "Cierre mensual de costos",
            body: `
                <dl class="detail-list">
                    <div><dt>Periodo</dt><dd>Junio 2026</dd></div>
                    <div><dt>Validaciones</dt><dd>Compras imputadas, jornadas completas, tratamientos revisados y otros costos con soporte.</dd></div>
                    <div><dt>Resultado</dt><dd>Costo por lote, cultivo, centro de costo y vivero listo para reporte ejecutivo.</dd></div>
                    <div><dt>Regla</dt><dd>El cierre bloquea ajustes directos; las correcciones se registran como movimientos del periodo siguiente.</dd></div>
                </dl>
            `
        },
        "Copiar plan anterior": {
            title: "Plan copiado",
            body: "<p>Replica las tareas del día anterior como borrador para ajustar responsables, horarios y lotes.</p>"
        },
        "Dashboard ejecutivo": {
            title: "Dashboard ejecutivo",
            body: `
                <dl class="detail-list">
                    <div><dt>Producción</dt><dd>18 lotes activos, 6 cosechas previstas y 6.8% de merma mensual.</dd></div>
                    <div><dt>Inventario</dt><dd>$18.4M valorizados, 7 alertas de stock y NPK bajo mínimo.</dd></div>
                    <div><dt>Ambiente y calidad</dt><dd>2 anomalías IA, 4 alertas críticas y 82% de plantas clasificación A.</dd></div>
                    <div><dt>Personal</dt><dd>14 activos, 68% de tareas completadas y 9 jornadas abiertas.</dd></div>
                </dl>
            `
        },
        "Exportar reporte": {
            title: "Reporte listo",
            body: "<p>Se genera un paquete con indicadores, filtros aplicados y tablas exportables en PDF y Excel.</p>"
        },
        "Actualizar cada 5 min": {
            title: "Actualización programada",
            body: "<p>El dashboard queda marcado para refrescar indicadores cada cinco minutos durante la sesión.</p>"
        },
        "Enviar prueba": {
            title: "Notificación enviada",
            body: "<p>Se registra una prueba por sistema y correo para validar destinatarios y reglas de silencio.</p>"
        },
        "Aplicar filtros": {
            title: "Filtros aplicados",
            body: modalForm([
                { label: "Búsqueda", type: "search", value: "sustrato" },
                { label: "Estado", type: "select", value: "Todos", options: ["Todos", "Normal", "Bajo", "Crítico"] },
                { label: "Fecha inicial", type: "date", value: "2026-06-01" },
                { label: "Fecha final", type: "date", value: "2026-06-30" }
            ], "Aplicar")
        },
        "Tipo": {
            title: "Filtrar por tipo",
            body: modalForm([
                { label: "Tipo de alerta", type: "select", value: "Todos", options: ["Todos", "Inventario", "Ambiental", "Incidencia", "Limitante"] }
            ], "Aplicar filtro")
        },
        "Criticidad": {
            title: "Filtrar por criticidad",
            body: modalForm([
                { label: "Criticidad", type: "select", value: "Todas", options: ["Todas", "Crítica", "Advertencia", "Informativa"] }
            ], "Aplicar filtro")
        },
        "Rango de fechas": {
            title: "Filtrar por fechas",
            body: modalForm([
                { label: "Desde", type: "date", value: "2026-06-01" },
                { label: "Hasta", type: "date", value: "2026-06-30" }
            ], "Aplicar filtro")
        },
        "Zona: todas": {
            title: "Filtrar sensores por zona",
            body: modalForm([
                { label: "Zona", type: "select", value: "Todas", options: ["Todas", "Germinación norte", "Crecimiento sur"] }
            ], "Aplicar filtro")
        },
        "Variable: todas": {
            title: "Filtrar sensores por variable",
            body: modalForm([
                { label: "Variable", type: "select", value: "Todas", options: ["Todas", "Temperatura ambiental", "Humedad del sustrato", "CO2", "Luminosidad PAR"] }
            ], "Aplicar filtro")
        },
        "Filtro: actividades": {
            title: "Filtrar línea de tiempo",
            body: modalForm([
                { label: "Tipo de evento", type: "select", value: "Actividades", options: ["Actividades", "Consumos", "Alertas", "Incidencias", "Lecturas ambientales"] }
            ], "Aplicar filtro")
        },
        "Filtro: junio 2026": {
            title: "Filtrar por periodo",
            body: modalForm([
                { label: "Desde", type: "date", value: "2026-06-01" },
                { label: "Hasta", type: "date", value: "2026-06-30" }
            ], "Aplicar filtro")
        },
        "Cambiar de usuario": {
            title: "Cambiar de usuario",
            body: modalForm([
                { label: "Perfil de demostración", type: "select", value: "Supervisor", options: ["Administrador", "Supervisor", "Operario"] }
            ], "Cambiar perfil", "La navegación se ajusta al rol seleccionado.")
        }
    };

    document.querySelectorAll(".main-content button, .main-content .toolbar a, .profile-menu button").forEach((control) => {
        const text = control.textContent.trim();
        const href = control.getAttribute("href");
        if (href && href.startsWith("#")) {
            return;
        }
        control.addEventListener("click", (event) => {
            const label = control.dataset.modalAction || text || control.getAttribute("aria-label") || "Acción";
            if (["Excel", "PDF", "Exportar Excel"].includes(label)) {
                showToast(`${label} preparado con los filtros actuales.`);
                return;
            }
            const action = actionTexts[label] || {
                title: label,
                body: "<p>Esta acción ya está conectada al panel contextual del prototipo. Usa el botón principal del modal para registrar el cambio cuando aplique.</p>"
            };
            event.preventDefault();
            openModal(action.title, action.body);
        });
    });

    document.addEventListener("click", (event) => {
        const toastButton = event.target.closest("[data-toast]");
        if (!toastButton) {
            return;
        }
        modal.classList.remove("open");
        showToast(toastButton.dataset.toast);
    });
})();

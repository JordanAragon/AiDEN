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
            Supervisor: ["inventario.html", "produccion.html", "trazabilidad.html", "ambiental.html", "calidad-alertas.html", "personal.html", "reportes-dashboard.html"],
            Administrador: ["configuracion.html", "inventario.html", "produccion.html", "trazabilidad.html", "ambiental.html", "calidad-alertas.html", "personal.html", "reportes-dashboard.html"]
        };
        const allowed = roleMap[role] || roleMap.Supervisor;
        document.querySelectorAll(".nav-menu a").forEach((link) => {
            const page = link.getAttribute("href");
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

    modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest(".modal-close")) {
            modal.classList.remove("open");
        }
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
            body: "<p>Se abre el panel de usuarios con validación de correo único, rol activo y contraseña temporal de un solo uso.</p><p><strong>Permiso:</strong> solo Administrador.</p>"
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
            body: "<p>Detalle contextual en modal: stock, historial reciente, alertas asociadas y acciones permitidas según el rol activo.</p>"
        },
        "Registrar entrada": {
            title: "Registrar entrada",
            body: "<p>Se muestra el bloque de entrada con cantidad validada, proveedor obligatorio para compra y soporte documental.</p>"
        },
        "Abrir lote": {
            title: "Abrir lote",
            body: "<p>El panel de apertura genera código único, QR permanente y responsables vinculados al ciclo productivo.</p>"
        },
        "Clonar ciclo": {
            title: "Clonar ciclo productivo",
            body: "<p>Se crea una copia editable del ciclo seleccionado sin alterar lotes activos ni el historial previo.</p>"
        },
        "Descargar QR PNG": {
            title: "QR descargado",
            body: "<p>Se prepara la etiqueta del lote consultado con código, cultivo, fecha de inicio y zona.</p>"
        },
        "Generar informe PDF": {
            title: "Informe generado",
            body: "<p>El PDF consolida origen, responsables, línea de tiempo, evidencias y estado final del lote.</p>"
        },
        "Histórico": {
            title: "Histórico ambiental",
            body: "<p>Se abre la consulta por sensor, zona, variable y rango de fechas para comparación entre periodos.</p>"
        },
        "Nuevo sensor": {
            title: "Nuevo sensor",
            body: "<p>Registro rápido de alias, variable, unidad, zona, identificador único, calibración y estado.</p>"
        },
        "Reportar incidencia": {
            title: "Reportar incidencia",
            body: "<p>La incidencia queda ligada al lote, crea alerta crítica y solicita evidencias antes de cerrar.</p>"
        },
        "Nueva tarea": {
            title: "Nueva tarea",
            body: "<p>Asignación por operario, prioridad, fecha límite, lote o zona, observaciones y seguimiento de avance.</p>"
        },
        "Copiar plan anterior": {
            title: "Plan copiado",
            body: "<p>Replica las tareas del día anterior como borrador para ajustar responsables, horarios y lotes.</p>"
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
        "Cambiar de usuario": {
            title: "Cambiar de usuario",
            body: "<p>Selecciona otro perfil de demostración para validar permisos de Administrador, Supervisor u Operario.</p>"
        }
    };

    document.querySelectorAll(".main-content button, .main-content .toolbar a, .profile-menu button").forEach((control) => {
        const text = control.textContent.trim();
        const href = control.getAttribute("href");
        if (href && href.startsWith("#")) {
            return;
        }
        control.addEventListener("click", (event) => {
            const label = text || control.getAttribute("aria-label") || "Acción";
            if (["Excel", "PDF", "Exportar Excel"].includes(label)) {
                showToast(`${label} preparado con los filtros actuales.`);
                return;
            }
            const action = actionTexts[label] || {
                title: label,
                body: "<p>Acción disponible en el prototipo mediante panel contextual para evitar redirecciones innecesarias.</p>"
            };
            event.preventDefault();
            openModal(action.title, action.body);
        });
    });
})();

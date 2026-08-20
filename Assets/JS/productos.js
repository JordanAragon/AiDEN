var modal = document.querySelector("#modalNuevoLote");
var boton_nuevo = document.querySelector("[data-action='nuevo-lote']");
var boton_cerrar = document.querySelector("#cerrarModal");
var boton_cancelar = document.querySelector("#cancelarModal");
var formulario = document.querySelector("#formNuevoLote");
var tabla = document.querySelector(".data-table tbody");
var modal_ver = document.querySelector("#modalVerLote");
var boton_cerrar_ver = document.querySelector("#cerrarVerLote");
var boton_cancelar_editar = document.querySelector("#cancelarEditar");
var formulario_editar = document.querySelector("#formEditarLote");
// ESTA VARIABLE GUARDA EL LOTE QUE ESTAMOS EDITANDO
var fila_editar = null;

// ABRIR MODAL NUEVO LOTE
boton_nuevo.addEventListener("click", () => {
    modal.classList.add("open");
});
// CERRAR MODAL NUEVO LOTE
boton_cerrar.addEventListener("click", () => {
    cerrar_modal();
});
boton_cancelar.addEventListener("click", () => {
    cerrar_modal();
});
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
        cerrar_modal();
    }
});
// FUNCION PARA CERRAR MODAL

function cerrar_modal() {
    modal.classList.remove("open");
    formulario.reset();
}
// CREAR NUEVO LOTE
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    var numero_lote =
        document.querySelector("#numeroLote").value;
    var especie =
        document.querySelector("#especieLote").value;
    var fecha =
        document.querySelector("#fechaSiembra").value;
    var cantidad =
        document.querySelector("#cantidadLote").value;
    var etapa =
        document.querySelector("#etapaLote").value;
    var responsable =
        document.querySelector("#responsableLote").value;
    // CONVERTIR LA FECHA
    var fecha_formateada = convertir_fecha(fecha);
    // CREAR FILA
    var fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${numero_lote}</td>
        <td>${especie}</td>
        <td>${fecha_formateada}</td>
        <td>${cantidad}</td>
        <td>${etapa}</td>
        <td>
            <span class="badge">Activo</span>
        </td>
        <td>${responsable}</td>
        <td>
            <button
                class="btn-outline"
                data-action="ver-lote"
                type="button"
            >
                Ver lote
            </button>
        </td>
    `;
    tabla.appendChild(fila);
    cerrar_modal();
});
// CONVERTIR FECHA
function convertir_fecha(fecha) {
    var partes = fecha.split("-");
    var año = partes[0];
    var mes = partes[1];
    var dia = partes[2];
    return dia + "/" + mes + "/" + año;
}
// BOTONES "VER LOTE"
tabla.addEventListener("click", (evento) => {
    var boton = evento.target.closest("button");
    if (boton === null) {
        return;

    }
    var fila = boton.closest("tr");
    if (fila === null) {
        return;
    }
    var accion = boton.getAttribute("data-action");
    if (accion === "ver-lote") {
        ver_lote(fila);
    }
});
// VER LOTE
function ver_lote(fila) {
    fila_editar = fila;
    var numero_lote = fila.children[0].textContent;
    var especie = fila.children[1].textContent;
    var fecha = fila.children[2].textContent;
    var cantidad = fila.children[3].textContent
    var etapa = fila.children[4].textContent;
    var responsable = fila.children[6].textContent;
    // MOSTRAR LOS DATOS EN EL FORMULARIO
    document.querySelector("#editarNumeroLote").value =
        numero_lote;
    document.querySelector("#editarEspecie").value =
        especie;
    document.querySelector("#editarFecha").value =
        convertir_fecha_input(fecha);
    document.querySelector("#editarCantidad").value =
        cantidad;
    document.querySelector("#editarEtapa").value =
        etapa;
    document.querySelector("#editarResponsable").value =
        responsable;
    // CAMBIAR TITULO
    document.querySelector("#tituloVerLote").textContent =
        "Lote " + numero_lote;
    document.querySelector("#textoVerLote").textContent =
        "Consulta o modifica la información de este lote.";
    // ABRIR MODAL
    modal_ver.classList.add("open");
}
// CONVERTIR FECHA PARA INPUT DATE
function convertir_fecha_input(fecha) {
    var partes = fecha.split("/");
    var dia = partes[0];
    var mes = partes[1];
    var año = partes[2];
    return año + "-" + mes + "-" + dia;
}
// GUARDAR CAMBIOS DEL LOTE
formulario_editar.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (fila_editar === null) {
        return;
    }
    var numero_lote =
        document.querySelector("#editarNumeroLote").value;
    var especie =
        document.querySelector("#editarEspecie").value;
    var fecha =
        document.querySelector("#editarFecha").value;
    var cantidad =
        document.querySelector("#editarCantidad").value;
    var etapa =
        document.querySelector("#editarEtapa").value;
    var responsable =
        document.querySelector("#editarResponsable").value;
    // CONVERTIR FECHA
    var fecha_formateada = convertir_fecha(fecha);
    // ACTUALIZAR FILA
    fila_editar.children[0].textContent =
        numero_lote;
    fila_editar.children[1].textContent =
        especie;
    fila_editar.children[2].textContent =
        fecha_formateada;
    fila_editar.children[3].textContent =
        cantidad;
    fila_editar.children[4].textContent =
        etapa;
    fila_editar.children[6].textContent =
        responsable;
    // CERRAR MODAL
    cerrar_modal_ver();

});
// CERRAR MODAL VER LOTE
boton_cerrar_ver.addEventListener("click", () => {
    cerrar_modal_ver();
});
boton_cancelar_editar.addEventListener("click", () => {
    cerrar_modal_ver();
});
modal_ver.addEventListener("click", (evento) => {
    if (evento.target === modal_ver) {
        cerrar_modal_ver();
    }
});
// FUNCION CERRAR MODAL VER
function cerrar_modal_ver() {
    modal_ver.classList.remove("open");
    formulario_editar.reset();
    fila_editar = null;
}
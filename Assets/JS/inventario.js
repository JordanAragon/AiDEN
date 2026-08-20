var modal = document.querySelector("#modalNuevoInsumo");
var boton_abrir = document.querySelector("#btnNuevoInsumo");
var boton_cerrar = document.querySelector("#cerrarModal");
var boton_cancelar = document.querySelector("#cancelarModal");
var formulario = document.querySelector("#formNuevoInsumo");
var tabla = document.querySelector(".data-table tbody");
var buscar = document.querySelector("#buscarInsumo");
var filtro_categoria = document.querySelector("#filtroCategoria");
var filtro_estado = document.querySelector("#filtroEstado");
var titulo_modal = document.querySelector("#modalNuevoInsumo h2");
var texto_modal = document.querySelector("#modalNuevoInsumo header p");
var boton_formulario = document.querySelector("#formNuevoInsumo button[type='submit']");

// VARIABLES PARA SABER SI ESTAMOS AGREGANDO O EDITANDO
var fila_editar = null
var modo = "nuevo";

// ABRIR MODAL PARA NUEVO INSUMO
boton_abrir.addEventListener("click", () => {
    modo = "nuevo";
    fila_editar = null;
    titulo_modal.textContent = "Nuevo insumo";
    texto_modal.textContent = "Completa los datos para agregarlo al inventario.";
    boton_formulario.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar';
    formulario.reset();
    modal.classList.add("open");

});

// CERRAR MODAL
boton_cerrar.addEventListener("click", () => {
    cerrar_modal();
});

// BOTON CANCELAR
boton_cancelar.addEventListener("click", () => {
    cerrar_modal();
});


// CERRAR AL HACER CLICK FUERA DEL MODAL
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
        cerrar_modal();
    }
});

// FUNCION PARA CERRAR EL MODAL
function cerrar_modal() {
    modal.classList.remove("open");
    formulario.reset();
    fila_editar = null;
    modo = "nuevo";
}

// AGREGAR O EDITAR INSUMO
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    var nombre = document.querySelector("#insumoNombre").value;
    var categoria = document.querySelector("#insumoCategoria").value;
    var cantidad = parseInt(document.querySelector("#insumoCantidad").value);
    var unidad = document.querySelector("#insumoUnidad").value;
    var stock_minimo = parseInt(document.querySelector("#insumoStockMin").value);
    var estado = obtener_estado(cantidad, stock_minimo);
    // SI ESTAMOS EDITANDO
    if (modo === "editar") {
        fila_editar.children[0].textContent = nombre;
        fila_editar.children[1].textContent = categoria;
        fila_editar.children[2].textContent = cantidad;
        fila_editar.children[3].textContent = unidad;
        fila_editar.children[4].textContent = stock_minimo;
        fila_editar.children[5].innerHTML = estado;

    // SI ESTAMOS AGREGANDO
    } else {
        var fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${nombre}</td>
            <td>${categoria}</td>
            <td>${cantidad}</td>
            <td>${unidad}</td>
            <td>${stock_minimo}</td>
            <td>${estado}</td>
            <td>
                <button class="btn-outline" type="button">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
            </td>
        `;
        tabla.appendChild(fila);
    }

    cerrar_modal();
    filtrar_tabla();
});

// DETERMINAR EL ESTADO DEL INSUMO
function obtener_estado(cantidad, stock_minimo) {
    if (cantidad <= 0) {
        return '<span class="badge-danger">Critico</span>';
    } else if (cantidad < stock_minimo) {
        return '<span class="badge-warn">Stock bajo</span>';
    } else {
        return '<span class="badge">Disponible</span>';
    }
}

// DETECTAR LOS BOTONES DE EDITAR Y REPONER
tabla.addEventListener("click", (evento) => {
    var boton = evento.target.closest("button");
    if (boton === null) {
        return;
    }

    var fila = boton.closest("tr");
    if (fila === null) {
        return;
    }
    var texto_boton = boton.textContent.trim();

    // BOTON EDITAR
    if (texto_boton.includes("Editar")) {
        editar_insumo(fila);
    }

    // BOTON REPONER
    if (texto_boton.includes("Reponer")) {
        reponer_insumo(fila);
    }
});

// EDITAR INSUMO
function editar_insumo(fila) {
    modo = "editar";
    fila_editar = fila;
    titulo_modal.textContent = "Editar insumo";
    texto_modal.textContent = "Modifica los datos del insumo.";
    boton_formulario.innerHTML = '<i class="fa-solid fa-pen"></i> Guardar cambios';

    document.querySelector("#insumoNombre").value = fila.children[0].textContent;
    document.querySelector("#insumoCategoria").value = fila.children[1].textContent;
    document.querySelector("#insumoCantidad").value = fila.children[2].textContent;
    document.querySelector("#insumoUnidad").value = fila.children[3].textContent;
    document.querySelector("#insumoStockMin").value = fila.children[4].textContent;
    modal.classList.add("open");
}

// REPONER INSUMO
function reponer_insumo(fila) {
    modo = "editar";
    fila_editar = fila;
    titulo_modal.textContent = "Reponer insumo";
    texto_modal.textContent = "Modifica la cantidad disponible del insumo.";
    boton_formulario.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Reponer';

    document.querySelector("#insumoNombre").value = fila.children[0].textContent;
    document.querySelector("#insumoCategoria").value = fila.children[1].textContent;
    document.querySelector("#insumoCantidad").value = fila.children[2].textContent;
    document.querySelector("#insumoUnidad").value = fila.children[3].textContent;
    document.querySelector("#insumoStockMin").value = fila.children[4].textContent;
    modal.classList.add("open");
}

// BUSCAR
buscar.addEventListener("input", () => {
    filtrar_tabla();
});

// FILTRO CATEGORIA
filtro_categoria.addEventListener("change", () => {
    filtrar_tabla();
});

// FILTRO ESTADO
filtro_estado.addEventListener("change", () => {
    filtrar_tabla();
});

// FUNCION PARA FILTRAR
function filtrar_tabla() {
    var texto = buscar.value.toLowerCase().trim();
    var categoria = filtro_categoria.value;
    var estado = filtro_estado.value;
    var filas = tabla.querySelectorAll("tr");
    filas.forEach((fila) => {
        var nombre = fila.children[0].textContent.toLowerCase();
        var categoria_insumo = fila.children[1].textContent.trim();
        var estado_insumo = fila.children[5].textContent.trim();
        var coincide_nombre = nombre.includes(texto);
        var coincide_categoria = categoria === "" || categoria_insumo === categoria;
        var coincide_estado = estado === "" || estado_insumo === estado;

        if (
            coincide_nombre &&
            coincide_categoria &&
            coincide_estado
        ) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
}
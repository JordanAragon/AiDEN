export const EVENTO_VERSION_NUEVA = "aiden-version-nueva";

let actualizacionPedida = false;
let registrado = false;

// Se llama desde la app autenticada: quien solo visita la landing no descarga la
// precarga completa.
export function registrarTrabajador() {
  if (registrado || !import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  registrado = true;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (actualizacionPedida) window.location.reload();
  });

  const registrar = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registro) => {
        const avisar = (trabajador) => window.dispatchEvent(new CustomEvent(EVENTO_VERSION_NUEVA, { detail: trabajador }));
        if (registro.waiting && navigator.serviceWorker.controller) avisar(registro.waiting);
        registro.addEventListener("updatefound", () => {
          const nuevo = registro.installing;
          nuevo?.addEventListener("statechange", () => {
            if (nuevo.state === "installed" && navigator.serviceWorker.controller) avisar(nuevo);
          });
        });
      })
      .catch((error) => console.warn("AiDEN no pudo activar el modo sin conexión", error));
  };
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true });
}

export function activarVersionNueva(trabajador) {
  actualizacionPedida = true;
  trabajador?.postMessage({ tipo: "ACTIVAR_VERSION" });
}

export const EVENTO_VERSION_NUEVA = "aiden-version-nueva";

let actualizacionPedida = false;

export function registrarTrabajador() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  // clients.claim() también cambia el controlador en la primera visita: solo se recarga
  // cuando la persona pidió la versión nueva.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (actualizacionPedida) window.location.reload();
  });

  window.addEventListener("load", () => {
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
  });
}

export function activarVersionNueva(trabajador) {
  actualizacionPedida = true;
  trabajador?.postMessage({ tipo: "ACTIVAR_VERSION" });
}

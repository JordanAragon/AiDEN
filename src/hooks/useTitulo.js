import { useEffect } from "react";

export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · AiDEN` : "AiDEN · Gestión operativa para viveros";
  }, [titulo]);
}

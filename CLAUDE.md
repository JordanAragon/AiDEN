## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Diseño

- Fuente de verdad visual: `DESIGN.md` (raíz). Producto: `PRODUCT.md` (raíz). Léelos antes de cualquier trabajo de UI. `design-system/aiden/MASTER.md` solo apunta a ellos.
- Flujo principal de diseño: el skill `impeccable` (`/impeccable critique`, `audit`, `polish`, `harden`, `typeset`, `layout`, `clarify`…). Aquí todo trabajo es **refinamiento**: preserva la identidad de `DESIGN.md`. Un rediseño solo si David lo pide.
- `ui-ux-pro-max` es solo consulta (guías del stack y datos de UX). No apliques sus paletas, tipografías ni estilos, ni ejecutes `--persist`.
- Si un cambio visual contradice `DESIGN.md`, propónlo a David y actualiza `DESIGN.md` en el mismo cambio. `PRODUCT.md` solo cambia con hechos confirmados por David.

## Verificación

- Servidor de desarrollo: `npm run dev` → http://localhost:5173
- Todo cambio de UI se verifica en el navegador con el skill `playwright-cli` antes de darlo por terminado: abrir la página, revisar 375, 768 y 1440 px (`resize`), sin errores en consola, y una captura por ancho.
- Para recorrer o verificar la app usa `playwright-cli` (`snapshot` y `find` en vez de leer el DOM completo). Para tareas largas, usa una sesión propia: `-s=<proyecto>`.
- No uses `--persistent` ni guardes estado de sesión (`state-save`) con cuentas reales; las salidas van a `.playwright-cli/` (ignorado por Git).
- Flujos clave: login y dashboard de cada rol (admin, supervisor, operario), un módulo por rol, modo oscuro (`aiden-dark`). Las cuentas de prueba son `CUENTAS_INICIALES` en `src/utilidades/autenticacion.js`; no inventes credenciales.
- Pruebas existentes: `pruebas/` (Python).

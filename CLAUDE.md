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

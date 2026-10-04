## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Diseño

- La identidad visual está en `design-system/aiden/MASTER.md`. Léelo antes de cualquier trabajo de UI; si existe `design-system/aiden/pages/<página>.md`, sus reglas tienen prioridad.
- Prioridad: este MASTER, luego las preferencias de diseño de David (brain David-AI) y al final el skill `ui-ux-pro-max`.
- `ui-ux-pro-max` se usa aquí solo como checklist de UX y accesibilidad y como guía del stack. No apliques sus paletas, tipografías ni estilos, y no ejecutes `--persist` ni `--force` sobre este MASTER.
- Si un cambio visual contradice el MASTER, propónlo a David y actualiza el MASTER en el mismo cambio.

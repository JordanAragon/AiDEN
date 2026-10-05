#!/usr/bin/env bash
# Exporta los datos de ejemplo de la app (src/datos/semilla.js) a semilla.json.
# Uso, desde la raíz del repo: bash docs/base-de-datos/herramientas/exportar_semilla.sh
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d)"
cp -r "$RAIZ/src/datos" "$RAIZ/src/utilidades" "$TMP/"
# Node necesita la extensión .js en los imports relativos (Vite no)
sed -i -E 's#from "(\.\.?/[^"]+)"#from "\1.js"#g; s#\.js\.js#.js#g' "$TMP"/datos/*.js "$TMP"/utilidades/*.js
cat > "$TMP/exportar.mjs" <<'JS'
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { generarSemilla } = await import("./datos/semilla.js");
const fs = await import("fs");
fs.writeFileSync(process.argv[2], JSON.stringify({ semilla: generarSemilla() }, null, 1));
JS
node "$TMP/exportar.mjs" "$PWD/semilla.json"
rm -rf "$TMP"
echo "semilla.json listo"

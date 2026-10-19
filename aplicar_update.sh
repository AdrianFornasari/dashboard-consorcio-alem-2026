#!/usr/bin/env bash
set -euo pipefail
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$PWD}"
if [[ ! -f "$TARGET_DIR/index.html" || ! -f "$TARGET_DIR/multibuilding.js" || ! -f "$TARGET_DIR/app.js" || ! -f "$TARGET_DIR/consorcios/lagos-2797/data/2026.json" ]]; then
  echo "Error: la carpeta destino no parece ser la versión funcional multiedificio. No se copiaron archivos." >&2; exit 1
fi
FILES=(
  "index.html"
  "styles.css"
  "multibuilding.js"
  "data/edificios.json"
  "consorcios/lagos-2797/data/2025.json"
  "consorcios/lagos-2797/data/2026.json"
  "consorcios/lagos-2797/informes/202504-informe.pdf"
  "consorcios/lagos-2797/informes/202505-informe.pdf"
  "consorcios/lagos-2797/informes/202507-informe.pdf"
  "consorcios/lagos-2797/informes/202508-informe.pdf"
  "consorcios/lagos-2797/informes/202510-informe.pdf"
  "consorcios/lagos-2797/informes/202512-informe.pdf"
  "consorcios/lagos-2797/informes/202601-informe.pdf"
  "consorcios/lagos-2797/informes/202602-informe.pdf"
  "consorcios/lagos-2797/informes/202603-informe.pdf"
  "consorcios/lagos-2797/informes/202604-informe.pdf"
  "docs/VALIDACION_LAGOS_v1_1.json"
  "docs/EVOLUCION_GASTOS_LAGOS_2025_2026_v1_1.md"
  "README_ACTUALIZACION_LAGOS_v1_1.md"
)
for relative in "${FILES[@]}"; do
  mkdir -p "$TARGET_DIR/$(dirname "$relative")"
  if [[ "$SOURCE_DIR/$relative" != "$TARGET_DIR/$relative" ]]; then
    cp "$SOURCE_DIR/$relative" "$TARGET_DIR/$relative"
  fi
done
echo "Actualización v1.1 aplicada en: $TARGET_DIR"
echo "Revisá git diff / git status y probá el servidor local antes de publicar."

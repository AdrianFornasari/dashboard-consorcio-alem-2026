#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$PWD}"
if [[ ! -f "$ROOT/app.js" || ! -f "$ROOT/data/expensas-2026.json" || ! -f "$ROOT/multibuilding.js" ]]; then
  echo 'ERROR: esta actualización requiere el repositorio con versión multiedificio v0.8.' >&2
  exit 1
fi
for file in index.html multibuilding.js data/edificios.json consorcios/lagos-2797/data/2026.json docs/validacion_lagos_2026.json docs/ACTUALIZACION_LAGOS_ENERO_JULIO_2026.md; do
  mkdir -p "$ROOT/$(dirname "$file")"
  cp "$SCRIPT_DIR/$file" "$ROOT/$file"
done
mkdir -p "$ROOT/consorcios/lagos-2797/informes"
for month in 01 02 03 04; do
  cp "$SCRIPT_DIR/consorcios/lagos-2797/informes/2026${month}-informe.pdf" "$ROOT/consorcios/lagos-2797/informes/"
done
echo 'Aplicación completa. Revisá git diff y probá localhost antes de publicar.'

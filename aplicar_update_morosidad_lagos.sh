#!/usr/bin/env bash
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$PWD}"
if [[ ! -f "$ROOT/app.js" || ! -f "$ROOT/multibuilding.js" || ! -f "$ROOT/consorcios/lagos-2797/data/2026.json" ]]; then
  echo 'ERROR: se requiere la raíz del dashboard multiedificio v0.9 con el JSON de Lagos enero-julio.' >&2
  exit 1
fi
for file in index.html styles.css multibuilding.js README_ACTUALIZACION_MOROSIDAD_LAGOS.md docs/SEGUIMIENTO_MOROSIDAD_LAGOS_v1_0.md; do
  mkdir -p "$ROOT/$(dirname "$file")"
  cp "$SRC/$file" "$ROOT/$file"
done
echo 'Actualización de seguimiento de morosidad aplicada. Verificá git diff y probá localhost.'

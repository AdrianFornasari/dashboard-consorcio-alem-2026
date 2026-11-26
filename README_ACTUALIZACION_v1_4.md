# Actualización v1.4 — Carga mensual semiautomática

**Qué incluye:** extractor local de PDFs, borrador JSON, revisión HTML privada, controles previos, publicación controlada, informe PDF anonimizado, regeneración de auditoría v1.3 e instalador incremental.

**Qué NO modifica al instalar:** `app.js`, `multibuilding.js`, `fondos.js`, `auditoria.js`, `index.html`, `styles.css`, JSON de los edificios, PDFs ni informes. Se preservan todas las funciones actuales.

**Requisitos:** versión v1.3 instalada, Python 3 y dependencias de `scripts/requirements_carga_v14.txt`.

## Instalar en Windows

Descomprimí este ZIP en una carpeta temporal distinta del proyecto. En PowerShell:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
python "C:\RUTA\AL\ZIP_DESCOMPRIMIDO\aplicar_update.py" .
python -m pip install -r scripts/requirements_carga_v14.txt
```

Leé el procedimiento completo en `docs/CARGA_MENSUAL_v1_4.md`.

## Instalar en Codespaces

```bash
python /tmp/ZIP_DESCOMPRIMIDO/aplicar_update.py .
python -m pip install -r scripts/requirements_carga_v14.txt
```

Luego ejecutá `preparar`, revisá el JSON fuera del repo, probá `publicar --simular` y sólo después usá `publicar`.

**Privacidad:** la liquidación fuente nunca se publica; revisá igualmente el JSON aprobado y el PDF derivado antes del commit.

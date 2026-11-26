# v1.2 — Seguimiento documental de fondos y obras

Actualización incremental para **Dashboard de Consorcios** (Alem 1274 y Torre VI Lagos 2797), basada en la **versión v1.1 funcional con octubre 2026 de Alem ya incorporado**.

## Cambios

- Nueva sección desplegable **Fondos, anticipos y obras**, común a ambos edificios.
- Filtros por período, proyecto, tipo de movimiento y búsqueda de proveedor o concepto.
- Series mensuales con discontinuidad para PDFs faltantes, fichas de proyecto, partidas detalladas y fuente.
- Separación de fondos liquidados, acopios y anticipos, trabajos/compras, partidas mixtas y ajustes/devoluciones.
- Para **Alem**, foto documental de cuentas por pagar al cierre de octubre 2026 ($1.550.000,00), sin sumar saldos de períodos anteriores.
- Para **Lagos**, aviso de que sus liquidaciones individuales no informan un mayor de fondos ni cuentas por pagar por proyecto.
- No se incorpora ninguna comparación entre consorcios.

## Alcance crítico

Las cifras son **partidas incluidas en liquidaciones**, no una certificación de pagos, cobros o saldo de obras. **No sumes fondos con trabajos para calcular una inversión ni restes anticipos de fondos para inferir saldos.** Algunos movimientos del JSON se agrupan bajo un concepto global que requiere desagregación con facturas. El registro contempla solamente proyectos reconocidos documentalmente, no todos los gastos del edificio.

- Alem: 2026 enero–octubre.
- Lagos: 2025 abril, mayo, julio, agosto, octubre y diciembre; 2026 enero–julio. Los meses faltantes no se completan.
- No se publica ningún PDF original nuevo ni información de titulares.

## Instalación en PC

1. Antes de actualizar, `git status` debe mostrar el árbol de trabajo limpio. Si hay cambios, guardalos primero.
2. Descomprimí **este ZIP en una carpeta temporal**, no directamente sobre la raíz del repo.
3. En PowerShell:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
python "C:\RUTA\AL\ZIP_EXTRAIDO\aplicar_update.py" .
python -m http.server 8080
```

4. Abrí `http://localhost:8080`, expandí **Fondos, anticipos y obras**. Probá el selector de edificios (ambos), el filtro de proyectos y la impresión.
5. Si está correcto:

```powershell
git status
git add index.html styles.css multibuilding.js fondos.js data/seguimiento_fondos_v12.json docs/FONDOS_Y_OBRAS_v1_2.md scripts/build_funds_registry_v12.py README_ACTUALIZACION_v1_2.md
git commit -m "Agregar seguimiento documental de fondos y obras v1.2"
git push
```

**No uses `git add .` antes de revisar la lista**. El instalador respalda los archivos reemplazados en una carpeta hermana del repositorio (no dentro de Git).

## Instalación en Codespaces

Subí el ZIP a la raíz del repositorio y, en la terminal:

```bash
mkdir -p /tmp/consorcios-v12
unzip -oq dashboard_consorcios_v12_fondos_obras.zip -d /tmp/consorcios-v12
python /tmp/consorcios-v12/aplicar_update.py .
python -m http.server 8080
```

Después de probar, usá `git status`, `git add` de los archivos indicados, `git commit` y `git push`.

## Archivos modificados

- `index.html` (nueva sección, script y versión de caché)
- `styles.css` (responsive e impresión)
- `multibuilding.js` (sólo etiquetas de versión)
- `fondos.js` (módulo independiente nuevo)
- `data/seguimiento_fondos_v12.json` (registro documental curado)
- `docs/FONDOS_Y_OBRAS_v1_2.md` (alcance y criterio contable)
- `scripts/build_funds_registry_v12.py` (regeneración revisada)
- `README_ACTUALIZACION_v1_2.md`

El instalador **no sustituye** `app.js`, los JSON mensuales, los informes existentes ni los documentos de Lagos.

# Actualización PDFs e informes mensuales 2026

Este paquete incorpora los PDFs mensuales de expensas de enero a septiembre 2026, genera informes mensuales para cada período y actualiza `data/expensas-2026.json` para enlazarlos desde el dashboard.

## Aplicación en PC

Descomprimir el ZIP en la raíz del repositorio:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
# Descomprimir aquí, reemplazando carpetas data/, pdfs/ e informes/
python -m http.server 8080
```

Luego validar en `http://localhost:8080` y subir cambios:

```powershell
git status
git add data pdfs informes docs
git commit -m "Agregar PDFs e informes mensuales 2026"
git push
```

## Aplicación en Codespaces

Subir el ZIP a la raíz del repo y ejecutar:

```bash
mkdir -p /tmp/dashboard_update
unzip -o dashboard_update_pdfs_informes_2026.zip -d /tmp/dashboard_update
bash /tmp/dashboard_update/aplicar_update.sh
```

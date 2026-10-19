# Actualización incremental · Lagos enero–julio 2026

**Base necesaria:** dashboard multiedificio v0.8 funcionando, con el selector Alem/Lagos. Si aún no instalaste la v0.8, primero aplicá ese paquete.

Incluye datos de enero–abril de Lagos, más cuatro informes PDF y la conciliación de enero–julio. Respeta Alem y la vista Lagos mayo–julio. No incluye archivos PDF originales con nombres de propietarios, ni implementa comparación entre consorcios.

**PC:** desde `C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026`, ejecutar `git status`, respaldar cambios pendientes, luego descomprimir este ZIP en la raíz respetando carpetas y reemplazando los archivos existentes. Alternativamente, descomprimir en carpeta temporal y ejecutar `aplicar_update.ps1` desde la carpeta del repo.

**Codespaces:** subir ZIP, descomprimir en `/tmp/lagos_update`, ejecutar `bash /tmp/lagos_update/aplicar_update.sh` desde la raíz.

Probar `python -m http.server 8080`, verificar enero–julio de Lagos y que Alem siga funcionando. Antes de publicar: `git diff`, `git status`, commit y push.

Detalles y cifras conciliadas: `docs/ACTUALIZACION_LAGOS_ENERO_JULIO_2026.md`.

# Actualización v1.3 — Auditoría y trazabilidad de Expensas Alem / Lagos

Requiere la **v1.2 funcional** instalada sobre la v1.1, con Alem octubre 2026 y Lagos 2025–2026 completos. El instalador se niega a reemplazar archivos si detecta una base incompleta.

## Instalación en PC

1. En la raíz del repositorio, verificar que `git status` no muestre cambios pendientes. Si hay cambios, guardarlos primero.
2. **Descomprimir el ZIP en una carpeta temporal** (no directamente en el repositorio).
3. Ejecutar, desde la carpeta del proyecto:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
python "C:\RUTA\AL\ZIP_EXTRAIDO\aplicar_update.py" .
python -m http.server 8080
```

4. Abrir `http://localhost:8080`, desplegar **Auditoría y trazabilidad** y probar edificios, meses y filtros. Verificar que **Fondos y obras**, tortas, morosidad e impresión continúen funcionando. No abrir el HTML con `file://`: el panel utiliza `fetch`.
5. Una vez aprobado:

```powershell
git status
git add index.html styles.css auditoria.js data/auditoria_v13.json scripts/auditar_consorcios_v13.py docs/AUDITORIA_Y_TRAZABILIDAD_v1_3.md README_ACTUALIZACION_v1_3.md
git commit -m "Incorporar auditoria y trazabilidad documental v1.3"
git push
```

## En Codespaces

Subir el ZIP a la raíz del repositorio, y ejecutar:

```bash
mkdir -p /tmp/consorcios-v13
unzip -oq dashboard_consorcios_v13_auditoria_trazabilidad.zip -d /tmp/consorcios-v13
python /tmp/consorcios-v13/aplicar_update.py .
python -m http.server 8080
```

## Importante

- No cambia las bases mensuales ni las funcionalidades de v1.2.
- Los resultados **Conciliado** son consistencia matemática del JSON, no certificación del PDF.
- La auditoría advierte que falta cotejo independiente con PDF y revisión de privacidad.
- Después de cada actualización mensual, **regenerar el registro** con `python scripts/auditar_consorcios_v13.py --build` y publicar también `data/auditoria_v13.json`.
- El instalador respalda los archivos sustituidos en una carpeta hermana del repositorio, no en el propio repositorio.

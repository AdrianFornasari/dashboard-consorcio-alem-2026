# Dashboard Consorcio Alem 2026

MVP estático en HTML/CSS/JavaScript puro para publicar con GitHub Pages.

## Versión 0.5

Esta actualización agrega las 10 mejoras funcionales pedidas:

1. **Semáforo financiero mensual** en la pestaña Resumen.
2. **Comparativa automática mes actual vs mes anterior**.
3. **Modo reunión** con lectura simplificada para asamblea o consejo.
4. **Buscador global** por proveedor, rubro, unidad, mes y documentos.
5. **Evolución por proveedor** al seleccionar una porción o leyenda de la torta.
6. **Detalle ordinario / extraordinario / particulares / cuentas por pagar**.
7. **Lectura del mes** con puntos favorables, alertas y recomendación.
8. **Botón imprimir / guardar PDF**.
9. **Historial local de decisiones** en el navegador.
10. **Control de calidad de datos** con cobertura de PDFs, informes y advertencias.

## Privacidad

El dashboard no muestra nombres de propietarios en la sección de morosidad: sólo unidades funcionales. Sin login ni contraseña, la privacidad depende de mantener controlado el enlace publicado.

## Prueba local

Desde la carpeta del proyecto:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Publicación

Después de reemplazar los archivos modificados:

```powershell
git status
git add index.html styles.css app.js README.md
git commit -m "Agregar semaforo financiero, modo reunion y gestion"
git push
```

## Archivos modificados en esta actualización

```text
index.html
styles.css
app.js
README.md
```

## Actualización mensual

Cada mes hay que actualizar principalmente:

```text
data/expensas-2026.json
pdfs/
informes/
```

El dashboard debe validarse contra el PDF oficial de expensas antes de publicar.

## Notas de uso

- El historial de decisiones se guarda en `localStorage`; por ahora es local del navegador y no queda sincronizado entre usuarios.
- Para que una decisión sea visible para todos, hay que incorporarla luego como dato permanente en el proyecto.
- La clasificación “pagos devengados de meses anteriores” aparece como “No cargado” si ese dato no está estructurado en el JSON mensual.
- La liquidación oficial sigue siendo el PDF mensual: el dashboard es una herramienta de lectura y seguimiento.

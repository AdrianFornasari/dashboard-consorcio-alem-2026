# Dashboard Expensas Alem 2026 - MVP

Dashboard estático HTML/CSS/JavaScript para seguimiento financiero del Consorcio Alem 1268/74/80/82.

## Criterios del MVP

- Sin login ni contraseña.
- Uso privado por circulación controlada del enlace entre consorcistas.
- No se publican nombres de propietarios en la sección de morosidad: sólo unidades funcionales.
- Datos 2026 cargados de enero a septiembre.
- Comparativa por períodos a elección.
- Composición del gasto.
- Detalle del gasto por proveedor.
- Morosidad por unidad.
- Se incluyen PDFs e informes disponibles como archivos descargables/consultables.

## Archivos incluidos

### PDFs de expensas incluidos

- `pdfs/202607Expensas.pdf`
- `pdfs/202608Expensas.pdf`
- `pdfs/202609Expensas.pdf`

### Informes incluidos

- `informes/202605-informe-general.pdf`
- `informes/202606-informe-ajustado.pdf`
- `informes/202609-informe.pdf`
- `informes/202609-informe-ajustado.pdf` copia explícita del informe ajustado de septiembre.

Los PDFs anteriores que no estaban materializados como archivo descargable en este entorno quedaron pendientes de copia manual. Los datos numéricos de enero a septiembre sí están cargados en `data/expensas-2026.json`.

## Cómo probar localmente

Desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080
```

No conviene abrir `index.html` con doble clic porque algunos navegadores bloquean la carga local de `data/expensas-2026.json`.

## Publicación sugerida

Repositorio GitHub:

```text
dashboard-consorcio-alem-2026
```

Hosting inicial sugerido:

```text
GitHub Pages
```

## Actualización mensual

1. Agregar el PDF mensual nuevo en `pdfs/`.
2. Agregar el informe mensual nuevo en `informes/`.
3. Actualizar `data/expensas-2026.json`.
4. Probar localmente.
5. Hacer commit y push.
6. GitHub Pages publica la nueva versión.

## Privacidad

Aunque el tablero no tiene nombres de propietarios, los PDFs de expensas pueden contener información más detallada. Si se suben al sitio, el enlace debe circularse sólo entre consorcistas.

## Cambios de esta actualización

- Los gráficos de composición del gasto, gasto por proveedor y morosidad pasan de barras horizontales a gráficos de torta.
- Las categorías menores se agrupan automáticamente como `Otros` para evitar gráficos ilegibles.
- Se agregó leyenda HTML debajo de cada torta, más legible en celular que etiquetas dibujadas dentro del gráfico.
- Se ajustó la altura responsiva de los canvas para evitar que los gráficos se vean estirados verticalmente en celulares.


## Versión 0.2 - tortas y responsive

- Los gráficos de composición del gasto, gasto por proveedor y morosidad se muestran como tortas.
- Se agregó cache busting en `index.html` para forzar la carga de `styles.css` y `app.js` actualizados en GitHub Pages.
- Se ajustó la altura de los gráficos en celular para evitar estiramiento vertical.
- En el encabezado debe verse: `Versión 0.2 · tortas + responsive mobile`.


## Actualización 0.3

- Las leyendas de gráficos de torta se muestran apiladas a la derecha del gráfico.
- Al hacer clic en una porción de la torta, se resalta la fila o filas correspondientes en la tabla de detalle.
- También se puede hacer clic en una leyenda para resaltar la tabla.

## Actualización 0.4

- En la sección `Gasto por proveedor`, al hacer clic en una porción de la torta o en su leyenda, la tabla queda filtrada para mostrar sólo los movimientos del proveedor seleccionado.
- Si la porción seleccionada es `Otros`, la tabla muestra sólo los proveedores agrupados en esa categoría.
- Se agregó un botón `Ver todos los proveedores` para limpiar el filtro aplicado desde la torta.
- Se actualizó el cache busting de `index.html` para forzar la descarga de `app.js` y `styles.css` nuevos en GitHub Pages.

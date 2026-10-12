# Dashboard Consorcio Alem 2026 — actualización v0.6 viaje / Codespaces

Esta actualización agrega las 5 mejoras propuestas para continuar el desarrollo desde GitHub Codespaces o desde la PC local.

## Archivos incluidos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `aplicar_update.sh`

## Mejoras incluidas

1. **Ficha mensual completa**
   - Nueva pestaña `Ficha mensual`.
   - Resume qué pasó, qué mejoró, qué exige atención, gastos principales, deuda y documentos asociados.

2. **Comparador dos meses frente a frente**
   - Nuevo bloque dentro de `Comparativa`.
   - Permite elegir Mes A y Mes B.
   - Muestra diferencias directas de caja, deuda, gastos, recupero e intereses.

3. **Ranking anual de proveedores**
   - Nuevo bloque en `Gasto por proveedor`.
   - Ordena proveedores por total anual.
   - Incluye meses con gasto, promedio mensual, mayor gasto y rubro principal.

4. **Ficha del proveedor**
   - Se actualiza al seleccionar un proveedor en la torta, en la leyenda o en el ranking.
   - Muestra total 2026, meses con gasto, cantidad de movimientos, mayor gasto, rubros principales y evolución mensual.

5. **Estado de documentos y validación**
   - Nuevo bloque dentro de `Documentos`.
   - Muestra por mes si hay PDF, informe, datos estructurados y estado de validación.

## Aplicación rápida en Codespaces

Subir el ZIP a la raíz del repositorio y ejecutar:

```bash
mkdir -p /tmp/dashboard_update
unzip -o dashboard_consorcio_alem_2026_update_5_codespaces.zip -d /tmp/dashboard_update
bash /tmp/dashboard_update/aplicar_update.sh
```

Luego probar:

```bash
python -m http.server 8080
```

Commit recomendado:

```bash
git status
git add index.html styles.css app.js README.md
git commit -m "Agregar ficha mensual comparador y ranking de proveedores"
git push
```

## Aplicación manual

También se puede descomprimir el ZIP en la raíz del proyecto reemplazando los archivos existentes.

## Nota

Esta actualización no modifica `data/expensas-2026.json`. Usa los datos ya cargados de 2026.

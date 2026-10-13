# Dashboard Consorcio Alem 2026 — actualización v0.7

Actualización incremental para aplicar sobre la versión que ya funciona en PC, GitHub Pages y Codespaces.

## Cambios incluidos

1. **Análisis anual resumido**
   - Nueva pestaña `Análisis anual`.
   - Tabla mensual con caja neta, deuda, gastos, cuentas por pagar, presión financiera y estado automático.

2. **Indicador de presión financiera**
   - Fórmula: `deuda de capital + cuentas por pagar - caja final`.
   - Gráfico comparando exposición financiera contra caja final.

3. **Evolución del recupero de deuda**
   - Gráfico y tabla mensual de recupero de expensas adeudadas e intereses cobrados.

4. **Mapa de concentración de deuda**
   - En `Morosidad`, agrega Top 1 / Top 3 / Top 5 / Top 10 con lectura automática.
   - Sigue mostrando sólo unidades funcionales, sin nombres de propietarios.

5. **Mejoras para celular/tablet**
   - Menú de pestañas fijo y con desplazamiento horizontal.
   - Botón flotante para volver arriba.

6. **Resumen para WhatsApp**
   - Nueva pestaña `Herramientas`.
   - Texto copiable con resumen del mes seleccionado.

7. **Glosario para consorcistas**
   - Explica caja final, caja neta, deuda capital, cuentas por pagar, presión financiera, etc.

8. **Control de inconsistencias**
   - Chequea diferencias entre rubros/gasto total y deudores/deuda capital.
   - Marca documentos o informes faltantes.

9. **Historial de cambios**
   - Bitácora simple de versiones del dashboard.

## Archivos modificados

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `aplicar_update.sh`

## Aplicación en PC

Desde la carpeta del proyecto:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
```

Descomprimir el ZIP reemplazando archivos. Luego probar:

```powershell
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

Commit sugerido:

```powershell
git add index.html styles.css app.js README.md
git commit -m "Agregar analisis anual presion financiera y herramientas"
git push
```

## Aplicación en Codespaces

Subir el ZIP a la raíz del repo y ejecutar:

```bash
mkdir -p /tmp/dashboard_update
unzip -o dashboard_consorcio_alem_2026_update_v07_analisis_herramientas.zip -d /tmp/dashboard_update
bash /tmp/dashboard_update/aplicar_update.sh
```

Luego probar:

```bash
python -m http.server 8080
```

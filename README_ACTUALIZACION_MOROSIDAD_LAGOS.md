# Consorcios · Actualización incremental v1.0 — Morosidad Lagos

**Base requerida:** dashboard multiedificio **v0.9**, con Lagos enero–julio 2026 y Alem funcionando. Esta actualización no modifica `app.js`, ningún JSON, los informes ni los PDF existentes.

## Novedades

1. Evolución mensual de deuda visible, unidades deudoras y relación deuda/liquidación; serie mensual completa enero–julio.
2. Historia individual por **código de unidad funcional**, incluyendo discontinuidades ("No figura", jamás igual a cero).
3. Comparador entre dos meses, con aumentos, reducciones, altas y desapariciones de listado; filtros y acceso rápido a la historia de la unidad.
4. Concentración Top 1, 3, 5 y 10 y evolución del Top 5.
5. Diagnóstico automático de variaciones y advertencias contables, sin inferir cobranzas no documentadas.

Acceso: elegí **Torre VI · Lagos 2797** y tocá **Ver evolución de morosidad**. También se puede llegar desplazándose desde los cuadros de morosidad.

## Aplicación desde la PC

Trabajá en `C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026`. Antes de aplicar, verificá con `git status` que no haya cambios tuyos sin guardar/confirmar.

**Método 1:** extraé el ZIP en la raíz del repositorio, reemplazando `index.html`, `styles.css` y `multibuilding.js`, e incorporando este README y `docs/SEGUIMIENTO_MOROSIDAD_LAGOS_v1_0.md`.

**Método 2:** extraé el ZIP en carpeta temporal y, desde la raíz del repositorio, ejecutá el PowerShell del paquete:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\RUTA\AL\ZIP_EXTRAIDO\aplicar_update_morosidad_lagos.ps1"
```

El instalador valida que la versión multiedificio y el JSON de Lagos existan antes de copiar.

## Aplicación desde Codespaces

Subí el ZIP a la raíz del repositorio y ejecutá:

```bash
mkdir -p /tmp/lagos_morosidad
unzip -o dashboard_consorcios_v10_seguimiento_morosidad_lagos.zip -d /tmp/lagos_morosidad
bash /tmp/lagos_morosidad/aplicar_update_morosidad_lagos.sh
```

## Comprobaciones

```powershell
python -m http.server 8080
```

Abrí `http://localhost:8080` y comprobá:

- Lagos: los siete meses aparecen; julio muestra $26.630.241,82 de deuda visible, 25 unidades y Top 5 = 70,9 %.
- Compará **mayo vs junio**. La unidad **10-04** debe indicar "Deja de figurar", con importe de mayo $3.610.263,23, no un pago acreditado.
- En **Historia por unidad**, el gráfico de 10-04 debe mostrar un hueco en junio y la tabla "No figura".
- Seleccioná una porción de morosidad y verificá que siga destacándose la fila; seleccioná el proveedor y verificá su filtro; probá imprimir PDF.
- Elegí **Consorcio Alem** y confirmá todas sus pestañas anteriores. Verificá GitHub Pages luego del push, con caché actualizada.

Si todo funciona:

```powershell
git add index.html styles.css multibuilding.js docs/SEGUIMIENTO_MOROSIDAD_LAGOS_v1_0.md README_ACTUALIZACION_MOROSIDAD_LAGOS.md
git commit -m "Agregar seguimiento historico de morosidad Lagos"
git push
```

## Limitaciones

Los listados visibles incluidos en **comprobantes individuales** no permiten concluir recupero efectivo, convenios, intereses cobrados, saldos de caja ni cuentas por pagar. Una unidad que no aparece en una liquidación **no debe tratarse como saldo cero ni deuda cancelada**. Los importes son **nominales**. Los documentos originales con nombres propios siguen fuera de GitHub Pages. No se implementan comparativas entre edificios.

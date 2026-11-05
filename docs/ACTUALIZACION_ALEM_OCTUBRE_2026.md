# Consorcio Alem — actualización mensual octubre 2026

**Fecha:** 4 de noviembre de 2026  
**Alcance:** datos financieros de octubre 2026, documento publicable anonimizado e informe de análisis mensual.  
**Compatibilidad:** dashboard multiedificio v1.0/v1.1; no cambia `app.js`, `index.html`, `styles.css`, `multibuilding.js` ni los datos de Lagos.

## Archivos agregados o actualizados

- `data/expensas-2026.json`: mes `2026-10` con rubros, movimientos por proveedor, lista de unidades con deuda y saldo final. Se conservan enero a septiembre.
- `pdfs/202610Expensas.pdf`: **copia para publicación anonimizada**, con nombres de consorcistas eliminados de los cuadros de morosidad y prorrateo; no es el documento original íntegro. El PDF original deberá conservarse fuera de la carpeta pública del sitio.
- `informes/202610-informe.pdf`: informe mensual de cinco páginas, sin nombres de propietarios.
- `docs/ACTUALIZACION_ALEM_OCTUBRE_2026.md`: esta nota de trazabilidad.

## Saldos y totales comprobados

| Indicador | Septiembre 2026 | Octubre 2026 |
| --- | ---: | ---: |
| Gastos ordinarios | $4.516.282,00 | $4.715.005,40 |
| Gastos extraordinarios | $1.443.000,00 | $1.504.500,00 |
| Total liquidado | $5.959.282,00 | $6.219.505,40 |
| Caja al cierre | $6.817.910,83 | $8.086.605,43 |
| Cuentas por pagar | $1.555.500,00 | $1.550.000,00 |
| Caja neta analítica | $5.262.410,83 | $6.536.605,43 |
| Capital adeudado | $3.687.369,52 | $2.574.656,88 |
| Intereses a cobrar | $1.111.967,44 | $979.008,82 |

### Conciliaciones

- Suma de rubros ordinarios: **$4.715.005,40**.
- Suma de extraordinarios: **$1.504.500,00**.
- Suma de movimientos por proveedor: **$6.219.505,40**.
- Suma de los ocho saldos por unidad: **$2.574.656,88**.
- Conciliación de caja: $6.817.910,83 + $5.462.193,15 + $27.500,00 + $1.613.582,53 + $390.424,32 - $4.715.005,40 - $54.500,00 - $1.455.500,00 = **$8.086.605,43**.
- Caja neta analítica = caja final menos cuentas por pagar; no es un rubro contable oficial.

### Advertencias relevantes

- Los **$1.504.500** extraordinarios del período no representan **$1.504.500 pagos** en octubre: el egreso extraordinario corriente fue $54.500, mientras que otros $1.450.000 figuran pendientes por acopios/trabajos.
- Las cobranzas de deuda atrasada de $1.613.582,53 no deben confundirse con la variación neta de capital adeudado. La diferencia incorpora movimiento de obligaciones y posibles reclasificaciones.
- Las unidades se identifican exclusivamente mediante códigos de unidad funcional.
- El PDF publicable fue anonimizado para minimizar la difusión de nombres; **las versiones anteriores presentes en `pdfs/` podrían seguir conteniendo datos personales**. Si el sitio se publica en GitHub Pages, revisarlas antes de compartir enlaces. Sin login, GitHub Pages no ofrece acceso privado.
- Todos los indicadores son **nominales**; no se incorporó actualización por IPC al mes de octubre.

Fuentes: liquidación octubre 2026, páginas 1 a 5; liquidación septiembre 2026, páginas 1 a 5.

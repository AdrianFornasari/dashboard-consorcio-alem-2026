# Lagos 2797 — Integración enero-julio 2026 · v0.9

## Alcance de la actualización

Actualización incremental sobre la **versión multiedificio v0.8 validada por el usuario**. Incorpora enero, febrero, marzo y abril de 2026 a Torre VI, Ovidio Lagos 2797. **Conserva mayo, junio y julio** tal como estaban; las copias de esos tres meses reenviadas por el usuario tienen exactamente el mismo SHA-256 que las ya procesadas.

No se modifica `app.js` ni `data/expensas-2026.json` de Alem, no se introducen funciones de comparación entre edificios y se mantiene el selector de edificio existente. La comparación entre meses *del mismo edificio* continúa disponible.

## Origen y limitación documental

Siete comprobantes individuales de la **unidad 01-03**, administrados por SAPP; cada uno contiene la estructura de rubros/partidas y un listado de deudores. Los documentos **no incluyen** cierre de caja, cobranza real global, cuentas por pagar ni un balance patrimonial de todo el consorcio. Por ello esos indicadores continúan como `null` («No informado»), no cero.

Los **totales computables para liquidación** representan importes facturados/liquidados; no equivalen a dinero efectivamente pagado. Los rubros 01 a 04 no son sinónimos de gastos periódicos: también contienen reparaciones y anticipos no recurrentes.

## Conciliación por mes

| Mes | Rubros 01–04 | Rubro 08, no habituales | Total computable | Unidades deudoras listadas | Suma de deudas del listado |
|---|---:|---:|---:|---:|---:|
| Enero | $3.624.140,39 | $0,00 | $3.624.140,39 | 22 | $20.757.582,44 |
| Febrero | $2.393.418,43 | $3.251.447,86 | $5.644.866,29 | 18 | $22.215.845,06 |
| Marzo | $2.157.815,00 | $2.400.000,00 | $4.557.815,00 | 22 | $24.530.724,90 |
| Abril | $1.573.440,28 | $3.460.902,06 | $5.034.342,34 | 21 | $25.651.031,90 |
| Mayo | $1.576.093,65 | $3.750.756,60 | $5.326.850,25 | 20 | $25.264.410,29 |
| Junio | $2.360.116,56 | $3.000.000,00 | $5.360.116,56 | 22 | $23.954.550,35 |
| Julio | $2.218.191,96 | $3.000.000,00 | $5.218.191,96 | 25 | $26.630.241,82 |

Se validó por cada mes:

1. Suma de rubros = total computable del documento.
2. Suma de partidas por proveedor/concepto = total computable.
3. Suma de las deudas individualizadas en la lista = suma informativa almacenada.
4. Unidades funcionales sin duplicación dentro de cada mes.
5. Montos negativos de devoluciones y reversiones preservados sin cambiarlos de signo.

El archivo `docs/validacion_lagos_2026.json` guarda los resultados numéricos de enero–julio.

## Fondos, anticipos y ajustes

- **Febrero:** fondo de reserva $2.600.000 dentro del rubro 08.
- **Marzo:** fondo de reserva $2.200.000 dentro del rubro 08.
- **Abril:** devolución de reserva -$2.200.000 y nueva partida $1.000.000; **movimiento neto -$1.200.000**, no saldo negativo de la reserva.
- **Mayo:** fondo operativo $3.500.000 para cañerías, dentro del rubro 08.
- **Junio y julio:** fondo operativo $3.000.000 por mes dentro del rubro 08.

Las partidas de fondo operativo y fondo de reserva **no se cuentan como proveedores** para el ranking de gastos. Las demás partidas mantienen su signo y su clasificación original. Un fondo o anticipo liquidado no prueba la ejecución del trabajo ni el pago efectivo.

## Informes

Se generan los archivos:

- `consorcios/lagos-2797/informes/202601-informe.pdf`
- `consorcios/lagos-2797/informes/202602-informe.pdf`
- `consorcios/lagos-2797/informes/202603-informe.pdf`
- `consorcios/lagos-2797/informes/202604-informe.pdf`

Los informes mayo–julio que ya estaban en el repositorio se mantienen sin cambios. Cada informe nuevo tiene indicadores, composición, detalle de partidas, interpretación y advertencias de alcance.

## Privacidad

No se distribuyen los PDFs originales de Lagos: incluyen datos personales, mientras GitHub Pages **no brinda acceso restringido por enlace privado**. En la app y los informes sólo se muestran códigos de **unidades funcionales** en la sección de morosidad; los nombres de proveedores se conservan como dato comercial. Los PDFs originales se conservan localmente, fuera del paquete publicable.

**Importante:** esta actualización no anonimiza los PDFs de Alem previamente publicados, que deben revisarse por separado.

## Archivos cambiados o agregados

- `index.html`: mensajes de disponibilidad y versión; busting de caché del JS multiedificio.
- `multibuilding.js`: compatibilidad de fondos de reserva / operativos en KPI y exclusión de ambos del ranking de proveedores.
- `data/edificios.json`: disponibilidad Lagos enero–julio.
- `consorcios/lagos-2797/data/2026.json`: datos de siete meses con enero–abril incorporados.
- `consorcios/lagos-2797/informes/202601-informe.pdf` a `202604-informe.pdf`.
- `docs/validacion_lagos_2026.json` y este documento.

## Aplicación y prueba

Desde la raíz local del repositorio, antes de aplicar:

```powershell
git status
```

Si está limpio, extraer el ZIP incremental respetando rutas relativas, reemplazando sólo los archivos indicados. Probar:

```powershell
python -m http.server 8080
```

Verificar en `http://localhost:8080` el selector Lagos, enero, febrero, marzo, abril, filtros y leyendas de tortas, informes mensuales y el retorno a Alem. Publicar solamente si las pruebas son correctas.

```powershell
git add index.html multibuilding.js data/edificios.json consorcios/lagos-2797/data/2026.json consorcios/lagos-2797/informes docs/validacion_lagos_2026.json docs/ACTUALIZACION_LAGOS_ENERO_JULIO_2026.md
git commit -m "Completar Lagos enero-julio 2026 e informes"
git push
```

# Lagos 2797 · Evolución de gastos y proveedores (v1.1)

## 1. Fuente y períodos cubiertos

- **2025:** abril, mayo, julio, agosto, octubre y diciembre, a partir de seis liquidaciones individuales de la unidad 01-03 (en abril el comprobante corresponde a CH-11). El formato incluye rubros generales y morosos por unidad.
- **2026:** enero–julio; se restauran enero–abril desde el paquete incremental v0.9, ausentes en el ZIP funcional suministrado. Mayo–julio permanecen sin cambios respecto de ese paquete.
- **Meses sin comprobante 2025:** enero, febrero, marzo, junio, septiembre y noviembre. **No se estiman ni interpolan datos.**
- Todos los importes se presentan en **pesos nominales**, sin ajuste por inflación en esta versión.

## 2. Indicadores disponibles

- Evolución mensual del **total computable para liquidar expensas** y del importe neto descontando fondos identificados (estos últimos **no son equivalentes a egresos de caja**).
- Descomposición por rubros 01–04 y 08, manteniendo su ubicación original en las liquidaciones.
- Fondos operativos y de reserva separados **por concepto**, incluso cuando se imputan al rubro 04. Incluye devoluciones netas cuando están informadas.
- Historial por proveedor y ranking para el período elegido; los movimientos de fondo no figuran como proveedores.
- Clasificación **analítica y orientativa** entre servicios/honorarios habituales, otros trabajos, fondos y ajustes; requiere análisis del detalle antes de comparar facturas.
- Seguimiento de morosidad anterior ampliado a los 13 meses documentados, sin conectar meses sin PDF en los gráficos.

## 3. Resumen de 2025

| Período | Liquidación | Deuda visible | Unidades en listado |
|---|---:|---:|---:|
| Abril 2025 | $ 2.962.268,05 | $ 10.189.993,21 | 28 |
| Mayo 2025 | $ 3.327.901,72 | $ 10.811.272,53 | 24 |
| Julio 2025 | $ 3.402.163,73 | $ 12.744.564,65 | 23 |
| Agosto 2025 | $ 3.155.508,57 | $ 13.517.744,11 | 17 |
| Octubre 2025 | $ 2.877.603,79 | $ 16.408.706,33 | 18 |
| Diciembre 2025 | $ 3.201.040,47 | $ 19.077.904,54 | 18 |

Los importes anteriores están expresados en pesos argentinos nominales.

## 4. Alertas contables y límites

1. En **2025 agosto y octubre**, las partidas de fondo de reserva aparecen dentro de **Varios (rubro 04)**. No deben tratarse como pago efectivo de obra por el solo hecho de estar liquidadas.
2. Los meses sin PDF interrumpen las líneas de evolución. Las variaciones comparadas contra la liquidación anterior **disponible** no son necesariamente cambios de un único mes.
3. Un proveedor puede facturar mantenimiento habitual, obras, materiales y anticipos en el mismo mes. El ranking suma cargos **liquidados**; no mide pagado.
4. La baja o desaparición de una unidad del listado de morosidad **no confirma pago ni convenio**.
5. Las liquidaciones no proveen caja, flujo de cobranzas ni saldo real de reservas.
6. Los PDFs originales no se publican en el dashboard porque contienen nombres de propietarios y datos de pago. Los informes derivados evitan esos datos.

## 5. Alcance del parche

Se actualizan `index.html`, `styles.css`, `multibuilding.js`, el manifiesto de edificios y los JSON/documentos de Lagos. No se modifica `app.js`, `data/expensas-2026.json`, los PDFs ni los informes de Alem. **No se agregan comparaciones entre edificios**.

## 6. Pruebas reproducibles

- Conciliación aritmética automatizada en `docs/VALIDACION_LAGOS_v1_1.json` (13 meses).
- `node --check` sobre `multibuilding.js`.
- Prueba programática de inicialización y eventos UI con DOM simulado (13 meses, selección de proveedor, series, enlaces a informes, cambio Alem/Lagos); no equivale a prueba visual real.
- Verificar visualmente en PC/tablet y revisar impresión/PDF antes de publicar.

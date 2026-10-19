# Especificación y validaciones — Seguimiento morosidad Lagos 2797 (v1.0)

## Objetivo y fuentes

Ampliar la vista del segundo edificio con un seguimiento analítico de morosidad a partir de las siete liquidaciones individuales de enero–julio 2026. Fuente de ejecución: `consorcios/lagos-2797/data/2026.json`, generado y conciliado en la v0.9; fuente documental: los siete PDFs originales (NO publicados en el sitio porque contienen nombres de propietarios).

El ejemplo `Informe_Consorcio_Lagos_Actualizado_Julio_2026.pdf` es la referencia conceptual del seguimiento (serie mensual, concentración, detalle por unidad y cautelas contables). **No se agregó ese PDF al sitio porque contiene nombres de propietarios.**

## Semántica y garantías

- **Deuda visible:** suma de importes positivos publicados bajo el listado "Deudores"; no se presume equivalencia con el saldo general de créditos del edificio.
- **Ausente del listado:** `null`/"No figura". Jamás convertir a `0` ni a pago confirmado.
- **Cambio entre meses:** diferencia de sumas visibles, no cobranza efectiva.
- **Variación por unidad:** se calcula **sólo si está listada en ambos meses**. En caso contrario se rotula "Aparece en listado" o "Deja de figurar"; sin diferencia comparable.
- **Deuda/liquidación:** cociente de deuda visible / total computable del mes. Mide equivalentes de liquidaciones mensuales, no la antigüedad de cada saldo.
- **Concentración:** importes de los mayores N deudores del mes divididos por el total visible del mismo mes.
- No se muestran nombres de propietarios. No se añade análisis comparativo Alem–Lagos.

## Valores de referencia de julio

- Deuda visible: $26.630.241,82.
- Total liquidado: $5.218.191,96.
- Registros deudores: 25.
- Deuda / total liquidado: 5,10 veces.
- Top 5: 70,9 % de la deuda visible.
- Diferencia respecto de junio: +$2.675.691,47 (≈11,2 %).

## Caso de discontinuidad

Unidad 10-04:
- Mayo 2026: $3.610.263,23.
- Junio 2026: no figura en el listado.
- Julio 2026: $107.279,45.

Esto es señal para consultar el mayor contable; **no acredita recuperación de deuda por sí solo**.

## Validaciones realizadas

1. Se conserva el JSON actual y `app.js` de Alem; cambios sólo en HTML, CSS y `multibuilding.js`.
2. Se comprobó en navegador Chromium mediante Playwright la presencia de siete meses, gráficos, tablas, selectores, filtros y acceso desde la tabla de deudores a la historia por unidad.
3. Se verificó el caso 10-04 y que no exista una línea artificial hacia cero en junio.
4. Se comprobó el cambio desde Lagos a Alem, que el contenido de Alem siga visible y no haya errores JS.
5. En viewport móvil de 390 px no aparece desplazamiento horizontal global; las tablas extensas siguen desplazándose dentro de sus contenedores.

El usuario debe verificar finalmente localhost/GitHub Pages antes de dar la actualización por aceptada.

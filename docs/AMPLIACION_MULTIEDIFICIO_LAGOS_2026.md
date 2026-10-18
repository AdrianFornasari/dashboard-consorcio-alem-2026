# Ampliación multiedificio v0.8 — Alem y Torre VI Lagos 2797

## Objetivo

Incorporar un segundo consorcio al dashboard existente sin perder funcionalidades ni alterar `data/expensas-2026.json` de Alem. La nueva vista utiliza el selector **Edificio** en la cabecera, un catálogo central y un archivo de datos independiente.

## Fuentes incorporadas

- Mayo 2026: `Lagos-Expensas202605Liquidación.pdf`, **página rotulada 17**.
- Junio 2026: `Lagos-Expensas202606Liquidación.pdf`, página 1.
- Julio 2026: `Lagos-Expensas202607Liquidación.pdf`, página 1.

**Alcance:** los tres documentos son copias **individuales de la unidad 01-03** que incluyen resumen de gastos generales, partidas y listado de deudores. No son liquidaciones integrales con estado de caja y patrimonio al cierre. Por ello no se publican números no contenidos en dichas fuentes.

## Conciliación de datos transcritos

| Mes | Rubros habituales 01-04 | Rubro 08 no habitual | Total computable | Deudores enumerados | Suma del listado de deudores |
|---|---:|---:|---:|---:|---:|
| Mayo | $1.576.093,65 | $3.750.756,60 | $5.326.850,25 | 20 | $25.264.410,29 |
| Junio | $2.360.116,56 | $3.000.000,00 | $5.360.116,56 | 22 | $23.954.550,35 |
| Julio | $2.218.191,96 | $3.000.000,00 | $5.218.191,96 | 25 | $26.630.241,82 |

Para cada mes se verificó que:
1. La suma de los rubros coincide con el **total computable para determinar las expensas**.
2. La suma de las partidas/ajustes por proveedor y concepto coincide con dicho total.
3. La suma de importes de deudores de la lista se almacena con su etiqueta explícita **suma del listado publicado**, no como «cuentas a cobrar» certificadas.

El 08-**NO HABITUALES** incluye **FONDO OPERATIVO**, que no es un proveedor y podría representar fondos/acopios para obras. No tratar como pago efectivo. El comprobante de julio incluye una línea de «Servicio Julio 2025» asociada a ascensores dentro de la liquidación julio 2026: requiere verificación documental.

## Campos no disponibles para Lagos

Caja inicial/final, caja neta, cuentas por pagar, pagos en término, recupero de deuda, intereses cobrados, intereses a cobrar y saldo contable global de cuentas por cobrar. Son `null` y no se presentan como cero. No hay equivalencia directa con los indicadores contables completos de Alem.

## Privacidad y publicación

Los PDFs originales de Lagos contienen titulares y nombres de deudores. **No se incorporan al ZIP público ni se enlazan desde la aplicación.** Los datos transcritos y los informes PDF sólo identifican unidades funcionales. El usuario conserva los originales fuera de GitHub Pages.

La versión anterior del repositorio Alem contiene PDFs originales que podrían incluir nombres propios. Esta actualización **no los elimina ni los anonimiza**; revisarlos antes de compartir públicamente el sitio.

## Cambios en archivos

- `index.html` — selector de consorcio y vista Lagos.
- `styles.css` — layout para Lagos sin modificar estilos estructurales anteriores.
- `multibuilding.js` — selector, gráficos, filtros, comparaciones y tablas de Lagos.
- `data/edificios.json` — catálogo de consorcios.
- `consorcios/lagos-2797/data/2026.json` — datos estructurados anónimos.
- `consorcios/lagos-2797/informes/202605-informe.pdf`, `202606-informe.pdf`, `202607-informe.pdf` — análisis mensuales.
- `docs/validacion_lagos_2026.json` — conciliaciones numéricas.

`app.js` y `data/expensas-2026.json` **no se modifican**: Alem conserva exactamente su base y comportamiento v0.7.

## Próximas fases

1. Solicitar una liquidación general completa de Lagos, o extractos/estado de fondos de la administración, para incorporar caja, deuda consolidada y movimientos reales.
2. Diseñar esquema contable compartido con datos faltantes explícitos, evitando afirmar equivalencia entre «total liquidado» y «gasto pagado».
3. Crear una sección de comparación entre edificios sólo para indicadores homogéneos y períodos disponibles.
4. Revisar publicación de documentos originales en Alem y definir política de versión pública anonimizada por consorcio.

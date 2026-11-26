# Seguimiento de fondos, anticipos y obras — v1.2

## Objetivo

Facilitar la rendición de cuentas en Alem 1274 y Ovidio Lagos 2797. Registrar **qué aparece liquidado** cada mes para proyectos/partidas de fondos, anticipos, compras y trabajos. El sistema no afirma conocer pagos efectivos, saldos de contratos, avances físicos ni ingresos al banco.

## Criterio de clasificación

| Clase | Interpretación | NO permite afirmar |
|---|---|---|
| Fondo | Importe neto liquidado como fondo de reserva u operativo; incluye devoluciones negativas | Que ese dinero está depositado o disponible |
| Acopio | Partida liquidada como acopio o saldo de acopio | Que representa un anticipo pagado efectivamente |
| Anticipo/cuota | Entrega o cuota de obra incluida en la liquidación | Que se concretó la transferencia |
| Trabajo/compra | Factura o concepto de intervención registrado en liquidación | Que la obra fue certificada y pagada |
| Mixto | Partida agrupada con obra + acopio u otros conceptos | Que se pueden distribuir los componentes sin respaldo |
| Ajuste/devolución | Importe negativo que corrige otra partida | Que el proveedor transfirió dinero al consorcio |

**No sumar fondos con trabajos como inversión ejecutada**: financiamiento y destino se pueden solapar. Tampoco utilizar un total acumulado de acopios para determinar la disponibilidad efectiva de caja.

## Alem — foto de cuentas por pagar de octubre 2026

La liquidación oficial de octubre presenta **$1.550.000,00** de saldos impagos: $100.000 de un acopio de agosto, $1.150.000 por trabajo de cámara de octubre, y $300.000 de acopio extraordinario para reparaciones de octubre. Esta es una **foto al cierre de octubre**, no la suma de obligaciones de cada mes. La asignación por concepto se apoya en la descripción de esa liquidación, no constituye certificación de contrato.

El detalle de proveedores de Alem contiene en algunos meses entradas agregadas (p. ej. reparaciones y acopios en una sola línea). Se mantienen como **mixtas, sin desagregarlas de manera inventada**.

## Lagos — alcance limitado

Los PDFs de Lagos son comprobantes individuales que resumen rubros de la liquidación general y una lista de deudores. No acompañan movimientos de caja, estado de fondos, órdenes de pago, facturas completas ni cuentas por pagar por obra. Los fondos informados **no equivalen a fondos efectivamente recaudados**.

Las partidas de fondo operativo con descripción de cañerías y las partidas de fondo de reserva se mantienen **separadas** de los trabajos imputados a proveedores, incluso cuando se refieren a obras potencialmente relacionadas.

## Controles

1. Cada movimiento del registro se referencia con **edificio, mes, índice de partida, proveedor, concepto e importe**, tomado de los JSON mensuales existentes.
2. En generación, el script falla si falta un mes, proyecto o índice; valida el saldo de cuentas por pagar de octubre contra el valor global de la liquidación de Alem.
3. Para nuevos meses, corresponde revisar los documentos originales e **incorporar manualmente** las nuevas partidas en `scripts/build_funds_registry_v12.py`; no se inventan movimientos por una búsqueda textual automática.
4. Un mes sin PDF aparece como **sin documento**, nunca como importe cero ni como continuidad de cobro.
5. Fuentes originales que contienen nombres de consorcistas deben mantenerse fuera de GitHub Pages. Este módulo muestra solamente proveedores, proyectos y conceptos de gasto.

## Datos adicionales necesarios para auditoría financiera completa

- Extractos bancarios y libro de caja por mes.
- Mayor de cuenta corriente separado por fondo y proyecto.
- Actas de aprobación, presupuestos y órdenes de trabajo.
- Facturas completas, recibos y certificados de avance.
- Identificación de anticipos aplicados a facturas posteriores y ajustes de devolución.

Hasta contar con esa documentación, el dashboard sólo permite **seguir los movimientos declarados en las liquidaciones**, identificar pendientes documentales y solicitar explicaciones concretas.

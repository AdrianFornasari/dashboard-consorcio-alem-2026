# v1.3 — Auditoría automática y trazabilidad documental

## Objetivo y alcance

Se agrega una sección de auditoría **por consorcio y por mes**. No se comparan consorcios. La auditoría comprueba **consistencia interna de los JSON publicados** y la presencia de documentos locales; **no equivale** a verificar independientes originales de las liquidaciones, auditar bancariamente pagos, validar actas, ni certificar la eliminación de datos personales en los PDFs.

## Controles del registro

- Total del mes vs. sus componentes (Alem: ordinarios + extraordinarios + particulares; Lagos: habituales + no habituales).
- Total del mes vs. categorías / rubros.
- Total del mes vs. movimientos registrados por proveedor, incluidas devoluciones negativas cuando forman parte del documento.
- Saldo de deuda declarado vs. listado de unidades funcionales, incluyendo duplicados.
- Presencia de nombres identificables de proveedor (no personas propietarias), cuantías numéricas y coherencia de caja neta para Alem.
- Presencia en el proyecto del informe mensual y del PDF original publicable para Alem.
- En Lagos, reconocimiento de que no existe PDF original público ni estado bancario de caja en estas liquidaciones individuales.
- Control de modificación posterior: firma SHA-256 de los 4 JSON usados para crear el registro (`expensas-2026`, dos años de Lagos, `seguimiento_fondos_v12`). Se señala si fueron modificados sin regenerar la auditoría.

**NO se afirma** que los PDFs originales y el JSON tengan los mismos importes: esa comparación requiere leer el PDF y cotejar la extracción, y el registro v1.3 lo indica como *pendiente*. Tampoco se considera como prueba de anonimización la mera presencia de un PDF.

## Trazabilidad

La nueva tabla permite buscar por rubro, proveedor, unidad o fondo. Muestra el **origen exacto dentro del JSON** (ruta y posición `months[i]` y `providers[j]`/`debtors[j]`) y, cuando el registro documental v1.2 lo consigna, referencia a liquidación y página. Si no se conoce una página precisa, dice explícitamente *Página sin determinar*.

**Privacidad:** únicamente códigos de unidad funcional, sin nombres de propietarios. Los originales de Lagos se conservan fuera de GitHub Pages. Los PDFs existentes de Alem NO se modifican aquí: revisar individualmente su privacidad antes de publicar.

## Procedimiento mensual recomendado

1. Agregar la liquidación y su reporte al proyecto mediante el procedimiento de carga habitual.
2. Verificar el JSON del mes contra el PDF original, incluyendo total liquidado, gastos extraordinarios, proveedores, deuda de unidades y pagos.
3. Ejecutar desde la raíz del proyecto:

```bash
python scripts/auditar_consorcios_v13.py --check
```

Si se detectan errores de suma, corregir los datos de origen (no silenciar el control). Después:

```bash
python scripts/auditar_consorcios_v13.py --build
```

4. Probar el sitio local y abrir **Auditoría y trazabilidad** para comprobar el mes nuevo; luego `git status`, commit y push. **No editar manualmente** `data/auditoria_v13.json`.

El script funciona sin paquetes de terceros. `--check` sale con código 1 ante errores contables internos; advertencias o pendientes no bloquean, pero deben investigarse.

## Resultados sobre la base de referencia al generar v1.3

- **10 meses de Alem**: enero–octubre 2026.
- **13 meses de Lagos**: abril, mayo, julio, agosto, octubre y diciembre 2025; enero–julio 2026.
- En ambos casos las principales conciliaciones internas de totales, rubros, proveedores y listado de deudores dieron diferencias **$0,00**.
- El sistema identifica los controles documentales aún pendientes; los meses ausentes **no se interpolan**.

## Compatibilidad

No se modifica `app.js`, `multibuilding.js`, `fondos.js`, los datos mensuales, PDFs o informes. Se agregan `auditoria.js`, `data/auditoria_v13.json`, `scripts/auditar_consorcios_v13.py` y esta documentación; se actualizan `index.html` y `styles.css` para mostrar la sección.

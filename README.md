# Dashboard Expensas Alem 2026 — MVP

Dashboard estático en HTML/CSS/JavaScript puro, pensado para GitHub Pages.

## Qué incluye

- Resumen mensual con caja, caja neta, deuda, gastos y recupero de mora.
- Comparativa por períodos a elección.
- Composición del gasto por rubro.
- Detalle del gasto por proveedor.
- Morosidad por unidad funcional, sin nombres de propietarios.
- Enlaces a PDFs de expensas e informes mensuales.

## Cómo probar localmente

Desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

No conviene abrir `index.html` directamente con doble clic porque el navegador puede bloquear la carga de `data/expensas-2026.json`.

## Cómo actualizar cada mes

1. Copiar el nuevo PDF en `pdfs/`, por ejemplo `202610Expensas.pdf`.
2. Agregar un nuevo objeto mensual en `data/expensas-2026.json`.
3. Completar:
   - caja final;
   - cuentas por pagar;
   - gastos ordinarios, extraordinarios y particulares;
   - deuda de capital;
   - intereses a cobrar;
   - expensas corrientes a cobrar;
   - composición por rubro;
   - gastos por proveedor;
   - deudores sólo por unidad funcional.
4. Publicar en GitHub Pages.

## Privacidad

El dashboard no usa login. Por eso, si se publica en GitHub Pages, cualquier persona con el enlace podría verlo. La sección de morosidad está anonimizada por unidad funcional y no incluye nombres de propietarios.

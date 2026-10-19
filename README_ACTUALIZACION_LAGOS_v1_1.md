# Actualización incremental v1.1 — Lagos: gastos, proveedores e histórico 2025

**Base:** `dashboard-consorcio-alem-2026-main(1).zip` (versión funcional enviada por el usuario, v1.0).
**No modifica el dashboard Alem ni incorpora comparaciones entre edificios.**

## Cambios

1. Nueva sección «Evolución de gastos y proveedores» de Lagos, con gráficos históricos, selector de períodos, desglose de fondos, ficha y ranking de proveedores y alertas orientativas.
2. Se agregan seis liquidaciones 2025 al modelo de datos (abril, mayo, julio, agosto, octubre y diciembre); se conservan huecos donde faltan meses.
3. Se restauran los datos y los informes de enero–abril 2026 usando la v0.9 previamente generada, ya que el ZIP v1.0 entregado sólo contenía mayo–julio.
4. Se generan seis informes interpretativos anonimizados correspondientes a 2025.
5. Se extiende la serie de morosidad a los 13 meses disponibles, sin unir los meses ausentes en los gráficos.
6. No se distribuyen los PDFs originales de Lagos, porque incluyen nombres de propietarios.

## Cómo instalar desde la PC

Abrí PowerShell en la raíz del proyecto (`C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026`) y comprobá `git status`. Si hay trabajo sin guardar o commits locales por subir, resolvelo primero.

**Opción A:** descomprimí el ZIP en la raíz del repositorio conservando carpetas y reemplazando los archivos indicados. **Opción B:** descomprimí en una carpeta temporal y desde la carpeta del proyecto ejecutá:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\ruta\al\paquete\aplicar_update.ps1"
```

Después, desde la raíz del proyecto:

```powershell
python -m http.server 8080
```

Abrí http://localhost:8080, elegí **Torre VI · Lagos 2797** y revisá gastos, morosidad, proveedores e informes de 2025/2026. Luego seleccioná Alem y verificá que siga funcionando.

Para publicar:

```powershell
git status
git add index.html styles.css multibuilding.js data/edificios.json consorcios/lagos-2797 docs/EVOLUCION_GASTOS_LAGOS_2025_2026_v1_1.md docs/VALIDACION_LAGOS_v1_1.json README_ACTUALIZACION_LAGOS_v1_1.md
git commit -m "Lagos evolucion de gastos e historico 2025"
git push
```

**Codespaces:** subí el ZIP al entorno, extraelo fuera del repo y ejecutá `bash /ruta/paquete/aplicar_update.sh` desde la raíz del repositorio.

## Validación manual prioritaria

- Aparecen **13 meses** (seis de 2025, siete de 2026) al elegir Lagos.
- **Abril 2025**: total liquidado $2.962.268,05; deuda visible $10.189.993,21.
- **Julio 2026**: total liquidado $5.218.191,96; deuda visible $26.630.241,82.
- El gráfico presenta interrupciones en junio, septiembre y noviembre de 2025.
- Se puede seleccionar un proveedor y revisar cargos de distintos períodos; el ranking permite elegir uno.
- Hay seis informes PDF de 2025, más los siete de 2026.
- El informe de Lagos **no muestra datos de caja inexistentes**; el de Alem y sus funciones siguen igual.
- Probar exportación PDF y vista móvil. Si GitHub Pages muestra datos viejos, usar recarga forzada.

## Documentación técnica

`docs/EVOLUCION_GASTOS_LAGOS_2025_2026_v1_1.md` y `docs/VALIDACION_LAGOS_v1_1.json`.

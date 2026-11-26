# Carga mensual semiautomática v1.4

Compatible con **Dashboard Consorcios v1.3**. No requiere backend ni credenciales. Funciona en la PC de desarrollo o en Codespaces.

## Alcance y decisiones de seguridad

- **Separación clara** entre extracción provisional, revisión humana y publicación local.
- Nunca incorpora el **PDF original** con titulares y datos personales al sitio alojado en GitHub Pages.
- Guarda los borradores y las vistas de revisión **fuera del repositorio** por defecto (`../consorcios_cargas_privadas/`). Tampoco se deben copiar esas carpetas a `docs/`, `data/` o `public/`.
- Los importes extraídos son **candidatos**, no una certificación. El operador debe cotejar el PDF y corregir cualquier renglón no reconocido.
- Si las sumas no concilian, el proceso **se bloquea**. Un campo faltante jamás se interpreta como cero.
- Para **Lagos**, el importe `liquidatedTotal` refleja el total liquidado, **no pagos efectuados**. La deuda visible se obtiene de la suma de la lista; sin otro total publicado no hay verificación independiente.
- Para **Alem**, el balance incluye caja, morosidad y cuentas por pagar cuando los datos están presentes en las liquidaciones modernas.
- La v1.4 **no actualiza automáticamente** el registro de seguimiento de fondos/obras v1.2: requiere una revisión documental adicional de movimientos extraordinarios, obras y acopios.
- El informe generado en PDF es un **resumen financiero derivado** y anonimizado, no sustituye el informe analítico extensivo que preparamos en ChatGPT.
- No hay automatismo de `git add`, `git commit`, `git push` ni publicación remota.

## Instalación

Desde la raíz del repositorio:

```powershell
python -m pip install -r scripts/requirements_carga_v14.txt
```

En Codespaces, el comando equivalente es el mismo (`python3 -m pip ...` si fuese necesario).

## Paso 1 — Preparar una liquidación

Ubicá el PDF original **fuera del repositorio**. Por ejemplo, en `Descargas`.

```powershell
python scripts/carga_mensual_v14.py preparar --pdf "C:\Users\TU_USUARIO\Downloads\202611Expensas.pdf"
```

Desde Codespaces, subí primero el PDF a un directorio externo al repo, por ejemplo `/tmp/expensas`, y luego ejecutá:

```bash
python scripts/carga_mensual_v14.py preparar --pdf /tmp/expensas/nueva-liquidacion.pdf
```

El programa identifica el edificio y el **mes de cierre** (distinto del mes de vencimiento), y genera:

- `borrador.json`: todos los datos extraídos para verificar y corregir.
- `revision.html`: vista privada local con editor y validador preliminar.
- `control.json`: bloqueos detectados en las conciliaciones.

Si no se identifica el mes, podés indicarlo con `--mes AAAA-MM`, pero **sólo si el mes está confirmado en el PDF**. Si la liquidación es escaneada o cambia de formato, deberá revisarse manualmente: el programa no adivina valores.

## Paso 2 — Revisar y aprobar

Abrí `revision.html` en el navegador. Cotejá todas las cifras del borrador con las tablas del PDF, especialmente:

1. Total de la liquidación y composición de rubros.
2. Cada movimiento por proveedor, sin duplicaciones ni errores de líneas cortadas.
3. Lista y suma de unidades deudoras, sin nombres de titulares.
4. Fondos de reserva y operativos: representan importes liquidados, no saldos de caja.
5. Caja, cobranzas y cuentas por pagar si el PDF las informa.

Una vez corregido, en el JSON colocá:

```json
"revision": {
  "aprobado": true,
  "cotejoPDF": true,
  "responsable": "Revisión manual efectuada",
  "observaciones": "Cotejado con el PDF original; aclaraciones ..."
}
```

El botón **Descargar revisión editada** descarga `revision_aprobada.json`. Guardalo fuera del repositorio.

La validación definitiva se realiza en la terminal:

```powershell
python scripts/carga_mensual_v14.py validar --revision "RUTA_A_REVISION_APROBADA.json"
```

Si aparece un bloqueo, volvé a corregir. El programa no publica números que no concilian.

## Paso 3 — Simular publicación

```powershell
python scripts/carga_mensual_v14.py publicar --revision "RUTA_A_REVISION_APROBADA.json" --repo . --simular
```

Este comando valida de nuevo el SHA-256 del PDF original, el edificio, el período, las sumas y la compatibilidad con la auditoría v1.3. **No modifica** la aplicación.

## Paso 4 — Publicar sólo si la revisión está completa

```powershell
python scripts/carga_mensual_v14.py publicar --revision "RUTA_A_REVISION_APROBADA.json" --repo .
```

Al publicar, el programa:

- Rechaza meses duplicados; no reemplaza datos existentes.
- Hace respaldo del JSON anterior **fuera del repositorio**.
- Añade el mes en el JSON que corresponde al edificio.
- Genera un PDF de resumen **sin nombres de titulares** en la ruta de informes.
- **No copia el PDF original** al sitio público; `pdf` queda en `null`.
- Regenera `data/auditoria_v13.json`.

No actualiza otras aplicaciones ni servidores.

## Paso 5 — Probar y subir a GitHub

```powershell
python -m http.server 8080
```

Revisá el edificio, mes, proveedores, deuda, informe y auditoría. Comprobá también Alem y Lagos. Si todo funciona:

```powershell
git status
git diff
git add data/expensas-2026.json consorcios/lagos-2797/data data/auditoria_v13.json informes consorcios/lagos-2797/informes
git commit -m "Agregar liquidacion mensual validada"
git push
```

Usá `git add` sólo para los archivos realmente generados o editados: no subas archivos privados.

## Qué hacer si algo falla

- `PDF sin texto suficiente`: archivo escaneado, necesita OCR o extracción manual; no insistas con una extracción incompleta.
- `No se pudo identificar edificio`: revisá la fuente, el parser sólo soporta los dos edificios ya registrados.
- `Total rubros/proveedores no concilia`: hay partidas omitidas, duplicadas o interpretadas incorrectamente; editá el borrador y volvé a validar.
- `Ya existe ese mes`: evitamos sobrescribir meses previos por accidente. Si necesitás corregir un dato ya publicado, hacelo en una rama y con revisión explícita.
- `No se puede publicar`: revisá los mensajes; no se fuerzan controles ni se inventan pagos.

## Limitaciones explícitas

El extractor está probado con liquidaciones históricas en texto de **Alem (formato moderno)** y **Torre VI de Lagos**. Un cambio en la disposición del PDF puede requerir ajustes. En algunos meses anteriores de Alem, la extracción de líneas de proveedores puede no conciliar automáticamente; se exige corrección humana. La verificación de exactitud contra la fuente no puede automatizarse completamente con una simple suma de JSON.

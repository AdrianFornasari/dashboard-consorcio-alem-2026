# Actualización parcial v0.8 — Segundo consorcio

Esta actualización está preparada para el repositorio existente `dashboard-consorcio-alem-2026` partiendo del ZIP recibido el 18/10/2026.

**No descomprimas dentro de una carpeta adicional.** Los archivos deben quedar en la raíz del repositorio al mismo nivel que `app.js` y `index.html`.

## Archivos del paquete

- `index.html`, `styles.css` y `multibuilding.js`
- `data/edificios.json`
- `consorcios/lagos-2797/data/2026.json`
- `consorcios/lagos-2797/informes/202605-informe.pdf` (y junio y julio)
- `docs/AMPLIACION_MULTIEDIFICIO_LAGOS_2026.md`
- `docs/validacion_lagos_2026.json`
- Scripts de instalación opcionales (PowerShell y bash)

No reemplaza `app.js`, `data/expensas-2026.json`, ni documentos existentes de Alem. No se incluyen los PDFs originales de Lagos por contener datos identificatorios.

## Instalación desde Windows

Primero, comprobar que el repositorio está limpio:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
git status
```

Descomprimir el paquete **en la raíz del repositorio**, conservando sus subcarpetas, o descomprimirlo aparte y ejecutar `aplicar_update.ps1` desde la carpeta descomprimida (PowerShell puede requerir `-ExecutionPolicy Bypass`).

```powershell
python -m http.server 8080
```

Abrir <http://localhost:8080> y comprobar en el selector de edificios:
1. Alem continúa funcionando, con sus once pestañas.
2. Lagos carga mayo, junio y julio de 2026.
3. Los gráficos de torta y las leyendas son interactivos; proveedor filtra la tabla.
4. Los informes PDF se abren; no hay enlaces a las liquidaciones originales de Lagos.
5. Al regresar a Alem, siguen funcionando los filtros y documentos anteriores.

Luego:

```powershell
git status
git add index.html styles.css multibuilding.js data/edificios.json consorcios/lagos-2797 docs/AMPLIACION_MULTIEDIFICIO_LAGOS_2026.md docs/validacion_lagos_2026.json
git commit -m "Incorporar segundo consorcio Lagos con datos parciales 2026"
git push
```

## Codespaces / tablet

Subir el ZIP, descomprimirlo en carpeta temporal y copiar manteniendo estructura. El script `aplicar_update.sh` puede ejecutarse desde la carpeta extraída con la raíz del repositorio como directorio de trabajo.

## Nota contable y de privacidad

Los documentos de Lagos no permiten calcular caja neta, recupero ni cuentas a pagar. No confundir su total de expensas liquidadas con gastos efectivamente pagados. Revisar qué PDFs originales de Alem permanecen públicos en GitHub Pages.

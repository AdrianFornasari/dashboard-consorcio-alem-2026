# Guía de desarrollo PC ↔ Tablet — Dashboard Consorcio Alem 2026

Proyecto local en PC:

```powershell
C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026
```

Repositorio GitHub: usar el repositorio ya vinculado al proyecto `dashboard-consorcio-alem-2026`.

## Objetivo

Esta guía define el flujo seguro para continuar el desarrollo del dashboard desde la PC o desde tablet/celular usando GitHub Codespaces, sin perder cambios ni generar conflictos innecesarios.

El criterio general es:

- **PC:** entorno principal de desarrollo y prueba local.
- **Tablet:** desarrollo remoto con GitHub Codespaces.
- **GitHub:** punto común de sincronización.
- **GitHub Pages:** publicación del dashboard.

---

## 1. Antes de cambiar de dispositivo

Antes de dejar la PC o la tablet, siempre verificar que el trabajo esté guardado, commiteado y subido a GitHub.

Comando de control:

```bash
git status
```

Estado ideal:

```text
nothing to commit, working tree clean
```

Si hay archivos modificados, hacer commit y push antes de cambiar de dispositivo.

---

## 2. Flujo desde PC hacia tablet

### 2.1 En la PC, guardar y subir cambios

Abrir PowerShell:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
git status
```

Si hay cambios:

```powershell
git add .
git commit -m "Actualizar dashboard antes de continuar en tablet"
git push
```

Si no hay cambios:

```powershell
git pull
```

### 2.2 Abrir Codespaces desde la tablet

Desde Chrome en tablet:

1. Entrar al repositorio en GitHub.
2. Presionar **Code**.
3. Abrir la pestaña **Codespaces**.
4. Crear o reabrir el Codespace existente.

### 2.3 Actualizar Codespaces

En la terminal de Codespaces:

```bash
git status
git pull
```

Si el estado queda limpio, ya se puede trabajar desde la tablet.

---

## 3. Flujo desde tablet hacia PC

### 3.1 En Codespaces, guardar y subir cambios

En la terminal de Codespaces:

```bash
git status
```

Si hay cambios:

```bash
git add .
git commit -m "Actualizar dashboard desde tablet"
git push
```

Verificar:

```bash
git status
```

Estado esperado:

```text
nothing to commit, working tree clean
```

### 3.2 En la PC, traer los cambios

Abrir PowerShell:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
git status
```

Si la PC está limpia:

```powershell
git pull
```

Después probar localmente:

```powershell
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

---

## 4. Uso de ramas durante viajes

Para cambios chicos puede trabajarse directamente en `main`.

Para cambios más grandes, conviene crear una rama de viaje:

```bash
git checkout -b viaje-mejoras-dashboard
```

Guardar cambios:

```bash
git add .
git commit -m "Mejoras dashboard durante viaje"
git push -u origin viaje-mejoras-dashboard
```

Al volver a la PC:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
git fetch origin
git checkout viaje-mejoras-dashboard
git pull origin viaje-mejoras-dashboard
```

Probar localmente. Si todo funciona, integrar a `main`:

```powershell
git checkout main
git pull origin main
git merge viaje-mejoras-dashboard
git push origin main
```

---

## 5. Cómo aplicar un ZIP incremental en Codespaces

Cuando ChatGPT entregue un ZIP con cambios, subirlo a la raíz del repositorio en Codespaces.

La raíz es donde están:

```text
index.html
styles.css
app.js
README.md
data/
pdfs/
informes/
```

### 5.1 Subir el ZIP

Método recomendado:

1. En Codespaces, abrir el panel izquierdo **Explorer**.
2. Arrastrar el ZIP desde el dispositivo hacia la raíz del proyecto.
3. Confirmar que el ZIP quedó al lado de `index.html`.

Verificar en terminal:

```bash
ls
```

### 5.2 Descomprimir y aplicar

Ejemplo con un ZIP llamado `dashboard_update.zip`:

```bash
mkdir -p /tmp/dashboard_update
unzip -o dashboard_update.zip -d /tmp/dashboard_update
find /tmp/dashboard_update -maxdepth 3 -type f
```

Si el ZIP trae script `aplicar_update.sh`:

```bash
bash /tmp/dashboard_update/aplicar_update.sh
```

Si no trae script, copiar manualmente:

```bash
cp -r /tmp/dashboard_update/* .
```

Revisar cambios:

```bash
git status
git diff
```

Probar:

```bash
python -m http.server 8080
```

Commit y push:

```bash
git add .
git commit -m "Aplicar actualización del dashboard"
git push
```

---

## 6. Cómo aplicar un ZIP incremental en PC

1. Descargar el ZIP.
2. Descomprimirlo dentro de:

```text
C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026
```

3. Reemplazar archivos existentes cuando Windows lo solicite.
4. Probar local:

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
python -m http.server 8080
```

5. Abrir:

```text
http://localhost:8080
```

6. Commit y push:

```powershell
git status
git add .
git commit -m "Aplicar actualización del dashboard"
git push
```

---

## 7. Resolución de errores frecuentes

### Error: `fatal: The current branch has no upstream branch`

Ver rama actual:

```bash
git branch --show-current
```

Si la rama es `main`:

```bash
git push -u origin main
```

Si la rama es `viaje-mejoras-dashboard`:

```bash
git push -u origin viaje-mejoras-dashboard
```

Luego, en futuros cambios, alcanza con:

```bash
git push
```

### Error: cambios locales impiden hacer pull

Ver estado:

```bash
git status
```

Si son cambios que se quieren conservar:

```bash
git add .
git commit -m "Guardar cambios locales antes de sincronizar"
git pull
```

Si son cambios descartables:

```bash
git restore .
git pull
```

### Error: el ZIP quedó en otra carpeta

Buscarlo:

```bash
find . -name "*.zip"
```

---

## 8. Checklist rápido antes de terminar una sesión

Antes de cerrar PC, tablet o Codespaces:

```bash
git status
```

Si hay cambios:

```bash
git add .
git commit -m "Actualizar dashboard"
git push
```

Confirmar que quedó limpio:

```bash
git status
```

Estado ideal:

```text
nothing to commit, working tree clean
```

---

## 9. Reglas prácticas del proyecto

- No modificar directamente archivos sin probar localmente o en Codespaces.
- Mantener el dashboard sin nombres de propietarios; usar sólo unidades funcionales.
- Subir PDFs e informes mensuales cuando estén disponibles.
- Validar datos contra el PDF mensual de expensas y contra el informe mensual.
- Antes de publicar cambios importantes, revisar en PC y en pantalla móvil.
- Después de cada push, verificar GitHub Pages con caché limpia o modo incógnito.

---

## 10. Comandos mínimos para retomar en PC

```powershell
cd "C:\Trabajos\Consorcio_Alem\dashboard-consorcio-alem-2026"
git status
git pull
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

---

## 11. Comandos mínimos para retomar en tablet / Codespaces

```bash
git status
git pull
python -m http.server 8080
```

Luego abrir el puerto 8080 desde la interfaz de Codespaces.

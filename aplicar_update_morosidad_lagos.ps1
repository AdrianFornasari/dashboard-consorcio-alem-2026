param([string]$Repositorio = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
$Origen = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!(Test-Path (Join-Path $Repositorio 'app.js')) -or !(Test-Path (Join-Path $Repositorio 'multibuilding.js')) -or !(Test-Path (Join-Path $Repositorio 'consorcios/lagos-2797/data/2026.json'))) {
  throw 'Se requiere la raíz del dashboard multiedificio v0.9 con el JSON de Lagos enero-julio.'
}
foreach ($f in @('index.html','styles.css','multibuilding.js','README_ACTUALIZACION_MOROSIDAD_LAGOS.md','docs/SEGUIMIENTO_MOROSIDAD_LAGOS_v1_0.md')) {
  $destino = Join-Path $Repositorio $f
  New-Item -ItemType Directory -Force -Path (Split-Path $destino -Parent) | Out-Null
  Copy-Item (Join-Path $Origen $f) $destino -Force
}
Write-Host 'Actualización de seguimiento de morosidad aplicada. Revisá git diff y probá localhost.'

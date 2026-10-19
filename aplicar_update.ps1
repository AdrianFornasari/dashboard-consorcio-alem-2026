param([string]$Repositorio = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
$Origen = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!(Test-Path (Join-Path $Repositorio 'app.js')) -or !(Test-Path (Join-Path $Repositorio 'data/expensas-2026.json')) -or !(Test-Path (Join-Path $Repositorio 'multibuilding.js'))) {
  throw 'Esta actualización requiere el repositorio con versión multiedificio v0.8.'
}
$archivos = @('index.html','multibuilding.js','data/edificios.json','consorcios/lagos-2797/data/2026.json', 'docs/validacion_lagos_2026.json','docs/ACTUALIZACION_LAGOS_ENERO_JULIO_2026.md')
foreach ($m in @('01','02','03','04')) { $archivos += "consorcios/lagos-2797/informes/2026$m-informe.pdf" }
foreach ($archivo in $archivos) {
  $dest = Join-Path $Repositorio $archivo
  New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
  Copy-Item (Join-Path $Origen $archivo) $dest -Force
}
Write-Host 'Actualización aplicada. Revisá git diff y probá localhost antes de publicar.'

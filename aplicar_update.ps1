param([string]$Destino=(Get-Location).Path)
$ErrorActionPreference = 'Stop'
$Origen = Split-Path -Parent $MyInvocation.MyCommand.Path
$obligatorios = @('index.html','app.js','multibuilding.js','consorcios/lagos-2797/data/2026.json')
foreach ($archivo in $obligatorios) {
  if (-not (Test-Path (Join-Path $Destino $archivo))) { throw "Directorio destino incorrecto: falta $archivo. No se copió ningún archivo." }
}
$archivos = @(
  'index.html',
  'styles.css',
  'multibuilding.js',
  'data/edificios.json',
  'consorcios/lagos-2797/data/2025.json',
  'consorcios/lagos-2797/data/2026.json',
  'consorcios/lagos-2797/informes/202504-informe.pdf',
  'consorcios/lagos-2797/informes/202505-informe.pdf',
  'consorcios/lagos-2797/informes/202507-informe.pdf',
  'consorcios/lagos-2797/informes/202508-informe.pdf',
  'consorcios/lagos-2797/informes/202510-informe.pdf',
  'consorcios/lagos-2797/informes/202512-informe.pdf',
  'consorcios/lagos-2797/informes/202601-informe.pdf',
  'consorcios/lagos-2797/informes/202602-informe.pdf',
  'consorcios/lagos-2797/informes/202603-informe.pdf',
  'consorcios/lagos-2797/informes/202604-informe.pdf',
  'docs/VALIDACION_LAGOS_v1_1.json',
  'docs/EVOLUCION_GASTOS_LAGOS_2025_2026_v1_1.md',
  'README_ACTUALIZACION_LAGOS_v1_1.md'
)
foreach ($archivo in $archivos) {
  $source = Join-Path $Origen $archivo
  $target = Join-Path $Destino $archivo
  $parent = Split-Path -Parent $target
  if (-not (Test-Path $parent)) { New-Item -Path $parent -ItemType Directory -Force | Out-Null }
  if ([IO.Path]::GetFullPath($source) -ne [IO.Path]::GetFullPath($target)) {Copy-Item $source $target -Force}
}
Write-Host 'Actualización Lagos v1.1 aplicada. Revisá git status y probá localhost antes de publicar.'

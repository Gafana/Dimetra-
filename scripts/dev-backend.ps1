$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodeDir = Join-Path $root '.tools\node-v22.12.0-win-x64'
if (Test-Path (Join-Path $nodeDir 'node.exe')) {
  $env:PATH = "$nodeDir;" + $env:PATH
}
Set-Location $root
npm run dev

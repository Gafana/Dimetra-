$nodeDir = Join-Path $PSScriptRoot '..' '.tools' 'node-v22.12.0-win-x64'
if (Test-Path (Join-Path $nodeDir 'node.exe')) {
  $env:PATH = "$nodeDir;" + $env:PATH
}
Set-Location (Join-Path $PSScriptRoot '..')
npm run dev

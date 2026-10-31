$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot '..'
Set-Location $root

$envExample = Join-Path $root '.env.local.example'
$envLocal = Join-Path $root '.env.local'
$feExample = Join-Path $root 'frontend\.env.local.example'
$feLocal = Join-Path $root 'frontend\.env.local'

if (-not (Test-Path $envLocal) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envLocal
  Write-Host "Created .env.local from .env.local.example — review LOCAL_DEV_CHAT_ID and run neon env pull if needed."
}

if (-not (Test-Path $feLocal) -and (Test-Path $feExample)) {
  Copy-Item $feExample $feLocal
  Write-Host "Created frontend/.env.local from example."
}

if (-not (Test-Path $envLocal)) {
  Write-Warning "Missing .env.local. Copy .env.local.example and set DATABASE_URL (neon env pull)."
}

Write-Host ""
Write-Host "Local stack: backend (tsx watch) + frontend (Vite http://localhost:5173)"
Write-Host "Open http://localhost:5173 in the browser after both processes are ready."
Write-Host ""

npm run dev:all

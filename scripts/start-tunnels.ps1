$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Test-Path "node_modules/localtunnel")) {
  npm install localtunnel --save-dev
}

$bundledNode = Join-Path $root ".tools\node-v22.12.0-win-x64\node.exe"
$node = if (Test-Path $bundledNode) { $bundledNode } elseif (Test-Path "C:\Program Files\nodejs\node.exe") { "C:\Program Files\nodejs\node.exe" } else { "node" }

Write-Host "Starting tunnels (keep these windows open)..."
Write-Host "Frontend -> port 5173"
Write-Host "Backend  -> port 3001 (see .env PORT)"

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root'; & '$node' ./scripts/tunnel.mjs 5173 honest-wings-add"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root'; & '$node' ./scripts/tunnel.mjs 3001 strong-colts-jump"
)

Write-Host "Copy HTTPS URLs from both windows into .env and frontend/.env, then restart npm run dev:all"

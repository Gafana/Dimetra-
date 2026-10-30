# Neon agent setup for Cursor — https://neon.com/prompts/agent-setup.md
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "Installing Neon CLI globally..."
npm install -g neon@latest

Write-Host "Running neon init for Cursor (link/create project, MCP, skills)..."
neon init --agent cursor

if (Test-Path (Join-Path $root ".neon")) {
  Write-Host "Pulling DATABASE_URL into .env / .env.local..."
  neon env pull
}

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. Cursor -> Settings -> MCP -> enable 'neon' and sign in if asked"
Write-Host "  2. npm install && npm run db:init"
Write-Host "  3. npm run build"

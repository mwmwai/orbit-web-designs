# Phone Server quick start - double-click Phone Server on Desktop
$ErrorActionPreference = "Stop"
Set-Location "C:\Users\mwmwa\OneDrive\Documents\Default Project"

# Ensure npm global bin is on PATH (where opencode lives)
$npmBin = "C:\Users\mwmwa\AppData\Roaming\npm"
if ($env:Path -notlike "*$npmBin*") { $env:Path = "$npmBin;" + $env:Path }

if (-not (Get-Command opencode -ErrorAction SilentlyContinue)) {
  Write-Host "opencode not found, installing..." -ForegroundColor Yellow
  npm install -g opencode-ai
}

$env:OPENCODE_SERVER_PASSWORD = "12345"

Write-Host "=== OpenCode Phone Server ===" -ForegroundColor Green
ipconfig | Select-String "IPv4"
Write-Host "Phone URL: http://192.168.0.108:4096  user: opencode  pass: 12345" -ForegroundColor Yellow
Write-Host "Keep this window OPEN while using phone" -ForegroundColor Cyan
Write-Host ""

opencode serve --hostname 0.0.0.0 --port 4096

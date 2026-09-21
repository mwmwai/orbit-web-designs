# One-click start for phone access - right-click > Run with PowerShell
# Keeps project path fixed so phone always sees same work
Set-Location "C:\Users\mwmwa\OneDrive\Documents\Default Project"
$env:OPENCODE_SERVER_PASSWORD="12345"

Write-Host "=== OpenCode Phone Quick Start ===" -ForegroundColor Green
ipconfig | Select-String "IPv4"
Write-Host "On phone use: http://192.168.0.108:4096  user: opencode  pass: 12345" -ForegroundColor Yellow
Write-Host "Leave this window open" -ForegroundColor Cyan
Write-Host ""

opencode serve --hostname 0.0.0.0 --port 4096

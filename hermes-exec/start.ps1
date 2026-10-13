# Start Hermes exec system
Set-Location "C:\Users\mwmwa\OneDrive\Documents\Default Project\hermes-exec"
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install | Out-Null
Write-Host "Hermes Exec System Starting..." -ForegroundColor Green
node src/core/index.js

# Registers scheduled task OrbitCrew (logon) and starts loop.ps1 hidden, now.
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\mwmwa\OneDrive\Documents\Default Project'
$loop = Join-Path $repo 'crew\loop.ps1'
$who = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Stop any existing loop first (idempotent)
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*crew\loop.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Unregister-ScheduledTask -TaskName 'OrbitCrew' -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$loop`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $who
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName 'OrbitCrew' -Action $action -Trigger $trigger -Settings $settings | Out-Null

Start-ScheduledTask -TaskName 'OrbitCrew'
Write-Host "OrbitCrew registered (logon) and started. Loop pid starts in crew\logs\loop.log"

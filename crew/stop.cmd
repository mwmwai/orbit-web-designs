@echo off
rem Stop the 24/7 crew: loop + any in-flight seat runs. Keeps money-app/watchdog untouched.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "Unregister-ScheduledTask -TaskName 'OrbitCrew' -Confirm:$false -ErrorAction SilentlyContinue; Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*crew\loop.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*opencode*run*auto*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host crew stopped"

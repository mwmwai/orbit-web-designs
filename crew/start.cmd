@echo off
rem Start the 24/7 crew: register logon task (user-scoped, no admin) + launch loop now.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-crew.ps1"
if errorlevel 1 echo crew install failed - see crew\logs\loop.log

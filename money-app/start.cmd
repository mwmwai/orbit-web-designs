@echo off
cd /d "%~dp0"
start "orbit-money-local" /min node server.mjs
echo money-app starting on http://127.0.0.1:8390 — health at /health

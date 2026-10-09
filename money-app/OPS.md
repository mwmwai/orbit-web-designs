# money-app OPS runbook - 24/7 unattended operation

Local money runner for Orbit Web Designs. Never serves from the public domain
(owner override, Oct 6). Binds 127.0.0.1 only.

| Piece | File | Job |
|---|---|---|
| App | `money-app/server.mjs` | zero-dep Node server, default port 8390 (`MONEY_APP_PORT` overrides) |
| Supervisor | `money-app/watchdog.ps1` | probes `/health`, restarts a dead app, heartbeats to `watchdog.log` |
| Service installer | `money-app/install-service.ps1` | Scheduled Task `OrbitMoneyAppWatchdog` (AtLogOn + on demand, hidden) |

All commands below are PowerShell 5.1 from the repo root unless shown otherwise.

## Start / stop / status one-liners

```powershell
# --- server ---------------------------------------------------------------
node money-app\server.mjs                                  # foreground (Ctrl+C stops it)
.\money-app\start.cmd                                      # double-click equivalent
Invoke-WebRequest http://127.0.0.1:8390/health -UseBasicParsing -TimeoutSec 3   # STATUS
# start hidden, detached (stdin redirect keeps it off the console):
$e="$env:TEMP\empty-stdin.txt"; if(-not(Test-Path $e)){$null=New-Item $e}
Start-Process node -ArgumentList '"C:\...\money-app\server.mjs"' -WindowStyle Hidden `
  -RedirectStandardInput $e -RedirectStandardOutput "$env:TEMP\money.out" -RedirectStandardError "$env:TEMP\money.err"
# stop only OUR servers (never touches other apps):
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'money-app\\server\.mjs' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# --- watchdog -------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File money-app\watchdog.ps1                    # prod: port 8390, 60s
powershell -NoProfile -ExecutionPolicy Bypass -File money-app\watchdog.ps1 -Port 8395 -CheckIntervalSec 5   # test rig
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'watchdog\.ps1' }        # STATUS (PID + args)
Get-Content money-app\watchdog.log -Tail 20                                                   # STATUS (log tail)
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'watchdog\.ps1' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }                                     # stop watchdog (app keeps running)

# --- scheduled task (the 24/7 mode) ---------------------------------------
powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1          # install (idempotent, re-run safe)
powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1 -Start   # install + start now
powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1 -Uninstall
Get-ScheduledTask -TaskName OrbitMoneyAppWatchdog        # status (Ready = armed, Running = live)
Start-ScheduledTask -TaskName OrbitMoneyAppWatchdog      # start on demand
Stop-ScheduledTask  -TaskName OrbitMoneyAppWatchdog      # stop watchdog process only
```

Watchdog contract: probe `/health` with a 3s timeout every `-CheckIntervalSec`
(default 60s); two consecutive dead probes => restart; at most ONE line written
per check interval (status change, else a heartbeat every 10 min); it restarts
the app only when no live `money-app\server.mjs` PID serves its port, and it
NEVER stops a foreign process (ports 8377 / 8390 / 8391 belong to others - the
watchdog only stops a `money-app\server.mjs` PID that owns ITS OWN port).

## Logs

| File | Written by | Contents |
|---|---|---|
| `money-app/health.log` | server.mjs | UTC heartbeat every 10 min: `ok=true ... env_missing=none`, plus `server-start port=8390`, `self-probe FAILED ...` |
| `money-app/watchdog.log` | watchdog.ps1 | one line per check interval: `<ISO-Z> status=up\|down\|restarting\|restarted\|stopped port=<p> <detail>` |
| `$env:TEMP\orbit-money-server-<port>.out.log` / `.err.log` | watchdog start | hidden server stdout/stderr (restart failures land here) |

Live evidence from the verified restart drill (port 8395, 5s interval):

```
2026-10-08T17:28:27Z status=up port=8395 watchdog-start pid=8988 node=C:\Program Files\nodejs\node.exe
2026-10-08T17:30:17Z status=down port=8395 probe-failed streak=1 (restart on 2)
2026-10-08T17:30:27Z status=restarted port=8395 pid=9304 reason=dead-x2
2026-10-08T17:30:32Z status=up port=8395
```

(kill at 17:30:10 -> detected 17:30:17 -> restarted 17:30:27 -> healthy 17:30:32)

## Env repair (pointers)

Do NOT edit `server.mjs`. Repair env per `money-app/README.md` ("Autonomy"):
copy values from `.env.example` into `.env` at the repo root, then restart the
server. Keys reported by `/health`:

`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`INGEST_SECRET`, `TILL_SHOP_MAP`, `POCHI_SHOP_MAP`, `MPESA_CALLBACK_TOKEN`.

Missing keys are not fatal: handlers answer 503 (not 500) until env is set.
Data truth additionally needs `supabase/dashboard-schema.sql` applied + an owner
account (founder-only). Daraja portal URL registration must happen BEFORE
setting `MPESA_CALLBACK_TOKEN`.

## Post-reboot recovery

1. Reboot. Nothing auto-starts until a user logs on (the task uses an
   `InteractiveToken` logon trigger - by design, it needs your desktop session).
2. Log on as `DESKTOP-PAFR567\mwmwa` -> Task Scheduler fires
   `OrbitMoneyAppWatchdog` automatically -> hidden watchdog probes 8390 and
   starts `server.mjs` within 2 failed probes (2 min at the default interval).
3. Verify: `Get-ScheduledTask -TaskName OrbitMoneyAppWatchdog` -> `Running`,
   then `Invoke-WebRequest http://127.0.0.1:8390/health -UseBasicParsing`.
4. Task missing/Ready but not running -> `Start-ScheduledTask -TaskName OrbitMoneyAppWatchdog`.
5. Task gone entirely -> `powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1`.
6. Logon trigger deleted / never armed -> the manual one-liner above keeps the
   app up until the task is restored.

## /health verification fields

`GET http://127.0.0.1:8390/health` -> 200 JSON:

```json
{ "ok": true, "app": "orbit-money-local", "uptime_s": 123,
  "env": { "...": "set" | "missing" },            // 7 keys, see above
  "routes": [ "GET,POST /api/transactions",
              "POST /api/mpesa/c2b/validation",
              "POST /api/mpesa/c2b/confirmation",
              "POST /api/ingest/sms" ] }
```

Pass criteria: `ok == true`; `env` all `set` for data paths (missing = 503s);
`routes` lists all 4; `uptime_s` climbing (flat/zero = crash loop);
`app == "orbit-money-local"`.

```powershell
$h = (Invoke-WebRequest http://127.0.0.1:8390/health -UseBasicParsing).Content | ConvertFrom-Json
"$($h.ok) uptime=$($h.uptime_s)s missing=" + (($h.env.GetEnumerator() | Where-Object Value -eq 'missing').Key -join ',')
```

## Troubleshooting

| Symptom | Detect | Fix |
|---|---|---|
| **node missing** | `Get-Command node` returns nothing; `watchdog.log` = `status=restarting ... node-not-found (Get-Command node)` | Install Node (or repair `%PATH%`), then `Start-ScheduledTask -TaskName OrbitMoneyAppWatchdog`. The watchdog retries every 2 probes - it does not need a restart. |
| **port busy** | `Get-NetTCPConnection -LocalPort 8390 -State Listen`; `watchdog.log` = `status=restarting ... port-busy pid=.. name=.. not-starting` | The port is held by something that is NOT `money-app\server.mjs` (watchdog refuses to kill foreign processes). Identify it: `Get-Process -Id <pid>`; stop it yourself, or move the app: run `watchdog.ps1 -Port 8391` and set `MONEY_APP_PORT`. |
| **env missing** | `/health` shows `"missing"` for any key; API returns 503 | Follow `money-app/README.md` "Autonomy": fill `.env` from `.env.example`, restart the server. Never edit `server.mjs`. |
| **watchdog not running** | `Get-ScheduledTask -TaskName OrbitMoneyAppWatchdog` -> not found or `Ready` with no `watchdog.ps1` process (`Get-CimInstance Win32_Process \| ? CommandLine -match 'watchdog.ps1'`) | `Start-ScheduledTask -TaskName OrbitMoneyAppWatchdog`; if the task is gone re-run `install-service.ps1`; check `watchdog.log` tail for `stopped` / errors; remember it only runs while a user is logged on. |
| **restart loop** | `watchdog.log` shows repeated `restarted` lines | Read `$env:TEMP\orbit-money-server-8390.err.log` - usually a bad import in `money-api/*` or an occupied port. Fix the cause; the watchdog will recover by itself. |
| **task registration denied (0x80070005)** | `install-service.ps1` prints "Register-ScheduledTask failed" | A bare "any user logon" trigger needs admin rights; the script registers a user-scoped trigger that works unelevated. If you still see this, run the script from an elevated PowerShell once. |
| **nothing after reboot** | Task `Ready` but no processes | The machine was not logged on. Log on (step 2 above) or start the task manually. |

Safe-test recipe (ports 8377 / 8390 / 8391 belong to others - never touch them):
use a throwaway port, e.g. `MONEY_APP_PORT=8395` + `watchdog.ps1 -Port 8395
-CheckIntervalSec 5`, kill only the PID listening on 8395, confirm
`status=restarted` in `watchdog.log`, then kill both processes and re-check
`Get-CimInstance Win32_Process | ? CommandLine -match 'watchdog.ps1|money-app\\server.mjs'`
returns nothing.

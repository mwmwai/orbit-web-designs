<#
.SYNOPSIS
  Orbit money-app watchdog -- self-healing supervisor for money-app\server.mjs.

.DESCRIPTION
  Loops forever ($true):
    (a) probes http://127.0.0.1:<Port>/health with a 3s timeout (try/catch: a
        transient probe error never kills the loop),
    (b) two consecutive failed probes => restart server.mjs hidden, with node
        resolved via Get-Command node,
    (c) heartbeat to money-app\watchdog.log at most ONE line per check interval
        (status changes log immediately; otherwise a heartbeat line every 10 min),
    (d) before starting, detects live PIDs via Get-CimInstance Win32_Process
        whose CommandLine matches money-app\server.mjs and only starts when no
        such PID is serving this port; a wedged instance (listening but not
        answering) is restarted; a foreign process holding the port is never
        touched,
    (e) -Port (default 8390), -CheckIntervalSec (default 60),
    (f) runs forever; Ctrl+C only stops THIS watchdog (the server it started
        keeps serving); every probe/restart is wrapped in try/catch.

.NOTES
  Never edits server.mjs. Never kills ports it does not own: the only process
  ever stopped is a money-app\server.mjs PID that owns THIS watchdog's port.
#>
[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8390,

    [ValidateRange(1, 86400)]
    [int]$CheckIntervalSec = 60,

    # Heartbeat cadence for watchdog.log (spec: every 10 minutes).
    [ValidateRange(30, 86400)]
    [int]$HeartbeatSec = 600,

    [ValidateRange(1, 60)]
    [int]$ProbeTimeoutSec = 3
)

$ErrorActionPreference = 'Continue'

# --- paths -------------------------------------------------------------------
$AppDir       = $PSScriptRoot
if (-not $AppDir) { $AppDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$ServerScript = Join-Path $AppDir 'server.mjs'
$WatchdogLog  = Join-Path $AppDir 'watchdog.log'
$HealthUri    = "http://127.0.0.1:$Port/health"
# Required detection pattern: money-app\server.mjs (slash or backslash).
$ProcPattern  = 'money-app[\\/]server\.mjs'
$StopWatchdog = $false

# --- logging: exactly one line per check interval ----------------------------
function Write-WdLine {
    param(
        [Parameter(Mandatory)][string]$Status,
        [string]$Detail = ''
    )
    $ts  = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    $line = "$ts status=$Status port=$Port"
    if ($Detail) { $line = "$line $Detail" }
    try {
        # AppendAllText: atomic-enough single append, UTF-8 without BOM
        # (PowerShell `>` would write UTF-16 -- never use it on repo files).
        [System.IO.File]::AppendAllText($WatchdogLog, $line + "`r`n", (New-Object System.Text.UTF8Encoding($false)))
    } catch {
        try { Add-Content -Path $WatchdogLog -Value $line -Encoding UTF8 -ErrorAction SilentlyContinue } catch { }
    }
    $script:LastLoggedStatus = $Status
    $script:LastHeartbeatUtc  = [DateTime]::UtcNow
}

# --- (a) probe /health, 3s timeout -------------------------------------------
function Test-AppHealth {
    try {
        $resp = Invoke-WebRequest -Uri $HealthUri -TimeoutSec $ProbeTimeoutSec -UseBasicParsing -ErrorAction Stop
        return ($resp.StatusCode -eq 200)
    } catch {
        return $false   # dead OR transient network error: never throw upward
    }
}

# --- (d) live PIDs: Win32_Process CommandLine matching money-app\server.mjs ---
function Get-ServerProcesses {
    try {
        $all = @(Get-CimInstance Win32_Process -ErrorAction Stop)
        return @($all | Where-Object { $_.CommandLine -and ($_.CommandLine -match $ProcPattern) })
    } catch {
        return @()
    }
}

# Which PID (if any) owns a TCP listener on $Port.
function Get-ListenerPid {
    param([int]$LocalPort)
    try {
        $conn = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction Stop | Select-Object -First 1
        if ($conn) { return [int]$conn.OwningProcess }
    } catch { }
    try {
        foreach ($l in (& netstat -ano -p tcp 2>$null)) {
            if ($l -match ":(?<!\d)$LocalPort\s+.*LISTENING\s+(\d+)\s*$") { return [int]$Matches[1] }
        }
    } catch { }
    return $null
}

# --- start server.mjs hidden, node resolved via Get-Command ------------------
function Start-ServerInstance {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd -or -not $nodeCmd.Source) {
        return @{ Ok = $false; Detail = 'node-not-found (Get-Command node)' }
    }
    if (-not (Test-Path -LiteralPath $ServerScript)) {
        return @{ Ok = $false; Detail = "server-script-missing $ServerScript" }
    }
    $outLog = Join-Path $env:TEMP "orbit-money-server-$Port.out.log"
    $errLog = Join-Path $env:TEMP "orbit-money-server-$Port.err.log"
    Remove-Item -LiteralPath $outLog, $errLog -Force -ErrorAction SilentlyContinue
    $env:MONEY_APP_PORT = "$Port"   # child inherits the port this watchdog owns
    try {
        $proc = Start-Process -FilePath $nodeCmd.Source `
                              -ArgumentList ('"{0}"' -f $ServerScript) `
                              -WindowStyle Hidden `
                              -RedirectStandardOutput $outLog `
                              -RedirectStandardError $errLog `
                              -PassThru -ErrorAction Stop
        return @{ Ok = $true; Detail = "pid=$($proc.Id)" }
    } catch {
        return @{ Ok = $false; Detail = "start-failed $($_.Exception.Message)" }
    }
}

# --- (b)+(d) restart path ----------------------------------------------------
function Invoke-Restart {
    $procs = Get-ServerProcesses
    $ownerPid = Get-ListenerPid -LocalPort $Port
    $otherInstances = @($procs | Where-Object { $ownerPid -eq $null -or [int]$_.ProcessId -ne [int]$ownerPid })

    # Live PID holding OUR port but failing health => wedged. It is our own
    # money-app\server.mjs (CommandLine matched) bound to THIS port, so a
    # restart (stop + start) is the heal. Foreign ports are never touched.
    if ($ownerPid -ne $null) {
        $ownerIsOurs = @($procs | Where-Object { [int]$_.ProcessId -eq [int]$ownerPid })
        if ($ownerIsOurs.Count -gt 0) {
            try {
                Stop-Process -Id $ownerPid -Force -ErrorAction Stop
                $deadline = [DateTime]::UtcNow.AddSeconds(15)
                while ([DateTime]::UtcNow -lt $deadline -and (Get-ListenerPid -LocalPort $Port) -ne $null) {
                    Start-Sleep -Milliseconds 400
                }
            } catch {
                return @{ Status = 'restarting'; Detail = "wedge-stop-failed pid=$ownerPid $($_.Exception.Message)" }
            }
        } else {
            # Port held by something that is NOT money-app\server.mjs -- never
            # kill it (ports 8377/8390/8391 belong to others). Report, don't fight.
            $ownerName = '?'
            try { $ownerName = (Get-Process -Id $ownerPid -ErrorAction Stop).ProcessName } catch { }
            $detail = "port-busy pid=$ownerPid name=$ownerName not-starting"
            if ($otherInstances.Count -gt 0) { $detail = "$detail other-money-app-instances=$($otherInstances.Count)" }
            return @{ Status = 'restarting'; Detail = $detail }
        }
    }

    # Required gate: re-detect live PIDs (Win32_Process CommandLine match).
    $procs = Get-ServerProcesses
    $ownerPid = Get-ListenerPid -LocalPort $Port
    $live = @($procs | Where-Object { $ownerPid -ne $null -and [int]$_.ProcessId -eq [int]$ownerPid })
    if ($live.Count -gt 0) {
        # A matching PID is still serving this port => start only if none. Skip.
        return @{ Status = 'restarting'; Detail = "live-pid=$($live[0].ProcessId) still-serving not-starting" }
    }

    $r = Start-ServerInstance
    if ($r.Ok) {
        $d = "$($r.Detail) reason=dead-x$($script:FailStreak)"
        if ($otherInstances.Count -gt 0) { $d = "$d other-money-app-instances=$($otherInstances.Count)" }
        return @{ Status = 'restarted'; Detail = $d }
    }
    return @{ Status = 'restarting'; Detail = "$($r.Detail) will-retry" }
}

# --- (f) main loop: forever, never dies on transient errors ------------------
$script:LastLoggedStatus    = ''
$script:LastHeartbeatUtc    = [DateTime]::UtcNow
$script:FailStreak          = 0
$firstRun                   = $true
$exitDetail                 = 'watchdog-exit'

try {
    while ($true) {                      # runs forever until the task/process is stopped
        $status = 'unknown'
        $detail = ''
        try {
            if (Test-AppHealth) {
                $script:FailStreak = 0
                $status = 'up'
            } else {
                $script:FailStreak++
                if ($script:FailStreak -ge 2) {
                    $rr = Invoke-Restart
                    $status = $rr.Status
                    $detail = $rr.Detail
                    $script:FailStreak = 0     # pace retries: 2 failed probes per attempt
                } else {
                    $status = 'down'
                    $detail = "probe-failed streak=$($script:FailStreak) (restart on 2)"
                }
            }
        } catch {
            # Never die: log and continue to the next interval.
            $status = 'down'
            $detail = "transient-error $($_.Exception.Message)"
        }

        if ($firstRun) {
            $detail = ("watchdog-start pid=$PID node=" + $(try { (Get-Command node -ErrorAction SilentlyContinue).Source } catch { '?' }) + " $detail").Trim()
            $firstRun = $false
        }

        # ONE line per check interval: status change wins, else 10-min heartbeat.
        $now = [DateTime]::UtcNow
        if ($status -ne $script:LastLoggedStatus) {
            Write-WdLine $status $detail
        } elseif (($now - $script:LastHeartbeatUtc).TotalSeconds -ge $HeartbeatSec) {
            Write-WdLine $status $detail
        }

        if ($StopWatchdog) { break }
        try { Start-Sleep -Seconds $CheckIntervalSec } catch { Start-Sleep -Seconds 1 }
    }
} catch [System.Management.Automation.PipelineStoppedException] {
    $exitDetail = 'watchdog-exit ctrl-c/pipeline-stopped'
} catch {
    $exitDetail = "watchdog-exit unexpected $($_.Exception.Message)"
} finally {
    # Ctrl+C / normal stop only ends the watchdog; the money server it started
    # keeps running (that is the safe behaviour: stopping the supervisor must
    # never take the app down with it).
    Write-WdLine 'stopped' $exitDetail
}

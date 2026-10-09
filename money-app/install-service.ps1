<#
.SYNOPSIS
  Installs / removes the Scheduled Task "OrbitMoneyAppWatchdog" that runs
  money-app\watchdog.ps1 unattended (hidden PowerShell, at logon + on demand).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1
  # idempotent: unregisters any existing task first, then registers fresh

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1 -Start
  # register AND start it right now (on-demand start)

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File money-app\install-service.ps1 -Uninstall
  # remove the task entirely (the watchdog process itself, if running, is NOT
  #   killed here -- stop it first with: Get-CimInstance Win32_Process |
  #   ? CommandLine -match 'watchdog.ps1' | % { Stop-Process -Id $_.ProcessId })
#>
[CmdletBinding()]
param(
    [switch]$Uninstall,   # uninstall section (see also Uninstall-OrbitWatchdogTask)
    [switch]$Start,       # start the task immediately after registering (OnDemand proof)
    [string]$TaskName = 'OrbitMoneyAppWatchdog'
)

$ErrorActionPreference = 'Stop'

$script:AppDir     = $PSScriptRoot
if (-not $script:AppDir) { $script:AppDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$script:WatchdogPs = Join-Path $script:AppDir 'watchdog.ps1'

# ---------------------------------------------------------------------------
# Uninstall section: removes the task if present (never throws when absent).
# ---------------------------------------------------------------------------
function Uninstall-OrbitWatchdogTask {
    param([string]$Name = $script:TaskNameFallback)
    $existing = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        Write-Host "[$Name] not registered -- nothing to uninstall (idempotent)."
        return $false
    }
    Unregister-ScheduledTask -TaskName $Name -Confirm:$false -ErrorAction Stop
    Write-Host "[$Name] unregistered."
    return $true
}
$script:TaskNameFallback = $TaskName

# ---------------------------------------------------------------------------
# Install: idempotent (unregister existing first), then register fresh.
#   Trigger : AtLogOn (survives reboot) + OnDemand (Start-ScheduledTask)
#   Action  : powershell.exe -WindowStyle Hidden -File watchdog.ps1
# ---------------------------------------------------------------------------
function Install-OrbitWatchdogTask {
    param(
        [string]$Name = $TaskName,
        [switch]$StartNow
    )
    if (-not (Test-Path -LiteralPath $script:WatchdogPs)) {
        throw "watchdog.ps1 not found at $script:WatchdogPs"
    }

    # Idempotency: drop any previous registration before re-registering.
    $null = Uninstall-OrbitWatchdogTask -Name $Name

    $psExe   = Join-Path $PSHOME 'powershell.exe'
    if (-not (Test-Path -LiteralPath $psExe)) { $psExe = 'powershell.exe' }
    $argLine = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}"' -f $script:WatchdogPs

    # Owner identity (also used by the principal below).
    $owner = ('{0}\{1}' -f $env:USERDOMAIN, $env:USERNAME)

    # Logon trigger MUST be user-scoped: a bare -AtLogOn means "any user's
    # logon" and Windows refuses to register that without elevation (verified
    # 0x80070005 on this box). -AtLogOn -User <owner> registers as a standard
    # user and is exactly what we want: the watchdog follows the app owner.
    try {
        $trigger = New-ScheduledTaskTrigger -AtLogOn -User $owner -ErrorAction Stop
    } catch {
        $trigger = New-ScheduledTaskTrigger -AtLogOn   # fallback: needs elevation
    }

    $action    = New-ScheduledTaskAction -Execute $psExe -Argument $argLine -WorkingDirectory $script:AppDir
    $principal = New-ScheduledTaskPrincipal -UserId $owner `
                                            -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet `
                    -MultipleInstances IgnoreNew `
                    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                    -StartWhenAvailable `
                    -Hidden `
                    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
                    -ExecutionTimeLimit (New-TimeSpan -Days 3650)   # watchdog must run forever

    try {
        Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger `
                               -Principal $principal -Settings $settings -Force `
                               -Description 'Orbit money-app watchdog: probes /health, restarts money-app\server.mjs, heartbeats to money-app\watchdog.log' -ErrorAction Stop | Out-Null
    } catch {
        $msg = ('Register-ScheduledTask failed: {0}' + [Environment]::NewLine +
                '  Fix: run this script from an ELEVATED PowerShell (Run as administrator):' + [Environment]::NewLine +
                '    powershell -ExecutionPolicy Bypass -File "{1}"') -f $_.Exception.Message, $PSScriptRoot
        throw $msg
    }

    $task = Get-ScheduledTask -TaskName $Name
    Write-Host ("[{0}] registered. state={1} trigger=AtLogOn action=powershell -WindowStyle Hidden -File watchdog.ps1" -f $Name, $task.State)
    Write-Host ("[{0}] on-demand start: Start-ScheduledTask -TaskName '{0}'" -f $Name)

    if ($StartNow) {
        try {
            Start-ScheduledTask -TaskName $Name
            Write-Host ("[{0}] started on demand." -f $Name)
        } catch {
            Write-Host ("[{0}] on-demand start failed: {1}" -f $Name, $_.Exception.Message)
        }
    }
    return $task
}

# ---------------------------------------------------------------------------
if ($Uninstall) {
    $null = Uninstall-OrbitWatchdogTask -Name $TaskName
} else {
    $null = Install-OrbitWatchdogTask -Name $TaskName -StartNow:$Start
}

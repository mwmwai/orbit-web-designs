# 24/7 crew loop: rotates seats, each seat = one `opencode run --auto` mission round.
# Designed to run hidden via scheduled task. ASCII only (PS 5.1 parse safety).
param(
  [string]$Repo = 'C:\Users\mwmwa\OneDrive\Documents\Default Project',
  [int]$DelaySec = 10,
  [int]$RoundTimeoutSec = 2400
)
$ErrorActionPreference = 'Continue'
$seats = @('foreman', 'sre', 'finance', 'dashboard', 'security', 'chief')
$logDir = Join-Path $Repo 'crew\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$loopLog = Join-Path $logDir 'loop.log'

function Log([string]$msg) {
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'), $msg
  try { Add-Content -Path $loopLog -Value $line -Encoding UTF8 } catch {}
}

# Single instance guard
$me = $PID
$others = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessId -ne $me -and $_.CommandLine -like '*crew\loop.ps1*' })
if ($others.Count -gt 0) {
  Log "loop already running (pid=$($others[0].ProcessId)) - exiting duplicate"
  exit 0
}

$oc = $null
try { $oc = (Get-Command opencode -ErrorAction Stop).Source } catch {}
if (-not $oc) {
  Log "FATAL: opencode not on PATH - crew cannot start"
  exit 1
}

Log "loop-start pid=$me opencode=$oc seats=$($seats -join ',') delay=${DelaySec}s timeout=${RoundTimeoutSec}s"
$i = 0
while ($true) {
  $seat = $seats[$i % $seats.Count]
  $i++
  $missionPath = Join-Path $Repo ("crew\missions\{0}.md" -f $seat)
  if (-not (Test-Path $missionPath)) {
    Log "round=$i seat=$seat SKIP mission-missing"
    Start-Sleep -Seconds $DelaySec
    continue
  }
  $seatLog = Join-Path $logDir ("{0}.log" -f $seat)
  Log "round=$i seat=$seat start"
  $t0 = Get-Date
  try {
    $mission = Get-Content -Path $missionPath -Raw -Encoding UTF8
    $job = Start-Job -ScriptBlock {
      param($ocPath, $repoDir, $missionText)
      Set-Location -LiteralPath $repoDir
      $out = & $ocPath run --auto $missionText 2>&1
      $out | ForEach-Object { "$_" }
      return $LASTEXITCODE
    } -ArgumentList $oc, $Repo, $mission
    $done = Wait-Job -Job $job -Timeout $RoundTimeoutSec
    if (-not $done) {
      Stop-Job -Job $job -ErrorAction SilentlyContinue
      Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
      Log "round=$i seat=$seat TIMEOUT after ${RoundTimeoutSec}s - killed, rotating"
      Start-Sleep -Seconds $DelaySec
      continue
    }
    $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
    $exit = $job.State
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    $elapsed = [int]((Get-Date) - $t0).TotalSeconds
    $output | ForEach-Object { try { Add-Content -Path $seatLog -Value ('{0} {1}' -f (Get-Date -Format 's'), $_) -Encoding UTF8 } catch {} }
    Log ("round={0} seat={1} state={2} elapsed={3}s" -f $i, $seat, $exit, $elapsed)
  } catch {
    Log "round=$i seat=$seat ERROR $($_.Exception.Message)"
  }
  Start-Sleep -Seconds $DelaySec
}

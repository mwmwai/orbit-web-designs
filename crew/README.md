# crew — 24/7 autonomous seat rotation

Runs on this machine (no external server needed). Each seat is an independent
`opencode run --auto` session with FULL permissions (opencode.json: permission allow).

## Structure

    crew/loop.ps1          forever loop: foreman -> sre -> finance -> dashboard -> security -> chief
    crew/install-crew.ps1  registers scheduled task "OrbitCrew" (logon, user-scoped) + starts now
    crew/start.cmd         = install + start
    crew/stop.cmd          = unregister task + kill loop + in-flight seat runs
    crew/missions/*.md     mission per seat (CONTEXT.md holds standing rules)
    crew/logs/loop.log     round bookkeeping (start/state/elapsed per round)
    crew/logs/<seat>.log   each seat's session output (REPORT lines)
    crew/STATUS.md         chief seat's rolling status (single source of truth)

## Controls

    crew\start.cmd       start / restart (idempotent)
    crew\stop.cmd        full stop
    Get-ScheduledTask OrbitCrew        status
    Get-Content crew\logs\loop.log -Tail 20

## Safety

- Round timeout 40 min: a wedged seat is killed and rotation continues.
- Single-instance guard: duplicate loops exit immediately.
- Seats may never edit .opencode/memory/MEMORY.md, kill port 8377, or put money back on the public domain.
- Commits/pushes require passing `npm run build` and explicit file paths (standing approval Oct 6).

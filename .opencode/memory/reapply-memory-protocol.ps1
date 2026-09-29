$ErrorActionPreference = 'Stop'

# Appends the shared-memory protocol block to every roster agent.
# Re-run this after regenerating agents from the corpus (regen wipes hand edits).
# Usage: & "<this file>"

$agentsDir = 'C:\Users\mwmwa\OneDrive\Documents\Default Project\.opencode\agents'
$utf8      = New-Object System.Text.UTF8Encoding($false)

$blockLines = @(
  '',
  '## SHARED MEMORY PROTOCOL',
  '',
  'The Boss keeps a shared memory file at `.opencode/memory/MEMORY.md`: project facts, user preferences, past decisions, lessons learned. It is the crew''s collective brain.',
  '',
  '- READ it with the read tool at the start of any non-trivial task. Context you don''t have to ask for is leverage.',
  '- END every completed task with a `MEMORY:` section in your final summary: durable facts worth keeping (decisions made, constraints discovered, user preferences, reusable results). One line per fact. Nothing episodic.',
  '- You never write to MEMORY.md yourself. The Boss harvests your `MEMORY:` lines and persists what matters.',
  ''
)

$block = $blockLines -join "`n"
$done = 0
$skipped = 0

foreach ($f in (Get-ChildItem $agentsDir -Filter *.md -Recurse)) {
  if ($f.Name -eq 'README.md') { continue }
  if ($f.Name -eq 'boss.md')   { continue }
  $text = [System.IO.File]::ReadAllText($f.FullName)
  if ($text.Contains('## SHARED MEMORY PROTOCOL')) { $skipped++; continue }
  $text = $text.TrimEnd() + "`n" + $block
  [System.IO.File]::WriteAllText($f.FullName, $text, $utf8)
  $done++
}

Write-Output "appended=$done already_had=$skipped"

param(
  [string]$TaskName = "YueJian-Marketing-Autopilot",
  [string]$RunTime = "09:30"
)

$ErrorActionPreference = "Stop"

if ($RunTime -notmatch '^\d{2}:\d{2}$') {
  throw "RunTime must be HH:mm, e.g. 09:30"
}

$runner = Join-Path $PSScriptRoot "run-marketing-autopilot-feishu.bat"
if (-not (Test-Path $runner)) {
  throw "Runner not found: $runner"
}

$taskCmd = "cmd /c `"$runner`""

Write-Host "Creating scheduled task..."
Write-Host "Task: $TaskName"
Write-Host "Time: $RunTime"
Write-Host "Command: $taskCmd"

schtasks /Create /TN $TaskName /SC DAILY /ST $RunTime /TR $taskCmd /F | Out-Host

Write-Host "Task created. Running once for smoke test..."
schtasks /Run /TN $TaskName | Out-Host

Write-Host "Done."

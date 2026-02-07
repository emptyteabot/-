$ErrorActionPreference = "Stop"

# Resolve project root from script location to avoid non-ASCII literals in this file.
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $root

$logsDir = Join-Path $root 'tools\logs'
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

# 1) Build once to ensure prod server is ready
npm run build | Out-Null

# 2) Start Next.js server in background
$serverLog = Join-Path $logsDir 'next-server.out.log'
$serverErr = Join-Path $logsDir 'next-server.err.log'
if (Test-Path $serverLog) { Remove-Item -Force $serverLog }
if (Test-Path $serverErr) { Remove-Item -Force $serverErr }

$server = Start-Process -PassThru -WindowStyle Hidden -WorkingDirectory $root -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm run start') -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr

# Wait for port 3000
$deadline = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $deadline) {
  try {
    $c = Test-NetConnection -ComputerName '127.0.0.1' -Port 3000 -WarningAction SilentlyContinue
    if ($c.TcpTestSucceeded) { break }
  } catch {}
  Start-Sleep -Milliseconds 500
}

# 3) Start localtunnel in background and capture public URL
$tunnelLog = Join-Path $logsDir 'localtunnel.out.log'
$tunnelErr = Join-Path $logsDir 'localtunnel.err.log'
if (Test-Path $tunnelLog) { Remove-Item -Force $tunnelLog }
if (Test-Path $tunnelErr) { Remove-Item -Force $tunnelErr }

$tunnel = Start-Process -PassThru -WindowStyle Hidden -WorkingDirectory $root -FilePath 'cmd.exe' -ArgumentList @('/c', 'npx --yes localtunnel --port 3000') -RedirectStandardOutput $tunnelLog -RedirectStandardError $tunnelErr

$publicUrlFile = "$root\PUBLIC_URL.txt"
if (Test-Path $publicUrlFile) { Remove-Item -Force $publicUrlFile }

$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  $txt = ""
  if (Test-Path $tunnelLog) { $txt += (Get-Content -Raw $tunnelLog) }
  if (Test-Path $tunnelErr) { $txt += "`n" + (Get-Content -Raw $tunnelErr) }

  $m = [regex]::Match($txt, 'https?://[a-zA-Z0-9.-]+')
  if ($m.Success) {
    $m.Value | Set-Content -Encoding UTF8 $publicUrlFile
    Write-Output $m.Value
    exit 0
  }

  Start-Sleep -Milliseconds 500
}

Write-Error "Failed to obtain public URL from localtunnel. Check $tunnelLog and $tunnelErr"

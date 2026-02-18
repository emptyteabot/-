@echo off
chcp 65001 >nul
setlocal

set "SCRIPT_DIR=%~dp0"

call "%SCRIPT_DIR%marketing-autopilot.bat" ^
  -Product both ^
  -Channel xiaohongshu ^
  -SendViaOpenClaw ^
  -OpenClawChannel feishu ^
  -OpenClawTarget "ou_e219303a0aef4481bc3a489a65b9f49d"

set "EXIT_CODE=%ERRORLEVEL%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $root=Resolve-Path '%SCRIPT_DIR%..'; $dir=Join-Path $root 'outputs\\marketing'; if(Test-Path $dir){ $latest=Get-ChildItem $dir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if($latest){ $md=Join-Path $latest.FullName 'marketing-pack.md'; $csv=Join-Path $latest.FullName 'post-drafts.csv'; if(Test-Path $md){ Copy-Item $md \"$env:USERPROFILE\\Desktop\\marketing-pack-latest.md\" -Force }; if(Test-Path $csv){ Copy-Item $csv \"$env:USERPROFILE\\Desktop\\marketing-drafts-latest.csv\" -Force } } }"

endlocal & exit /b %EXIT_CODE%

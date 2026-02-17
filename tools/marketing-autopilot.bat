@echo off
chcp 65001 >nul
setlocal

set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%marketing-autopilot.ps1" %*

endlocal

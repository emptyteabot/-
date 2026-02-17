@echo off
chcp 65001 >nul
setlocal

set SCRIPT_DIR=%~dp0

call "%SCRIPT_DIR%marketing-autopilot.bat" ^
  -Product both ^
  -Channel xiaohongshu ^
  -SendViaOpenClaw ^
  -OpenClawChannel feishu ^
  -OpenClawTarget "ou_e219303a0aef4481bc3a489a65b9f49d"

set EXIT_CODE=%ERRORLEVEL%
endlocal & exit /b %EXIT_CODE%

@echo off
cd /d "%~dp0"

echo.
echo  ========================================
echo   Step 1: Local build test
echo  ========================================
echo.

call npx next build
if %errorlevel% neq 0 (
    echo.
    echo  BUILD FAILED - fix errors above first
    pause
    exit /b 1
)

if "%VERCEL_TOKEN%"=="" (
    echo.
    echo  [ERROR] VERCEL_TOKEN not set
    echo  PowerShell example: $env:VERCEL_TOKEN="your_vercel_token"
    pause
    exit /b 1
)

echo.
echo  ========================================
echo   Step 2: Deploying to Vercel
echo  ========================================
echo.

node deploy-script.js

pause

@echo off
cd /d "%~dp0"

echo.
echo  ========================================
echo     Soul Lab - Starting...
echo  ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found
    echo  Install from: https://nodejs.org
    pause
    exit /b 1
)

echo  [OK] Node.js found

if not exist "node_modules" (
    echo  [INSTALL] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed
) else (
echo  [OK] Dependencies ready
)

if not exist ".env.local" (
    if exist "env.example" (
        copy /Y "env.example" ".env.local" >nul
        echo  [OK] .env.local created from env.example
        echo  [TODO] Fill your real API keys in .env.local before first paid run
    ) else (
        echo  [WARN] .env.local missing and env.example not found
    )
) else (
    echo  [OK] Existing .env.local detected
)

echo.
echo  ========================================
echo   Homepage:       http://localhost:3000
echo   Soul Autopsy:   http://localhost:3000/soul-autopsy
echo   AI Fortune:     http://localhost:3000/ai-fortune
echo   Content Tool:   http://localhost:3000/content-launderer
echo   Payment:        http://localhost:3000/pay
echo  ========================================
echo.
echo   Press Ctrl+C to stop
echo.

start http://localhost:3000

call npx next dev
pause

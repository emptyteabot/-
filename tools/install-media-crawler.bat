@echo off
chcp 65001 >nul 2>&1
title MediaCrawler - 小红书/抖音爬虫 一键安装
cd /d "%~dp0\.."

echo.
echo  ========================================
echo   MediaCrawler - 全平台爆款爬虫
echo   支持: 小红书 / 抖音 / 快手 / B站
echo   一键安装脚本
echo  ========================================
echo.

:: 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] 未检测到 Python
    echo  请先安装 Python 3.10+: https://python.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo  [OK] %PY_VER%

:: 检查 Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] 未检测到 Git
    echo  请先安装 Git: https://git-scm.com
    pause
    exit /b 1
)
echo  [OK] Git 已安装

:: 克隆 MediaCrawler
if not exist "MediaCrawler" (
    echo.
    echo  [CLONE] 正在克隆 MediaCrawler...
    git clone https://github.com/NanmiCoder/MediaCrawler.git
    if %errorlevel% neq 0 (
        echo  [ERROR] 克隆失败，请检查网络
        pause
        exit /b 1
    )
) else (
    echo  [OK] MediaCrawler 已存在
)

cd MediaCrawler

:: 安装依赖
echo.
echo  [INSTALL] 安装 Python 依赖...
pip install -r requirements.txt

:: 安装 Playwright 浏览器
echo.
echo  [INSTALL] 安装 Playwright 浏览器内核 (首次较慢)...
playwright install chromium

echo.
echo  ========================================
echo   安装完成! 使用方式:
echo.
echo   爬小红书:
echo     cd MediaCrawler
echo     python main.py --platform xhs --lt qrcode
echo.
echo   爬抖音:
echo     python main.py --platform dy --lt qrcode
echo.
echo   爬快手:
echo     python main.py --platform ks --lt qrcode
echo.
echo   爬B站:
echo     python main.py --platform bili --lt qrcode
echo.
echo   爬到的数据在 data/ 目录下
echo  ========================================
echo.
pause




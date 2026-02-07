@echo off
chcp 65001 >nul 2>&1
title 自动流量工厂 - 一键爬款+洗稿+生视频
cd /d "%~dp0\.."

echo.
echo  ========================================
echo   自动流量工厂
echo   爬爆款 - AI洗稿 - 生视频 - 全自动
echo  ========================================
echo.

:: 检查依赖
if not exist "MediaCrawler" (
    echo  [ERROR] 请先运行 install-media-crawler.bat
    pause
    exit /b 1
)
if not exist "MoneyPrinterTurbo" (
    echo  [ERROR] 请先运行 install-money-printer.bat
    pause
    exit /b 1
)

echo  [OK] MediaCrawler 已就绪
echo  [OK] MoneyPrinterTurbo 已就绪

:: 第1步: 爬取小红书热门内容
echo.
echo  ===== 第1步: 爬取小红书爆款 =====
echo  (需要扫码登录，请准备好手机)
cd MediaCrawler
python main.py --platform xhs --lt qrcode --keywords "聊天记录,算命,塔罗,运势"
cd ..

:: 第2步: 启动洗稿服务
echo.
echo  ===== 第2步: 启动 AI 洗稿服务 =====
echo  打开浏览器访问 http://localhost:3000/content-launderer
echo  将爬到的内容粘贴进去，选择平台和推广目标
echo.
echo  爬取的内容在: MediaCrawler\data\ 目录下
echo.

:: 启动 Next.js 服务
cd /d "%~dp0\.."
echo  [START] 启动洗稿服务...
start "" cmd /k "cd /d "%~dp0\.." && npx next dev"

echo.
echo  ========================================
echo   流量工厂已启动!
echo.
echo   1. 爬到的爆款内容在 MediaCrawler\data\
echo   2. 打开 http://localhost:3000/content-launderer 洗稿
echo   3. 洗完的内容发到各平台
echo   4. 植入推广引导用户到:
echo      - http://你的域名/soul-autopsy (灵魂尸检 ¥9.9)
echo      - http://你的域名/ai-fortune  (AI算命 ¥19.9)
echo  ========================================
echo.
pause




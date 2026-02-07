@echo off
chcp 65001 >nul 2>&1
title MoneyPrinterTurbo - AI短视频生成器 一键安装
cd /d "%~dp0\.."

echo.
echo  ========================================
echo   MoneyPrinterTurbo - AI 短视频生成器
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

:: 克隆 MoneyPrinterTurbo
if not exist "MoneyPrinterTurbo" (
    echo.
    echo  [CLONE] 正在克隆 MoneyPrinterTurbo...
    git clone https://github.com/harry0703/MoneyPrinterTurbo.git
    if %errorlevel% neq 0 (
        echo  [ERROR] 克隆失败，请检查网络
        pause
        exit /b 1
    )
) else (
    echo  [OK] MoneyPrinterTurbo 已存在
)

cd MoneyPrinterTurbo

:: 安装依赖
echo.
echo  [INSTALL] 安装 Python 依赖 (可能需要几分钟)...
pip install -r requirements.txt

:: 配置 DeepSeek API
echo.
echo  [CONFIG] 配置 AI API...
if not exist "config.toml" (
    (
        echo [app]
        echo video_subject = ""
        echo video_language = "zh"
        echo voice_name = "zh-CN-XiaoxiaoNeural"
        echo.
        echo [llm]
        echo provider = "openai"
        echo openai_api_key = "sk-9b1fb5be6f18465690e499e2d23f37ac"
        echo openai_base_url = "https://api.deepseek.com/v1"
        echo openai_model_name = "deepseek-chat"
    ) > config.toml
    echo  [OK] config.toml 已创建 (DeepSeek API)
)

echo.
echo  ========================================
echo   安装完成! 启动方式:
echo   cd MoneyPrinterTurbo
echo   python main.py
echo   然后打开 http://localhost:8501
echo  ========================================
echo.
pause




@echo off
echo ==========================================
echo   نظام الدواجن الذكي - Smart Poultry
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python غير مثبت!
    echo حمّل Python من: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Install Flask if needed
echo [1/3] التحقق من المتطلبات...
pip show flask openai >nul 2>&1
if %errorlevel% neq 0 (
    echo تثبيت المتطلبات (Flask, OpenAI)...
    pip install flask openai
)

echo [2/3] تشغيل قاعدة البيانات...
echo [3/3] تشغيل السيرفر...
echo.
echo ==========================================
echo  الموقع يعمل على:
echo  http://localhost:5000
echo  افتح هذا الرابط في متصفحك الآن!
echo ==========================================
echo.
echo اضغط Ctrl+C لإيقاف السيرفر
echo.

cd /d "%~dp0"
python server.py

pause

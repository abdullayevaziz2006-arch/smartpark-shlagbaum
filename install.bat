@echo off
chcp 65001 > nul
echo ================================================
echo    SmartPark - Bog'liqliklarni o'rnatish
echo ================================================
echo.

echo [1/3] Backend bog'liqliklarini o'rnatilmoqda...
cd /d "%~dp0backend"
call npm install
call npx prisma generate
if %errorlevel% neq 0 (
    echo XATO: Backend o'rnatishda muammo yuz berdi!
    pause
    exit /b 1
)
echo Backend - OK!
echo.

echo [2/3] Frontend bog'liqliklarini o'rnatilmoqda...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo XATO: Frontend o'rnatishda muammo yuz berdi!
    pause
    exit /b 1
)
echo Frontend - OK!
echo.

echo [3/3] Customer-app bog'liqliklarini o'rnatilmoqda...
cd /d "%~dp0customer-app"
call npm install
if %errorlevel% neq 0 (
    echo XATO: Customer-app o'rnatishda muammo yuz berdi!
    pause
    exit /b 1
)
echo Customer-app - OK!
echo.

echo ================================================
echo   Barcha bog'liqliklar muvaffaqiyatli o'rnatildi!
echo   Endi start.bat ni ishga tushiring.
echo ================================================
pause

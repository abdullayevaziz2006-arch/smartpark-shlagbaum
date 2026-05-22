@echo off
title SmartPark Shlagbaum - Tezkor Ishga Tushirish
echo ===================================================
echo   SmartPark Shlagbaum Lokal Serveri
echo ===================================================

:: Node.js o'rnatilganini tekshirish
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [XATO] Kompyuterda Node.js topilmadi!
    echo Iltimos, ishga tushirishdan oldin Node.js ni o'rnating:
    echo Havola: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
    echo.
    pause
    exit /b
)

:: Backend serverni alohida oynada ishga tushirish (U o'zi bilan birga build bo'lgan frontend/admin panelni 3001-portda taqdim etadi)
echo [1/2] SmartPark Backend server ishga tushirilmoqda (Port: 3001)...
start "SmartPark Backend" cmd /c "cd backend && node index.js"

:: Customer-app (Mijoz ilovasi) ni alohida oynada ishga tushirish
echo [2/2] SmartPark Customer App (Mijoz Ilovasi) ishga tushirilmoqda...
start "SmartPark Customer App" cmd /c "cd customer-app && npm run dev"

:: Brauzerda Admin Panelni ochish
echo Loyiha muvaffaqiyatli boshlandi!
timeout /t 3 >nul
start http://localhost:3001

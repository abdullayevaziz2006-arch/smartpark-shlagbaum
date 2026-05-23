@echo off
title SmartPark Shlagbaum - Tezkor Ishga Tushirish
echo ===================================================
echo   SmartPark Shlagbaum Lokal Serveri
echo ===================================================

:: Mahalliy node.exe ni PATH ga vaqtincha qo'shish (Zero-Install uchun)
set PATH=%~dp0;%PATH%

:: Node.js borligini tekshirish
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [XATO] Kompyuterda Node.js topilmadi!
    echo.
    pause
    exit /b
)

:: Backend serverni alohida oynada ishga tushirish (Port: 3001)
echo [1/2] SmartPark Backend server ishga tushirilmoqda (Port: 3001)...
start "SmartPark Backend" cmd /k "cd backend && node index.js"

:: Customer-app (Mijoz ilovasi) ni alohida oynada ishga tushirish
echo [2/2] SmartPark Customer App (Mijoz Ilovasi) ishga tushirilmoqda...
start "SmartPark Customer App" cmd /k "cd customer-app && node node_modules\vite\bin\vite.js"

:: Brauzerda Admin Panelni ochish
echo Loyiha muvaffaqiyatli boshlandi!
timeout /t 3 >nul
start http://localhost:3001


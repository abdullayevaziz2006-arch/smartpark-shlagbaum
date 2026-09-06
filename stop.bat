@echo off
title SmartPark - To'xtatish
echo ===================================================
echo   SmartPark Lokal Serverini To'xtatish
echo ===================================================
echo.

setlocal enabledelayedexpansion
set "stopped=0"

echo Dastur jarayonlari tekshirilmoqda...

:: Port 3001 (Backend) ni topish va o'chirish
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
    set "stopped=1"
    echo [OK] Backend server to'xtatildi (PID: %%a).
)

:: Port 5173 (Customer App / Vite) ni topish va o'chirish
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
    set "stopped=1"
    echo [OK] Customer App (Vite) to'xtatildi (PID: %%a).
)

if !stopped! equ 1 (
    echo.
    echo SmartPark lokal serveri muvaffaqiyatli to'xtatildi!
) else (
    echo.
    echo Faol SmartPark jarayonlari topilmadi (portlar 3001 va 5173 bo'sh).
)

echo.
timeout /t 5

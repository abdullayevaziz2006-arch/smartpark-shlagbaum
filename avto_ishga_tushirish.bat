@echo off
title SmartPark - Avtomatik Ishga Tushirishni Sozlash
echo ===================================================
echo   SmartPark Avtomatik Ishga Tushirish Sozlamasi
echo ===================================================
echo.

:: PowerShell yordamida Windows Startup (Avtozagruzka) papkasiga yorliq (shortcut) yaratish
powershell -Command "$ShortcutPath = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\SmartPark.lnk'; $WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut($ShortcutPath); $Shortcut.TargetPath = '%~dp0start.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()"

if %errorlevel% equ 0 (
    echo [OK] Muvaffaqiyatli sozlandi!
    echo Endi har safar kompyuter yoqilganda dastur o'zi avtomatik ishga tushadi.
) else (
    echo [XATO] Avtomatik ishga tushirishni sozlashda xatolik yuz berdi.
)
echo.
pause

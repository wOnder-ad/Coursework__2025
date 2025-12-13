@echo off
title Investment Project Launcher

:: Отримуємо шлях до поточної папки
set "PROJECT_ROOT=%~dp0"

echo ==================================================
echo       ZAPUSK INVESTMENT PROJECT
echo ==================================================
echo.

:: 1. Запуск Бекенду
echo [1/2] Starting Backend Server...
cd /d "%PROJECT_ROOT%backend"
:: 'start' відкриває нове вікно. '/k' залишає вікно відкритим (щоб бачити помилки)
start "BACKEND (Port 5000)" cmd /k "color 0A && echo Backend starting... && node server.js"

:: Невелика пауза, щоб бекенд встиг ініціалізуватися
timeout /t 2 /nobreak >nul

:: 2. Запуск Фронтенду
echo [2/2] Starting Frontend Client...
cd /d "%PROJECT_ROOT%frontend"
start "FRONTEND (React)" cmd /k "color 0B && echo Frontend starting... && npm run dev"

echo.
echo ==================================================
echo       PROJECT STARTED SUCCESSFULLY!
echo ==================================================
echo.
echo Close the popup windows to stop the servers.
echo.
pause
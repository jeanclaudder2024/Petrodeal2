@echo off
echo ========================================
echo Starting Document CMS Services
echo ========================================
echo.

echo [1/2] Starting Python API...
start "Python API" cmd /k "cd /d %~dp0document-processor && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React App...
start "React App" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Python API: http://localhost:8000
echo React App: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul

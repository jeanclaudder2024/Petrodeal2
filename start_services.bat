@echo off
REM Optional: run React + Python locally for development only.
REM Production: full system runs on VPS only - see RUN_FULL_SYSTEM_ON_VPS_ONLY.md
echo ========================================
echo Starting Document CMS Services (local dev only)
echo ========================================
echo.

echo [1/2] Starting Document Processor (Python API)...
start "Python API" cmd /k "cd /d %~dp0document-processor && set PORT=5000 && python main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React App...
start "React App" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Document Processor (Python): http://localhost:5000
echo React App (Vite):           http://localhost:8080
echo.
echo Ensure .env has SUPABASE_URL, SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY).
echo React uses VITE_DOCUMENT_API_URL=http://localhost:5000 by default.
echo.
echo Press any key to exit this window...
pause >nul

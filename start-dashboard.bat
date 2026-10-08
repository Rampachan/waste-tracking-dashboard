@echo off
title Tamil Nadu Municipal Waste Monitoring System
echo =====================================================================
echo  Government of Tamil Nadu - Directorate of Municipal Administration
echo  Municipal Waste Segregation & Processing Monitoring System (169 ULBs)
echo =====================================================================
echo.

echo [1/2] Starting Python FastAPI Backend on 0.0.0.0:8000...
start "TN Waste Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on 0.0.0.0:5173...
start "TN Waste Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"

echo.
echo =====================================================================
echo  System started successfully!
echo =====================================================================
echo  - Primary Portal (Chrome / Edge): http://localhost:5173
echo  - Direct Loopback (Edge fallback): http://127.0.0.1:5173
echo  - Backend Swagger API Docs:        http://127.0.0.1:8000/docs
echo =====================================================================
echo  NOTE for Microsoft Edge Users:
echo  If Edge says "Can't reach this page" for http://localhost:5173,
echo  simply open: http://127.0.0.1:5173 (bypasses Windows IPv6 DNS bug)
echo =====================================================================
echo.
pause

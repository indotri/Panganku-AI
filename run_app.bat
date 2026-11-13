@echo off
title Menjalankan PanganKu AI (Backend & Frontend)
echo ============================================================
echo   Menjalankan PanganKu AI: Smart Recipe & Grocery Predictor
echo ============================================================
echo.

echo [1/2] Menjalankan Server Backend FastAPI di Port 8000...
start "PanganKu AI - Backend FastAPI (Port 8000)" cmd /k "cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Menjalankan Server Frontend Next.js di Port 3000...
start "PanganKu AI - Frontend Next.js (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo   Kedua server sedang berjalan!
echo   Buka browser Anda di: http://localhost:3000
echo ============================================================
timeout /t 5
start http://localhost:3000


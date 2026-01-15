@echo off
echo 🚀 Starting TrainPi...

REM Start Backend
start "TrainPi Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start Frontend
start "TrainPi Frontend" cmd /k "cd frontend && npm run dev"

echo ✅ Services started!
echo 🌍 Backend: http://localhost:8000
echo 🌍 Frontend: http://localhost:3000

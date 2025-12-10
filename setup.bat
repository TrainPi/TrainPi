@echo off
echo 🚀 Setting up TrainPi...

REM Backend setup
echo 📦 Setting up backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

if not exist .env (
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your database credentials
)

REM Frontend setup
echo 📦 Setting up frontend...
cd ..\frontend
call npm install

if not exist .env.local (
    copy .env.local.example .env.local
)

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Create a PostgreSQL database named 'trainpi'
echo 2. Update backend\.env with your database URL
echo 3. Start backend: cd backend ^&^& python run.py
echo 4. Start frontend: cd frontend ^&^& npm run dev

pause


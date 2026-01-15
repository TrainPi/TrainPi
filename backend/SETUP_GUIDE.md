# Setup Guide

## 1. Install Backend Dependencies
Open a terminal in `c:\Users\Hashaam\trainpi\backend` and run:

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install requirements (including OpenAI)
pip install -r requirements.txt
pip install openai
```

## 2. Start Backend
In the same terminal:
```powershell
python -m uvicorn app.main:app --reload
```

## 3. Verify Frontend
Ensure your frontend terminal (running `npm run dev`) is still active. The app will be at `http://localhost:3000`.

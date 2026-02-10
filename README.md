# TrainPi

AI-powered learning and career platform. Backend: Python (FastAPI). Frontend: Next.js.

---

## Start the backend

1. Open a terminal.
2. Go to the backend folder and use the project venv:
   ```powershell
   cd backend
   ..\.venv\Scripts\Activate.ps1
   ```
   (If you don't have a venv yet: from project root run `python -m venv .venv`, then the line above.)
3. Install dependencies (first time only):
   ```powershell
   pip install -r requirements.txt
   ```
4. Create a `backend\.env` file with at least:
   ```
   DATABASE_URL=postgresql://postgres:opium@localhost:5432/trainpi
   SECRET_KEY=your-secret-key
   ```
   (Use your real Postgres URL if different.)
5. Start the API:
   ```powershell
   python run.py
   ```
   Backend runs at **http://localhost:8000**.

---

## Start the frontend

1. Open a **second** terminal.
2. Go to the frontend folder:
   ```powershell
   cd frontend
   ```
3. Install dependencies (first time only):
   ```powershell
   npm install
   ```
4. Start the dev server:
   ```powershell
   npm run dev
   ```
   Frontend runs at **http://localhost:3000**. Open that in your browser.

---

## Summary

| What    | Terminal 1        | Terminal 2     |
|---------|--------------------|-----------------|
| Backend | `cd backend` → activate venv → `python run.py` | — |
| Frontend | —                 | `cd frontend` → `npm run dev` |

Two terminals: one for backend, one for frontend. That’s it.

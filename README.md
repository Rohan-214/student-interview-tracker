# ClassTrack — Training Center Interview Tracker

A teacher-only interview management app for a Data Analytics batch. Frontend: React + Tailwind CSS. Backend: FastAPI. Database: PostgreSQL.

## Features
- Teacher login with a signed JWT token and hashed password.
- Add and search students.
- Schedule interviews, add company/role/date/time/mode/notes, and assign students.
- Mark each assigned student's attendance independently from their result.
- Results: Pending, Selected, Rejected.
- Rejection feedback is validated in both frontend and backend.
- Student-by-student interview history.
- Dashboard counts and upcoming interviews.

## 1. PostgreSQL setup (Windows)
Open pgAdmin or SQL Shell (psql), connect to your local server, and run:

```sql
CREATE DATABASE interview_tracker;
```

## 2. Start the API
Open PowerShell:

```powershell
cd interview-tracker\backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set the correct PostgreSQL password, a long random `SECRET_KEY`, and a new `ADMIN_PASSWORD`. Then:

```powershell
uvicorn main:app --reload
```

API docs: http://127.0.0.1:8000/docs

The API creates the tables and initial teacher user on first startup. The default example credentials are `teacher` / `ChangeMe123!`; replace them in `.env` before first startup and do not use example credentials for real data. The seed user is created only if that username does not already exist.

## 3. Start the React app
Open a second PowerShell window:

```powershell
cd interview-tracker\frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in using the credentials set in `backend/.env`.

## Notes
- Keep `.env` private; it contains database credentials and a signing secret.
- The frontend defaults to API URL `http://127.0.0.1:8000/api`. Set Netlify's `VITE_API_URL` to the backend base URL including `/api` (for example, `https://your-backend.example.com/api`). The frontend appends endpoint paths to this base.
- This is a local-development starter. Before public deployment, use HTTPS, strong unique secrets, backups, rate limiting, and a proper password-change flow. Do not expose PostgreSQL directly to the internet.
- Database tables are created automatically for this initial version. For production changes, add Alembic migrations.

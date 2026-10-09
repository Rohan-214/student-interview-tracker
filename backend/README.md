# Backend setup

1. Create a PostgreSQL database named `interview_tracker` in pgAdmin or psql.
2. In this folder, create `.env` by copying `.env.example` and update the database password and `SECRET_KEY`.
3. Use Python 3.11+:

```powershell
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

On first start, tables are created and a teacher account is seeded from `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Change the example password before using real student data. API docs: http://127.0.0.1:8000/docs

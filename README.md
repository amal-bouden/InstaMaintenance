# InstaMaintenance - Full-Stack GMAO Application

InstaMaintenance is a modern, responsive Computerized Maintenance Management System (GMAO) built for Consomed. It streamlines the declaration, troubleshooting, diagnostic logging, and closing of machine breakdowns.

## Tech Stack
- **Backend:** Python, FastAPI, SQLModel (SQLite database), ReportLab (PDF generator), Openpyxl (Excel import)
- **Frontend:** React, Vite, Tailwind CSS, Axios, Chart.js

---

## Quick Start (2 Commands to Launch)

You can launch the entire stack using the following two commands from the root directory:

### 1. Launch the Backend Server (FastAPI)
```powershell
backend/.venv/Scripts/uvicorn main:app --app-dir backend --reload --port 8000
```

### 2. Launch the Frontend Dev Server (React)
```bash
npm run dev --prefix frontend
```

---

## Seeding the Database (Optional)

If you need to initialize or re-seed the SQLite database:

1. **Seed Users (Admin):**
   ```powershell
   backend/.venv/Scripts/python.exe backend/seed.py
   ```
2. **Seed Machines (from Excel):**
   This script parses the real tracking Excel file (`C:\Users\boude\Downloads\suivi FOR-MAI-03 2026.xlsx`) using `openpyxl` and seeds 181 unique machines into the database.
   ```powershell
   backend/.venv/Scripts/python.exe backend/seed_machines.py
   ```

---

## Main User Roles & Credentials
The default admin account is seeded automatically:
- **Admin:**
  - Username: `admin`
  - Password: `admin123`

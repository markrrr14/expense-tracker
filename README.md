# Expense Tracker

A full-stack personal expense tracker with a React + Vite frontend and a Laravel API (Sanctum bearer tokens). It runs on SQLite locally and MySQL in production.

- Live demo: https://expense-tracker-mark.netlify.app (Netlify frontend, Railway API)
- `expense-tracker/expense-tracker/` — React + Vite UI (see its README)
- `expense-tracker-backend/expense-tracker-backend/` — Laravel API (see its README)
- `setup-backend.bat` / `setup-backend.sh` — installs the backend, creates `.env`, migrates and seeds the demo data

## Quick start

1. Run the backend setup:
   - Windows: `setup-backend.bat`
   - macOS/Linux: `chmod +x setup-backend.sh && ./setup-backend.sh`
2. Start the API:
   ```
   cd expense-tracker-backend/expense-tracker-backend
   php artisan serve
   ```
3. In another terminal, start the frontend:
   ```
   cd expense-tracker/expense-tracker
   npm install
   npm run dev
   ```
4. Open http://localhost:5173 and log in with `demo@example.com` / `password123`.

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`. To point at a different API host, set `VITE_API_URL` (see the frontend `.env.example`).

## Deployment

- Frontend: Netlify (`netlify.toml` builds `expense-tracker/expense-tracker` with `VITE_API_URL` pointing at the Railway API).
- Backend: Railway (`https://backend-production-eef98b2f.up.railway.app`), deployed by `.github/workflows/deploy-railway.yml`.
- Optional: `deploy-infinityfree.ps1` builds a PHP + MySQL package for InfinityFree; see `infinityfree/README.md`.

## Tests

```
cd expense-tracker-backend/expense-tracker-backend
php artisan test
```

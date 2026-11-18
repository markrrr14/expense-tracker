# Expense Tracker (React + Laravel)

A full-stack personal expense tracker. The React frontend talks to a Laravel API backed by SQLite, with user accounts and token authentication (Sanctum).

## Requirements

- PHP 8.2+ with `pdo_sqlite`
- Composer
- Node.js 18+

## 1. Run the backend

```bash
cd expense-tracker-backend/expense-tracker-backend
composer install
cp .env.example .env          # already configured for SQLite
php artisan key:generate      # only if APP_KEY is empty
php artisan migrate --seed    # creates the database and a demo account
php artisan serve             # http://127.0.0.1:8000
```

Demo account: `demo@example.com` / `password123`

## 2. Run the frontend

```bash
cd expense-tracker/expense-tracker
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api` to `http://127.0.0.1:8000`. To point at a different API host, set `VITE_API_URL` (see `.env.example`), e.g. `VITE_API_URL=http://127.0.0.1:8000/api`.

Build for production: `npm run build`

## Features

- Register, log in, and log out (Sanctum bearer tokens)
- Add, edit, and delete expenses (amount, category, date, note)
- Pick any month and see its total, number of transactions, and daily average
- Monthly budget saved per user, with progress bar and warnings at 80% and 100%
- Spending-by-category breakdown (bars with percentages)
- Search by note and filter by category
- Export the current list to CSV
- Each user only ever sees and modifies their own data

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/register` | Create an account, returns user + token |
| POST | `/api/login` | Log in, returns user + token |
| GET | `/api/me` | Current user |
| POST | `/api/logout` | Revoke the current token |
| GET | `/api/expenses?month=YYYY-MM&category=&search=` | List expenses |
| POST | `/api/expenses` | Create an expense |
| PUT | `/api/expenses/{id}` | Update an expense |
| DELETE | `/api/expenses/{id}` | Delete an expense |
| GET | `/api/summary?month=YYYY-MM` | Totals, category breakdown, budget usage |
| PUT | `/api/budget` | Update `monthly_budget` |

All routes except register/login require `Authorization: Bearer <token>`.

## Project structure

```
src/
  App.jsx                  auth gate: login page or dashboard
  api.js                   fetch wrapper + API calls, token storage
  context/AuthContext.jsx  user session, login/register/logout
  utils.js                 categories, peso formatting, date helpers, CSV export
  components/
    Dashboard.jsx          data loading, month selection, filters
    AuthPage.jsx           login / register form
    ExpenseForm.jsx        add/edit form with validation
    ExpenseList.jsx        list, search, category filter
    BudgetCard.jsx         budget input and progress
    CategoryChart.jsx      spending by category
```

## Defense notes

- Authentication uses Laravel Sanctum personal access tokens; the token is stored in `localStorage` and attached as a bearer token.
- Server-side validation rejects bad amounts, categories, and dates; the UI also validates before submitting.
- Every expense query goes through `$request->user()->expenses()`, so users cannot read or modify other users' records (foreign ids return 404).
- Month totals, category breakdown, and budget usage are computed by the database in `ExpenseController::summary`.
- The frontend recomputes filters with plain array math for instant search/filter feedback.
- Money uses `Intl.NumberFormat` with the `PHP` currency.

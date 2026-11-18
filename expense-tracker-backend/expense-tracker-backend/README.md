# Expense Tracker API (Laravel)

REST API for the Expense Tracker app. Laravel + Sanctum tokens + SQLite.

## Setup

```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The API is served at `http://127.0.0.1:8000/api`.

Demo account created by the seeder: `demo@example.com` / `password123`.

## Configuration

`.env` defaults to SQLite (`DB_CONNECTION=sqlite`), using `database/database.sqlite`.
To use MySQL instead, set `DB_CONNECTION=mysql` plus `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, then run the migrations again.

CORS allows all origins by default (`config/cors.php`), which is fine for local development.

## Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/register` | No | `{name, email, password, password_confirmation}` |
| POST | `/api/login` | No | `{email, password}` |
| GET | `/api/me` | Yes | Current user |
| POST | `/api/logout` | Yes | Revoke current token |
| GET | `/api/expenses` | Yes | Filters: `month=YYYY-MM`, `category`, `search` |
| POST | `/api/expenses` | Yes | `{amount, category, date, note?}` |
| PUT | `/api/expenses/{id}` | Yes | Update owned expense |
| DELETE | `/api/expenses/{id}` | Yes | Delete owned expense |
| GET | `/api/summary?month=YYYY-MM` | Yes | Total, transactions, daily average, by category, budget |
| PUT | `/api/budget` | Yes | `{monthly_budget}` |

Authenticated requests need `Authorization: Bearer <token>` and `Accept: application/json`.

## Data model

- `users` — name, email, password (hashed), monthly_budget
- `expenses` — user_id, amount, category, date, note
- `personal_access_tokens` — Sanctum tokens

Categories: Food, Transport, School, Bills, Shopping, Health, Others.

## Tests

```bash
php artisan test
```

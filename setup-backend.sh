#!/usr/bin/env bash
set -euo pipefail

# Expense Tracker backend setup (macOS/Linux). Needs PHP 8.3+ and Composer in PATH.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/expense-tracker-backend/expense-tracker-backend"

command -v php >/dev/null 2>&1 || { echo "PHP not found. Install PHP 8.3+ and add it to PATH."; exit 1; }
command -v composer >/dev/null 2>&1 || { echo "Composer not found. Install Composer and add it to PATH."; exit 1; }

echo "[1/4] Installing PHP dependencies..."
composer install --no-interaction

if [ ! -f .env ]; then
  echo "[2/4] Creating .env from .env.example..."
  cp .env.example .env
else
  echo "[2/4] .env already exists - leaving it as is."
fi

if ! grep -qE '^APP_KEY=.+' .env; then
  echo "      Generating APP_KEY..."
  php artisan key:generate --no-interaction
fi

echo "[3/4] Preparing the database..."
mkdir -p database
[ -f database/database.sqlite ] || : > database/database.sqlite
php artisan migrate --seed --force

echo "[4/4] Done."
echo
echo "Backend API: http://127.0.0.1:8000/api"
echo "Demo login:  demo@example.com / password123"
echo
echo "Start the API:"
echo "  cd expense-tracker-backend/expense-tracker-backend"
echo "  php artisan serve"

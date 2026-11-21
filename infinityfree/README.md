# Deploy the Expense Tracker to InfinityFree

InfinityFree is PHP + MySQL only: no Node.js, no npm, no Composer, no SSH on the server,
and the web root is always `htdocs`. This folder contains everything needed to run the
existing **Laravel API + React SPA** there.

The React app is built into `public/spa` and served by Laravel. The API stays at `/api`,
so the frontend and backend share one domain and one upload.

> The `?i=1` / `aes.js` page on the reference site is InfinityFree's browser check.
> Your site will show the same check automatically once it is hosted there.

## 1. Create the InfinityFree account

1. Sign up at <https://dash.infinityfree.com/register>.
2. Create a hosting account and pick a free subdomain (for example `yourname.gt.tc`).
3. Wait for the account to become active.

## 2. Create the MySQL database

1. Open the account in the client area.
2. Go to **MySQL Databases** and create a database.
3. Write down the **host**, **database name**, **username**, and **password** shown there.
   The host is **not** `localhost`.

## 3. Build the upload package

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-infinityfree.ps1
```

This script:

- builds the React app with base `/spa/`
- copies the build into `infinityfree/htdocs/public/spa`
- copies the Laravel app (without `vendor`, `node_modules`, `.env`, tests)
- runs `composer install --no-dev` and a **non-optimized** autoloader
  (InfinityFree silently drops PHP files larger than 1 MB)
- adds the `htdocs/.htaccess` rewrite rules
- creates `infinityfree/expense-tracker-infinityfree.zip`

You only need to re-run it after code changes.

## 4. Configure the environment

Edit `infinityfree/htdocs/.env` and replace the placeholders:

```dotenv
APP_URL=https://yourname.gt.tc

DB_HOST=sql123.infinityfree.com
DB_DATABASE=if0_00000000_expense
DB_USERNAME=if0_00000000
DB_PASSWORD=your-database-password
```

Keep these values as they are:

```dotenv
APP_ENV=production
APP_DEBUG=false
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

The deploy script generates a fresh `APP_KEY` automatically. You can also
create one manually with `php artisan key:generate --show`.

## 5. Import the database

1. Open **phpMyAdmin** for your database.
2. Select the database, open the **Import** tab.
3. Import `infinityfree/database/schema.sql`.
4. Optional: import `infinityfree/database/seed-demo.sql` to create the demo account.

Demo login after seeding: `demo@example.com` / `password123`.

## 6. Upload

Upload the **contents** of `infinityfree/htdocs` (or extract the zip) into the account's
`htdocs` folder using FTP or the online File Manager.

Important:

- Upload dotfiles too: `.htaccess` and `.env`. FTP clients often hide them by default.
- Do **not** upload `node_modules`.
- Do **not** upload a local `database.sqlite`.
- If a file seems missing after upload, check for the 1 MB PHP file limit and re-run
  `composer dump-autoload --no-dev --optimize=false`.

After uploading, `htdocs` should look like:

```text
htdocs/
├── .env
├── .htaccess
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
│   ├── .htaccess
│   ├── index.php
│   └── spa/
│       ├── index.html
│       └── assets/
├── resources/
├── routes/
├── storage/
├── vendor/
└── artisan
```

## 7. Open the site

Visit `https://yourname.gt.tc`. On the first visit InfinityFree may show its browser check
for a second, then the Expense Tracker loads. Register an account or use the demo account.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Laravel welcome page instead of the app | `public/spa/index.html` is missing. Re-run the deploy script and re-upload `public/spa`. |
| `500 Server Error` | Check `storage/logs/laravel.log`. Most often wrong `DB_*` values in `.env` or a missing `APP_KEY`. |
| `could not find driver` | Set `DB_CONNECTION=mysql` (InfinityFree has no SQLite). |
| Login works but data does not save | Re-import `schema.sql`; confirm the `expenses` and `personal_access_tokens` tables exist. |
| `Class ... not found` | A vendor file was rejected for being over 1 MB. Re-run the deploy script and re-upload `vendor/`. |
| `Composer detected issues ... PHP version` | This build targets PHP 8.4 (InfinityFree currently runs PHP 8.4). If your account shows PHP 8.3, ask InfinityFree support to move it to 8.4. |
| `No application encryption key` | Set `APP_KEY` in `.env` and re-upload. |
| Changes do not appear | Delete `bootstrap/cache/*.php` and `storage/framework/views/*` on the server. |

## What is not supported on free hosting

- `php artisan` commands (import SQL through phpMyAdmin instead)
- cron jobs / scheduled tasks
- queue workers (the app uses `QUEUE_CONNECTION=sync`)
- WebSockets
- email sending
- Node.js

## Files in this folder

| File | Purpose |
| --- | --- |
| `.htaccess` | Rewrites every request into `public/` and maps `/storage/` to `storage/app/public`. |
| `.env.infinityfree` | Production environment template copied to `htdocs/.env` by the script. |
| `database/schema.sql` | Tables for `users`, `personal_access_tokens`, and `expenses`. |
| `database/seed-demo.sql` | Optional demo user and sample expenses. |
| `htdocs/` | Generated upload folder (git-ignored). |

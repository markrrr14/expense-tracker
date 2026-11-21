@echo off
setlocal

rem Expense Tracker backend setup (Windows). Needs PHP 8.3+ and Composer in PATH.

where php >nul 2>nul
if errorlevel 1 (
  echo PHP not found. Install PHP 8.3+ and add it to PATH.
  exit /b 1
)

where composer >nul 2>nul
if errorlevel 1 (
  echo Composer not found. Install Composer and add it to PATH.
  exit /b 1
)

set "BACKEND=%~dp0expense-tracker-backend\expense-tracker-backend"
if not exist "%BACKEND%\artisan" (
  echo Backend folder not found at "%BACKEND%".
  exit /b 1
)

cd /d "%BACKEND%" || exit /b 1

echo [1/4] Installing PHP dependencies...
call composer install --no-interaction
if errorlevel 1 exit /b 1

if not exist ".env" (
  echo [2/4] Creating .env from .env.example...
  copy /Y ".env.example" ".env" >nul
) else (
  echo [2/4] .env already exists - leaving it as is.
)

findstr /R /C:"^APP_KEY=." ".env" >nul
if errorlevel 1 (
  echo       Generating APP_KEY...
  call php artisan key:generate --no-interaction
  if errorlevel 1 exit /b 1
)

echo [3/4] Preparing the database...
if not exist "database\database.sqlite" type nul > "database\database.sqlite"
call php artisan migrate --seed --force
if errorlevel 1 exit /b 1

echo [4/4] Done.
echo.
echo Backend API: http://127.0.0.1:8000/api
echo Demo login:  demo@example.com / password123
echo.
echo Start the API:
echo   cd expense-tracker-backend\expense-tracker-backend
echo   php artisan serve

endlocal

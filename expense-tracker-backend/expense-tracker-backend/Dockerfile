FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libzip-dev libicu-dev libonig-dev libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring zip intl bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

CMD ["sh", "-c", "until php artisan migrate --force; do echo 'Waiting for database...'; sleep 3; done; if [ \"$SEED_DEMO\" = \"true\" ]; then php artisan db:seed --force; fi; php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]

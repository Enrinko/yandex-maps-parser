# syntax=docker/dockerfile:1

# --- Composer dependencies ---
# Dev dependencies are kept so the test suite can run inside the container
# (`docker compose exec app php artisan test`).
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction

# --- PHP-FPM runtime ---
FROM php:8.4-fpm-alpine AS app

# composer binary (needed to regenerate the autoloader below).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apk add --no-cache git icu-dev libzip-dev oniguruma-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_mysql bcmath intl zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor
COPY . .

# Regenerate the optimized autoloader now that all source is present.
RUN composer dump-autoload --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
# Strip any CR (Windows line endings) so the shebang works, then make executable.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

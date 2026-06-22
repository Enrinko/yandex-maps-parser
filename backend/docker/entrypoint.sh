#!/bin/sh
set -e

# Runtime config (APP_KEY, DB/Redis hosts, etc.) is supplied via container
# environment variables. A .env is created only as a fallback so artisan can boot.
if [ ! -f .env ]; then
  cp .env.example .env
fi
if [ -z "${APP_KEY}" ] && ! grep -q "^APP_KEY=base64" .env 2>/dev/null; then
  php artisan key:generate --force
fi

php artisan config:clear >/dev/null 2>&1 || true

# Only the app role runs migrations; the queue worker sets RUN_MIGRATIONS=false.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Waiting for database and applying migrations..."
  tries=0
  # Bounded retry so a DB problem doesn't trap us in an infinite loop (which
  # would keep php-fpm down and surface as a permanent 502 with no clue).
  until php artisan migrate --force; do
    tries=$((tries + 1))
    if [ "$tries" -ge 20 ]; then
      echo "WARNING: database still unavailable after $tries attempts; starting php-fpm anyway."
      break
    fi
    echo "DB not ready (attempt $tries/20), retrying in 3s..."
    sleep 3
  done

  # Seed the default admin user (idempotent via updateOrCreate).
  php artisan db:seed --force || true
  echo "Startup migrations done."
fi

exec "$@"

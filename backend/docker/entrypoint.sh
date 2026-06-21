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
  until php artisan migrate --force 2>/dev/null; do
    echo "DB not ready yet, retrying in 3s..."
    sleep 3
  done

  # Seed the default admin user once (idempotent via updateOrCreate).
  php artisan db:seed --force || true
  echo "Migrations + seed applied."
fi

exec "$@"

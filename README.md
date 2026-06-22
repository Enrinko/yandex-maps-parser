# Парсер отзывов Яндекс.Карт

Веб-приложение из двух экранов: **авторизация** и **настройки**, где пользователь вставляет ссылку
на карточку организации в Яндекс.Картах. Приложение асинхронно парсит все её отзывы (до ~600),
средний рейтинг и счётчики, кэширует их в БД и показывает с пагинацией.

- **Backend:** Laravel 13 (PHP 8.4) + Sanctum (SPA cookie-auth), очередь на Redis.
- **Парсер:** отдельный микросервис Node + Playwright (headful Chromium под Xvfb).
- **Frontend:** Vue 3 + TypeScript + Vite + Pinia + Vue Router + Tailwind.
- **Инфраструктура:** Docker Compose (nginx, php-fpm, queue worker, MySQL, Redis, scraper).

## Архитектура

```
Браузер ──> nginx ──┬─ /              -> статика SPA (Vue build)
(единый origin)     └─ /api, /sanctum -> php-fpm (Laravel API)
                                              │ dispatch job
                                              ▼
                              Redis (queue) ──> queue worker
                                                    │ HTTP POST /scrape
                                                    ▼
                                          scraper (Playwright/Xvfb) -> Яндекс.Карты
                                                    │ JSON
                                                    ▼
                                          MySQL (stats + reviews)
SPA опрашивает /api/organization/status каждые ~3с, затем читает отзывы из БД.
```

Поток: контроллер → `OrganizationService::saveUrl()` → `ParseOrganizationReviewsJob` → worker →
`OrganizationService::runParse()` → `ScraperClient` → scraper → DTO → транзакция (stats + reviews)
→ `status=done`. Единый origin (nginx) делает cookie-аутентификацию Sanctum простой — без CORS.

## Запуск

Требуется Docker + Docker Compose.

```bash
cp .env.example .env
docker compose up -d --build
```

Миграции и сид-пользователь применяются автоматически при старте контейнера `app`
(см. `backend/docker/entrypoint.sh`). После сборки откройте:

- Приложение: **http://localhost:8080**
- Логин по умолчанию: **admin@example.com** / **password**

> Для разработки доступен Vite dev-сервер с HMR на **http://localhost:5173**
> (`docker compose up` поднимает сервис `frontend` из override-файла).

### Переменные окружения

| Переменная | Назначение | По умолчанию |
|------------|-----------|--------------|
| `APP_PORT` | Порт публикации nginx | `8080` |
| `APP_KEY` | Ключ Laravel (в проде сгенерируйте свой) | dev-ключ в compose |
| `APP_URL` | Базовый URL | `http://localhost:8080` |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | MySQL | `yandex` / `yandex` / `secret` |
| `SANCTUM_STATEFUL_DOMAINS` | Хосты со stateful-сессией | `localhost:8080,...` |
| `SESSION_DOMAIN` | Домен cookie | `localhost` |
| `CORS_ALLOWED_ORIGINS` | Origin Vite для dev-CORS | `http://localhost:5173` |
| `SCRAPER_URL` | Адрес микросервиса парсера | `http://scraper:3000` |
| `SCRAPER_PROXY` | Опциональный прокси для парсера | — |
| `SCRAPER_TIMEOUT` | Таймаут запроса к парсеру (сек) | `240` |

БД по умолчанию — **MySQL 8**; для PostgreSQL замените `DB_CONNECTION=pgsql` и образ `db`.

## Подход к парсингу и обходу защиты

У Яндекс.Карт нет официального API. Внутренний JSON-эндпоинт `fetchReviews` нестабилен и часто
отдаёт капчу, поэтому используется **реальный браузер (Playwright)**:

- **Headful под Xvfb.** Яндекс отдаёт все отзывы только при реальном рендеринге, поэтому Chromium
  запускается не в headless-режиме, а под виртуальным дисплеем Xvfb (`xvfb-run`).
- **Стелс и реализм.** `ru-RU` локаль, таймзона Москвы, реалистичный User-Agent/viewport, скрытие
  флага `navigator.webdriver`, случайные задержки между прокрутками. Картинки/шрифты блокируются для
  скорости.
- **Прокрутка.** Контейнер отзывов прокручивается циклически, пока количество карточек растёт
  (с ограничением по числу и общему таймауту) — так подгружаются все ~600 отзывов.
- **Детекция капчи.** Маркеры SmartCaptcha → понятная ошибка `captcha` в UI. Изменение вёрстки →
  `markup_changed`. Все селекторы изолированы в `scraper/src/selectors.ts` — правятся в одном месте.
- **Прокси.** Опциональный `SCRAPER_PROXY` (резидентный прокси) снижает вероятность капчи с
  дата-центровых IP.
- **Кэш и пагинация.** Парсинг выполняется один раз, результат кэшируется в БД; страницы отзывов
  отдаются пагинатором Laravel (50/стр) — без повторного скрейпинга. Повторный парсинг — по кнопке
  «Обновить».

> ⚠️ В продакшене Яндекс часто показывает капчу при запросах с дата-центровых IP. Для стабильной
> работы укажите прокси в `SCRAPER_PROXY` — браузер парсера ходит через него.

### Обход капчи через Crawlbase Smart Proxy

Браузер можно завернуть в [Crawlbase Smart Proxy](https://crawlbase.com/docs/smart-proxy) —
он раздаёт residential-IP и снимает капчу. Токен передаётся как имя пользователя, пароль пустой;
Smart Proxy подменяет TLS, поэтому парсер автоматически включает `ignoreHTTPSErrors`, когда задан
прокси. В корневом `.env` укажите (токен — ваш, в репозиторий он не коммитится):

```
SCRAPER_PROXY=http://ВАШ_CRAWLBASE_ТОКЕН@smartproxy.crawlbase.com:8012
```

затем `docker compose up -d` и повторите парсинг. Если Smart Proxy с обычным токеном всё равно
упирается в капчу на JS-тяжёлой странице, используйте JavaScript-токен Crawlbase в том же формате.

## Тесты

```bash
# Backend (Pest/PHPUnit): auth, валидация URL, пагинация, сервис парсинга
docker compose exec app php artisan test

# Scraper (парс-логика дат/счётчиков/рейтинга, без сети)
docker compose exec scraper npm test
```

## Что доделали бы

- Пул прокси с ротацией и автоматическим переключением при капче.
- Интеграция решателя капчи (anti-captcha / SmartCaptcha solver).
- Инкрементальный авто-рефреш: подгружать только новые отзывы по расписанию.
- Поддержка нескольких организаций на пользователя (БД уже это допускает).
- Больше тестов (e2e на Playwright) + CI-пайплайн.
- Метрики/observability (Telescope, Prometheus), rate-limiting запросов к парсеру.
```

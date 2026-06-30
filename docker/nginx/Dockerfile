# syntax=docker/dockerfile:1
# Build context is the repository root.

# --- Build the Vue SPA ---
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Nginx: serve SPA + reverse-proxy the API to php-fpm ---
FROM nginx:1.27-alpine
COPY --from=frontend /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# syntax=docker/dockerfile:1

# Playwright base image ships Chromium + all system deps and matches the
# playwright npm version below.
FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Xvfb provides a virtual display so Chromium can run *headful* (Yandex withholds
# reviews from truly headless windows).
RUN apt-get update \
    && apt-get install -y --no-install-recommends xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the server under a virtual X display.
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1366x900x24", "node", "dist/server.js"]

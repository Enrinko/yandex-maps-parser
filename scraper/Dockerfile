# syntax=docker/dockerfile:1

# Playwright base image ships Chromium + all system deps. The tag version MUST
# match the "playwright" version in package.json (pinned exactly) so the bundled
# browser matches what the library expects.
FROM mcr.microsoft.com/playwright:v1.61.0-noble

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
ENV DISPLAY=:99
EXPOSE 3000

# Entrypoint starts Xvfb in the background, then runs the server.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip any CR (Windows line endings) so the shebang works, then make executable.
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]

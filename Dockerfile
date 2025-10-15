FROM oven/bun:1.3.0 AS builder

ENV NODE_ENV=production
ENV SQUID_HOST=127.0.0.1
ENV SQUID_PORT=3128
ENV LOG_DIR=/tmp/squid/log
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=bunsqstat123




WORKDIR /app

COPY . .

RUN /usr/local/bin/bun install
RUN /usr/local/bin/bun x turbo run build --filter=web
WORKDIR /app/apps/server
RUN /usr/local/bin/bun run build:binary
WORKDIR /app


FROM redis/redis-stack:7.2.0-v18

RUN apt-get update
RUN apt-get install -y \
    curl \
    supervisor \
    ca-certificates \
    gnupg \
    unzip \
    bash \
    libstdc++6


RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
RUN apt-get update && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*



WORKDIR /app

COPY --from=builder /app/apps/server/bunsqstat-backend-binary ./backend/bunsqstat-backend-binary
COPY --from=builder /app/apps/web/dist ./frontend/

WORKDIR /app
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile.template
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /app/start.sh

RUN sed 's|/srv|/app/frontend|g' /etc/caddy/Caddyfile.template > /etc/caddy/Caddyfile && \
    sed -i 's|bunsqstat_server:3000|localhost:3000|g' /etc/caddy/Caddyfile && \
    chmod +x /app/start.sh

RUN mkdir -p /app/logs



EXPOSE 80 3000 6379

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1



CMD ["/app/start.sh"]

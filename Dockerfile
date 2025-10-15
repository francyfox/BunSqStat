FROM alpine:latest AS builder

ENV NODE_ENV=production
ENV SQUID_HOST=127.0.0.1
ENV SQUID_PORT=3128
ENV LOG_DIR=/tmp/squid/log
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=bunsqstat123

RUN apk add --no-cache \
    unzip \
    curl \
    bash \
    libstdc++ \
    libgcc
RUN set -eux; \
    ARCH="$(uname -m)"; \
    case "${ARCH}" in aarch64) ARCH_ALT="arm64";; x86_64) ARCH_ALT="x64";; *) echo >&2 "error: unsupported architecture: ${ARCH}"; exit 1 ;; esac; \
    BUN_FILENAME="bun-linux-${ARCH_ALT}-musl-baseline.zip"; \
    BUN_DOWNLOAD_URL="https://github.com/oven-sh/bun/releases/latest/download/${BUN_FILENAME}"; \
    curl -fsSL "${BUN_DOWNLOAD_URL}" -o /tmp/${BUN_FILENAME}; \
    unzip /tmp/${BUN_FILENAME} -d /tmp/bun_extracted; \
    mv /tmp/bun_extracted/bun-linux-${ARCH_ALT}-musl-baseline/bun /usr/local/bin/bun; \
    chmod +x /usr/local/bin/bun; \
    ls -l /usr/local/bin/bun; \
    rm -rf /tmp/bun_extracted; \
    rm /tmp/${BUN_FILENAME}


WORKDIR /app

COPY . .

RUN /usr/local/bin/bun install
RUN /usr/local/bin/bun x turbo run build --filter=web
RUN /usr/local/bin/bun x turbo run build --filter=server

FROM redis/redis-stack:7.2.0-v18

RUN apt-get update
RUN apt-get install -y \
    curl \
    supervisor \
    ca-certificates \
    gnupg \
    unzip \
    bash
RUN set -eux; \
    ARCH="$(uname -m)"; \
    case "${ARCH}" in aarch64) ARCH_ALT="arm64";; x86_64) ARCH_ALT="x64";; *) echo >&2 "error: unsupported architecture: ${ARCH}"; exit 1 ;; esac; \
    BUN_FILENAME="bun-linux-${ARCH_ALT}-baseline.zip"; \
    BUN_DOWNLOAD_URL="https://github.com/oven-sh/bun/releases/latest/download/${BUN_FILENAME}"; \
    curl -fsSL "${BUN_DOWNLOAD_URL}" -o /tmp/${BUN_FILENAME}; \
    unzip /tmp/${BUN_FILENAME} -d /tmp/bun_extracted; \
    mv /tmp/bun_extracted/bun-linux-${ARCH_ALT}-baseline/bun /usr/local/bin/bun; \
    chmod +x /usr/local/bin/bun; \
    ls -l /usr/local/bin/bun; \
    rm -rf /tmp/bun_extracted; \
    rm /tmp/${BUN_FILENAME}

RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
RUN apt-get update && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/server/package.json /app/backend/package.json
WORKDIR /app/backend
RUN /usr/local/bin/bun install --production

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./backend/
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

ARG UNAME=bunsqstat
ARG UID=1000
ARG GID=1000

CMD ["/app/start.sh"]

FROM oven/bun:1.2.21 AS base
WORKDIR /usr/src/app

# Install stage - copy dependencies and install
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock turbo.json /temp/dev/
COPY apps /temp/dev/apps
# COPY packages /temp/dev/packages  # Uncomment if you have packages

RUN cd /temp/dev && bun install

# Build stage - build the frontend
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=install /temp/dev/turbo.json turbo.json
COPY --from=install /temp/dev/package.json package.json
COPY --from=install /temp/dev/apps apps
RUN bun run build --filter=web

# Production stage - serve with Caddy
FROM caddy:2.9.1-alpine

ARG PORT
ARG CADDY_BACKEND_HOST

# Copy Caddy configuration
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile

# Copy built frontend files
COPY --from=build /usr/src/app/apps/web/dist /srv

# Format Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

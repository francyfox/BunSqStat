FROM oven/bun:1.3.0 AS base
WORKDIR /usr/src/app

# Install stage - copy dependencies and install
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock turbo.json /temp/dev/
COPY apps/server /temp/dev/apps/server
RUN cd /temp/dev && bun install

# Build stage - build the application
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=install /temp/dev/turbo.json turbo.json
COPY --from=install /temp/dev/package.json package.json
COPY --from=install /temp/dev/apps/server apps/server
RUN bun run build:binary

# Production stage - minimal runtime
FROM base AS release
COPY --from=build /usr/src/app/apps/server/bunsqstat-backend-binary /app/backend/bunsqstat-backend-binary



# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["./bunsqstat-backend-binary"]
EXPOSE 3000

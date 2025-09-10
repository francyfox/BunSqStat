FROM oven/bun:1.2.21 AS base
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
RUN bun run build --filter=server

# Production stage - minimal runtime
FROM base AS release
COPY --from=build /usr/src/app/apps/server/dist ./dist
COPY --from=install /temp/dev/apps/server/package.json ./package.json

# Install only production dependencies for the built app
RUN bun install --production

ENV NODE_ENV=production

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["bun", "./dist/index.js"]
EXPOSE 3000

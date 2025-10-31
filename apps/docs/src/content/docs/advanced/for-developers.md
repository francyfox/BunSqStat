---
title: Installation for devs
---

## 📁 Project Structure

```
BunSqStat/
├── apps/
|   ├── docs/            # Astro docs
│   ├── server/          # Bun backend API
│   │   ├── src/         # Source code
│   │   └── __tests__/   # Test suites
│   └── web/             # Vue 3 frontend
│       ├── src/         # Source code
│       └── dist/        # Build output
├── docs/                # Documentation
├── docker/              # Docker configs
└── packages/            # Shared packages
    └── i18n             # locales
```

## 📖 Documentation

- [🔍 Search Syntax](apps/docs/src/content/docs/advanced/search-guide.md)
- [🚀 Deployment](./docs/deployment.md)

## 🛠️ Tech Stack

### Backend
- **[Bun](https://bun.sh)** - Ultra-fast JavaScript runtime
- **[TypeScript](https://typescriptlang.org)** - Type-safe development
- **[Elysia](https://elysiajs.com)** - High-performance web framework
- **[Redis Stack](https://redis.io/docs/stack/)** - Real-time search and analytics

### Frontend
- **[Vue 3](https://vuejs.org)** - Progressive JavaScript framework
- **[Composition API](https://vuejs.org/api/composition-api-setup.html)** - Modern Vue development
- **[Naive UI](https://naiveui.com)** - Beautiful component library
- **[UnoCSS](https://unocss.dev)** - Instant on-demand atomic CSS

### DevOps
- **[Docker](https://docker.com)** - Containerization
- **[Turbo](https://turbo.build)** - Monorepo build system
- **[Biome](https://biomejs.dev)** - Fast linter and formatter


### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BunSqStat

# Install dependencies
bun install

# Start Redis with Docker Compose
docker-compose up -d

# Copy environment template
cp .env.example .env

# Configure your Squid log paths in .env
```

### Development

```bash
# Start all services in development mode
bun run dev

# Or start individual services
bun run dev --filter=server  # Backend only
bun run dev --filter=web     # Frontend only
```

### Production

```bash
# Build all apps
bun run build

# Deploy with Docker Compose
docker-compose up -d
```
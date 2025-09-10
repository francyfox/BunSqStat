# 🦄 BunSqStat [WIP]

[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff&style=for-the-badge)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)](https://vuejs.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

> **In progress**

> **Real-time Squid proxy log analyzer with powerful search capabilities** ⚡

BunSqStat is a modern, high-performance web application for analyzing Squid proxy server logs in real-time. Built with the latest technologies including Bun, Vue 3, Redis Stack, and RediSearch for lightning-fast full-text search.

## 📈 Roadmap

- [X] Access log data table
- [X] Real-time WebSocket updates
- [ ] Access log charts
- - [ ] Hit Ratio
- - [ ] User speed
- [ ] Add to env lazy mode (use watcher only has ws clients)
- [ ] Use index for recording last line (slow parse speed)
- [ ] Log rotate support (logfile_rotate N)
- - [ ] {inode, offset}
- - [ ] size < offset, reset offset

### History:

This web app modern analog of SqStat. Old web app used object_cache (removed in squid 6), so we cant use
socket for grabbing realtime data. Now we can only use logs like: access_log/cache_log

## ✨ Features

- 🚀 **Real-time monitoring** - Watch logs update live as requests flow through your proxy
- 🔍 **Advanced search** - Full-text search with Redis Search including IP, users, URLs, and more  
- 📊 **Rich analytics** - Detailed statistics and insights about proxy usage
- 🎯 **Smart filtering** - Filter by status codes, methods, time ranges, users
- 📱 **Responsive UI** - Beautiful Vue 3 interface that works on all devices
- ⚡ **High performance** - Built on Bun runtime for maximum speed
- 🐳 **Docker ready** - Easy deployment with Docker Compose

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Squid Proxy   │───▶│   BunSqStat      │───▶│   Redis Stack   │
│                 │    │   (Log Parser)   │    │   (Search Index)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Vue 3 Web UI  │
                       │   (Dashboard)   │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- [Docker](https://docker.com) (for Redis)
- Node.js 18+ (for workspace compatibility)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BunSqStat

# Install dependencies
bun install

# Start Redis with Docker Compose
docker-compose up -d redis

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

## 📁 Project Structure

```
BunSqStat/
├── apps/
│   ├── server/          # Bun backend API
│   │   ├── src/         # Source code
│   │   └── test/        # Test suites
│   └── web/             # Vue 3 frontend
│       ├── src/         # Source code
│       └── dist/        # Build output
├── docs/                # Documentation
├── docker/              # Docker configs
└── packages/            # Shared packages
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# Specific test suites
bun run test:generator   # Log generator tests
bun run test:simulator   # Log simulator tests
```

## 📖 Documentation

- [📋 Installation Guide](./docs/installation.md)
- [⚙️ Configuration](./docs/configuration.md)
- [🔍 Search Syntax](./docs/search-guide.md)
- [🧪 Testing Guide](./docs/testing.md)
- [🚀 Deployment](./docs/deployment.md)
- [🔌 API Reference](./docs/api.md)

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

## 🤝 Contributing

~~We welcome contributions! Please see our [Contributing Guide](./docs/contributing.md) for details.~~

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

See our [Issues](./issues) page for current known issues and their status.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Squid Cache](http://squid-cache.org/) - The proxy server we analyze
- [Redis Team](https://redis.io) - For the amazing search capabilities
- [Bun Team](https://bun.sh) - For the incredible JavaScript runtime

---

<div align="center">
Made with ❤️ by HellizArt

 [🐛 Report Bug](./issues) | [💡 Request Feature](./issues)
</div>

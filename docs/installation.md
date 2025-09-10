[WIP]~~# 📋 Installation Guide~~

This guide will walk you through setting up BunSqStat from scratch.

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **OS**: Linux, macOS, or Windows with WSL2

## Prerequisites

### 1. Install Bun
```bash
# macOS and Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# Verify installation
bun --version
```

### 2. Install Docker
- **Linux**: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)
- **macOS**: Download [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
- **Windows**: Download [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)

### 3. Install Node.js (Optional)
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Installation Methods

### Method 1: Quick Setup (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/francyfox/BunSqStat.git
cd BunSqStat

# 2. Run setup script
./scripts/setup.sh
```

### Method 2: Manual Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/francyfox/BunSqStat.git
cd BunSqStat
```

#### Step 2: Install Dependencies
```bash
# Install all workspace dependencies
bun install

# Alternative: Install specific app dependencies
bun install --cwd apps/server
bun install --cwd apps/web
```

#### Step 3: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

#### Step 4: Start Services
```bash
# Start Redis with Docker Compose
docker-compose up -d redis

# Build applications
bun run build

# Start in development mode
bun run dev
```

## Environment Configuration

### Core Settings (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Log File Paths
SQUID_LOG_PATH=/var/log/squid/access.log
LOG_ROTATION_ENABLED=true
LOG_RETENTION_DAYS=30

# Search Configuration
SEARCH_INDEX_NAME=log_idx
MAX_SEARCH_RESULTS=1000

# Frontend URL
WEB_URL=http://localhost:3000
```

### Production Settings
```bash
# Production overrides
NODE_ENV=production
PORT=8080
WEB_URL=https://your-domain.com

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=15

# Redis (production)
REDIS_HOST=redis.your-domain.com
REDIS_PORT=6380
REDIS_PASSWORD=your-secure-password
REDIS_TLS_ENABLED=true
```

## Docker Installation

### Using Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/francyfox/BunSqStat.git
cd BunSqStat

# Copy production environment
cp .env.production .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Custom Docker Build
```bash
# Build server image
docker build -f apps/server/Dockerfile -t bunsqstat-server .

# Build web image  
docker build -f apps/web/Dockerfile -t bunsqstat-web .

# Run with custom configuration
docker run -d \
  --name bunsqstat-server \
  -p 3001:3001 \
  -v /var/log/squid:/var/log/squid:ro \
  -e REDIS_HOST=redis \
  bunsqstat-server
```

## Verification

### Health Checks
```bash
# Check server health
curl http://localhost:3001/health

# Check Redis connection
bun run --cwd apps/server test:redis

# Run full test suite
bun test
```

### Expected Responses
- **Server health**: `{"status": "ok", "uptime": "..."}`
- **Redis connection**: `Connection successful`
- **Tests**: All tests should pass

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3001
kill -9 <PID>

# Or change port in .env
PORT=3002
```

#### 2. Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connectivity
redis-cli ping

# Check Redis logs
docker logs redis-container
```

#### 3. Permission Denied (Log Files)
```bash
# Grant read permissions
sudo chmod +r /var/log/squid/access.log

# Add user to adm group (Ubuntu/Debian)
sudo usermod -a -G adm $USER

# Restart session
sudo -i -u $USER
```

#### 4. Bun Installation Issues
```bash
# Clear Bun cache
rm -rf ~/.bun/install/cache

# Reinstall dependencies
bun install --force

# Use npm fallback
npm install
```

### Performance Tuning

#### System Limits
```bash
# Increase file descriptor limits
echo "fs.file-max = 65536" | sudo tee -a /etc/sysctl.conf

# User limits
echo "$USER soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "$USER hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

#### Redis Optimization
```bash
# Redis memory settings
echo "maxmemory 2gb" | sudo tee -a /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" | sudo tee -a /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis
```

## Next Steps

1. **Configuration**: See [Configuration Guide](./configuration.md)
2. **Search Setup**: Read [Search Guide](./search-guide.md)  
3. **Testing**: Follow [Testing Guide](./testing.md)
4. **Deployment**: Check [Deployment Guide](./deployment.md)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/francyfox/BunSqStat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/francyfox/BunSqStat/discussions)
- **Discord**: [Join our community](https://discord.gg/bunsqstat)

## Update Instructions

```bash
# Pull latest changes
git pull origin main

# Update dependencies
bun install

# Rebuild applications
bun run build

# Restart services
docker-compose restart
```

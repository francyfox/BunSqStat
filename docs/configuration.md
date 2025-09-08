[WIP]~~# ⚙️ Configuration Guide~~

This guide covers all configuration options available in BunSqStat.

## Configuration Files Overview

```
BunSqStat/
├── .env                     # Main environment configuration
├── .env.example            # Environment template
├── .env.production         # Production overrides
├── apps/server/config/     # Server-specific configuration
├── apps/web/config/        # Frontend configuration
└── docker-compose.yml      # Docker services configuration
```

## Environment Variables

### Core Server Settings

```bash
# Server Configuration
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment: development|production|test
HOST=localhost              # Server host binding
CORS_ORIGIN=*               # CORS allowed origins (* for dev, specific domain for prod)

# Logging
LOG_LEVEL=info              # Log level: error|warn|info|debug|trace
LOG_FORMAT=pretty           # Log format: pretty|json
LOG_FILE=/var/log/bunsqstat/app.log  # Log file path (optional)
```

### Redis Configuration

```bash
# Redis Connection
REDIS_HOST=localhost         # Redis server host
REDIS_PORT=6379             # Redis server port
REDIS_PASSWORD=             # Redis password (leave empty if none)
REDIS_DB=0                  # Redis database number
REDIS_USERNAME=             # Redis username (Redis 6+ ACL)

# Redis Connection Pool
REDIS_MAX_CONNECTIONS=10     # Maximum concurrent connections
REDIS_MIN_CONNECTIONS=2      # Minimum pool connections
REDIS_CONNECTION_TIMEOUT=5000 # Connection timeout in ms

# Redis TLS (for production)
REDIS_TLS_ENABLED=false     # Enable TLS encryption
REDIS_TLS_CERT_FILE=        # Client certificate file
REDIS_TLS_KEY_FILE=         # Client private key file
REDIS_TLS_CA_FILE=          # Certificate Authority file
```

### Squid Log Configuration

```bash
# Log File Paths
SQUID_LOG_PATH=/var/log/squid/access.log  # Primary log file path
SQUID_LOG_BACKUP_PATH=                    # Backup/rotated log path pattern
LOG_ROTATION_ENABLED=true                 # Enable log rotation handling

# Log Parsing
LOG_FORMAT=squid                          # Log format: squid|combined|custom
LOG_ENCODING=utf8                         # File encoding
LOG_TAIL_LINES=1000                       # Lines to read on startup

# Log Retention
LOG_RETENTION_DAYS=30                     # Days to retain parsed logs
LOG_CLEANUP_INTERVAL=3600                 # Cleanup interval in seconds
LOG_MAX_SIZE_MB=1000                      # Max log size before rotation
```

### Search Configuration

```bash
# Redis Search Settings
SEARCH_INDEX_NAME=log_idx                 # Search index name
MAX_SEARCH_RESULTS=1000                   # Maximum search results
SEARCH_TIMEOUT=5000                       # Search timeout in ms
SEARCH_CACHE_TTL=300                      # Search result cache TTL

# Index Configuration
INDEX_BATCH_SIZE=1000                     # Documents per batch
INDEX_REFRESH_INTERVAL=30                 # Index refresh interval (seconds)
INDEX_MEMORY_LIMIT=512MB                  # Memory limit for indexing

# Field Types (for reference)
# Available field types: TEXT, TAG, NUMERIC, GEO
FIELD_CLIENT_IP=TAG                       # IP addresses as TAG for exact search
FIELD_USER_ID=TEXT                        # User IDs as searchable text
FIELD_URL=TEXT                           # URLs as full-text searchable
FIELD_STATUS=NUMERIC                     # HTTP status codes as numeric
FIELD_SIZE=NUMERIC                       # Response sizes as numeric
FIELD_TIMESTAMP=NUMERIC                  # Timestamps as numeric (Unix)
```

### Frontend Configuration

```bash
# Web Application
WEB_URL=http://localhost:3000            # Frontend URL
WEB_PORT=3000                           # Frontend port (Vite dev server)
WEB_HOST=localhost                       # Frontend host binding

# API Configuration
API_BASE_URL=http://localhost:3001       # Backend API URL
API_TIMEOUT=10000                        # API request timeout
API_RETRY_COUNT=3                        # API retry attempts

# UI Settings
UI_THEME=auto                           # Theme: light|dark|auto
UI_LANGUAGE=en                          # Interface language
UI_RESULTS_PER_PAGE=50                  # Default results per page
UI_REFRESH_INTERVAL=30                  # Auto-refresh interval (seconds)
```

### Security Settings

```bash
# Rate Limiting
RATE_LIMIT_REQUESTS=1000                # Requests per window
RATE_LIMIT_WINDOW=15                    # Rate limit window (minutes)
RATE_LIMIT_SKIP_SUCCESS=true            # Skip rate limit on successful requests

# Authentication (if enabled)
AUTH_ENABLED=false                      # Enable authentication
AUTH_SECRET=your-secret-key             # JWT secret key
AUTH_EXPIRES_IN=24h                     # Token expiration time
AUTH_REFRESH_ENABLED=true               # Enable refresh tokens

# Security Headers
SECURITY_HELMET_ENABLED=true            # Enable security headers
SECURITY_CSRF_ENABLED=false             # Enable CSRF protection (disable for API-only)
SECURITY_CONTENT_TYPE_NOSNIFF=true      # Enable X-Content-Type-Options
```

## Configuration Files

### Server Configuration

Create `apps/server/config/default.json`:

```json
{
  "server": {
    "port": "${PORT:3001}",
    "host": "${HOST:localhost}",
    "cors": {
      "origin": "${CORS_ORIGIN:*}",
      "credentials": true
    }
  },
  "redis": {
    "host": "${REDIS_HOST:localhost}",
    "port": "${REDIS_PORT:6379}",
    "password": "${REDIS_PASSWORD:}",
    "db": "${REDIS_DB:0}",
    "retryDelayOnFailover": 1000,
    "maxRetriesPerRequest": 3
  },
  "logging": {
    "level": "${LOG_LEVEL:info}",
    "format": "${LOG_FORMAT:pretty}",
    "file": "${LOG_FILE:}"
  },
  "squid": {
    "logPath": "${SQUID_LOG_PATH:/var/log/squid/access.log}",
    "format": "${LOG_FORMAT:squid}",
    "encoding": "${LOG_ENCODING:utf8}",
    "tailLines": "${LOG_TAIL_LINES:1000}",
    "rotationEnabled": "${LOG_ROTATION_ENABLED:true}"
  },
  "search": {
    "indexName": "${SEARCH_INDEX_NAME:log_idx}",
    "maxResults": "${MAX_SEARCH_RESULTS:1000}",
    "timeout": "${SEARCH_TIMEOUT:5000}",
    "cacheTTL": "${SEARCH_CACHE_TTL:300}",
    "batchSize": "${INDEX_BATCH_SIZE:1000}"
  }
}
```

### Frontend Configuration

Create `apps/web/config/app.config.ts`:

```typescript
export default defineAppConfig({
  api: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    retryCount: parseInt(process.env.API_RETRY_COUNT || '3')
  },
  ui: {
    theme: process.env.UI_THEME || 'auto',
    language: process.env.UI_LANGUAGE || 'en',
    resultsPerPage: parseInt(process.env.UI_RESULTS_PER_PAGE || '50'),
    refreshInterval: parseInt(process.env.UI_REFRESH_INTERVAL || '30')
  },
  features: {
    realTimeUpdates: true,
    exportFunctionality: false,
    advancedSearch: true,
    darkMode: true
  }
})
```

## Docker Configuration

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis/redis-stack-server:latest
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "${PORT:-3001}:${PORT:-3001}"
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3001}
      - REDIS_HOST=redis
      - REDIS_PORT=${REDIS_PORT:-6379}
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    volumes:
      - "${SQUID_LOG_PATH:-/var/log/squid/access.log}:${SQUID_LOG_PATH:-/var/log/squid/access.log}:ro"
      - app_logs:/var/log/bunsqstat

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "${WEB_PORT:-3000}:80"
    depends_on:
      - server
    environment:
      - API_BASE_URL=http://server:${PORT:-3001}

volumes:
  redis_data:
  app_logs:
```

### Redis Configuration

Create `docker/redis.conf`:

```conf
# Basic Redis configuration for BunSqStat
bind 0.0.0.0
port 6379
dir /data

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# RDB settings
rdbcompression yes
rdbchecksum yes
dbfilename bunsqstat.rdb

# AOF settings
appendonly yes
appendfilename "bunsqstat.aof"
appendfsync everysec

# Redis Search module
loadmodule /opt/redis-stack/lib/redisearch.so
loadmodule /opt/redis-stack/lib/rejson.so

# Logging
loglevel notice
logfile "/var/log/redis/redis-server.log"

# Network timeout
timeout 300
tcp-keepalive 300

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
```

## Environment-Specific Configuration

### Development (.env.development)

```bash
NODE_ENV=development
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Development Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379

# Development frontend
WEB_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Hot reload settings
HOT_RELOAD=true
WATCH_FILES=true

# Debug settings
DEBUG_ENABLED=true
DEBUG_SQL=false
```

### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_FILE=/var/log/bunsqstat/app.log

# Production Redis (with security)
REDIS_HOST=redis.production.com
REDIS_PORT=6380
REDIS_PASSWORD=secure-production-password
REDIS_TLS_ENABLED=true

# Production frontend
WEB_URL=https://bunsqstat.company.com
CORS_ORIGIN=https://bunsqstat.company.com

# Security
SECURITY_HELMET_ENABLED=true
AUTH_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=15

# Performance
INDEX_BATCH_SIZE=5000
MAX_SEARCH_RESULTS=500
```

### Testing (.env.test)

```bash
NODE_ENV=test
LOG_LEVEL=error

# Test Redis (isolated)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_DB=15

# Test log files
SQUID_LOG_PATH=./test/fixtures/test.log
LOG_RETENTION_DAYS=1

# Test settings
MAX_SEARCH_RESULTS=100
INDEX_BATCH_SIZE=100
```

## Advanced Configuration

### Custom Log Formats

Define custom log parsing patterns:

```typescript
// apps/server/config/log-formats.ts
export const customLogFormats = {
  squid: {
    pattern: /^(\d+\.\d+)\s+(\d+)\s+(\S+)\s+(\S+)\/(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/,
    fields: ['timestamp', 'duration', 'clientIP', 'resultStatus', 'size', 'method', 'url', 'user', 'hierarchy', 'contentType', 'extra']
  },
  custom: {
    pattern: /your-custom-regex-pattern/,
    fields: ['field1', 'field2', 'field3']
  }
}
```

### Search Field Configuration

Configure search field types and options:

```typescript
// apps/server/config/search-fields.ts
export const searchFieldConfig = {
  timestamp: { 
    type: 'NUMERIC', 
    sortable: true,
    index: true
  },
  clientIP: { 
    type: 'TAG', 
    separator: '.',
    index: true
  },
  url: { 
    type: 'TEXT', 
    weight: 2.0,
    phonetic: true,
    index: true
  },
  user: { 
    type: 'TAG',
    caseSensitive: false,
    index: true
  },
  resultStatus: { 
    type: 'NUMERIC',
    index: true
  },
  size: { 
    type: 'NUMERIC',
    index: true
  },
  method: { 
    type: 'TAG',
    index: true
  }
}
```

## Configuration Validation

BunSqStat validates configuration on startup. Common validation errors:

```bash
# Missing required fields
ERROR: REDIS_HOST is required
ERROR: SQUID_LOG_PATH file does not exist

# Invalid values
ERROR: PORT must be a number between 1 and 65535
ERROR: LOG_LEVEL must be one of: error, warn, info, debug, trace

# Permission issues  
ERROR: Cannot read log file /var/log/squid/access.log
ERROR: Cannot write to log directory /var/log/bunsqstat
```

## Configuration Best Practices

### Security
- Never commit `.env` files with secrets
- Use environment variables for sensitive data
- Enable TLS for production Redis
- Set restrictive CORS origins in production
- Use strong passwords and rotate them regularly

### Performance
- Tune Redis memory settings based on log volume
- Adjust batch sizes for optimal indexing performance
- Configure appropriate connection pool sizes
- Set reasonable search timeouts and result limits

### Monitoring
- Enable structured logging in production
- Configure log retention policies
- Set up health check endpoints
- Monitor Redis memory usage and performance

## Troubleshooting Configuration

```bash
# Validate configuration
bun run --cwd apps/server config:validate

# Test Redis connection
bun run --cwd apps/server test:redis

# Check log file permissions
bun run --cwd apps/server test:logs

# View current configuration
bun run --cwd apps/server config:show
```

For more advanced configuration options, see:
- [API Reference](./api.md)
- [Deployment Guide](./deployment.md)
- [Search Guide](./search-guide.md)

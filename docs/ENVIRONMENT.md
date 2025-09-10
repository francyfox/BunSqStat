# Environment Variables

This document describes all environment variables used by BunSqStat application.

## Required Variables

All these variables must be set for the application to work properly.

### Application Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Application environment | `development` | `production` |

### Squid Proxy Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SQUID_HOST` | Squid proxy hostname/IP | - | `127.0.0.1` |
| `SQUID_PORT` | Squid proxy port | - | `3128` |

### Log Files Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `ACCESS_LOG` | Path to Squid access log file | - | `/var/log/squid/access.log` |
| `CACHE_LOG` | Path to Squid cache log file | - | `/var/log/squid/cache.log` |

### Redis Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_HOST` | Redis server hostname/IP | `localhost` | `redis-bunsqstat` |
| `REDIS_PORT` | Redis server port | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis server password | - | `your-secure-password` |

## Development vs Production

### Development (.env)
```bash
NODE_ENV=development
REDIS_HOST=localhost
ACCESS_LOG=/tmp/access.log
CACHE_LOG=/tmp/cache.log
```

### Production (docker-compose.prod.yml)
```bash
NODE_ENV=production
REDIS_HOST=redis-bunsqstat  # Docker service name
ACCESS_LOG=/var/log/squid/access.log
CACHE_LOG=/var/log/squid/cache.log
```

## Docker Compose Configuration

In production, environment variables are configured directly in `docker-compose.prod.yml`:

```yaml
services:
  bunsqstat_server:
    environment:
      - NODE_ENV=production
      - SQUID_HOST=127.0.0.1
      - SQUID_PORT=3128
      - ACCESS_LOG=/app/logs/access.log
      - CACHE_LOG=/app/logs/cache.log
      - REDIS_HOST=redis-bunsqstat
      - REDIS_PORT=6379
      - REDIS_PASSWORD=123
    volumes:
      # Mount Squid log files from host system
      - /var/log/squid/access.log:/app/logs/access.log:ro
      - /var/log/squid/cache.log:/app/logs/cache.log:ro
```

### Volume Mounting

Squid log files are mounted from the host system using Docker volumes:

- **Host Path**: `/var/log/squid/access.log` → **Container Path**: `/app/logs/access.log`
- **Host Path**: `/var/log/squid/cache.log` → **Container Path**: `/app/logs/cache.log`

To customize log file locations, modify the volume mappings in `docker-compose.prod.yml`.

## Important Notes

1. **Log Files**: Make sure the specified log file paths exist and are readable by the application
2. **Redis Connection**: In Docker, use service names (e.g., `redis-bunsqstat`) for inter-container communication
3. **Security**: Change default passwords in production environments
4. **File Permissions**: Ensure the application has read access to log files

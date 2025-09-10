# BunSqStat - All-in-One Squid Log Analytics

![Docker Image Size](https://img.shields.io/docker/image-size/francyfox/bunsqstat)
![Docker Pulls](https://img.shields.io/docker/pulls/francyfox/bunsqstat)

A lightweight, all-in-one Docker image for Squid proxy log analytics. Built with Bun, Vue.js, Redis, and Caddy.

## 🚀 Quick Start

### Using Docker Run (Simplest)

```bash
docker run -d \
  --name bunsqstat \
  -p 80:80 \
  -v /var/log/squid/access.log:/app/logs/access.log:ro \
  -v /var/log/squid/cache.log:/app/logs/cache.log:ro \
  -e REDIS_PASSWORD=your-secure-password \
  francyfox/bunsqstat:latest
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  bunsqstat:
    image: francyfox/bunsqstat:latest
    container_name: bunsqstat
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      - REDIS_PASSWORD=your-secure-password
      - SQUID_HOST=127.0.0.1
      - SQUID_PORT=3128
    volumes:
      - /var/log/squid/access.log:/app/logs/access.log:ro
      - /var/log/squid/cache.log:/app/logs/cache.log:ro
```

## 📊 Features

- **Real-time Analytics**: Live monitoring of Squid proxy logs
- **Web Dashboard**: Modern Vue.js interface
- **REST API**: Full API access for integrations
- **Redis Storage**: Fast in-memory analytics
- **All-in-One**: Single container with everything included
- **Lightweight**: Based on Alpine Linux (~50MB)

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `SQUID_HOST` | `127.0.0.1` | Squid proxy hostname |
| `SQUID_PORT` | `3128` | Squid proxy port |
| `ACCESS_LOG` | `/app/logs/access.log` | Path to access log |
| `CACHE_LOG` | `/app/logs/cache.log` | Path to cache log |
| `REDIS_PASSWORD` | `bunsqstat123` | Redis password |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |

### Volume Mounts

Mount your Squid log files to the container:

```bash
# Single log file
-v /var/log/squid/access.log:/app/logs/access.log:ro

# Entire log directory
-v /var/log/squid:/app/logs:ro
```

### Ports

- `80` - Web interface (required)
- `3000` - API direct access (optional)
- `6379` - Redis access (optional)

## 📝 Usage Examples

### Basic Setup

```bash
# Pull and run the image
docker pull francyfox/bunsqstat:latest
docker run -d --name bunsqstat -p 80:80 \
  -v /var/log/squid:/app/logs:ro \
  francyfox/bunsqstat:latest

# Access web interface
open http://localhost
```

### Custom Configuration

```bash
docker run -d --name bunsqstat \
  -p 8080:80 \
  -e SQUID_HOST=192.168.1.100 \
  -e SQUID_PORT=8080 \
  -e REDIS_PASSWORD=my-secure-password \
  -v /custom/path/access.log:/app/logs/access.log:ro \
  -v /custom/path/cache.log:/app/logs/cache.log:ro \
  francyfox/bunsqstat:latest
```

### Development Mode

```bash
# Run with debug logging
docker run -d --name bunsqstat \
  -p 80:80 \
  -e NODE_ENV=development \
  -v /var/log/squid:/app/logs:ro \
  francyfox/bunsqstat:latest
```

## 🏥 Health Check

The image includes built-in health checks:

```bash
# Check container health
docker ps
# STATUS should show "healthy"

# Manual health check
curl http://localhost/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

## 📊 API Access

Direct API access is available on port 3000:

```bash
# Get health status
curl http://localhost:3000/health

# Get access logs (if port 3000 is exposed)
curl http://localhost:3000/stats/access-logs
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs bunsqstat

# Common issues:
# 1. Log files not accessible - check volume mounts
# 2. Port conflicts - use different ports
# 3. Permission issues - ensure log files are readable
```

### No data showing
```bash
# Verify log files are mounted correctly
docker exec bunsqstat ls -la /app/logs/

# Check if logs are being read
docker exec bunsqstat tail -f /var/log/backend.out.log
```

### Performance issues
```bash
# Monitor resource usage
docker stats bunsqstat

# For heavy traffic, consider:
# - Increasing container memory
# - Using external Redis
# - Optimizing log rotation
```

## 🔄 Updates

```bash
# Pull latest version
docker pull francyfox/bunsqstat:latest

# Recreate container
docker stop bunsqstat
docker rm bunsqstat
docker run -d --name bunsqstat ... # your full run command
```

## 📂 Data Persistence

All analytics data is stored in Redis inside the container. For data persistence across container restarts:

```bash
# Add Redis data volume
docker run -d --name bunsqstat \
  -p 80:80 \
  -v bunsqstat-data:/data \
  -v /var/log/squid:/app/logs:ro \
  francyfox/bunsqstat:latest
```

## 🔧 Advanced Usage

### External Redis

```bash
# Use external Redis instance
docker run -d --name bunsqstat \
  -p 80:80 \
  -e REDIS_HOST=external-redis.example.com \
  -e REDIS_PORT=6379 \
  -e REDIS_PASSWORD=external-password \
  -v /var/log/squid:/app/logs:ro \
  francyfox/bunsqstat:latest
```

### Behind Reverse Proxy

```bash
# Running behind nginx/traefik
docker run -d --name bunsqstat \
  --network web \
  -l traefik.enable=true \
  -l traefik.http.routers.bunsqstat.rule=Host\(\`analytics.yourdomain.com\`\) \
  -v /var/log/squid:/app/logs:ro \
  francyfox/bunsqstat:latest
```

## 📋 Requirements

- Docker 20.10+
- Readable Squid log files
- Minimum 100MB RAM
- Minimum 50MB disk space

## 🆘 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/francyfox/bunsqstat/issues)
- **Documentation**: [Full documentation](https://github.com/francyfox/bunsqstat/docs)
- **Docker Hub**: [Image repository](https://hub.docker.com/r/francyfox/bunsqstat)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ using Bun, Vue.js, Redis, and Alpine Linux**

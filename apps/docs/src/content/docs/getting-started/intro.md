---
title: Quick start
description: Quick start
---

**Requirements:**

Server:
- x64
- Squid 3.2+ (UDP logs support)
- MEMORY: 190MB RAM
- Nehalem (1st gen Core) or newer (i use baseline bun version for KVM support)
- STORAGE: 1.2GB
- Docker

Web client:

- Google Chrome/Firefox latest version. Edge and Safari may contain some bugs. I don't support the oldest browsers.

Install the latest version of BunSqStat analyzer from 

### Using Docker Run (Simplest)

```bash
docker run -d \
  --name bunsqstat \
  -p 80:80 \
  -e SQUID_LISTENERS=0.0.0.0:5140,0.0.0.0:5141,... \
  ghcr.io/francyfox/bunsqstat:latest
```

### Using Docker Compose

```yaml
services:
    bunsqstat_client:
      image: ghcr.io/francyfox/bunsqstat:latest
      container_name: bunsqstat-client
      restart: unless-stopped
      env:
        SQUID_LISTENERS: "0.0.0.0:5140,0.0.0.0:5141,..."
      ports:
        - "8078:80" # Web UI
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost/api/health"]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 30s
      networks:
        - squid-internal
```

All logs in `app/logs` directory.

For the work, we need to open udp access logs on squid. Add this line to `squid.conf` file.

```text
access_log udp://your_bunsqstat_ip:5140 squid
```

If you're working with squid in one stack, you can set container name like `udp://bunsqstat_client:5140`. But if you're 
working with many squid servers you can set macvlan (local ip). At the end chose your squid user. By default, its squid.
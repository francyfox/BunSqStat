---
title: 🚀 [WIP] Deployment Guide 
---

## TODO

This guide covers deploying BunSqStat in various environments, from development to production.

## Overview

BunSqStat supports multiple deployment strategies:
- **Docker Compose** (recommended for most users)
- **Kubernetes** (for large-scale deployments)
- **Manual deployment** (for custom setups)
- **Cloud platforms** (AWS, GCP, Azure)

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Bun runtime (for manual deployment)  
- Redis Stack server
- Access to Squid log files
- SSL certificates (for HTTPS in production)

## Docker Compose Deployment (Recommended)

### Quick Start

```bash
# Clone repository
git clone https://github.com/francyfox/BunSqStat.git
cd BunSqStat

# Copy production environment
cp .env.production .env

# Edit environment variables
nano .env

# Deploy all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f bunsqstat-server
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  redis:
    image: redis/redis-stack-server:7.2-latest
    container_name: bunsqstat-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD:-}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    networks:
      - bunsqstat

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
      args:
        - NODE_ENV=production
    container_name: bunsqstat-server
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3001
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - SQUID_LOG_PATH=${SQUID_LOG_PATH}
      - LOG_LEVEL=${LOG_LEVEL:-warn}
    volumes:
      - "${SQUID_LOG_PATH}:${SQUID_LOG_PATH}:ro"
      - app_logs:/var/log/bunsqstat
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - bunsqstat

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        - NODE_ENV=production
        - API_BASE_URL=http://server:3001
    container_name: bunsqstat-web
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - bunsqstat

  nginx:
    image: nginx:alpine
    container_name: bunsqstat-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/sites/:/etc/nginx/conf.d/:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - web
      - server
    networks:
      - bunsqstat

volumes:
  redis_data:
    driver: local
  app_logs:
    driver: local
  nginx_logs:
    driver: local

networks:
  bunsqstat:
    driver: bridge
```

### Nginx Configuration

```nginx
# docker/nginx/sites/bunsqstat.conf
upstream backend {
    server bunsqstat-server:3001;
}

upstream frontend {
    server bunsqstat-web:80;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health checks
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Handle client-side routing
        try_files $uri $uri/ /index.html;
    }

    # Static assets with long cache
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
# k8s/namespace.yml
apiVersion: v1
kind: Namespace
metadata:
  name: bunsqstat

---
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bunsqstat-config
  namespace: bunsqstat
data:
  NODE_ENV: "production"
  LOG_LEVEL: "warn"
  REDIS_HOST: "bunsqstat-redis"
  REDIS_PORT: "6379"
  SEARCH_INDEX_NAME: "log_idx"
  MAX_SEARCH_RESULTS: "1000"
```

### Redis Deployment

```yaml
# k8s/redis.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bunsqstat-redis
  namespace: bunsqstat
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bunsqstat-redis
  template:
    metadata:
      labels:
        app: bunsqstat-redis
    spec:
      containers:
      - name: redis
        image: redis/redis-stack-server:7.2-latest
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bunsqstat-secrets
              key: redis-password
        volumeMounts:
        - name: redis-data
          mountPath: /data
        - name: redis-config
          mountPath: /usr/local/etc/redis/redis.conf
          subPath: redis.conf
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: redis-data
        persistentVolumeClaim:
          claimName: redis-pvc
      - name: redis-config
        configMap:
          name: redis-config

---
apiVersion: v1
kind: Service
metadata:
  name: bunsqstat-redis
  namespace: bunsqstat
spec:
  selector:
    app: bunsqstat-redis
  ports:
  - port: 6379
    targetPort: 6379

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: bunsqstat
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Application Deployment

```yaml
# k8s/app.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bunsqstat-server
  namespace: bunsqstat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bunsqstat-server
  template:
    metadata:
      labels:
        app: bunsqstat-server
    spec:
      containers:
      - name: server
        image: bunsqstat-server:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: bunsqstat-config
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: bunsqstat-secrets
              key: redis-password
        volumeMounts:
        - name: squid-logs
          mountPath: /var/log/squid
          readOnly: true
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: squid-logs
        hostPath:
          path: /var/log/squid
          type: Directory

---
apiVersion: v1
kind: Service
metadata:
  name: bunsqstat-server
  namespace: bunsqstat
spec:
  selector:
    app: bunsqstat-server
  ports:
  - port: 3001
    targetPort: 3001

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bunsqstat-web
  namespace: bunsqstat
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bunsqstat-web
  template:
    metadata:
      labels:
        app: bunsqstat-web
    spec:
      containers:
      - name: web
        image: bunsqstat-web:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: bunsqstat-web
  namespace: bunsqstat
spec:
  selector:
    app: bunsqstat-web
  ports:
  - port: 80
    targetPort: 80
```

### Ingress Configuration

```yaml
# k8s/ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bunsqstat-ingress
  namespace: bunsqstat
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - bunsqstat.your-domain.com
    secretName: bunsqstat-tls
  rules:
  - host: bunsqstat.your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: bunsqstat-server
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bunsqstat-web
            port:
              number: 80
```

## Cloud Platform Deployment

### AWS ECS with Fargate

```yaml
# aws/task-definition.json
{
  "family": "bunsqstat",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "redis",
      "image": "redis/redis-stack-server:7.2-latest",
      "portMappings": [
        {
          "containerPort": 6379,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bunsqstat",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "redis"
        }
      }
    },
    {
      "name": "server",
      "image": "ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/bunsqstat-server:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "dependsOn": [
        {
          "containerName": "redis",
          "condition": "START"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "REDIS_HOST",
          "value": "localhost"
        }
      ],
      "secrets": [
        {
          "name": "REDIS_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-west-2:ACCOUNT:parameter/bunsqstat/redis-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bunsqstat",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "server"
        }
      }
    },
    {
      "name": "web",
      "image": "ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/bunsqstat-web:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bunsqstat",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "web"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```yaml
# gcp/cloud-run.yml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: bunsqstat-server
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      containers:
      - image: gcr.io/PROJECT_ID/bunsqstat-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          value: "10.0.0.3"  # Cloud Memorystore Redis IP
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-password
              key: password
        resources:
          limits:
            cpu: "1000m"
            memory: "2Gi"
        startupProbe:
          httpGet:
            path: /health
            port: 3001
          timeoutSeconds: 240
          periodSeconds: 240
          failureThreshold: 1
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
```

## Manual Deployment

You can use this [latest artifacts](https://github.com/francyfox/BunSqStat/releases) from build pipeline


### System Requirements

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Node.js (fallback)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis Stack
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server

# Install Nginx (optional)
sudo apt-get install nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Application Setup

```bash
# Clone and build
curl -O https://github.com/francyfox/BunSqStat/releases/download/v0.1.6/bunsqstat.zip
unzip bunsqstat.zip

# Set up environment
cp .env.production .env
nano .env

# Create system user
sudo useradd -r -s /bin/false bunsqstat
sudo usermod -a -G adm bunsqstat  # For log file access

# Set up directories
sudo mkdir -p /opt/bunsqstat
sudo mkdir -p /var/log/bunsqstat
sudo mkdir -p /etc/bunsqstat

# Copy files
sudo cp -r . /opt/bunsqstat/
sudo chown -R bunsqstat:bunsqstat /opt/bunsqstat
sudo chown -R bunsqstat:bunsqstat /var/log/bunsqstat

# Run
# Use pm2 for starting demon process for backend service
# https://bun.com/guides/ecosystem/pm2
# Serve frontend files with nginx/apache/caddy 

```

### Systemd Services

```ini
# /etc/systemd/system/bunsqstat-server.service
[Unit]
Description=BunSqStat Server
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=bunsqstat
Group=bunsqstat
WorkingDirectory=/opt/bunsqstat/apps/server
ExecStart=/home/bunsqstat/.bun/bin/bun run dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/etc/bunsqstat/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bunsqstat-server

# Security
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log/bunsqstat /tmp

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/bunsqstat-web.service
[Unit]
Description=BunSqStat Web Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/bunsqstat/apps/web
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bunsqstat-server',
      script: 'bun',
      args: 'run dist/server.js',
      cwd: '/opt/bunsqstat/apps/server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/bunsqstat/server.log',
      error_file: '/var/log/bunsqstat/server-error.log',
      out_file: '/var/log/bunsqstat/server-out.log',
      merge_logs: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'bunsqstat-web',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: '/opt/bunsqstat/apps/web',
      instances: 2,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Setup

```bash
# Generate private key
openssl genrsa -out /etc/ssl/private/bunsqstat.key 4096

# Generate certificate signing request
openssl req -new -key /etc/ssl/private/bunsqstat.key -out bunsqstat.csr

# Install certificate files
sudo cp your-certificate.crt /etc/ssl/certs/bunsqstat.crt
sudo cp ca-bundle.crt /etc/ssl/certs/bunsqstat-ca-bundle.crt

# Set permissions
sudo chmod 600 /etc/ssl/private/bunsqstat.key
sudo chmod 644 /etc/ssl/certs/bunsqstat.crt
```

## Monitoring and Logging

### Log Aggregation

```yaml
# docker/logging/fluentd.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match bunsqstat.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name bunsqstat
  type_name logs
</match>
```

### Health Monitoring

```yaml
# docker/monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'bunsqstat'
    static_configs:
      - targets: ['bunsqstat-server:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

# Redis data backup
redis-cli --rdb /backups/redis/dump-$(date +%Y%m%d-%H%M%S).rdb

# Application logs backup  
tar -czf /backups/logs/app-logs-$(date +%Y%m%d).tar.gz /var/log/bunsqstat/

# Configuration backup
cp /etc/bunsqstat/.env /backups/config/env-$(date +%Y%m%d)

# Retention (keep 30 days)
find /backups -type f -mtime +30 -delete
```

## Performance Optimization

### Redis Tuning

```conf
# /etc/redis/redis.conf (production)
maxmemory 4gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
maxclients 10000
tcp-keepalive 300
timeout 300
```

### System Limits

```bash
# /etc/security/limits.conf
bunsqstat soft nofile 65536
bunsqstat hard nofile 65536
bunsqstat soft nproc 32768
bunsqstat hard nproc 32768

# /etc/sysctl.conf
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
vm.overcommit_memory = 1
```

## Troubleshooting

### Common Issues

```bash
# Service not starting
sudo systemctl status bunsqstat-server
sudo journalctl -u bunsqstat-server -f

# Redis connection issues
redis-cli ping
sudo systemctl status redis

# File permission issues
sudo chown -R bunsqstat:bunsqstat /opt/bunsqstat
sudo chmod +r /var/log/squid/access.log

# Memory issues
free -h
sudo dmesg | grep -i memory
```

### Performance Issues

```bash
# Check resource usage
htop
iotop
docker stats

# Monitor Redis
redis-cli --latency-history
redis-cli info memory

# Check disk space
df -h
du -sh /var/log/*
```

For more deployment scenarios and troubleshooting, see [Configuration Guide](./configuration.md) and [API Reference](./api.md).

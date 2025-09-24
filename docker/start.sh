#!/bin/bash
set -e

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export SQUID_HOST=${SQUID_HOST:-127.0.0.1}
export SQUID_PORT=${SQUID_PORT:-3128}
export LOG_DIR=${LOG_DIR:-/app/logs}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_PASSWORD=${REDIS_PASSWORD:-bunsqstat123}

echo "Starting BunSqStat All-in-One..."
echo "Environment: $NODE_ENV"
echo "Redis: $REDIS_HOST:$REDIS_PORT"

# Create logs directory
mkdir -p /app/logs

# Configure Redis Stack password in config
if grep -q "^requirepass" /redis-stack.conf; then
  cat /redis-stack.conf
  sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" /redis-stack.conf;
else
  echo "requirepass $REDIS_PASSWORD" >> /redis-stack.conf;
fi

# Also set port if changed
if ! grep -q "^port $REDIS_PORT" /redis-stack.conf; then
  sed -i "s/^port .*/port $REDIS_PORT/" /redis-stack.conf || echo "port $REDIS_PORT" >> /redis-stack.conf;
fi

# Update supervisor config with current environment variables for backend
sed -i "s|environment=.*|environment=NODE_ENV=\"$NODE_ENV\",SQUID_HOST=\"$SQUID_HOST\",SQUID_PORT=\"$SQUID_PORT\",LOG_DIR=\"$LOG_DIR\",REDIS_HOST=\"$REDIS_HOST\",REDIS_PORT=\"$REDIS_PORT\",REDIS_PASSWORD=\"$REDIS_PASSWORD\"|g" /etc/supervisor/conf.d/supervisord.conf

echo "Starting Redis Stack, Backend and Frontend services..."

# Start supervisor to manage redis, backend and caddy
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf

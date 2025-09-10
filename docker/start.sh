#!/bin/bash
set -e

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export SQUID_HOST=${SQUID_HOST:-127.0.0.1}
export SQUID_PORT=${SQUID_PORT:-3128}
export ACCESS_LOG=${ACCESS_LOG:-/app/logs/access.log}
export CACHE_LOG=${CACHE_LOG:-/app/logs/cache.log}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_PASSWORD=${REDIS_PASSWORD:-bunsqstat123}

echo "Starting BunSqStat All-in-One..."
echo "Environment: $NODE_ENV"
echo "Redis: $REDIS_HOST:$REDIS_PORT"
echo "Logs: $ACCESS_LOG, $CACHE_LOG"

# Create logs directory
mkdir -p /app/logs

# Only create dummy log files if they don't exist (not mounted)
if [ ! -f "$ACCESS_LOG" ]; then
    echo "Creating dummy access log file: $ACCESS_LOG"
    touch "$ACCESS_LOG" 2>/dev/null || echo "Warning: Cannot create $ACCESS_LOG (likely mounted read-only)"
fi

if [ ! -f "$CACHE_LOG" ]; then
    echo "Creating dummy cache log file: $CACHE_LOG"
    touch "$CACHE_LOG" 2>/dev/null || echo "Warning: Cannot create $CACHE_LOG (likely mounted read-only)"
fi

# Configure Redis Stack password in config
if grep -q "^requirepass" /redis-stack.conf; then 
  sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" /redis-stack.conf;
else
  echo "requirepass $REDIS_PASSWORD" >> /redis-stack.conf;
fi

# Also set port if changed
if ! grep -q "^port $REDIS_PORT" /redis-stack.conf; then
  sed -i "s/^port .*/port $REDIS_PORT/" /redis-stack.conf || echo "port $REDIS_PORT" >> /redis-stack.conf;
fi

# Update supervisor config with current environment variables for backend
sed -i "s|environment=.*|environment=NODE_ENV=\"$NODE_ENV\",SQUID_HOST=\"$SQUID_HOST\",SQUID_PORT=\"$SQUID_PORT\",ACCESS_LOG=\"$ACCESS_LOG\",CACHE_LOG=\"$CACHE_LOG\",REDIS_HOST=\"$REDIS_HOST\",REDIS_PORT=\"$REDIS_PORT\",REDIS_PASSWORD=\"$REDIS_PASSWORD\"|g" /etc/supervisor/conf.d/supervisord.conf

echo "Starting Redis Stack, Backend and Frontend services..."

# Start supervisor to manage redis, backend and caddy
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf

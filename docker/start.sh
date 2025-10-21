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
export BACKEND_PORT=${BACKEND_PORT:-3000}

echo "Starting BunSqStat All-in-One..."
echo "Environment: $NODE_ENV"
echo "Redis: $REDIS_HOST:$REDIS_PORT"

# Create logs directory
mkdir -p /app/logs

# Always start with our default redis.conf
cp /app/docker/redis/redis.conf /tmp/redis_to_use.conf
REDIS_CONF_FILE="/tmp/redis_to_use.conf"

# If /redis-stack.conf exists (e.g. mounted by user), it overrides our default.
if [ -f "/redis-stack.conf" ]; then
    cp /redis-stack.conf $REDIS_CONF_FILE
fi

# Apply password and port to the chosen Redis config file
if grep -q "^requirepass" $REDIS_CONF_FILE; then
  sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" $REDIS_CONF_FILE;
else
  echo "requirepass $REDIS_PASSWORD" >> $REDIS_CONF_FILE;
fi

if ! grep -q "^port $REDIS_PORT" $REDIS_CONF_FILE; then
  sed -i "s/^port .*/port $REDIS_PORT/" $REDIS_CONF_FILE || echo "port $REDIS_PORT" >> $REDIS_CONF_FILE;
fi

# Point supervisord to the correct Redis configuration file
sed -i "s|command=redis-stack-server .*|command=/usr/bin/redis-server $REDIS_CONF_FILE|g" /etc/supervisor/conf.d/supervisord.conf

# Update supervisor config with current environment variables for backend
sed -i "s|environment=.*|environment=NODE_ENV=\"$NODE_ENV\",SQUID_HOST=\"$SQUID_HOST\",SQUID_PORT=\"$SQUID_PORT\",LOG_DIR=\"$LOG_DIR\",REDIS_HOST=\"$REDIS_HOST\",REDIS_PORT=\"$REDIS_PORT\",REDIS_PASSWORD=\"$REDIS_PASSWORD\"|g" /etc/supervisor/conf.d/supervisord.conf

echo "Starting Redis Stack, Backend and Frontend services..."

# Start supervisor to manage redis, backend and caddy
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf

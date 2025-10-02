#!/bin/bash

LOG_DIR="/home/fox/WebstormProjects/BunSqStat/logs"

# Fix permissions for all log files
sudo chmod 644 "$LOG_DIR"/access.log "$LOG_DIR"/cache.log 2>/dev/null || true
sudo find "$LOG_DIR" -name "access.log.*" -exec chmod 644 {} \;
sudo find "$LOG_DIR" -name "cache.log.*" -exec chmod 644 {} \;

echo "Fixed permissions for log files in $LOG_DIR"

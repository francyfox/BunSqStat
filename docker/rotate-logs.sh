#!/bin/bash

LOG_DIR="/home/fox/WebstormProjects/BunSqStat/logs"
MAX_SIZE=409600  # 400KB in bytes

check_and_rotate() {
    local logfile="$1"
    local container_name="$2"
    
    if [ -f "$logfile" ]; then
        size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)
        
        if [ "$size" -gt "$MAX_SIZE" ]; then
            echo "Rotating $logfile (size: $size bytes)"
            
            # Create rotated copy
            sudo cp "$logfile" "$logfile.$(date +%Y%m%d-%H%M%S)"
            
            # Make rotated file readable by group
            sudo chmod 644 "$logfile.$(date +%Y%m%d-%H%M%S)"
            sudo chgrp squidgroup "$logfile.$(date +%Y%m%d-%H%M%S)"
            
            # Truncate original file (copytruncate)
            sudo truncate -s 0 "$logfile"
            
            # Compress old files
            find "$(dirname "$logfile")" -name "$(basename "$logfile").20*" -mtime +1 -exec gzip {} \;
            
            # Remove old files (keep 7)
            find "$(dirname "$logfile")" -name "$(basename "$logfile").20*" -type f | sort -r | tail -n +8 | xargs rm -f
            
            # Notify container (optional)
            if [ -n "$container_name" ] && docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
                docker exec "$container_name" /usr/sbin/squid -k rotate 2>/dev/null || true
            fi
        fi
    fi
}

# Rotate logs
check_and_rotate "$LOG_DIR/access.log" "bunsqstat-squid-1"
check_and_rotate "$LOG_DIR/cache.log" "bunsqstat-squid-1"

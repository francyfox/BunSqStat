# Решение проблемы с правами доступа при ротации логов Squid

## Проблема
При включении ротации логов Squid (через `logrotate` или скрипты) возникают проблемы с правами доступа. Squid обычно пишет логи от имени пользователя `proxy` или `squid`, но ротация может создавать файлы с неправильными правами, что приводит к ошибкам чтения/записи. В контейнере Docker это усугубляется из-за различий в UID/GID хост-системы и контейнера.

В проекте BunSqStat логи хранятся в `/home/fox/WebstormProjects/BunSqStat/logs/`. Проблемы возникают при ротации `access.log` и `cache.log`.

## Решение
### 1. Настройка logrotate
Используйте конфигурацию `/docker/logrotate-squid.conf` как основу. Ключевой параметр — `su fox fox`, который указывает logrotate запускаться от имени пользователя `fox` (группа `fox`).

Пример конфигурации:
```
/home/fox/WebstormProjects/BunSqStat/logs/access.log {
    su fox fox
    size 400k
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}

 /home/fox/WebstormProjects/BunSqStat/logs/cache.log {
    su fox fox
    size 400k
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

- Установите cron-задачу: `crontab -e` и добавьте `@daily /usr/sbin/logrotate /path/to/logrotate-squid.conf`.
- `copytruncate`: Копирует лог и обрезает оригинал, сохраняя PID Squid.

### 2. Исправление прав на существующие логи
Запустите скрипт `/docker/fix-log-permissions.sh` после ротации или при проблемах:
```bash
#!/bin/bash
LOG_DIR="/home/fox/WebstormProjects/BunSqStat/logs"

# Fix permissions for all log files
sudo chmod 644 "$LOG_DIR"/access.log "$LOG_DIR"/cache.log 2>/dev/null || true
sudo find "$LOG_DIR" -name "access.log.*" -exec chmod 644 {} \;
sudo find "$LOG_DIR" -name "cache.log.*" -exec chmod 644 {} \;

echo "Fixed permissions for log files in $LOG_DIR"
```

Это устанавливает права 644 (чтение/запись для владельца, чтение для группы/других) на активные и ротированные файлы.

### 3. Кастомная ротация в Docker
Для контейнера используйте `/docker/rotate-logs.sh` (срабатывает при превышении 400KB):
```bash
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
```

- Добавьте вызов скрипта в `/docker/start.sh` или cron в контейнере.
- `chgrp squidgroup`: Устанавливает группу `squidgroup` для ротированных файлов, чтобы Squid мог писать.
- В `docker-compose.yml` убедитесь, что volumes монтируют `/var/log/squid` в `/logs` с UID 33 (proxy) или 112 (squid): `user: "33:33"`.

### 4. Настройка Squid
В `/docker/squid.conf` добавьте:
```
access_log /logs/access.log squid
cache_log /logs/cache.log
```
Укажите путь к логам в `/logs/` (монтируется из хоста).

### 5. Диагностика
- Проверьте права: `ls -la /logs/`.
- Логи logrotate: `/var/log/logrotate.log`.
- В Docker: `docker exec -it bunsqstat-squid-1 squid -k parse` для проверки конфига.

### Дополнительно
- Создайте группу `squidgroup` (если нет): `sudo groupadd squidgroup; sudo usermod -aG squidgroup fox`.
- Для продакшена используйте systemd-timer вместо cron для ротации.
- После изменений перезапустите контейнер: `docker-compose restart squid`.

Это решает большинство проблем с правами в BunSqStat.
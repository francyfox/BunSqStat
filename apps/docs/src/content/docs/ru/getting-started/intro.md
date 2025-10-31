---
title: Быстрый старт
description: Быстрый старт
---

**Требования:**

Сервер:
- x64
- Squid 3.2+ (поддержка UDP логов)
- ПАМЯТЬ: 190 МБ ОЗУ
- Nehalem (1-е поколение Core) или новее (используется базовая версия Bun для поддержки KVM)
- ХРАНИЛИЩЕ: 1,2 ГБ
- Docker

Веб-клиент:

- Google Chrome/Firefox последней версии. Edge и Safari могут содержать некоторые ошибки. Старые браузеры не поддерживаются.

Установите последнюю версию анализатора BunSqStat из

### Использование Docker Run (самый простой способ)

```bash
docker run -d \
  --name bunsqstat \
  -p 80:80 \
  -e SQUID_LISTENERS=0.0.0.0:5140,0.0.0.0:5141,... \
  ghcr.io/francyfox/bunsqstat:latest
```

### Использование Docker Compose

```yaml
services:
    bunsqstat_client:
      image: ghcr.io/francyfox/bunsqstat:latest
      container_name: bunsqstat-client
      restart: unless-stopped
      env:
        SQUID_LISTENERS: "0.0.0.0:5140,0.0.0.0:5141,..."
      ports:
        - "8078:80" # Веб-интерфейс
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost/api/health"]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 30s
      networks:
        - squid-internal
```

Все логи находятся в директории `app/logs`.

Для работы необходимо открыть логи доступа udp на squid. Добавьте эту строку в файл `squid.conf`.

```text
access_log udp://your_bunsqstat_ip:5140 squid
```

Если вы работаете со squid в одном стеке, вы можете указать имя контейнера, например `udp://bunsqstat_client:5140`. Но если вы работаете
со многими серверами squid, вы можете установить macvlan (локальный IP). В итоге выберите своего пользователя squid. По умолчанию это `squid`.

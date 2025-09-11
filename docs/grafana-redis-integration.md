# 📊 Интеграция BunSqStat с Grafana через Redis

> **Рекомендуемый способ интеграции для получения максимальной производительности и простоты настройки**

## 🎯 Обзор

Интеграция через Redis Data Source позволяет Grafana напрямую запрашивать данные из Redis, где BunSqStat хранит проанализированные логи Squid. Это обеспечивает:

- ⚡ **Минимальную задержку** - прямой доступ к данным
- 🚀 **Высокую производительность** - без промежуточных API
- 🔍 **Мощные возможности поиска** - используется RediSearch
- 📈 **Real-time метрики** - данные обновляются в режиме реального времени

## 🏗️ Архитектура интеграции

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Squid Logs    │───▶│   BunSqStat      │───▶│   Redis Stack   │
│                 │    │   (Парсер)       │    │   + RediSearch  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │     Grafana     │
                                               │  Redis Plugin   │
                                               └─────────────────┘
```

## 🛠️ Необходимые компоненты

### 1. Redis Data Source Plugin для Grafana
```bash
# Установка через Docker
docker run -d \
  --name grafana \
  -p 3001:3000 \
  -e "GF_INSTALL_PLUGINS=redis-datasource" \
  grafana/grafana:latest
```

### 2. Открытие Redis порта в BunSqStat
Убедитесь, что Redis доступен для Grafana:

```yaml
# docker-compose.yml
services:
  bunsqstat:
    image: francyfox/bunsqstat:latest
    ports:
      - "80:80"
      - "6379:6379"  # Открываем Redis порт
    environment:
      - REDIS_PASSWORD=your-secure-password
```

## ⚙️ Настройка Data Source в Grafana

### 1. Добавление Redis Data Source

1. Откройте Grafana: `http://localhost:3001`
2. Перейдите в **Configuration** → **Data Sources**
3. Нажмите **Add data source**
4. Выберите **Redis**

### 2. Конфигурация подключения

```
Address: bunsqstat:6379
Database: 0
Password: your-secure-password
Timeout: 10s
Pool Size: 5
```

### 3. Автоматическая настройка через Provisioning

Создайте файл конфигурации:

```yaml
# grafana/provisioning/datasources/redis.yml
apiVersion: 1
datasources:
  - name: BunSqStat Redis
    type: redis-datasource
    access: proxy
    url: redis://bunsqstat:6379
    database: 0
    jsonData:
      client: standalone
      poolSize: 5
      timeout: 10
      pingInterval: 0
      pipelineWindow: 0
    secureJsonData:
      password: "your-secure-password"
```

## 📊 Структура данных в Redis

BunSqStat сохраняет данные логов в следующем формате:

### Ключи данных
```
log:1726045200.123    # timestamp как ключ
log:1726045201.456
log:1726045202.789
...
```

### Поля каждой записи
```
timestamp: "1726045200.123"     # NUMERIC SORTABLE
duration: "150"                 # NUMERIC SORTABLE  
clientIP: "192.168.1.100"       # TAG SORTABLE
resultType: "TCP_HIT"           # TAG SORTABLE
resultStatus: "200"             # NUMERIC SORTABLE
bytes: "2048"                   # NUMERIC SORTABLE
method: "GET"                   # TAG SORTABLE
url: "http://example.com/page"  # TEXT
user: "john.doe"                # TEXT
hierarchyType: "DIRECT"         # TAG SORTABLE
hierarchyHost: "127.0.0.1"      # TEXT
contentType: "text/html"        # TEXT
```

### Индекс для поиска
```
Индекс: log_idx
Префикс: log:*
```

## 🔍 Запросы для получения метрик

### 1. Requests Per Second (RPS)
```redis
# Подсчет запросов за последние 5 минут
FT.SEARCH log_idx @timestamp:[{now-5m} {now}] LIMIT 0 0

# Команда для Grafana Redis Plugin:
Command: FT.SEARCH
Query: log_idx @timestamp:[${__from:date:X} ${__to:date:X}] LIMIT 0 0
```

### 2. Hit Ratio (Коэффициент попаданий)
```redis
# Запросы с HIT
FT.SEARCH log_idx (@timestamp:[{from} {to}] @resultType:*HIT*) LIMIT 0 0

# Все запросы
FT.SEARCH log_idx @timestamp:[{from} {to}] LIMIT 0 0

# Для Grafana (два отдельных запроса):
# Query A (Hits):
FT.SEARCH log_idx (@timestamp:[${__from:date:X} ${__to:date:X}] @resultType:*HIT*) LIMIT 0 0

# Query B (Total):
FT.SEARCH log_idx @timestamp:[${__from:date:X} ${__to:date:X}] LIMIT 0 0
```

### 3. Bandwidth Usage (Использование трафика)
```redis
# Агрегация байтов за период
FT.AGGREGATE log_idx @timestamp:[{from} {to}] 
  GROUPBY 1 @timestamp 
  REDUCE SUM 1 @bytes AS total_bytes
  SORTBY 1 @timestamp ASC

# Для Grafana:
FT.AGGREGATE log_idx @timestamp:[${__from:date:X} ${__to:date:X}] GROUPBY 1 @timestamp REDUCE SUM 1 @bytes AS total_bytes SORTBY 1 @timestamp ASC
```

### 4. Top Users (Топ пользователи)
```redis
# Топ 10 пользователей по количеству запросов
FT.AGGREGATE log_idx @timestamp:[{from} {to}] 
  GROUPBY 1 @user 
  REDUCE COUNT 0 AS request_count
  SORTBY 2 @request_count DESC
  LIMIT 0 10

# Для Grafana:
FT.AGGREGATE log_idx @timestamp:[${__from:date:X} ${__to:date:X}] GROUPBY 1 @user REDUCE COUNT 0 AS request_count SORTBY 2 @request_count DESC LIMIT 0 10
```

### 5. Response Time Distribution
```redis
# Распределение времени ответа
FT.AGGREGATE log_idx @timestamp:[{from} {to}] 
  APPLY "floor(@duration/100)*100" AS response_bucket
  GROUPBY 1 @response_bucket 
  REDUCE COUNT 0 AS count
  SORTBY 2 @response_bucket ASC

# Для Grafana:
FT.AGGREGATE log_idx @timestamp:[${__from:date:X} ${__to:date:X}] APPLY "floor(@duration/100)*100" AS response_bucket GROUPBY 1 @response_bucket REDUCE COUNT 0 AS count SORTBY 2 @response_bucket ASC
```

### 6. Status Code Distribution
```redis
# Распределение кодов ответа
FT.AGGREGATE log_idx @timestamp:[{from} {to}] 
  GROUPBY 1 @resultStatus 
  REDUCE COUNT 0 AS count
  SORTBY 2 @count DESC

# Для Grafana:
FT.AGGREGATE log_idx @timestamp:[${__from:date:X} ${__to:date:X}] GROUPBY 1 @resultStatus REDUCE COUNT 0 AS count SORTBY 2 @count DESC
```

## 📈 Готовые Grafana панели

### 1. Single Stat - Requests Per Second
```json
{
  "type": "stat",
  "title": "Requests Per Second",
  "targets": [
    {
      "datasource": "BunSqStat Redis",
      "command": "FT.SEARCH",
      "query": "log_idx @timestamp:[${__from:date:X} ${__to:date:X}] LIMIT 0 0",
      "refId": "A"
    }
  ],
  "transformations": [
    {
      "id": "calculateField",
      "options": {
        "alias": "RPS",
        "mode": "binary",
        "reduce": {
          "reducer": "lastNotNull"
        },
        "binary": {
          "left": "Value",
          "operator": "/",
          "right": "${__range_s}"
        }
      }
    }
  ]
}
```

### 2. Gauge - Hit Ratio
```json
{
  "type": "gauge",
  "title": "Cache Hit Ratio",
  "targets": [
    {
      "datasource": "BunSqStat Redis",
      "command": "FT.SEARCH",
      "query": "log_idx (@timestamp:[${__from:date:X} ${__to:date:X}] @resultType:*HIT*) LIMIT 0 0",
      "refId": "HITS"
    },
    {
      "datasource": "BunSqStat Redis", 
      "command": "FT.SEARCH",
      "query": "log_idx @timestamp:[${__from:date:X} ${__to:date:X}] LIMIT 0 0",
      "refId": "TOTAL"
    }
  ],
  "transformations": [
    {
      "id": "calculateField",
      "options": {
        "alias": "Hit Ratio %",
        "mode": "binary",
        "binary": {
          "left": "HITS",
          "operator": "/",
          "right": "TOTAL"
        }
      }
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "percentunit",
      "max": 1,
      "min": 0
    }
  }
}
```

### 3. Time Series - Bandwidth Usage
```json
{
  "type": "timeseries",
  "title": "Bandwidth Usage (MB/s)",
  "targets": [
    {
      "datasource": "BunSqStat Redis",
      "command": "FT.AGGREGATE",
      "query": "log_idx @timestamp:[${__from:date:X} ${__to:date:X}] APPLY \"floor(@timestamp/${__interval_ms:date:ms})*${__interval_ms:date:ms}\" AS time_bucket GROUPBY 1 @time_bucket REDUCE SUM 1 @bytes AS total_bytes SORTBY 1 @time_bucket ASC",
      "refId": "A"
    }
  ],
  "transformations": [
    {
      "id": "convertFieldType",
      "options": {
        "conversions": [
          {
            "destinationType": "time",
            "targetField": "time_bucket"
          }
        ]
      }
    },
    {
      "id": "calculateField",
      "options": {
        "alias": "MB/s",
        "mode": "binary",
        "binary": {
          "left": "total_bytes",
          "operator": "/",
          "right": "1048576"
        }
      }
    }
  ]
}
```

### 4. Table - Top Users
```json
{
  "type": "table",
  "title": "Top Users by Requests",
  "targets": [
    {
      "datasource": "BunSqStat Redis",
      "command": "FT.AGGREGATE", 
      "query": "log_idx @timestamp:[${__from:date:X} ${__to:date:X}] GROUPBY 1 @user REDUCE COUNT 0 AS request_count REDUCE SUM 1 @bytes AS total_bytes SORTBY 2 @request_count DESC LIMIT 0 10",
      "refId": "A"
    }
  ],
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": {},
        "indexByName": {
          "user": 0,
          "request_count": 1, 
          "total_bytes": 2
        },
        "renameByName": {
          "user": "User",
          "request_count": "Requests",
          "total_bytes": "Bytes"
        }
      }
    }
  ]
}
```

## 🐳 Docker Compose для полной интеграции

```yaml
# docker-compose.grafana-redis.yml
version: '3.8'

services:
  bunsqstat:
    image: francyfox/bunsqstat:latest
    container_name: bunsqstat
    restart: unless-stopped
    ports:
      - "80:80"
      - "6379:6379"  # Redis для Grafana
    environment:
      - NODE_ENV=production
      - REDIS_PASSWORD=bunsqstat123
      - SQUID_HOST=127.0.0.1
      - SQUID_PORT=3128
    volumes:
      - /var/log/squid/access.log:/app/logs/access.log:ro
      - /var/log/squid/cache.log:/app/logs/cache.log:ro

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=redis-datasource
      - GF_SECURITY_ALLOW_EMBEDDING=true
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-storage:/var/lib/grafana
    depends_on:
      - bunsqstat

volumes:
  grafana-storage:
```

## 📁 Структура конфигурационных файлов

```
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── redis.yml
│   └── dashboards/
│       └── dashboard.yml
└── dashboards/
    └── bunsqstat-dashboard.json
```

### Provisioning dashboards:
```yaml
# grafana/provisioning/dashboards/dashboard.yml
apiVersion: 1
providers:
  - name: 'BunSqStat'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

## 🚀 Быстрый старт

1. **Запуск с интеграцией Grafana**:
```bash
# Скачайте файлы конфигурации
curl -L https://raw.githubusercontent.com/your-repo/BunSqStat/main/examples/grafana/docker-compose.grafana-redis.yml -o docker-compose.yml

# Создайте структуру папок
mkdir -p grafana/provisioning/{datasources,dashboards}
mkdir -p grafana/dashboards

# Запустите сервисы
docker-compose up -d
```

2. **Доступ к дашбордам**:
- BunSqStat Web UI: `http://localhost`
- Grafana: `http://localhost:3001` (admin/admin)

3. **Импорт готового дашборда**:
   - Откройте Grafana → Dashboards → Import
   - Загрузите `bunsqstat-dashboard.json`
   - Выберите Redis data source

## 🔧 Troubleshooting

### Проблема: Grafana не может подключиться к Redis
**Решение**:
```bash
# Проверьте доступность Redis
docker exec grafana redis-cli -h bunsqstat -p 6379 -a "bunsqstat123" ping

# Убедитесь что порт 6379 открыт в BunSqStat
docker port bunsqstat
```

### Проблема: Нет данных в панелях
**Решение**:
```bash
# Проверьте наличие данных в Redis
docker exec bunsqstat redis-cli -a "bunsqstat123" FT.SEARCH log_idx "*" LIMIT 0 5

# Убедитесь что логи Squid читаются
docker logs bunsqstat | grep "parsed"
```

### Проблема: Медленные запросы
**Решение**:
- Используйте более короткие временные интервалы
- Добавьте дополнительные фильтры в запросы
- Увеличьте `poolSize` в настройках data source

## 📚 Дополнительные ресурсы

- [Redis Data Source Documentation](https://grafana.com/grafana/plugins/redis-datasource/)
- [RediSearch Query Syntax](https://redis.io/docs/interact/search-and-query/query/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)
- [BunSqStat API Documentation](./api.md)

## 🤝 Поддержка

Если у вас возникли проблемы с интеграцией:

1. Проверьте [Issues](../../../issues) проекта
2. Создайте новый Issue с тегом `grafana-integration`
3. Приложите логи Docker контейнеров

---

✨ **С интеграцией Grafana ваш BunSqStat превратится в мощную платформу аналитики Squid логов!**

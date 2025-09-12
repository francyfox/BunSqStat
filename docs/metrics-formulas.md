# Формулы для расчета метрик из Squid access логов

## Доступные поля в логах:
- `timestamp` - время в миллисекундах
- `duration` - длительность запроса в миллисекундах  
- `bytes` - размер ответа в байтах
- `clientIP`, `user`, `resultStatus`, `resultType`

## Формулы расчета скорости

### Средняя скорость
```
averageSpeed = totalBytes / totalTime * 1000 / 1024  // KB/s

где:
totalBytes = sum(bytes[i])  // сумма всех байтов
totalTime = sum(duration[i])  // сумма всех длительностей в мс
```

### Текущая скорость (за последние N запросов)
```
currentSpeed = recentBytes / recentTime * 1000 / 1024  // KB/s

где:
recentBytes = sum(bytes[last_N_requests])
recentTime = sum(duration[last_N_requests])
N = 10-50 последних запросов
```

### Альтернативный расчет текущей скорости (за временной интервал)
```
currentSpeed = bytesInPeriod / periodInSeconds / 1024  // KB/s

где:
periodInSeconds = (maxTimestamp - minTimestamp) / 1000
bytesInPeriod = sum(bytes для записей в периоде)
```

## Дополнительные полезные метрики

### 1. Requests per Second (RPS)

#### Базовая формула
```
rps = totalRequests / timeRangeInSeconds

где:
totalRequests = count(всех записей в периоде)
timeRangeInSeconds = (maxTimestamp - minTimestamp) / 1000
```

#### Формула для реального времени (скользящее окно)
```
realtimeRPS = requestsInWindow / windowSizeInSeconds

где:
requestsInWindow = count(записей за последние N секунд)
windowSizeInSeconds = размер окна (например, 60 сек)
```

#### RediSearch запрос для RPS
```redis
# Подсчет запросов в временном диапазоне
FT.SEARCH log_idx @timestamp:[startTime endTime] LIMIT 0 0

# Результат: [totalCount, ...]
rps = totalCount / ((endTime - startTime) / 1000)
```

### 2. Cache Hit Ratio (коэффициент попаданий в кэш)


#### Альтернативные метрики для Squid 6+
```
# Вместо Hit Ratio можно использовать:

# 1. Процент успешных запросов
successRate = count(status 2xx) / totalRequests * 100%

# 2. Процент ошибок
errorRate = count(status >= 400) / totalRequests * 100%

# 3. Процент перенаправлений
redirectRate = count(status 3xx) / totalRequests * 100%

# 4. Процент быстрых ответов (по времени отклика)
fastResponseRate = count(duration < 100ms) / totalRequests * 100%

FT.AGGREGATE log_idx "*" APPLY "floor(@resultStatus/100)*100" AS status_class GROUPBY 1 @status_class REDUCE COUNT 0 AS count SORTBY 2 @status_class ASC
```

#### RediSearch запросы для Hit Ratio
```redis
# Подсчет HIT запросов
FT.SEARCH log_idx (@timestamp:[startTime endTime] @resultType:*HIT*) LIMIT 0 0

# Подсчет всех запросов
FT.SEARCH log_idx @timestamp:[startTime endTime] LIMIT 0 0

# Расчет: hitRatio = (hitCount / totalCount) * 100
```

#### Формула Hit Ratio по времени (временные интервалы)
```
hitRatioByTime[i] = (hitsInInterval[i] / requestsInInterval[i]) * 100%

где i = временной интервал (например, каждые 5 минут)
```

### 3. Bandwidth (Пропускная способность)

#### Общая пропускная способность
```
bandwidth = totalBytes / timeRangeInSeconds / 1024 / 1024  // MB/s

где:
totalBytes = sum(bytes для всех записей в периоде)
timeRangeInSeconds = (maxTimestamp - minTimestamp) / 1000
```

#### Пропускная способность по интервалам
```
bandwidthByInterval[i] = bytesInInterval[i] / intervalDurationInSeconds / 1024  // KB/s

где:
bytesInInterval[i] = sum(bytes для записей в интервале i)
intervalDurationInSeconds = продолжительность интервала
```

#### Входящий vs исходящий трафик
```
# Обычно в Squid логах bytes = исходящий трафик
outboundBandwidth = sum(bytes) / timeRange / 1024  // KB/s

# Входящий трафик можно оценить (приблизительно)
inboundBandwidth = outboundBandwidth * compressionRatio
кде compressionRatio ≈ 0.7-0.9 (зависит от типа контента)
```

#### RediSearch запрос для Bandwidth
```redis
# Агрегация байтов по временным интервалам
FT.AGGREGATE log_idx @timestamp:[startTime endTime]
  APPLY "floor(@timestamp/intervalMs)*intervalMs" AS time_bucket
  GROUPBY 1 @time_bucket
  REDUCE SUM 1 @bytes AS total_bytes
  SORTBY 1 @time_bucket ASC

# где intervalMs = размер интервала в миллисекундах
```

#### Peak Bandwidth (пиковая нагрузка)
```
peakBandwidth = max(bandwidthByInterval[i]) для всех i
avgBandwidth = mean(bandwidthByInterval[i]) для всех i
peakToAvgRatio = peakBandwidth / avgBandwidth
```

### 4. Top Users (Топ пользователи)

#### Топ пользователи по количеству запросов
```
userRequestCount[user] = count(записей где user = конкретный_пользователь)

сортировка по убыванию userRequestCount
```

#### Топ пользователи по трафику
```
userBandwidth[user] = sum(bytes где user = конкретный_пользователь) / timeRange

сортировка по убыванию userBandwidth
```

#### Комплексная метрика активности пользователя
```
userActivity[user] = (
  requestWeight * normalizedRequests[user] + 
  bandwidthWeight * normalizedBandwidth[user] +
  timeWeight * normalizedActiveTime[user]
) / (requestWeight + bandwidthWeight + timeWeight)

где:
normalizedRequests[user] = userRequests[user] / maxUserRequests
normalizedBandwidth[user] = userBandwidth[user] / maxUserBandwidth
normalizedActiveTime[user] = userActiveTime[user] / totalTime
```

#### RediSearch запросы для Top Users
```redis
# Топ пользователи по запросам
FT.AGGREGATE log_idx @timestamp:[startTime endTime]
  GROUPBY 1 @user
  REDUCE COUNT 0 AS request_count
  REDUCE SUM 1 @bytes AS total_bytes
  REDUCE MIN 1 @timestamp AS first_request
  REDUCE MAX 1 @timestamp AS last_request
  SORTBY 2 @request_count DESC
  LIMIT 0 topN
```

#### Формула для определения "проблемных" пользователей
```
userScore[user] = (
  errorRate[user] * 2 +        // процент ошибок (статус >= 400)
  heavyUsage[user] * 1.5 +     // превышение среднего трафика
  peakActivity[user] * 1        // активность в пиковые часы
)

где:
errorRate[user] = count(статус >= 400) / totalRequests[user] * 100%
heavyUsage[user] = userBandwidth[user] / avgBandwidth - 1  // превышение средней
peakActivity[user] = requestsInPeakHours[user] / totalRequests[user] * 100%
```

## Временные агрегации

### Группировка по временным интервалам
```
# 5-минутные интервалы
timeBucket = floor(timestamp / 300000) * 300000

# Часовые интервалы  
timeBucket = floor(timestamp / 3600000) * 3600000

# Дневные интервалы
timeBucket = floor(timestamp / 86400000) * 86400000
```

### Скользящие средние
```
movingAverage[i] = sum(values[i-window:i]) / window

где:
window = размер окна (например, 10 последних значений)
values = массив значений метрики
```

## Формулы для алертов

### Превышение порогов
```
# RPS превышает норму
rpsAlert = currentRPS > (avgRPS * alertThreshold)
где alertThreshold = 1.5-2.0

# Hit Ratio слишком низкий
hitRatioAlert = currentHitRatio < minAcceptableHitRatio
где minAcceptableHitRatio = 70-80%

# Bandwidth превышает лимит
bandwidthAlert = currentBandwidth > maxAllowedBandwidth
```

### Аномалия в поведении
```
anomalyScore = (
  abs(currentValue - movingAverage) / standardDeviation
)

аномалия обнаружена если anomalyScore > 2.0-3.0
```

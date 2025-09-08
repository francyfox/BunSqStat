# Тестирование симулятора логов BunSqStat

Этот набор тестов симулирует реальную работу Squid прокси-сервера для проверки обновления данных в Redis в реальном времени.

## Файлы

- `log-generator.ts` - Генератор реалистичных строк логов Squid
- `log-simulator.ts` - Основной симулятор активности с проверкой Redis
- `config.json` - Конфигурация параметров тестирования

## Установка

```bash
# Убедитесь что установлены зависимости
bun install

# Убедитесь что Redis запущен
docker ps | grep redis
```

## Использование

### Быстрый запуск с заглушкой

```bash
# Запуск симулятора с функцией-заглушкой
bun run test/log-simulator.ts
```

### Использование с вашей функцией проверки

```typescript
import { runLogSimulatorTest } from './test/log-simulator';

// Ваша функция проверки Redis
async function myRedisCheckFunction(): Promise<boolean> {
  // Здесь ваша логика проверки Redis
  // Например: проверка количества записей, валидация индексов и т.д.
  return true;
}

// Запуск теста
await runLogSimulatorTest(myRedisCheckFunction);
```

### Ручная настройка

```typescript
import { LogSimulator } from './test/log-simulator';

const config = {
  logFilePath: process.env.ACCESS_LOG || '/tmp/access.log',
  redis: { host: 'localhost', port: 6379, password: '123' },
  scenarios: {
    normal: { intervalMs: 5000, burstSize: 3 },
    peak: { intervalMs: 2000, burstSize: 10 },
    heavy: { intervalMs: 1000, burstSize: 20 },
  },
  duration: 120, // 2 минуты
  validateRedis: true,
};

const simulator = new LogSimulator(config);
await simulator.runTest();
```

## Сценарии тестирования

### Normal (Обычная нагрузка)
- **Интервал**: 5 секунд
- **Размер порции**: 3 записи
- **Использование**: Имитация обычного трафика

### Peak (Пиковая нагрузка)  
- **Интервал**: 2 секунды
- **Размер порции**: 10 записей
- **Использование**: Имитация активного периода

### Heavy (Тяжелая нагрузка)
- **Интервал**: 1 секунда  
- **Размер порции**: 20 записей
- **Использование**: Стресс-тестирование системы

## Формат логов Squid

Генератор создает логи в формате:
```
timestamp duration clientIP resultType/resultStatus bytes method url user hierarchyType/hierarchyHost contentType
```

Пример:
```
1756975387.123 74 192.168.10.41 TCP_MISS/200 2191 GET https://example.com/path sgolota@TP.OIL HIER_DIRECT/216.239.38.120 text/javascript
```

## Что проверяется

1. **Генерация реалистичных данных** - использование faker для создания правдоподобных IP, URL, user-agents
2. **Обновление файла в реальном времени** - добавление новых строк с заданным интервалом
3. **Мониторинг chokidar** - файл должен отслеживаться и обрабатываться автоматически
4. **Индексация в Redis** - проверка что новые данные корректно попадают в RediSearch
5. **Производительность** - тестирование различных нагрузок

## Переменные окружения

- `ACCESS_LOG` - путь к файлу логов (по умолчанию `/tmp/access.log`)
- Другие переменные из `.env` файла проекта

## Примеры использования

### Только генерация данных
```typescript
import { SquidLogGenerator } from './test/log-generator';

const generator = new SquidLogGenerator();
const logs = generator.generateLogLines(100, 3600); // 100 записей за час
console.log(logs);
```

### Проверка конкретного сценария
```typescript
import { LogSimulator } from './test/log-simulator';

const simulator = new LogSimulator(config);
await simulator.runScenario('peak', 30000); // 30 секунд пиковой нагрузки
```

## Остановка

- **Ctrl+C** для graceful shutdown
- Или программная остановка: `await simulator.stop()`

## Логи и отладка

Симулятор выводит детальную информацию о:
- Количестве сгенерированных записей
- Состоянии сценариев 
- Проверках Redis
- Ошибках подключения или записи

## Устранение неполадок

1. **Redis недоступен**: Проверьте что контейнер запущен и доступен по порту 6379
2. **Файл логов недоступен**: Убедитесь что у процесса есть права записи в целевую директорию  
3. **Медленная обработка**: Увеличьте задержки между проверками или уменьшите размеры порций

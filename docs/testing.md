# [WIP]🧪 Testing Guide

This comprehensive guide covers all aspects of testing in BunSqStat, from unit tests to integration testing and log simulation.

## Overview

BunSqStat uses a modern testing stack built around Bun's native test runner:

- **Test Runner**: `bun:test` (built into Bun)
- **Assertions**: Native Bun assertions + custom matchers
- **Mocking**: Custom Redis mock + test utilities
- **Coverage**: Built-in Bun coverage reporting
- **CI/CD**: GitHub Actions integration

## Test Structure

```
apps/server/test/
├── unit/                    # Unit tests
│   ├── log-generator.test.ts
│   ├── log-simulator.test.ts
│   └── utils/
├── integration/             # Integration tests
│   ├── search.test.ts
│   ├── redis.test.ts
│   └── api.test.ts
├── fixtures/                # Test data
│   ├── sample-logs.txt
│   └── config.json
├── mocks/                   # Test mocks
│   └── redis-client.ts
└── setup.ts                 # Test setup
```

## Running Tests

### Basic Commands

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode (re-run on file changes)
bun run test:watch

# Run specific test file
bun test apps/server/test/unit/log-generator.test.ts

# Run tests matching pattern
bun test --grep "search"

# Verbose output
bun test --verbose
```

### Environment-Specific Tests

```bash
# Development tests
NODE_ENV=development bun test

# Test environment (uses test DB)
NODE_ENV=test bun test

# Integration tests only
bun run test:integration

# Unit tests only
bun run test:unit
```

### NPM Scripts

```bash
# Available in package.json
bun run test:unit           # Unit tests only
bun run test:integration    # Integration tests only
bun run test:coverage       # With coverage report
bun run test:watch          # Watch mode
bun run test:generator      # Log generator tests
bun run test:simulator      # Log simulator tests
```

## Unit Testing

### Log Generator Tests

```typescript
// apps/server/test/unit/log-generator.test.ts
import { test, expect, describe } from 'bun:test'
import { LogGenerator } from '../../src/lib/log-generator'

describe('LogGenerator', () => {
  test('should generate valid squid log entry', () => {
    const generator = new LogGenerator()
    const logEntry = generator.generateSquidLog()
    
    expect(logEntry).toMatch(/^\\d+\\.\\d+\\s+\\d+\\s+\\S+\\s+\\S+\\/\\d+\\s+\\d+\\s+\\S+\\s+\\S+/)
    expect(logEntry.split(' ')).toHaveLength(10)
  })

  test('should generate logs with specified timestamp range', () => {
    const generator = new LogGenerator()
    const startTime = Date.now()
    const endTime = startTime + 3600000 // +1 hour
    
    const logs = generator.generateBatch(100, { startTime, endTime })
    
    logs.forEach(log => {
      const timestamp = parseFloat(log.split(' ')[0]) * 1000
      expect(timestamp).toBeGreaterThanOrEqual(startTime)
      expect(timestamp).toBeLessThanOrEqual(endTime)
    })
  })

  test('should generate realistic IP addresses', () => {
    const generator = new LogGenerator()
    const logs = generator.generateBatch(100)
    
    const ips = logs.map(log => log.split(' ')[2])
    ips.forEach(ip => {
      expect(ip).toMatch(/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/)
    })
  })
})
```

### Log Simulator Tests

```typescript
// apps/server/test/unit/log-simulator.test.ts
import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { LogSimulator } from '../../src/lib/log-simulator'
import { MockRedisClient } from '../mocks/redis-client'
import fs from 'fs/promises'

describe('LogSimulator', () => {
  let simulator: LogSimulator
  let mockRedis: MockRedisClient
  const testLogPath = './test/fixtures/test-simulation.log'

  beforeEach(async () => {
    mockRedis = new MockRedisClient()
    simulator = new LogSimulator({
      logFile: testLogPath,
      redis: mockRedis as any
    })
    
    // Clean up any existing test file
    try {
      await fs.unlink(testLogPath)
    } catch {}
  })

  afterEach(async () => {
    simulator.stop()
    try {
      await fs.unlink(testLogPath)
    } catch {}
  })

  test('should create log file if it does not exist', async () => {
    await simulator.start()
    
    const fileExists = await fs.access(testLogPath)
      .then(() => true)
      .catch(() => false)
    
    expect(fileExists).toBe(true)
  })

  test('should append logs to existing file', async () => {
    // Create initial log file
    await fs.writeFile(testLogPath, 'initial log entry\\n')
    
    await simulator.appendLogs(['new log entry'])
    
    const content = await fs.readFile(testLogPath, 'utf-8')
    expect(content).toContain('initial log entry')
    expect(content).toContain('new log entry')
  })

  test('should index logs in Redis', async () => {
    const testLogs = [
      '1640995200.123 100 192.168.1.1 TCP_HIT/200 1024 GET http://example.com/test alice DIRECT/- text/html'
    ]

    await simulator.appendLogs(testLogs)

    expect(mockRedis.hset).toHaveBeenCalledWith(
      expect.stringMatching(/^log:.*$/),
      expect.objectContaining({
        timestamp: expect.any(String),
        clientIP: '192.168.1.1',
        resultStatus: '200'
      })
    )
  })
})
```

## Integration Testing

### Redis Search Tests

```typescript
// apps/server/test/integration/search.test.ts
import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
import { createRedisConnection } from '../../src/lib/redis'
import { SearchService } from '../../src/services/search'

describe('Redis Search Integration', () => {
  let redis: any
  let searchService: SearchService

  beforeAll(async () => {
    redis = createRedisConnection({
      host: 'localhost',
      port: 6379,
      db: 15 // Use test database
    })
    searchService = new SearchService(redis)
    
    // Create test index
    await searchService.createIndex()
  })

  afterAll(async () => {
    // Clean up test data
    await redis.flushdb()
    await redis.quit()
  })

  test('should create search index successfully', async () => {
    const indexInfo = await redis.call('FT.INFO', 'log_idx')
    expect(indexInfo).toBeDefined()
  })

  test('should index and search log entries', async () => {
    const testLog = {
      id: 'test:1',
      timestamp: Date.now(),
      clientIP: '192.168.1.1',
      user: 'alice',
      method: 'GET',
      url: 'http://example.com',
      resultStatus: 200,
      size: 1024
    }

    await searchService.indexLog(testLog)
    
    const results = await searchService.search('@user:alice')
    expect(results.total).toBe(1)
    expect(results.documents[0]).toMatchObject({
      user: 'alice',
      clientIP: '192.168.1.1'
    })
  })

  test('should handle complex search queries', async () => {
    // Index multiple test logs
    const logs = [
      { id: 'test:2', user: 'alice', method: 'GET', resultStatus: 200 },
      { id: 'test:3', user: 'bob', method: 'POST', resultStatus: 404 },
      { id: 'test:4', user: 'alice', method: 'POST', resultStatus: 500 }
    ]

    for (const log of logs) {
      await searchService.indexLog({ timestamp: Date.now(), ...log })
    }

    // Complex query: Alice's failed requests
    const results = await searchService.search('@user:alice @resultStatus:[400 599]')
    expect(results.total).toBe(1)
    expect(results.documents[0].resultStatus).toBe('500')
  })
})
```

### API Integration Tests

```typescript
// apps/server/test/integration/api.test.ts
import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/server'

describe('API Integration', () => {
  test('GET /health should return server status', async () => {
    const response = await app.handle(new Request('http://localhost:3001/health'))
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(Number)
    })
  })

  test('GET /api/search should return search results', async () => {
    const response = await app.handle(
      new Request('http://localhost:3001/api/search?q=@user:alice&limit=10')
    )
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      results: expect.any(Array),
      total: expect.any(Number),
      query: '@user:alice'
    })
  })

  test('POST /api/logs should accept log entries', async () => {
    const logEntry = {
      timestamp: Date.now(),
      clientIP: '192.168.1.1',
      user: 'testuser',
      method: 'GET',
      url: 'http://test.com',
      resultStatus: 200
    }

    const response = await app.handle(
      new Request('http://localhost:3001/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    )

    expect(response.status).toBe(201)
  })
})
```

## Test Mocks

### Redis Mock

```typescript
// apps/server/test/mocks/redis-client.ts
import { expect } from 'bun:test'

export class MockRedisClient {
  private data = new Map<string, any>()
  private hashData = new Map<string, Map<string, any>>()

  // Mock method tracking
  hset = expect.fn(async (key: string, fields: Record<string, any>) => {
    if (!this.hashData.has(key)) {
      this.hashData.set(key, new Map())
    }
    const hash = this.hashData.get(key)!
    for (const [field, value] of Object.entries(fields)) {
      hash.set(field, value)
    }
    return Object.keys(fields).length
  })

  hget = expect.fn(async (key: string, field: string) => {
    const hash = this.hashData.get(key)
    return hash?.get(field) || null
  })

  hgetall = expect.fn(async (key: string) => {
    const hash = this.hashData.get(key)
    if (!hash) return {}
    
    const result: Record<string, any> = {}
    hash.forEach((value, field) => {
      result[field] = value
    })
    return result
  })

  call = expect.fn(async (command: string, ...args: any[]) => {
    // Mock Redis Search commands
    switch (command) {
      case 'FT.CREATE':
        return 'OK'
      case 'FT.SEARCH':
        return [0] // No results by default
      case 'FT.INFO':
        return ['index_name', args[0]]
      default:
        return 'OK'
    }
  })

  set = expect.fn(async (key: string, value: any) => {
    this.data.set(key, value)
    return 'OK'
  })

  get = expect.fn(async (key: string) => {
    return this.data.get(key) || null
  })

  del = expect.fn(async (...keys: string[]) => {
    let count = 0
    keys.forEach(key => {
      if (this.data.delete(key)) count++
    })
    return count
  })

  flushall = expect.fn(async () => {
    this.data.clear()
    this.hashData.clear()
    return 'OK'
  })

  quit = expect.fn(async () => 'OK')

  // Helper methods for testing
  getCallCount(method: string): number {
    return (this as any)[method]?.mock?.calls?.length || 0
  }

  getLastCall(method: string): any[] {
    const calls = (this as any)[method]?.mock?.calls
    return calls?.[calls.length - 1] || []
  }

  reset(): void {
    this.data.clear()
    this.hashData.clear()
    // Reset all mock functions
    Object.getOwnPropertyNames(this).forEach(prop => {
      const value = (this as any)[prop]
      if (typeof value === 'function' && value.mock) {
        value.mockClear()
      }
    })
  }
}
```

## Test Data and Fixtures

### Sample Log Data

```typescript
// apps/server/test/fixtures/sample-logs.ts
export const sampleSquidLogs = [
  '1640995200.123 100 192.168.1.1 TCP_HIT/200 1024 GET http://example.com/page1 alice DIRECT/- text/html',
  '1640995201.456 250 10.0.0.1 TCP_MISS/404 512 GET http://example.com/missing bob DIRECT/- text/html',
  '1640995202.789 50 192.168.1.2 TCP_HIT/200 2048 POST http://api.example.com/data charlie DIRECT/- application/json'
]

export const sampleLogObjects = [
  {
    timestamp: 1640995200123,
    duration: 100,
    clientIP: '192.168.1.1',
    resultStatus: 200,
    size: 1024,
    method: 'GET',
    url: 'http://example.com/page1',
    user: 'alice',
    hierarchy: 'DIRECT/-',
    contentType: 'text/html'
  },
  // ... more sample data
]
```

### Test Configuration

```json
// apps/server/test/fixtures/test-config.json
{
  "scenarios": {
    "light": {
      "duration": 5000,
      "interval": 1000,
      "batchSize": 10,
      "userCount": 5
    },
    "heavy": {
      "duration": 10000,
      "interval": 500,
      "batchSize": 50,
      "userCount": 20
    }
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "db": 15
  }
}
```

## Performance Testing

### Load Testing with Simulated Data

```typescript
// apps/server/test/integration/performance.test.ts
import { test, expect, describe } from 'bun:test'
import { LogSimulator } from '../../src/lib/log-simulator'
import { performance } from 'perf_hooks'

describe('Performance Tests', () => {
  test('should handle high-volume log ingestion', async () => {
    const simulator = new LogSimulator()
    const startTime = performance.now()
    
    // Generate 10,000 log entries
    const logs = simulator.generateBatch(10000)
    
    const generationTime = performance.now() - startTime
    expect(generationTime).toBeLessThan(1000) // Should take less than 1 second
    expect(logs).toHaveLength(10000)
  })

  test('should search efficiently with large dataset', async () => {
    // This would require actual Redis instance
    // Index 100,000 log entries and measure search performance
    // Implementation depends on your specific performance requirements
  })
})
```

### Memory Usage Testing

```typescript
// Monitor memory usage during tests
const getMemoryUsage = () => {
  const usage = process.memoryUsage()
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024)
  }
}

test('should not leak memory during log processing', async () => {
  const initialMemory = getMemoryUsage()
  
  // Process many logs
  for (let i = 0; i < 1000; i++) {
    const logs = generator.generateBatch(100)
    await simulator.appendLogs(logs)
  }
  
  // Force garbage collection if available
  if (global.gc) global.gc()
  
  const finalMemory = getMemoryUsage()
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
  
  expect(memoryIncrease).toBeLessThan(50) // Less than 50MB increase
})
```

## Test Configuration

### Bun Test Configuration

```typescript
// bunfig.toml (project root)
[test]
coverage = true
timeout = 30000
preload = ["./apps/server/test/setup.ts"]

# Test-specific environment
[test.env]
NODE_ENV = "test"
LOG_LEVEL = "error"
REDIS_DB = "15"
```

### Test Setup File

```typescript
// apps/server/test/setup.ts
import { beforeAll, afterAll } from 'bun:test'

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'error'
  
  // Initialize test database
  // await setupTestDatabase()
})

afterAll(async () => {
  // Cleanup after all tests
  // await cleanupTestDatabase()
})

// Custom matchers
expect.extend({
  toBeValidSquidLog(received: string) {
    const parts = received.split(' ')
    const isValid = parts.length >= 10 && /^\\d+\\.\\d+$/.test(parts[0])
    
    return {
      pass: isValid,
      message: () => `Expected ${received} to be a valid Squid log entry`
    }
  }
})

// Global test utilities
global.testUtils = {
  createMockLog: () => ({
    timestamp: Date.now(),
    clientIP: '192.168.1.1',
    user: 'testuser',
    method: 'GET',
    url: 'http://test.com',
    resultStatus: 200,
    size: 1024
  })
}
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis/redis-stack-server:latest
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: bun install
        
      - name: Run unit tests
        run: bun run test:unit
        
      - name: Run integration tests
        run: bun run test:integration
        env:
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          
      - name: Generate coverage report
        run: bun test --coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused on single functionality
- Use setup and teardown hooks for common initialization

### Mocking Strategy
- Mock external dependencies (Redis, file system)
- Use real implementations for critical paths when possible
- Mock at the appropriate level (unit vs integration tests)
- Verify mock interactions when behavior is important

### Data Management
- Use fixtures for consistent test data
- Clean up test data after each test
- Use separate test databases/namespaces
- Generate realistic test data when needed

### Performance Considerations
- Run performance tests separately from unit tests
- Set appropriate timeouts for different test types
- Monitor memory usage in long-running tests
- Use test-specific configurations for optimal performance

## Troubleshooting Tests

### Common Issues

```bash
# Redis connection issues
Error: connect ECONNREFUSED 127.0.0.1:6379
# Solution: Ensure Redis is running on correct port

# File permission issues  
Error: EACCES: permission denied, open '/var/log/test.log'
# Solution: Use test directory with proper permissions

# Memory issues in large tests
JavaScript heap out of memory
# Solution: Increase Node.js memory limit or optimize test data

# Timeout issues
Test timeout after 30000ms
# Solution: Increase timeout or optimize slow operations
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* bun test

# Run specific test with logging
LOG_LEVEL=debug bun test apps/server/test/unit/specific.test.ts

# Run with Node.js debugger
bun --inspect test
```

For more testing examples and advanced patterns, see the test files in `apps/server/test/`.

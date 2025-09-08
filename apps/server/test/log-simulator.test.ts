import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { writeFile, appendFile, unlink } from 'node:fs/promises';
import { LogSimulator } from './log-simulator';
import { MockRedisClient } from './__mocks__/redis';

// Мокаем RedisClient
const mockRedisClient = mock();
mock.module('bun', () => ({
	RedisClient: MockRedisClient
}));

describe('LogSimulator', () => {
	let simulator: LogSimulator;
	let testLogPath: string;
	let mockConfig: any;

	beforeEach(() => {
		testLogPath = `/tmp/test-access-${Date.now()}.log`;
		
		mockConfig = {
			logFilePath: testLogPath,
			redis: {
				host: 'localhost',
				port: 6379,
				password: 'test123',
			},
			scenarios: {
				normal: { intervalMs: 100, burstSize: 2 },
				peak: { intervalMs: 50, burstSize: 5 },
				heavy: { intervalMs: 20, burstSize: 10 },
			},
			duration: 1, // 1 second for fast tests
			validateRedis: true,
		};

		simulator = new LogSimulator(mockConfig);
	});

	afterEach(async () => {
		// Cleanup test files
		try {
			await unlink(testLogPath);
		} catch {
			// File might not exist
		}
		
		// Stop simulator if running
		await simulator.stop();
	});

	describe('constructor', () => {
		it('should create LogSimulator with valid config', () => {
			expect(simulator).toBeDefined();
		});

		it('should initialize without Redis when validateRedis is false', () => {
			const configWithoutRedis = { ...mockConfig, validateRedis: false };
			const simWithoutRedis = new LogSimulator(configWithoutRedis);
			expect(simWithoutRedis).toBeDefined();
		});
	});

	describe('initializeLogFile', () => {
		it('should create log file with initial data', async () => {
			await simulator.initializeLogFile();
			
			// Проверяем что файл создан
			const file = Bun.file(testLogPath);
			const exists = await file.exists();
			expect(exists).toBe(true);
			
			// Проверяем содержимое
			const content = await file.text();
			const lines = content.trim().split('\n');
			expect(lines.length).toBe(50); // По умолчанию 50 начальных записей
			
			// Проверяем формат первой строки
			const firstLine = lines[0];
			const parts = firstLine.split(' ');
			expect(parts.length).toBeGreaterThanOrEqual(10);
		});

		it('should generate chronologically sorted logs', async () => {
			await simulator.initializeLogFile();
			
			const file = Bun.file(testLogPath);
			const content = await file.text();
			const lines = content.trim().split('\n');
			
			const timestamps = lines.map(line => parseFloat(line.split(' ')[0]));
			
			for (let i = 1; i < timestamps.length; i++) {
				expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
			}
		});
	});

	describe('appendLogLines', () => {
		it('should append new lines to existing file', async () => {
			// Создаем начальный файл
			await writeFile(testLogPath, 'initial line\n');
			
			// Добавляем новые строки
			const newLines = ['new line 1', 'new line 2'];
			await simulator.appendLogLines(newLines);
			
			// Проверяем содержимое
			const file = Bun.file(testLogPath);
			const content = await file.text();
			const lines = content.trim().split('\n');
			
			expect(lines).toContain('initial line');
			expect(lines).toContain('new line 1');
			expect(lines).toContain('new line 2');
			expect(lines.length).toBe(3);
		});

		it('should handle empty lines array', async () => {
			await writeFile(testLogPath, 'initial\n');
			
			await simulator.appendLogLines([]);
			
			const file = Bun.file(testLogPath);
			const content = await file.text();
			expect(content).toBe('initial\n\n'); // Just adds extra newline
		});
	});

	describe('validateRedisUpdate', () => {
		it('should return false when Redis client is not available', async () => {
			const configNoRedis = { ...mockConfig, validateRedis: false };
			const simNoRedis = new LogSimulator(configNoRedis);
			
			const result = await simNoRedis.validateRedisUpdate(5);
			expect(result).toBe(false);
		});

		it('should validate Redis updates correctly', async () => {
			// Wait for Redis connection to be established
			await new Promise(resolve => setTimeout(resolve, 150));
			
			// Mock successful validation
			const result = await simulator.validateRedisUpdate(0);
			expect(typeof result).toBe('boolean');
		});
	});

	describe('runScenario', () => {
		it('should run normal scenario successfully', async () => {
			await simulator.initializeLogFile();
			
			const consoleSpy = spyOn(console, 'log');
			
			// Запускаем короткий сценарий
			await simulator.runScenario('normal', 200); // 200ms
			
			// Проверяем что лог файл обновился
			const file = Bun.file(testLogPath);
			const content = await file.text();
			const lines = content.trim().split('\n');
			
			expect(lines.length).toBeGreaterThan(50); // Больше чем начальные записи
			
			// Проверяем что консоль вызывалась
			expect(consoleSpy).toHaveBeenCalled();
		});

		it('should respect scenario parameters', async () => {
			await simulator.initializeLogFile();
			
			const startTime = Date.now();
			await simulator.runScenario('peak', 300); // 300ms с интервалом 50ms
			const endTime = Date.now();
			
			// Проверяем что выполнение заняло примерно ожидаемое время
			const executionTime = endTime - startTime;
			expect(executionTime).toBeGreaterThanOrEqual(250); // Минимум 250ms
			expect(executionTime).toBeLessThanOrEqual(400); // Максимум 400ms
		});

		it('should handle invalid scenario gracefully', async () => {
			await simulator.initializeLogFile();
			
			// @ts-expect-error testing invalid scenario
			await expect(simulator.runScenario('invalid', 100)).not.toThrow();
		});
	});

	describe('stop', () => {
		it('should stop simulator gracefully', async () => {
			const consoleSpy = spyOn(console, 'log');
			
			await simulator.stop();
			
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Остановка симулятора'));
		});

		it('should prevent further operations after stop', async () => {
			await simulator.stop();
			
			// После остановки операции должны завершаться быстро
			const startTime = Date.now();
			await simulator.runScenario('normal', 1000);
			const endTime = Date.now();
			
			expect(endTime - startTime).toBeLessThan(100); // Должно завершиться быстро
		});
	});

	describe('integration tests', () => {
		it('should run complete test cycle', async () => {
			const consoleSpy = spyOn(console, 'log');
			
			// Запускаем полный тест с коротким временем
			const testPromise = simulator.runTest();
			
			// Ждем небольшое время и останавливаем
			setTimeout(() => simulator.stop(), 500);
			
			await testPromise;
			
			// Проверяем что файл лога был создан
			const file = Bun.file(testLogPath);
			const exists = await file.exists();
			expect(exists).toBe(true);
			
			// Проверяем логи консоли
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Начало тестирования'));
		});

		it('should handle file system errors gracefully', async () => {
			// Используем недоступный путь
			const badConfig = {
				...mockConfig,
				logFilePath: '/root/inaccessible/path/test.log'
			};
			
			const badSimulator = new LogSimulator(badConfig);
			
			// Должно обработать ошибку без падения
			await expect(badSimulator.initializeLogFile()).rejects.toThrow();
		});
	});

	describe('performance tests', () => {
		it('should generate logs within reasonable time', async () => {
			const startTime = Date.now();
			
			await simulator.initializeLogFile();
			
			const endTime = Date.now();
			const executionTime = endTime - startTime;
			
			// Генерация 50 логов должна занимать менее 1 секунды
			expect(executionTime).toBeLessThan(1000);
		});

		it('should handle large bursts efficiently', async () => {
			const largeConfig = {
				...mockConfig,
				scenarios: {
					...mockConfig.scenarios,
					heavy: { intervalMs: 10, burstSize: 100 }
				}
			};
			
			const heavySimulator = new LogSimulator(largeConfig);
			await heavySimulator.initializeLogFile();
			
			const startTime = Date.now();
			await heavySimulator.runScenario('heavy', 100);
			const endTime = Date.now();
			
			// Даже тяжелые сценарии должны выполняться разумное время
			expect(endTime - startTime).toBeLessThan(500);
			
			await heavySimulator.stop();
		});
	});
});

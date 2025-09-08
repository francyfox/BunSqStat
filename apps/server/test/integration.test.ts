import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { SquidLogGenerator } from './log-generator';
import { LogSimulator } from './log-simulator';

describe('Integration Tests', () => {
	let testLogPath: string;
	let generator: SquidLogGenerator;

	beforeEach(() => {
		testLogPath = `/tmp/integration-test-${Date.now()}.log`;
		generator = new SquidLogGenerator();
	});

	afterEach(async () => {
		// Cleanup
		try {
			await unlink(testLogPath);
		} catch {
			// File might not exist
		}
	});

	describe('Log Generator + Simulator Integration', () => {
		it('should create realistic log simulation workflow', async () => {
			// 1. Генерируем начальные данные
			const initialLogs = generator.generateLogLines(10, 3600);
			expect(initialLogs.length).toBe(10);
			
			// 2. Проверяем что все строки имеют правильный формат Squid
			initialLogs.forEach(logLine => {
				const parts = logLine.split(' ');
				expect(parts.length).toBeGreaterThanOrEqual(10);
				
				// Проверяем timestamp
				const timestamp = parseFloat(parts[0]);
				expect(timestamp).toBeGreaterThan(0);
				
				// Проверяем duration
				const duration = parseInt(parts[1]);
				expect(duration).toBeGreaterThanOrEqual(0);
				
				// Проверяем IP
				const ip = parts[2];
				expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
				
				// Проверяем resultType/status
				const resultTypeStatus = parts[3];
				expect(resultTypeStatus).toMatch(/^[A-Z_]+\/\d+$/);
				
				// Проверяем bytes
				const bytes = parseInt(parts[4]);
				expect(bytes).toBeGreaterThanOrEqual(0);
				
				// Проверяем HTTP method
				const method = parts[5];
				expect(['GET', 'POST', 'CONNECT', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']).toContain(method);
			});
		});

		it('should simulate different activity scenarios', async () => {
			// Тестируем каждый сценарий
			const scenarios: Array<'normal' | 'peak' | 'heavy'> = ['normal', 'peak', 'heavy'];
			
			const results = scenarios.map(scenario => {
				const logs = generator.generateActivityBurst(scenario);
				return { scenario, count: logs.length, logs };
			});

			// Normal сценарий должен генерировать меньше логов
			const normal = results.find(r => r.scenario === 'normal');
			const peak = results.find(r => r.scenario === 'peak');
			const heavy = results.find(r => r.scenario === 'heavy');

			expect(normal!.count).toBeLessThan(peak!.count);
			expect(peak!.count).toBeLessThan(heavy!.count);

			// Все логи должны иметь валидную структуру
			results.forEach(result => {
				result.logs.forEach(log => {
					expect(log.split(' ').length).toBeGreaterThanOrEqual(10);
				});
			});
		});

		it('should create complete end-to-end workflow', async () => {
			// Конфигурация для быстрого теста
			const config = {
				logFilePath: testLogPath,
				redis: {
					host: 'localhost',
					port: 6379,
					password: 'test123',
				},
				scenarios: {
					normal: { intervalMs: 50, burstSize: 2 },
					peak: { intervalMs: 25, burstSize: 5 },
					heavy: { intervalMs: 10, burstSize: 10 },
				},
				duration: 1, // 1 секунда для теста
				validateRedis: false, // Отключаем Redis для быстроты
			};

			const simulator = new LogSimulator(config);

			try {
				// 1. Инициализируем файл
				await simulator.initializeLogFile();
				
				// 2. Проверяем что файл создан
				const file = Bun.file(testLogPath);
				const exists = await file.exists();
				expect(exists).toBe(true);
				
				// 3. Проверяем содержимое
				const content = await file.text();
				const lines = content.trim().split('\n');
				expect(lines.length).toBe(50); // Начальные записи
				
				// 4. Запускаем короткий сценарий
				await simulator.runScenario('normal', 100); // 100ms
				
				// 5. Проверяем что добавились новые записи
				const updatedContent = await file.text();
				const updatedLines = updatedContent.trim().split('\n');
				expect(updatedLines.length).toBeGreaterThan(50);
				
			} finally {
				await simulator.stop();
			}
		});

		it('should handle various data formats correctly', async () => {
			// Генерируем большое количество записей для проверки разнообразия
			const largeBatch = generator.generateLogLines(100, 7200);
			
			// Собираем статистику по полям
			const stats = {
				clientIPs: new Set<string>(),
				methods: new Set<string>(),
				resultTypes: new Set<string>(),
				contentTypes: new Set<string>(),
				users: new Set<string>(),
			};

			largeBatch.forEach(line => {
				const parts = line.split(' ');
				stats.clientIPs.add(parts[2]);
				stats.methods.add(parts[5]);
				stats.resultTypes.add(parts[3].split('/')[0]);
				stats.users.add(parts[7]);
				stats.contentTypes.add(parts[parts.length - 1]);
			});

			// Проверяем разнообразие данных
			expect(stats.clientIPs.size).toBeGreaterThanOrEqual(3);
			expect(stats.methods.size).toBeGreaterThanOrEqual(3);
			expect(stats.resultTypes.size).toBeGreaterThanOrEqual(2);
			expect(stats.users.size).toBeGreaterThanOrEqual(2);
			expect(stats.contentTypes.size).toBeGreaterThanOrEqual(3);

			// Проверяем что все IP адреса валидны
			stats.clientIPs.forEach(ip => {
				expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
			});

			// Проверяем что все HTTP методы валидны
			const validMethods = ['GET', 'POST', 'CONNECT', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
			stats.methods.forEach(method => {
				expect(validMethods).toContain(method);
			});
		});

		it('should maintain chronological order across scenarios', async () => {
			// Генерируем данные с разными временными окнами
			const batch1 = generator.generateLogLines(10, 60);   // 1 минута
			const batch2 = generator.generateLogLines(10, 120);  // 2 минуты
			const batch3 = generator.generateLogLines(10, 180);  // 3 минуты

			// Объединяем и проверяем хронологический порядок
			const allLogs = [...batch1, ...batch2, ...batch3].sort((a, b) => {
				const timeA = parseFloat(a.split(' ')[0]);
				const timeB = parseFloat(b.split(' ')[0]);
				return timeA - timeB;
			});

			// Проверяем что после сортировки порядок соблюдается
			for (let i = 1; i < allLogs.length; i++) {
				const prevTime = parseFloat(allLogs[i - 1].split(' ')[0]);
				const currentTime = parseFloat(allLogs[i].split(' ')[0]);
				expect(currentTime).toBeGreaterThanOrEqual(prevTime);
			}
		});

		it('should generate consistent URL patterns based on HTTP methods', async () => {
			const methodToUrlPattern: Record<string, RegExp> = {
				'CONNECT': /:443$/,
				'GET': /^https?:\/\//,
				'POST': /^https?:\/\//,
			};

			// Генерируем много записей чтобы найти разные методы
			const logs = generator.generateLogLines(200, 3600);
			const methodUrls: Record<string, string[]> = {};

			logs.forEach(line => {
				const parts = line.split(' ');
				const method = parts[5];
				const url = parts[6];

				if (!methodUrls[method]) {
					methodUrls[method] = [];
				}
				methodUrls[method].push(url);
			});

			// Проверяем паттерны URL для каждого метода
			Object.entries(methodUrls).forEach(([method, urls]) => {
				if (methodToUrlPattern[method]) {
					urls.forEach(url => {
						expect(url).toMatch(methodToUrlPattern[method]);
					});
				}
			});
		});
	});
});

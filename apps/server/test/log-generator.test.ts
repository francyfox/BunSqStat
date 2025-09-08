import { describe, it, expect, beforeEach } from 'bun:test';
import { SquidLogGenerator } from './log-generator';

describe('SquidLogGenerator', () => {
	let generator: SquidLogGenerator;

	beforeEach(() => {
		generator = new SquidLogGenerator();
	});

	describe('generateLogLine', () => {
		it('should generate a valid log line with all required fields', () => {
			const logLine = generator.generateLogLine();
			
			expect(logLine).toBeDefined();
			expect(typeof logLine).toBe('string');
			
			// Проверяем что строка содержит основные компоненты
			const parts = logLine.split(' ');
			expect(parts.length).toBeGreaterThanOrEqual(10);
		});

		it('should use provided timestamp', () => {
			const timestamp = 1756975387.123;
			const logLine = generator.generateLogLine(timestamp);
			
			expect(logLine.startsWith(timestamp.toString())).toBe(true);
		});

		it('should generate valid IP addresses', () => {
			const logLine = generator.generateLogLine();
			const parts = logLine.split(' ');
			const clientIP = parts[2]; // third field is clientIP
			
			// Проверяем что IP соответствует одному из ожидаемых
			const validIPs = ['192.168.10.41', '192.168.11.16', '192.168.11.5', '127.0.0.1'];
			expect(validIPs).toContain(clientIP);
		});

		it('should generate valid HTTP methods', () => {
			const methods = new Set<string>();
			
			// Генерируем множество записей чтобы получить разные методы
			for (let i = 0; i < 50; i++) {
				const logLine = generator.generateLogLine();
				const parts = logLine.split(' ');
				const method = parts[5]; // sixth field is method
				methods.add(method);
			}
			
			const validMethods = ['GET', 'POST', 'CONNECT', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
			methods.forEach(method => {
				expect(validMethods).toContain(method);
			});
		});

		it('should generate valid result types', () => {
			const resultTypes = new Set<string>();
			
			for (let i = 0; i < 30; i++) {
				const logLine = generator.generateLogLine();
				const parts = logLine.split(' ');
				const resultTypeStatus = parts[3]; // fourth field is resultType/status
				const resultType = resultTypeStatus.split('/')[0];
				resultTypes.add(resultType);
			}
			
			const validResultTypes = ['TCP_MISS', 'TCP_HIT', 'TCP_DENIED', 'TCP_DENIED_REPLY', 'NONE_NONE'];
			resultTypes.forEach(type => {
				expect(validResultTypes).toContain(type);
			});
		});

		it('should generate numeric values for duration and bytes', () => {
			const logLine = generator.generateLogLine();
			const parts = logLine.split(' ');
			
			const duration = parseInt(parts[1]);
			const bytes = parseInt(parts[4]);
			
			expect(duration).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThanOrEqual(2000);
			expect(bytes).toBeGreaterThanOrEqual(0);
			expect(bytes).toBeLessThanOrEqual(10000);
		});
	});

	describe('generateLogLines', () => {
		it('should generate specified number of log lines', () => {
			const count = 5;
			const lines = generator.generateLogLines(count);
			
			expect(lines).toHaveLength(count);
			lines.forEach(line => {
				expect(typeof line).toBe('string');
				expect(line.length).toBeGreaterThan(0);
			});
		});

		it('should generate lines sorted by timestamp', () => {
			const lines = generator.generateLogLines(10, 3600);
			
			for (let i = 1; i < lines.length; i++) {
				const prevTimestamp = parseFloat(lines[i - 1].split(' ')[0]);
				const currentTimestamp = parseFloat(lines[i].split(' ')[0]);
				
				expect(currentTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
			}
		});

		it('should respect time spread parameter', () => {
			const timeSpread = 60; // 1 minute
			const lines = generator.generateLogLines(10, timeSpread);
			
			const timestamps = lines.map(line => parseFloat(line.split(' ')[0]));
			const minTime = Math.min(...timestamps);
			const maxTime = Math.max(...timestamps);
			
			expect(maxTime - minTime).toBeLessThanOrEqual(timeSpread);
		});
	});

	describe('generateActivityBurst', () => {
		it('should generate normal activity burst', () => {
			const lines = generator.generateActivityBurst('normal');
			
			expect(lines.length).toBeGreaterThanOrEqual(5);
			expect(lines.length).toBeLessThanOrEqual(15);
		});

		it('should generate peak activity burst', () => {
			const lines = generator.generateActivityBurst('peak');
			
			expect(lines.length).toBeGreaterThanOrEqual(50);
			expect(lines.length).toBeLessThanOrEqual(100);
		});

		it('should generate heavy activity burst', () => {
			const lines = generator.generateActivityBurst('heavy');
			
			expect(lines.length).toBeGreaterThanOrEqual(100);
			expect(lines.length).toBeLessThanOrEqual(200);
		});

		it('should handle unknown scenario as normal', () => {
			// @ts-expect-error testing unknown scenario
			const lines = generator.generateActivityBurst('unknown');
			
			expect(lines.length).toBe(10);
		});
	});

	describe('URL generation', () => {
		it('should generate CONNECT URLs with port', () => {
			// Генерируем много линий чтобы найти CONNECT запросы
			const connectLines = [];
			for (let i = 0; i < 100; i++) {
				const line = generator.generateLogLine();
				const parts = line.split(' ');
				const method = parts[5];
				if (method === 'CONNECT') {
					connectLines.push(line);
				}
			}
			
			expect(connectLines.length).toBeGreaterThan(0);
			
			connectLines.forEach(line => {
				const parts = line.split(' ');
				const url = parts[6];
				expect(url).toMatch(/:443$/); // Should end with :443
			});
		});

		it('should generate valid URLs for GET requests', () => {
			const getLines = [];
			for (let i = 0; i < 100; i++) {
				const line = generator.generateLogLine();
				const parts = line.split(' ');
				const method = parts[5];
				if (method === 'GET') {
					getLines.push(line);
				}
			}
			
			expect(getLines.length).toBeGreaterThan(0);
			
			getLines.forEach(line => {
				const parts = line.split(' ');
				const url = parts[6];
				expect(url).toMatch(/^https?:\/\//); // Should start with http:// or https://
			});
		});
	});

	describe('User generation', () => {
		it('should generate valid user names', () => {
			const users = new Set<string>();
			
			for (let i = 0; i < 50; i++) {
				const line = generator.generateLogLine();
				const parts = line.split(' ');
				const user = parts[7]; // eighth field is user
				users.add(user);
			}
			
			const validUsers = ['sgolota@TP.OIL', 'vpupkin@TP.OIL', 'TMP-PTO$@TP.OIL', '-'];
			users.forEach(user => {
				expect(validUsers).toContain(user);
			});
		});
	});

	describe('Content type generation', () => {
		it('should generate valid content types', () => {
			const contentTypes = new Set<string>();
			
			for (let i = 0; i < 50; i++) {
				const line = generator.generateLogLine();
				const parts = line.split(' ');
				const contentType = parts[parts.length - 1]; // last field is content type
				contentTypes.add(contentType);
			}
			
			const validContentTypes = [
				'text/html', 'text/javascript', 'text/css', 'application/json',
				'application/octet-stream', 'application/json+protobuf',
				'image/png', 'image/jpeg', 'image/gif', '-'
			];
			
			contentTypes.forEach(type => {
				expect(validContentTypes).toContain(type);
			});
		});
	});
});

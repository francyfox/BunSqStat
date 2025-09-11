import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { AccessLogService } from "@/modules/access-logs/service";
import { redisClient } from "@/redis";
import { config } from "@/config";
import fs from "node:fs";

const TEST_LOGS = [
	"1609459200.001 123 192.168.1.1 TCP_MISS/200 1024 GET http://example.com/page1 - HIER_DIRECT/93.184.216.34 text/html Mozilla/5.0",
	"1609459201.002 456 192.168.1.2 TCP_HIT/304 512 GET http://example.com/page2 - HIER_NONE/- image/png Mozilla/5.0",
	"1609459202.003 789 192.168.1.3 TCP_MISS/404 256 GET http://example.com/page3 - HIER_DIRECT/93.184.216.34 text/html Mozilla/5.0",
	"1609459203.004 321 192.168.1.4 TCP_MISS/200 2048 POST http://example.com/api - HIER_DIRECT/93.184.216.34 application/json Mozilla/5.0",
	"1609459204.005 654 192.168.1.5 TCP_HIT/200 1536 GET http://example.com/page5 - HIER_NONE/- text/html Mozilla/5.0"
];

const ADDITIONAL_LOG = "1609459205.006 987 192.168.1.6 TCP_MISS/200 3072 GET http://example.com/page6 - HIER_DIRECT/93.184.216.34 text/html Mozilla/5.0";

beforeAll(async () => {
	const keys = await redisClient.keys("*");
	if (keys.length > 0) {
		await redisClient.del(...keys);
	}
	fs.writeFileSync(config.ACCESS_LOG, TEST_LOGS.join('\n') + '\n');
});

afterAll(async () => {
	const keys = await redisClient.keys("*");
	if (keys.length > 0) {
		await redisClient.del(...keys);
	}
	if (fs.existsSync(config.ACCESS_LOG)) {
		fs.unlinkSync(config.ACCESS_LOG);
	}
});

describe("AccessLogService.readAccessLogs", () => {
	test("should create Redis index without errors", async () => {
		await AccessLogService.createIndex();
		const indexInfo = await redisClient.send("FT.INFO", ["log_idx"]);
		expect(indexInfo).toBeDefined();
	});

	test("should load all 5 test logs on first read", async () => {
		const loadedCount = await AccessLogService.readAccessLogs();
		expect(loadedCount).toBe(TEST_LOGS.length);
	});

	test("should create exactly 5 Redis keys for 5 log entries", async () => {
		const keys = await redisClient.keys("log:*");
		expect(keys.length).toBe(TEST_LOGS.length);
	});

	test("should not load any logs on second read when no new entries exist", async () => {
		const loadedCount = await AccessLogService.readAccessLogs();
		expect(loadedCount).toBe(0);
	});

	test("should detect and load exactly 1 new log after file append", async () => {
		fs.appendFileSync(config.ACCESS_LOG, ADDITIONAL_LOG + '\n');
		const loadedCount = await AccessLogService.readAccessLogs();
		expect(loadedCount).toBe(1);
	});

	test("should have exactly 6 Redis keys after loading additional log", async () => {
		const keys = await redisClient.keys("log:*");
		expect(keys.length).toBe(TEST_LOGS.length + 1);
	});

	test("should preserve millisecond precision in timestamps to avoid key collisions", async () => {
		const keys = await redisClient.keys("log:*");
		const uniqueKeys = new Set(keys);
		expect(uniqueKeys.size).toBe(keys.length);
	});

	test("should handle large number of logs with potential timestamp collisions", async () => {
		// Очищаем существующие ключи
		const existingKeys = await redisClient.keys("log:*");
		if (existingKeys.length > 0) {
			await redisClient.del(...existingKeys);
		}
		
		// Создаем 50+ записей с потенциально повторяющимся timestamp
		const manyLogs: string[] = [];
		const baseTime = 1609459200;
		
		for (let i = 0; i < 53; i++) {
			const timestamp = baseTime + (i * 0.001); // Микросекундная разность
			const log = `${timestamp.toFixed(3)} ${100 + i} 192.168.1.${i % 255} TCP_MISS/200 1024 GET http://example.com/page${i} - HIER_DIRECT/93.184.216.34 text/html Mozilla/5.0`;
			manyLogs.push(log);
		}
		
		// Записываем в файл
		fs.writeFileSync(config.ACCESS_LOG, manyLogs.join('\n') + '\n');
		
		// Пересоздаем индекс
		await AccessLogService.createIndex();
		
		// Загружаем все записи
		const loadedCount = await AccessLogService.readAccessLogs();
		expect(loadedCount).toBe(manyLogs.length);
		
		// Проверяем, что все ключи созданы
		const finalKeys = await redisClient.keys("log:*");
		expect(finalKeys.length).toBe(manyLogs.length);
		
		// Проверяем уникальность ключей
		const uniqueKeys = new Set(finalKeys);
		expect(uniqueKeys.size).toBe(finalKeys.length);
	});
});

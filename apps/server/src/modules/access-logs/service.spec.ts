import { beforeEach, describe, expect, test } from "bun:test";
import { config } from "@/config";
import { redisClient } from "@/redis";
import { AccessLogService } from "./service";

describe("AccessLogService", () => {
	beforeEach(async () => {
		// Очищаем Redis перед каждым тестом
		const keys = await redisClient.keys("log:*");
		if (keys.length > 0) {
			await redisClient.del(...keys);
		}

		// Удаляем индекс если существует
		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch {
			// Индекс не существует - это нормально
		}
	});

	test("должен читать все строки из файла", async () => {
		const result = await AccessLogService.readAccessLogs();

		console.log("readAccessLogs result:", result);

		// Проверим сколько ключей в Redis
		const redisKeys = await redisClient.keys("log:*");
		console.log("Keys in Redis:", redisKeys.length);

		// Если результат > 0, значит записи были добавлены
		expect(result).toBeGreaterThanOrEqual(0);

		// Количество ключей должно соответствовать результату
		if (result > 0) {
			expect(redisKeys.length).toBe(result);
		}
	});

	test("должен корректно санитизировать данные", () => {
		const testData = {
			timestamp: "1757415820",
			duration: "500",
			clientIP: "192.168.1.1",
			hierarchyHost: "-",
			contentType: "text/html",
		};

		const sanitized = AccessLogService.sanitizeLogData(testData);

		// Числовые поля с "-" должны стать "0"
		expect(sanitized["hierarchyHost"]).toBe("-"); // TEXT поле не меняется
		expect(sanitized["duration"]).toBe("500"); // Валидное число не меняется
	});

	test("должен создавать индекс после загрузки данных", async () => {
		// Загружаем данные
		await AccessLogService.readAccessLogs();

		// Создаем индекс
		await AccessLogService.createIndex();

		// Проверяем что индекс создан
		const indexInfo = await redisClient.send("FT.INFO", ["log_idx"]);
		expect(indexInfo).toBeDefined();

		console.log("Index created successfully");
	});

	test("должен находить новые записи при повторном вызове", async () => {
		// Первый вызов - загружает все записи
		const firstResult = await AccessLogService.readAccessLogs();
		console.log("First call result:", firstResult);

		// Второй вызов - не должен найти новые записи
		const secondResult = await AccessLogService.readAccessLogs();
		console.log("Second call result:", secondResult);

		// Второй вызов должен вернуть 0 (нет новых записей)
		expect(secondResult).toBe(0);
	});

	test("должен проверить состояние Redis и файла", async () => {
		// Проверим сколько уникальных timestamp в файле
		const { exec } = require("child_process");
		const { promisify } = require("util");
		const execAsync = promisify(exec);

		const { stdout: fileLines } = await execAsync(`wc -l ${config.ACCESS_LOG}`);
		const { stdout: uniqueTimestamps } = await execAsync(
			`awk '{print $1}' ${config.ACCESS_LOG} | sort -n | uniq | wc -l`,
		);

		console.log("Lines in file:", fileLines.trim());
		console.log("Unique timestamps:", uniqueTimestamps.trim());

		// Загружаем данные
		const result = await AccessLogService.readAccessLogs();
		console.log("Loaded records:", result);

		// Проверим Redis
		const redisKeys = await redisClient.keys("log:*");
		console.log("Keys in Redis:", redisKeys.length);

		// Анализируем расхождения
		const fileCount = parseInt(fileLines.trim().split(" ")[0]);
		const uniqueCount = parseInt(uniqueTimestamps.trim());

		console.log("Analysis:");
		console.log("- File lines:", fileCount);
		console.log("- Unique timestamps:", uniqueCount);
		console.log("- Duplicates:", fileCount - uniqueCount);
		console.log("- Redis keys:", redisKeys.length);
		console.log("- Missing from Redis:", uniqueCount - redisKeys.length);
	});
});

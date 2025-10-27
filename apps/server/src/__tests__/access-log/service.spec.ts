import { beforeEach, describe, expect, test } from "bun:test";
import { redisClient } from "@/libs/redis";
import { AccessLogService } from "@/modules/access-logs/service";

describe("AccessLogService", () => {
	beforeEach(async () => {
		const keys = await redisClient.keys("log:*");
		if (keys.length > 0) {
			await redisClient.del(...keys);
		}

		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch {}
	});

	test("read all lines from file", async () => {
		const result = await AccessLogService.readAccessLogs();

		const redisKeys = await redisClient.keys("log:*");

		expect(result).toBeGreaterThanOrEqual(0);

		if (result > 0) {
			expect(redisKeys.length).toBe(result);
		}
	});

	test("data sanitize", () => {
		const testData = {
			timestamp: "1757415820",
			duration: "500",
			clientIP: "192.168.1.1",
			hierarchyHost: "-",
			contentType: "text/html",
		};

		const sanitized = AccessLogService.sanitizeLogData(testData);

		expect(sanitized["hierarchyHost"]).toBe("-");
		expect(sanitized["duration"]).toBe("500");
	});

	test("create index", async () => {
		await AccessLogService.readAccessLogs();
		await AccessLogService.createIndex();

		const indexInfo = await redisClient.send("FT.INFO", ["log_idx"]);
		expect(indexInfo).toBeDefined();
	});

	test("new records after retry", async () => {
		await AccessLogService.readAccessLogs();
		const secondResult = await AccessLogService.readAccessLogs();

		expect(secondResult).toBe(0);
	});

	// test("check Redis state and file", async () => {
	// 	const { exec } = require("child_process");
	// 	const { promisify } = require("util");
	// 	const execAsync = promisify(exec);
	//
	// 	const { stdout: fileLines } = await execAsync(`wc -l ${config.ACCESS_LOG}`);
	// 	const { stdout: uniqueTimestamps } = await execAsync(
	// 		`awk '{print $1}' ${config.ACCESS_LOG} | sort -n | uniq | wc -l`,
	// 	);
	//
	// 	await AccessLogService.readAccessLogs();
	// 	const redisKeys = await redisClient.keys("log:*");
	// 	const fileCount = parseInt(fileLines.trim().split(" ")[0], 10);
	// 	const uniqueCount = parseInt(uniqueTimestamps.trim(), 10);
	//
	// 	// 	TODO: check
	// });
});

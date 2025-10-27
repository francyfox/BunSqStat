import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SquidLogGenerator } from "@/__tests__/log-generator/log-generator";
import { config } from "@/config";
import { redisClient } from "@/libs/redis";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";
import { AccessLogService } from "@/modules/access-logs/service";

// TODO: disable random
describe("MetricsService", () => {
	beforeAll(async () => {
		const generator = new SquidLogGenerator();
		const lines = generator.generateActivityBurst("normal");
		await Bun.write(config.ACCESS_LOG, lines.join("\n"));
		await AccessLogService.createIndex();
		await AccessLogService.readAccessLogs();
	});

	afterAll(async () => {
		const keys = await redisClient.keys("*");
		if (keys.length > 0) {
			await redisClient.del(...keys);
		}

		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch {}
	});

	test("get total bytes/duration", async () => {
		const { items, count } = await AccessLogsMetricsService.getTotalSum();
		const hasKeys = new RegExp(
			["user", "totalBytes", "totalDuration"].join("|"),
		).test(Object.keys(items[0] as any).join("|"));

		expect(count).toBeGreaterThan(0);
		expect(hasKeys).toBe(true);
	});

	test("get total RPS", async () => {
		const count = await AccessLogsMetricsService.getTotalRequestByTime(10000);
		expect(count).toBeGreaterThan(0);
	});

	test("get statuses", async () => {
		const { items, count } =
			await AccessLogsMetricsService.getTotalStatusesByTime(10000);
		expect(count).toBeGreaterThan(0);
	});
});

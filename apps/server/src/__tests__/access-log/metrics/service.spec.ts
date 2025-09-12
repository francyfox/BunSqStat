import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SquidLogGenerator } from "@/__tests__/log-generator/log-generator";
import { config } from "@/config";
import { AccessLogsMetrics } from "@/modules/access-logs/metrics/service";
import { AccessLogService } from "@/modules/access-logs/service";
import { redisClient } from "@/redis";

describe("MetricsService", () => {
	beforeAll(async () => {
		const generator = new SquidLogGenerator();
		const lines = generator.generateActivityBurst("normal");
		await Bun.write(config.ACCESS_LOG, lines.join("\n"));
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
		await AccessLogService.createIndex();
		await AccessLogService.readAccessLogs();

		const { items, count } = await AccessLogsMetrics.getTotalSum();
		const hasKeys = new RegExp(
			["user", "total_bytes", "total_duration"].join("|"),
		).test(Object.keys(items[0] as any).join("|"));

		expect(count).toBeGreaterThan(0);
		expect(items.length).toBeGreaterThan(0);
		expect(hasKeys).toBe(true);
	});
});

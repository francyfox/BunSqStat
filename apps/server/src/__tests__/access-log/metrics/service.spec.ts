import { describe, expect, test } from "bun:test";
import { AccessLogsMetrics } from "@/modules/access-logs/metrics/service";

describe("MetricsService", () => {
	test("get total bytes/duration", async () => {
		const { items, count } = await AccessLogsMetrics.getTotalSum();

		console.log(items, count);
		expect(count).toBeGreaterThan(0);
		expect(items.length).toBeGreaterThan(0);
	});
});

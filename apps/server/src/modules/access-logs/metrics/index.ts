import { Elysia, t } from "elysia";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";
import { AccessLogMetricsSchema } from "@/modules/access-logs/metrics/types";

export const AccessLogsMetrics = new Elysia().get(
	"/stats/access-logs/metrics",
	async ({ query }) => {
		const { limit, startTime, endTime } = query;
		const { items, count } = await AccessLogsMetricsService.getTotalSum(limit);
		const userInfo = await AccessLogsMetricsService.getUsersInfo(items);
		const total = await AccessLogsMetricsService.getTotal(items, {
			startTime,
			endTime,
		} as any);
		return {
			...total,
			users: userInfo,
		};
	},
	{
		query: t.Partial(
			t.Object({
				limit: t.Number({ default: 50 }),
				startTime: t.Partial(
					t.Number({ description: `Timestamp like ${Date.now()}` }),
				),
				endTime: t.Partial(
					t.Number({ description: `Timestamp like ${Date.now()}` }),
				),
			}),
		),
		response: {
			"200": AccessLogMetricsSchema,
		},
	},
);

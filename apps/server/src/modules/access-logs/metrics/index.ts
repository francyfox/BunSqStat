import { Elysia, t } from "elysia";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";
import { AccessLogMetricsSchema } from "@/modules/access-logs/metrics/types";

export const AccessLogsMetrics = new Elysia().get(
	"/stats/access-logs/metrics",
	async ({ query }) => {
		const { limit, time } = query;
		const { items, count } = await AccessLogsMetricsService.getTotalSum(limit);
		const userInfo = await AccessLogsMetricsService.getUsersInfo(items);
		const total = await AccessLogsMetricsService.getTotal(items, time);
		return {
			...total,
			users: userInfo,
		};
	},
	{
		query: t.Partial(
			t.Object({
				limit: t.Number({ default: 50 }),
				time: t.Number({ default: 60 }),
			}),
		),
		response: {
			"200": AccessLogMetricsSchema,
		},
	},
);

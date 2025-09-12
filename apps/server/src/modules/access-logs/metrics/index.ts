import { Elysia, t } from "elysia";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";

export const AccessLogsMetrics = new Elysia().get(
	"/stats/access-logs/metrics",
	async ({ query }) => {
		const { limit } = query;
		const { items } = await AccessLogsMetricsService.getTotalSum(limit);
		const userInfo = await AccessLogsMetricsService.getUsersInfo(items);
		const total = await AccessLogsMetricsService.getTotal(items);
		return {
			...total,
			users: userInfo,
		};
	},
	{
		query: t.Object({
			limit: t.Number({ default: 50 }),
		}),
		response: {
			"200": t.Object({
				rps: t.Number(),
				statusCount: t.Array(t.Any()),
				bytes: t.Number(),
				duration: t.Number(),
				users: t.Array(
					t.Object({
						currentSpeed: t.Number(),
						speed: t.Number(),
						user: t.String(),
						totalBytes: t.String(),
						totalDuration: t.String(),
					}),
				),
			}),
		},
	},
);

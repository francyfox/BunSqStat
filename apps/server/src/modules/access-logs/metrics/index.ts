import { Elysia, t } from "elysia";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";

export const statusCodes = t.Object({
	items: t.Array(
		t.Object({
			status: t.String(),
			count: t.Number(),
		}),
	),
	count: t.Number(),
});

export const AccessLogsMetrics = new Elysia().get(
	"/stats/access-logs/metrics",
	async ({ query }) => {
		const { limit, time } = query;
		const { items } = await AccessLogsMetricsService.getTotalSum(limit);
		const userInfo = await AccessLogsMetricsService.getUsersInfo(items);
		const total = await AccessLogsMetricsService.getTotal(items, time);
		return {
			...total,
			users: userInfo,
		};
	},
	{
		query: t.Object({
			limit: t.Number({ default: 50 }),
			time: t.Number({ default: 60 }),
		}),
		response: {
			"200": t.Object({
				currentStates: t.Object({
					rps: t.Union([t.Number(), t.Any()]),
					statusCodes,
				}),
				globalStates: t.Object({
					bytes: t.Number(),
					duration: t.Number(),
					statusCodes,
				}),
				users: t.Array(
					t.Object({
						user: t.String(),
						currentSpeed: t.Number(),
						speed: t.Number(),
						totalBytes: t.Number(),
						totalDuration: t.Number(),
					}),
				),
			}),
		},
	},
);

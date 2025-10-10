import { Elysia, t } from "elysia";
import {
	AccessLogsMetricsService,
	MetricDomainItemSchema,
} from "@/modules/access-logs/metrics/service";
import { AccessLogMetricsSchema } from "@/modules/access-logs/metrics/types";

export const AccessLogsMetrics = new Elysia()
	.get(
		"/stats/access-logs/metrics",
		async ({ query }) => {
			const { limit, startTime, endTime } = query;
			const { items } = await AccessLogsMetricsService.getTotalSum(limit);
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
	)
	.get(
		"/stats/access-logs/metrics/domains",
		async ({ query }) => {
			const response = await AccessLogsMetricsService.getDomainsInfo(query);
			return response;
		},
		{
			query: t.Partial(
				t.Object({
					search: t.String(),
					page: t.Number({ default: 1 }),
					limit: t.Number({ default: 20, maximum: 100 }),
					sortBy: t.Union([
						t.Literal('requestCount'),
						t.Literal('bytes'),
						t.Literal('duration'),
						t.Literal('lastActivity'),
						t.Literal('errorsRate'),
					]),
					sortOrder: t.Union([t.Literal('asc'), t.Literal('desc')]),
					startTime: t.Partial(
						t.Number({ description: `Timestamp like ${Date.now()}` }),
					),
					endTime: t.Partial(
						t.Number({ description: `Timestamp like ${Date.now()}` }),
					),
				}),
			),
			response: {
				"200": t.Object({
					count: t.Number(),
					items: t.Array(MetricDomainItemSchema),
				}),
			},
		},
	);

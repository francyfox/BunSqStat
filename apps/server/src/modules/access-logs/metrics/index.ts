import { Elysia, t } from "elysia";
import { AccessLogsMetricsService } from "@/modules/access-logs/metrics/service";
import {
	AccessLogMetricsSchema,
	MetricDomainItemSchema,
	MetricDomainOptionsSchema,
} from "@/modules/access-logs/metrics/types";

export const AccessLogsMetrics = new Elysia()
	.get(
		"/stats/access-logs/metrics",
		async ({ query }) => {
			const { limit } = query;
			
			// Если время не передано, используем последний час по умолчанию
			const now = Date.now();
			const startTime = query.startTime || now - 60 * 60 * 1000;
			const endTime = query.endTime || now;
			
			// Получаем данные за указанный временной диапазон
			const { items } = await AccessLogsMetricsService.getTotalSum(
				limit,
				false,
				60000,
				startTime,
				endTime
			);
			const userInfo = await AccessLogsMetricsService.getUsersInfo(items);
			const total = await AccessLogsMetricsService.getTotal(items, {
				startTime,
				endTime,
			});

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
			query: t.Partial(MetricDomainOptionsSchema),
			response: {
				"200": t.Object({
					count: t.Number(),
					items: t.Array(MetricDomainItemSchema),
				}),
			},
		},
	);

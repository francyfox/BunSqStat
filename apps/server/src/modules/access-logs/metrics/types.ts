import { type Static, t } from "elysia";

export const statusCodes = t.Object({
	items: t.Array(
		t.Object({
			status: t.String(),
			count: t.Number(),
		}),
	),
	count: t.Number(),
});

export const contentTypeStats = t.Object({
	items: t.Array(
		t.Object({
			contentType: t.String(),
			requestCount: t.Number(),
			bytes: t.Number(),
			hitRatePercent: t.Number(),
		}),
	),
	count: t.Number(),
});

export const AccessLogMetricsSchema = t.Object({
	currentStates: t.Object({
		rps: t.Union([t.Number(), t.Any()]),
		statusCodes,
	}),
	globalStates: t.Object({
		bytes: t.Number(),
		duration: t.Number(),
		statusCodes,
		bandwidth: t.Number(),
		hitRatePercent: t.Number(),
		successRatePercent: t.Number(),
		contentTypes: contentTypeStats,
	}),
	users: t.Array(
		t.Object({
			user: t.String(),
			currentSpeed: t.Number(),
			speed: t.Number(),
			clientIP: t.String(),
			totalBytes: t.Number(),
			totalDuration: t.Number(),
			lastRequestUrl: t.String(),
			lastActivity: t.Number(),
		}),
	),
});

export type TAccessLogMetricsResponse = Static<typeof AccessLogMetricsSchema>;

export interface IMetricBytesAndDuration {
	clientIP: string;
	totalBytes: number;
	totalDuration: number;
	lastRequestUrl?: string;
	lastActivity?: number;
}

export const MetricDomainItemSchema = t.Object({
	domain: t.String(),
	requestCount: t.Number(),
	bytes: t.Number(),
	duration: t.Number(),
	lastActivity: t.Number(),
	errorsRate: t.Number(),
	hasBlocked: t.Boolean(),
});

export const MetricDomainOptionsSchema = t.Object({
	search: t.String(),
	page: t.Number({ default: 1 }),
	limit: t.Number({ default: 20, maximum: 100 }),
	sortBy: t.Union([
		t.Literal("requestCount"),
		t.Literal("bytes"),
		t.Literal("duration"),
		t.Literal("lastActivity"),
		t.Literal("errorsRate"),
	]),
	sortOrder: t.Union([t.Literal("ASC"), t.Literal("DESC")]),
	startTime: t.Partial(
		t.Number({ description: `Timestamp like ${Date.now()}` }),
	),
	endTime: t.Partial(t.Number({ description: `Timestamp like ${Date.now()}` })),
});

export type TMetricDomainOptions = Static<typeof MetricDomainOptionsSchema>;
export type TMetricDomainItem = Static<typeof MetricDomainItemSchema>;

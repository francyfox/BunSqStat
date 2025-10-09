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

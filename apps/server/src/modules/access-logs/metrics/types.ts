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

export const AccessLogMetricsSchema = t.Object({
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
});

export type TAccessLogMetricsResponse = Static<typeof AccessLogMetricsSchema>;

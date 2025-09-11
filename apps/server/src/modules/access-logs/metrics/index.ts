import { Elysia } from "elysia";

export const AccessLogsMetrics = new Elysia().get(
	"/stats/access-logs/metrics",
	async ({ query }) => {},
);

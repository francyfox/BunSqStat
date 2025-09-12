import { Elysia, t } from "elysia";
import { AccessLogs } from "@/modules/access-logs";
import { AccessLogsMetrics } from "@/modules/access-logs/metrics";
import { Stats } from "@/modules/stats";
import { WS } from "@/modules/ws";

export const routes = new Elysia()
	.get(
		"/ping",
		// @ts-ignore
		() => "pong",
		{
			detail: {
				description: "Use for ping",
			},
			response: {
				"200": t.Literal("pong"),
			},
		},
	)
	.get(
		"/health",
		() => {
			return { status: "ok", timestamp: new Date().toISOString() };
		},
		{
			detail: {
				description: "Health check endpoint",
			},
			response: t.Object({
				status: t.Literal("ok"),
				timestamp: t.String(),
			}),
		},
	)
	.use(Stats)
	.use(AccessLogs)
	.use(AccessLogsMetrics)
	.use(WS);

export type EdenApp = typeof routes;

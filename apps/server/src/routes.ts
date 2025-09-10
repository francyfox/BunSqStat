import { Elysia, t } from "elysia";
import { AccessLogs } from "@/modules/access-logs";
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
		() => ({ status: "ok", timestamp: new Date().toISOString() }),
		{
			detail: {
				description: "Health check endpoint",
			},
			response: {
				"200": t.Object({
					status: t.Literal("ok"),
					timestamp: t.String(),
				}),
			},
		},
	)
	.use(Stats)
	.use(AccessLogs)
	.use(WS);

export type EdenApp = typeof routes;

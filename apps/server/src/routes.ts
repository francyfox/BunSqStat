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
	.use(Stats)
	.use(AccessLogs)
	.use(WS);

export type EdenApp = typeof routes;

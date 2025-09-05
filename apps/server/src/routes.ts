import { Elysia, t } from "elysia";
import { AccessLogs } from "@/modules/access-logs";
import { Stats } from "@/modules/stats";

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
	.use(AccessLogs);

export type EdenApp = typeof routes;

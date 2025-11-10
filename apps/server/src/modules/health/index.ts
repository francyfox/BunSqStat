import { Elysia, t } from "elysia";

export const Health = new Elysia()
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
		// @ts-ignore
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
	);

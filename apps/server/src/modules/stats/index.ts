import { Elysia, t } from "elysia";
import { AccessLogService } from "@/modules/access-logs/service";
import { AccessLogSchema } from "@/modules/access-logs/types";
import { redisClient } from "@/redis";

export const Stats = new Elysia({ prefix: "/stats" })
	.get(
		"/",
		async () => {
			const accessLog = await AccessLogService.getLogs();
			const items = {
				accessLog,
			};

			return items;
		},
		{
			detail: {
				description: "Return all stats from all logs",
			},
			response: {
				"200": t.Object({
					accessLog: t.Object({
						items: t.Array(AccessLogSchema),
						total: t.Number(),
					}),
				}),
			},
		},
	)
	.get(
		"/redis/maxmemory",
		async () => {
			const { maxmemory: maxMemory } = await redisClient.send("CONFIG", [
				"GET",
				"maxmemory",
			]);
			return { maxMemory: Number(maxMemory) };
		},
		{
			detail: { description: "Get current Redis maxmemory" },
			response: t.Object({ maxMemory: t.Number() }),
		},
	)
	.post(
		"/redis/maxmemory",
		async ({ body }) => {
			const { maxMemory } = body;

			await redisClient.send("CONFIG", [
				"SET",
				"maxmemory",
				maxMemory.toString(),
			]);
			return { success: true, maxMemory };
		},
		{
			body: t.Object({ maxMemory: t.Number() }),
			detail: { description: "Set Redis maxmemory" },
			response: t.Object({ success: t.Boolean(), maxMemory: t.Number() }),
		},
	);

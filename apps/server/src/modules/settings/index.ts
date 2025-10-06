import { Elysia, t } from "elysia";
import { SettingsService } from "@/modules/settings/service";
import { redisClient } from "@/redis";

export const Settings = new Elysia()
	.get(
		"settings/aliases",
		async ({ query }) => {
			const { ipMap } = query;

			const items = await SettingsService.getAliases(ipMap?.split(","));
			return {
				items,
				count: items.length,
			};
		},
		{
			detail: { description: "Get aliases" },
			response: t.Object({ items: t.Array(t.Any()), count: t.Number() }),
			query: t.Partial(
				t.Object({
					ipMap: t.String(),
				}),
			),
		},
	)
	.post(
		"settings/aliases",
		async ({ body }) => {
			const { aliases } = body;

			await SettingsService.setAliases(aliases.trim().split(" "));

			return { success: true };
		},
		{
			body: t.Object({
				aliases: t.String({
					description: "Example: '127.0.0.1 username 127.0.0.2 username2 ...'",
				}),
			}),
			response: t.Object({ success: t.Boolean() }),
		},
	)
	.delete(
		"settings/aliases",
		async () => {
			await SettingsService.dropAliases();
			return { success: true };
		},
		{
			detail: { description: "Drop aliases" },
			response: t.Object({ success: t.Boolean() }),
		},
	)
	.get(
		"settings/redis/maxmemory",
		async () => {
			const { maxmemory } = await redisClient.send("CONFIG", [
				"GET",
				"maxmemory",
			]);
			return { item: Number(maxmemory) };
		},
		{
			detail: { description: "Get current Redis maxmemory" },
			response: t.Object({ item: t.Number() }),
		},
	)
	.post(
		"settings/redis/maxmemory",
		async ({ body }) => {
			const { maxMemory } = body;

			await redisClient.send("CONFIG", [
				"SET",
				"maxmemory",
				maxMemory.toString(),
			]);
			return { success: true };
		},
		{
			body: t.Object({ maxMemory: t.Number() }),
			detail: { description: "Set Redis maxmemory" },
			response: t.Object({ success: t.Boolean() }),
		},
	);

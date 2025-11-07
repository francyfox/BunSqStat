import { Elysia, t } from "elysia";
import { redisClient } from "@/libs/redis";
import { AccessLogService } from "@/modules/access-logs/service";
import { ParserService } from "@/modules/parser/service";
import { SettingsService } from "@/modules/settings/service";
import { chuck } from "@/utils/array";

export const Settings = new Elysia()
	.get("settings/origin/prefix", async () => {
		const response = await ParserService.getPrefix();

		return {
			item: response,
		};
	})
	.post(
		"settings/origin/prefix",
		async ({ body }) => {
			const { prefix } = body;
			await ParserService.addPrefix(prefix);
			await AccessLogService.createIndex(prefix);

			return {
				success: true,
			};
		},
		{
			body: t.Object({
				prefix: t.String({ description: "prefix from origin: o1, o2, ..." }),
			}),
			response: t.Object({
				success: t.Boolean(),
			}),
		},
	)
	.get(
		"settings/origin",
		async () => {
			const response = await ParserService.getAll();

			return response;
		},
		{
			detail: { description: "Get origin from UDP logs" },
			response: t.Object({
				items: t.Array(
					t.Object({
						id: t.String(),
						prefix: t.String(),
						host: t.String(),
						listen: t.Boolean(),
					}),
				),
				total: t.Number(),
			}),
		},
	)
	.post(
		"/settings/origin/:id",
		async ({ params: { id }, body: { host, listen, prefix } }) => {
			await ParserService.add(
				id,
				{
					listen,
				},
				host,
				prefix,
			);

			return { success: true };
		},
		{
			body: t.Object({
				id: t.String(),
				prefix: t.String(),
				host: t.String(),
				listen: t.Boolean(),
			}),
			response: t.Object({
				success: t.Boolean(),
			}),
		},
	)
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

			const recordAliases = chuck(aliases.trim().split(" "), 2).reduce(
				(acc: Record<string, any>, v) => {
					if (v.length === 2) acc[v[0]] = v[1];
					return acc;
				},
				{},
			);
			await SettingsService.setAliases(recordAliases);

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

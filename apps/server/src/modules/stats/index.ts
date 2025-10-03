import { Elysia, t } from "elysia";
import { AccessLogService } from "@/modules/access-logs/service";
import { AccessLogSchema } from "@/modules/access-logs/types";

export const Stats = new Elysia({ prefix: "/stats" }).get(
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
);

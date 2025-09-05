import { Elysia, t } from "elysia";
import { AccessLog, AccessLogSchema } from "@/modules/log-manager/access-log";

export const Stats = new Elysia().get(
	"/stats",
	async () => {
		const accessLog = await AccessLog.getLogs();
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

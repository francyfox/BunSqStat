import { Elysia, t } from "elysia";
import { AccessLog } from "@/modules/log-manager/access-log";

export const Stats = new Elysia().get(
	"/stats",
	async () => {
		const accessLogs = await AccessLog.getLogs();
		const items = {
			accessLogs,
		};

		return items;
	},
	{
		detail: {
			description: "Return all stats from all logs",
		},
		response: {
			"200": t.Object({
				accessLogs: t.Object({}),
			}),
		},
	},
);

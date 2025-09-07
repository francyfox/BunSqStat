import { Elysia, t } from "elysia";
import { AccessLogService } from "@/modules/access-logs/service";
import { AccessLogSchema } from "@/modules/access-logs/types";

export const AccessLogs = new Elysia().get(
	"/stats/access-logs",
	async ({ query }) => {
		const data = await AccessLogService.getLogs(query);

		return data;
	},
	{
		query: t.Partial(
			t.Object({
				search: t.String(),
				page: t.Number(),
				fields: t.Array(t.KeyOf(AccessLogSchema)),
			}),
		),
		response: {
			"200": t.Object({
				items: t.Array(t.Partial(AccessLogSchema)),
				total: t.Number(),
				count: t.Number(),
			}),
		},
	},
);

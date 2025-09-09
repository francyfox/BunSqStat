import { resolve } from "node:path";
import chokidar from "chokidar";
import { Elysia, t } from "elysia";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";
import { AccessLogSchema } from "@/modules/access-logs/types";

const LogModel = t.Object({
	changedLinesCount: t.Number(),
	data: t.Object({
		items: t.Array(AccessLogSchema),
		count: t.Number(),
		total: t.Number(),
	}),
});
export const WS = new Elysia()
	.model({
		"log.response": LogModel,
	})
	.decorate({
		watcher: chokidar.watch(
			[resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
			{
				interval: 1000,
				ignoreInitial: true,
			},
		),
	})
	.ws("/ws/:log", {
		body: t.Any(),
		open(ws) {
			const {
				data: {
					watcher,
					params: { log },
				},
			} = ws;

			ws.subscribe(log);
			console.info(`Subscribe on ${log}`);

			watcher.on("change", async (path) => {
				await AccessLogService.readLastLines(1);
				const data = {
					changedLinesCount: 1,
					time: new Date().toISOString(),
					path,
				};

				ws.publish(log, data);

				console.log(`WS send ${log}: ${path}`);
			});
		},
		async close(ws) {
			const {
				data: { watcher },
			} = ws;
			ws.close();
			await watcher.close();
		},
	});

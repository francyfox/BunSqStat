import { resolve } from "node:path";
import chokidar from "chokidar";
import { Elysia, t } from "elysia";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export const WS = new Elysia().ws("/ws", {
	body: t.Any(),
	open(ws) {
		const watcher = chokidar.watch(
			[resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
			{
				interval: 1000,
				ignoreInitial: true,
			},
		);

		watcher.on("change", async () => {
			await AccessLogService.readLastLines(1);
			const data = await AccessLogService.getLogs({ last: true });
			ws.send(data);
		});
	},
});

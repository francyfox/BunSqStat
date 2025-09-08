import { resolve } from "node:path";
import chokidar from "chokidar";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	logs: [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
	watcher: chokidar.watch([
		resolve(config.ACCESS_LOG),
		resolve(config.CACHE_LOG),
	]),

	async readLogs() {
		const logs = [AccessLogService];
		// const items = {};

		for (const log of logs) {
			await log.readAccessLogs();
			await log.createIndex();
		}
	},
};

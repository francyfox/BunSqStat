import { resolve } from "node:path";
import chokidar from "chokidar";
import { config } from "@/config";
import { AccessLog } from "@/modules/log-manager/access-log";

export interface getLogParams {
	search?: string;
	page?: number;
	fields?: string[];
}

export const LogManager = {
	logs: [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
	watcher: chokidar.watch([
		resolve(config.ACCESS_LOG),
		resolve(config.CACHE_LOG),
	]),

	async readLogs() {
		const logs = [AccessLog];
		const items = {};

		for (const log of logs) {
			await log.createIndex();
			await log.readAccessLogs();
		}
	},
};

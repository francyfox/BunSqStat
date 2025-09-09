import { resolve } from "node:path";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	logs: [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
	async readLogs() {
		const logs = [AccessLogService];

		for (const log of logs) {
			await log.readLastLines(1000);
			await log.createIndex();
		}
	},
};

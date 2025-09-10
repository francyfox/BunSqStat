import { resolve } from "node:path";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	logs: [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
	async readLogs() {
		const logs = [AccessLogService];

		for (const log of logs) {
			try {
				await log.readLastLines(1000);
				await log.createIndex();
				console.log('Successfully initialized log service');
			} catch (error) {
				console.error('Error initializing log service:', error);
				// Don't throw - allow the app to start even without logs
			}
		}
	},
};

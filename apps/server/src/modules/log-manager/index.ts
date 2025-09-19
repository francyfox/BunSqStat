import { Glob } from "bun";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	logs: <string[]>[],

	async findLogs() {
		const glob = new Glob(`${config.LOG_DIR}/*`);

		for await (const file of glob.scan()) {
			this.logs.push(file);
		}

		if (this.logs.length === 0) {
			console.error(`No logs found in ${config.LOG_DIR}`);
			return;
		}

		return this.logs;
	},

	async getAccessLogs() {
		return this.logs.filter((i) => /(?<=\/)access.*/.test(i));
	},

	async getCacheLogs() {
		return this.logs.filter((i) => /(?<=\/)cache.*/.test(i));
	},

	async readLogs() {
		const logs = [AccessLogService];
		await this.findLogs();
		console.log(this.logs);
		console.log(await this.getAccessLogs());

		// for (const log of logs) {
		// 	try {
		// 		await log.readLastLines(1000);
		// 		await log.createIndex();
		// 		console.log("Successfully initialized log service");
		// 	} catch (error) {
		// 		console.error("Error initializing log service:", error);
		// 		// Don't throw - allow the app to start even without logs
		// 	}
		// }
	},
};

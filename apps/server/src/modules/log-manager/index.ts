import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	logs: <string[]>[],

	async getAccessLogs() {
		return this.logs
			.filter((i) => /(?<=\/)access.*/.test(i))
			.sort((a, b) => Number(a.match(/\d/)?.[0]) - Number(b.match(/\d/)?.[0]));
	},

	async getCacheLogs() {
		return this.logs
			.filter((i) => /(?<=\/)cache.*/.test(i))
			.sort((a, b) => Number(a.match(/\d/)?.[0]) - Number(b.match(/\d/)?.[0]))
			.reverse();
	},

	async readLogs() {
		const logs = [AccessLogService];

		for (const log of logs) {
			try {
				const files =
					log.name === "access"
						? await this.getAccessLogs()
						: await this.getCacheLogs();

				await log.readLogs(files);
				await log.createIndex();
				console.log("Successfully initialized log service");
			} catch (error) {
				console.error("Error initializing log service:", error);
				// Don't throw - allow the app to start even without logs
			}
		}
	},
};

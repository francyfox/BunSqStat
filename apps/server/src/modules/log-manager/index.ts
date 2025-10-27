import { AccessLogService } from "@/modules/access-logs/service";

export const LogManager = {
	async readLogs() {
		try {
			await AccessLogService.createIndex();
			console.log("Successfully initialized log service");
		} catch (error) {
			console.error("Error initializing log service:", error);
		}
	},
};

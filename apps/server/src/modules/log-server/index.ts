import { config } from "@/config";
import { logger } from "@/libs/logger";
import { AccessLogService } from "@/modules/access-logs/service";

export const LogServer = {
	get listeners() {
		return config.SQUID_LISTENERS.trim()
			.split(",")
			.map((i) => {
				const [host, port] = i.split(":");

				if (!host || !port) {
					throw new Error("Invalid host or port");
				}

				return {
					host,
					port,
				};
			});
	},

	async start() {
		for (const listener of this.listeners) {
			try {
				await Bun.udpSocket({
					hostname: listener.host,
					port: Number(listener.port),
					socket: {
						data(_, data) {
							const startTime = Date.now();
							const logEntries = data.toString().trim().split("\n");

							AccessLogService.readLogs(logEntries);

							logger.info(
								{
									operation: "process_data",
									startTime,
									count: logEntries.length,
								},
								"store",
							);
						},
						error(_, error) {
							logger.error({ operation: "process_data" }, error.message);
						},
					},
				});
				logger.info(
					{
						operation: "udp_add",
						startTime: 0,
					},
					`${listener.host}:${listener.port} udp started`,
				);
			} catch (e) {
				const error = e as Error;
				logger.error(
					{
						operation: "udp_add",
					},
					error.message,
				);
			}
		}
	},
};

import { config } from "@/config";
import { logger } from "@/libs/logger";
import { AccessLogService } from "@/modules/access-logs/service";
import { ParserService } from "@/modules/parser/service";
import { WsService } from "@/modules/ws/ws.service";

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
		await ParserService.createIndex();
		await ParserService.addPrefix();

		for (const listener of this.listeners) {
			try {
				const socket = await Bun.udpSocket({
					hostname: listener.host,
					port: Number(listener.port),
					socket: {
						async data(_, data, _$1, address) {
							const startTime = performance.now();
							const logEntries = data.toString("utf8").trim().split("\n");
							const id = address.replaceAll(".", "");
							const { items, total } = await ParserService.getAll();
							const origin = items.find((i: any) => i.id === id);
							const prefix = origin?.prefix ?? `o${total + 1}`;

							if (!origin) {
								await ParserService.add(id, undefined, address, prefix);
							} else {
								if (!origin.listen) return;
							}

							await AccessLogService.readLogs(logEntries, prefix);

							WsService.send({ changedLinesCount: logEntries.length });

							logger.info(
								{
									operation: "process_data",
									startTime,
									count: logEntries.length,
									url: `${listener.host}:${listener.port}`,
								},
								"store",
							);
						},
						error(_, error) {
							logger.error(
								{
									operation: "process_data",
									url: `${listener.host}:${listener.port}`,
								},
								error.message,
							);
						},
					},
				});
				logger.info(
					{
						operation: "udp_add",
						startTime: 0,
						url: `${listener.host}:${listener.port}`,
					},
					`${listener.host}:${listener.port} udp started`,
				);

				const shutdown = () => {
					console.log("Graceful shutdown: closing UDP socket...");
					socket.close();
				};

				process.on("SIGINT", shutdown);
				process.on("SIGTERM", shutdown);
			} catch (e) {
				const error = e as Error;
				logger.error(
					{
						operation: "udp_add",
						url: `${listener.host}:${listener.port}`,
					},
					error.message,
				);
			}
		}
	},
};

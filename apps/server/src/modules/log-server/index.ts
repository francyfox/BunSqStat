import { config } from "@/config";

export const LogServer = {
	async start() {
		await Bun.udpSocket({
			hostname: config.SQUID_HOST,
			port: Number(config.SQUID_PORT),
			socket: {
				data(_, data) {
					const logEntries = data.toString().trim().split("\n");
					for (const log of logEntries) {
						console.log(`Received log: ${log}`);
					}
				},
				error(_, error) {
					console.error(`Socket error: ${error.message}`);
				},
			},
		});
	},
};

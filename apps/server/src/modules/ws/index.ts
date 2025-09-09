import { Elysia, t } from "elysia";
import { AccessLogSchema } from "@/modules/access-logs/types";
import { fileWatcher } from "@/modules/watcher";

const LogModel = t.Object({
	changedLinesCount: t.Number(),
	data: t.Object({
		items: t.Array(AccessLogSchema),
		count: t.Number(),
		total: t.Number(),
	}),
});

const connectedClients = new Set<any>();

fileWatcher.onFileChange((event) => {
	if (connectedClients.size > 0) {
		connectedClients.forEach((ws) => {
			try {
				ws.publish("access-logs", event);
			} catch (error) {
				console.error("Error publishing to WebSocket client:", error);
			}
		});
		console.log(`WebSocket broadcast: ${event.changedLinesCount} new lines to ${connectedClients.size} clients`);
	}
});

export const WS = new Elysia()
	.model({
		"log.response": LogModel,
	})
	.ws("/ws/:log", {
		body: t.Any(),
		open(ws) {
			const { data: { params: { log } } } = ws;
			
			connectedClients.add(ws);
			ws.subscribe(log);
			console.info(`WebSocket client connected to ${log} channel. Total clients: ${connectedClients.size}`);
		},
		close(ws) {
			connectedClients.delete(ws);
			console.info(`WebSocket client disconnected. Total clients: ${connectedClients.size}`);
		},
	});

import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
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

interface WebSocketClient {
	id: string;
	ws: any;
	lastPing: number;
	channel: string;
}

const connectedClients = new Map<string, WebSocketClient>();

function cleanupDeadConnections() {
	const now = Date.now();
	const staleTimeout = 60000; // 1 min

	for (const [clientId, client] of connectedClients) {
		if (now - client.lastPing > staleTimeout) {
			try {
				client.ws.send(JSON.stringify({ type: "ping" }));
				client.lastPing = now;
			} catch (error) {
				connectedClients.delete(clientId);
			}
		}
	}
}

setInterval(cleanupDeadConnections, 30000);

fileWatcher.onFileChange((event) => {
	if (connectedClients.size > 0) {
		const deadClients: string[] = [];
		const messageData = JSON.stringify(event);

		for (const [clientId, client] of connectedClients.entries()) {
			console.log(`Broadcasting to client ${clientId} on channel ${client.channel}`);
			try {
				// Use send() to directly send to this specific client
				client.ws.send(messageData);
				client.lastPing = Date.now();
			} catch (error) {
				console.error(`Failed to send to client ${clientId}:`, error);
				deadClients.push(clientId);
			}
		}

		for (const clientId of deadClients) {
			connectedClients.delete(clientId);
		}

		if (connectedClients.size > 0) {
			console.log(
				`WebSocket broadcast: ${event.changedLinesCount} new lines to ${connectedClients.size} active clients`,
			);
		}
	}
});

export const WS = new Elysia()
	.model({
		"log.response": LogModel,
	})
	.ws("/ws/:log", {
		body: t.Any(),
open(ws) {
			const {
				data: {
					params: { log },
				},
			} = ws;

			const clientId = nanoid(10);
			const client: WebSocketClient = {
				id: clientId,
				ws,
				lastPing: Date.now(),
				channel: log,
			};

			(ws.data as any).clientId = clientId;
			(ws.data as any).channel = log;

			connectedClients.set(clientId, client);
			ws.subscribe(log);
			// Send welcome message directly to this client
			ws.send(JSON.stringify({ type: "hello", clientId }));

			console.info(
				`WebSocket client [${clientId}] connected to ${log} channel. Total clients: ${connectedClients.size}`,
			);
		},
		message(ws, message) {
			const clientId = (ws.data as any).clientId;
			const client = connectedClients.get(clientId);

			if (client) {
				client.lastPing = Date.now();

				if (typeof message === "object") {
					switch ((message as any)?.type) {
						case "ping":
							ws.send(JSON.stringify({ type: "pong" }));
							break;
						default:
							ws.send(JSON.stringify({ type: "error", message: "NO_CONTENT" }));
					}
				}
			}
		},
close(ws) {
			const channel = (ws.data as any).channel ?? "access-logs";
			ws.unsubscribe(channel);
			const clientId = (ws.data as any).clientId;
			if (clientId && connectedClients.has(clientId)) {
				connectedClients.delete(clientId);
				console.info(
					`WebSocket client [${clientId}] disconnected. Total clients: ${connectedClients.size}`,
				);
			}
		},
	});

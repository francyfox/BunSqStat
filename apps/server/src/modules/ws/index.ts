import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { AccessLogSchema } from "@/modules/access-logs/types";

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

const wsConfig = {
	body: t.Any(),
	open(ws: any) {
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
		ws.send(
			JSON.stringify({
				type: "hello",
				clientId,
				totalClients: connectedClients.size,
			}),
		);

		console.info(
			`WebSocket client [${clientId}] connected to ${log} channel. Total clients: ${connectedClients.size}`,
		);
	},
	message(ws: any, message: any) {
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
	close(ws: any) {
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
};

export const WS = new Elysia()
	.model({
		"log.response": LogModel,
	})
	// WebSocket endpoints - поддерживаем как прямой доступ, так и через /api префикс
	.ws("/ws/:log", wsConfig)
	.ws("/api/ws/:log", wsConfig);

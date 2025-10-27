import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { STALE_TIMEOUT } from "@/consts";
import { AccessLogSchema } from "@/modules/access-logs/types";
import { type WebSocketClient, WsService } from "@/modules/ws/ws.service";

const LogModel = t.Object({
	changedLinesCount: t.Number(),
	data: t.Object({
		items: t.Array(AccessLogSchema),
		count: t.Number(),
		total: t.Number(),
	}),
});

setInterval(
	() => WsService.cleanupDeadConnections(STALE_TIMEOUT),
	STALE_TIMEOUT,
);

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

		WsService.connectedClients.set(clientId, client);
		ws.subscribe(log);
		ws.send(
			JSON.stringify({
				type: "hello",
				clientId,
				totalClients: WsService.connectedClients.size,
			}),
		);

		console.info(
			`WebSocket client [${clientId}] connected to ${log} channel. Total clients: ${WsService.connectedClients.size}`,
		);
	},
	message(ws: any, message: any) {
		const clientId = (ws.data as any).clientId;
		const client = WsService.connectedClients.get(clientId);

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
		if (clientId && WsService.connectedClients.has(clientId)) {
			WsService.connectedClients.delete(clientId);
			console.info(
				`WebSocket client [${clientId}] disconnected. Total clients: ${WsService.connectedClients.size}`,
			);
		}
	},
};

export const WS = new Elysia()
	.model({
		"log.response": LogModel,
	})
	.ws("/ws/:log", wsConfig)
	.ws("/api/ws/:log", wsConfig);

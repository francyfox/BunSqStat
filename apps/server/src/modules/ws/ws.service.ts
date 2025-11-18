import { config } from "@/config";
import { REDIS_WS_CHANNEL, redisSubscriber } from "@/libs/redis";

export interface WebSocketClient {
	id: string;
	ws: any;
	lastPing: number;
	channel: string;
}

await redisSubscriber.subscribe(REDIS_WS_CHANNEL, (message) => {
	try {
		WsService.send(JSON.parse(message));
	} catch (_) {
		throw new Error("Could not parse message from redis for websocket");
	}
});

export const WsService = {
	connectedClients: new Map<string, WebSocketClient>(),
	cleanupDeadConnections(staleTimeout = 60000) {
		const now = Date.now();

		for (const [clientId, client] of this.connectedClients) {
			if (now - client.lastPing > staleTimeout) {
				try {
					client.ws.send(JSON.stringify({ type: "ping" }));
					client.lastPing = now;
				} catch (error) {
					this.connectedClients.delete(clientId);
					console.log(`Client removed by inactivity ${clientId}`);
				}
			}
		}
	},
	send(data: { changedLinesCount: number }) {
		if (this.connectedClients.size > 0) {
			const deadClients: string[] = [];

			for (const [clientId, client] of this.connectedClients.entries()) {
				const messageData = JSON.stringify({
					...data,
					clientId,
					totalClients: this.connectedClients.size,
				});

				if (config.NODE_ENV !== "production") {
					console.log(
						`Broadcasting to client ${clientId} on channel ${client.channel}`,
					);
				}

				try {
					client.ws.send(messageData);
					client.lastPing = Date.now();
				} catch (error) {
					console.error(`Failed to send to client ${clientId}:`, error);
					deadClients.push(clientId);
				}
			}

			for (const clientId of deadClients) {
				this.connectedClients.delete(clientId);
			}

			if (this.connectedClients.size > 0 && config.NODE_ENV !== "production") {
				console.log(
					`WebSocket broadcast: ${data.changedLinesCount} new lines to ${this.connectedClients.size} active clients`,
				);
			}
		}
	},
};

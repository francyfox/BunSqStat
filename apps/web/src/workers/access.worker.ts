const _self: SharedWorkerGlobalScope = self as any;

interface SharedWorkerGlobalScope {
	onconnect: (event: MessageEvent) => void;
}

let wsInstance: WebSocket;
const connections: MessagePort[] = [];

function openWS(url: string) {
	return new WebSocket(url);
}

function sendMessage(v: any) {
	for (const connection of connections) {
		connection.postMessage(v);
	}
}

_self.onconnect = async (event) => {
	const port = event.ports[0] as MessagePort;
	connections.push(port);

	port.onmessage = (event: MessageEvent) => {
		const { url } = event.data;
		if (!wsInstance) wsInstance = openWS(url);
	};

	wsInstance.onmessage = (event: MessageEvent) => {
		const status = () => {
			switch (wsInstance.readyState) {
				case WebSocket.OPEN:
					return "OPEN";
				case WebSocket.CLOSED:
					return "CLOSED";
				case WebSocket.CONNECTING:
					return "CONNECTING";
				default:
					return "CLOSED";
			}
		};

		sendMessage(
			JSON.stringify({
				data: event.data,
				error: null,
				status: status(),
			}),
		);
	};

	wsInstance.onerror = (event) => {
		sendMessage(
			JSON.stringify({
				data: null,
				error: event,
				status: "CLOSED",
			}),
		);
	};

	port.start();
};

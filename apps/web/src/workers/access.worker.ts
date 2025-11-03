const _self: SharedWorkerGlobalScope = self as any;

interface SharedWorkerGlobalScope {
	onconnect: (event: MessageEvent) => void;
}

let onceOpen = false;
let wsInstance: WebSocket | undefined;
const connections: MessagePort[] = [];

const status = () => {
	switch (wsInstance?.readyState) {
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

function openWS(url: string) {
	return new WebSocket(url);
}

function sendMessage(v: any) {
	for (const connection of connections) {
		connection.postMessage(v);
	}
}

function connect(event: MessageEvent) {
	const { url, paused } = event.data;
	if (!wsInstance) wsInstance = openWS(url);

	if (onceOpen) {
		if (paused) {
			wsInstance.close();
		} else {
			wsInstance = openWS(url);
		}
	}

	wsInstance.onopen = (_) => {
		onceOpen = true;
		sendMessage(
			JSON.stringify({
				data: null,
				error: null,
				status: status(),
			}),
		);
	};
	wsInstance.onmessage = (event: MessageEvent) => {
		sendMessage(
			JSON.stringify({
				data: event.data,
				error: null,
				status: status(),
			}),
		);
	};

	wsInstance.onclose = (_) => {
		if (onceOpen && !paused) {
			setTimeout(() => {
				wsInstance = undefined;
				connect(event);
			}, 1000);
		}

		sendMessage(
			JSON.stringify({
				data: null,
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
}

_self.onconnect = async (event) => {
	const port = event.ports[0] as MessagePort;

	connections.push(port);

	port.onmessage = (event: MessageEvent) => {
		connect(event);
	};

	port.start();
};

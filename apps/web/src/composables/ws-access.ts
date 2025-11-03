import { useNotification } from "naive-ui";
import { ref, watch } from "vue";
import { WS_URL } from "@/consts.ts";
import AccessWorker from "@/workers/access.worker.ts?sharedworker";
import type { AccessWorkerPostData } from "@/workers/access.worker.types.ts";

export const useWsAccess = () => {
	const worker = new AccessWorker();
	const notification = useNotification();
	const value = ref();
	const status = ref("CONNECTING");
	const paused = ref(false);

	worker.port.postMessage({
		url: `${WS_URL}/ws/access-logs`,
	} as AccessWorkerPostData);

	watch(paused, (v) => {
		if (v) {
			worker.port.postMessage({
				url: `${WS_URL}/ws/access-logs`,
				paused: true,
			} as AccessWorkerPostData);
		} else {
			worker.port.postMessage({
				url: `${WS_URL}/ws/access-logs`,
				paused: false,
			} as AccessWorkerPostData);
		}
	});

	worker.onerror = (event) => {
		notification.error({
			title: "Websocket ERROR!",
			description: event.error.message,
		});
	};

	watch(status, (v) => {
		if (v === "CLOSED") {
			notification.error({
				title: "Websocket CLOSED",
			});
		}
	});

	worker.port.onmessage = (event: MessageEvent) => {
		let data: any;
		try {
			data = JSON.parse(event.data);
			value.value = JSON.parse(data.data);
			status.value = data.status;
		} catch (e) {
			const error = e as Error;
			notification.error({
				title: error.message,
			});
		}
	};

	return {
		value,
		status,
		paused,
	};
};

import { useEventBus } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { WS_URL } from "@/consts.ts";
import { notificationKey } from "@/utils/accessKey.ts";
import AccessWorker from "@/workers/access.worker.ts?sharedworker";
import type { AccessWorkerPostData } from "@/workers/access.worker.types.ts";

const worker = new AccessWorker();
let isInitialized = false;

export const useAccessStore = defineStore("access", () => {
	const { t } = useI18n();

	const value = shallowRef();
	const status = ref("CONNECTING");
	const paused = ref(false);
	const notificationBus = useEventBus(notificationKey);

	if (!isInitialized) {
		isInitialized = true;
		worker.port.postMessage({
			url: `${WS_URL}/ws/access-logs`,
		} as AccessWorkerPostData);
	}

	const messageHandler = (event: MessageEvent) => {
		let data: any;
		try {
			data = JSON.parse(event.data);
			value.value = JSON.parse(data.data);
			status.value = data.status;
		} catch (e) {
			const error = e as Error;
			notificationBus.emit("error", {
				title: error.message,
			});
		}
	};

	worker.port.onmessage = messageHandler;
	worker.onerror = (event) => {
		notificationBus.emit("error", {
			title: "Websocket ERROR!",
			description: event.error.message,
		});
	};

	watch(status, (v) => {
		switch (v) {
			case "CLOSED":
				notificationBus.emit("error", {
					title: t("wsError"),
					duration: 2500,
				});
				break;
			case "OPEN":
				notificationBus.emit("success", {
					title: t("wsSuccess"),
					duration: 1500,
				});
		}
	});

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

	return {
		value,
		status,
		paused,
	};
});

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

export const useAccessStore = defineStore(
	"access",
	() => {
		const { t } = useI18n();

		const value = shallowRef();
		const status = ref("CONNECTING");
		const paused = ref(false);
		const notificationBus = useEventBus(notificationKey);

		const messageHandler = (event: MessageEvent) => {
			let data: any;
			try {
				data = JSON.parse(event.data);
				value.value = JSON.parse(data.data);
				status.value = data.status;
				paused.value = data.paused;
			} catch (e) {
				const error = e as Error;
				notificationBus.emit("error", {
					title: error.message,
				});
			}
		};

		// Инициализируем соединение только один раз для первого экземпляра
		if (!isInitialized) {
			isInitialized = true;
			worker.port.postMessage({
				url: `${WS_URL}/ws/access-logs`,
			} as AccessWorkerPostData);

			// Устанавливаем единый обработчик сообщений
			worker.port.onmessage = messageHandler;
			worker.onerror = (event) => {
				console.log(event);
				notificationBus.emit("error", {
					title: "Websocket ERROR!",
					description: event?.message || "error",
				});
			};
		}

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

		function setPaused(v: boolean) {
			worker.port.postMessage({
				url: `${WS_URL}/ws/access-logs`,
				paused: v,
			} as AccessWorkerPostData);
		}

		return {
			value,
			status,
			paused,
			setPaused,
		};
	},
	{
		persist: {
			storage: sessionStorage,
			pick: ["paused"],
		},
	},
);

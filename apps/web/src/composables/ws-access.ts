import { useBroadcastChannel, useWebSocket } from "@vueuse/core";
import { useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { WS_URL } from "@/consts.ts";
import { useSettingsStore } from "@/stores/settings.ts";

interface IBroadcastData {
	closedId?: number;
	status: "OPEN" | "CONNECTING" | "CLOSED";
}

export const useWsAccess = () => {
	const store = useSettingsStore();
	const { localClientsConnected, clientId } = storeToRefs(store);
	const { t } = useI18n();
	const notification = useNotification();
	const broadcast = useBroadcastChannel({
		name: "access",
	});

	clientId.value = store.getLastClientId() + 1;

	const socket = useWebSocket(`${WS_URL}/ws/access-logs`, {
		immediate: false,
		autoReconnect: {
			retries: 3,
			delay: 1000,
			onFailed() {
				notification.error({
					content: t("wsError"),
				});
			},
		},
		onConnected: () => {
			console.log("Connected");
		},
		onDisconnected: () => {
			console.log("Disconnected");
		},
	});

	watch(socket.data, () => {
		broadcast.post({});
	});

	onMounted(() => {
		// window.addEventListener("beforeunload", );
	});

	return socket;
};

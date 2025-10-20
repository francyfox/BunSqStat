import { useWebSocket } from "@vueuse/core";
import { useNotification } from "naive-ui";
import { useI18n } from "vue-i18n";
import { WS_URL } from "@/consts.ts";

export const useWsAccess = () => {
	const { t } = useI18n();
	const notification = useNotification();
	const socket = useWebSocket(`${WS_URL}/ws/access-logs`, {
		autoReconnect: {
			retries: 3,
			delay: 1000,
			onFailed() {
				notification.error({
					content: t("wsError"),
				});
			},
		},
	});
	return socket;
};

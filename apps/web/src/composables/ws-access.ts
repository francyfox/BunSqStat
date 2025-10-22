import { useNotification } from "naive-ui";
import { reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { WS_URL } from "@/consts.ts";
import AccessWorker from "@/workers/access.worker.ts?sharedworker";

export const useWsAccess = () => {
	const worker = new AccessWorker();
	const { t } = useI18n();
	const notification = useNotification();
	const value = ref();
	const status = ref("CONNECTING");

	worker.port.postMessage({ url: `${WS_URL}/ws/access-logs` });

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
	};
};

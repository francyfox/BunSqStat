import { defineStore } from "pinia";
import type { getLogParams } from "server/schema";
import { ref, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useStatsStore = defineStore("stats", () => {
	const accessLog = shallowRef();
	const total = ref();
	const count = ref();
	const loading = ref(true);
	const error = ref(undefined);

	async function getAccessLogs(query?: getLogParams) {
		loading.value = true;
		const response = await api.stats["access-logs"].get({
			query,
		});

		if (response.error) {
			error.value = response.error.message;
			loading.value = false;

			return response;
		}

		accessLog.value = response.data.items;
		count.value = response.data.count;
		total.value = response.data.total;
		loading.value = false;

		return response;
	}

	return {
		error,
		loading,
		count,
		accessLog,
		total,
		getAccessLogs,
	};
});

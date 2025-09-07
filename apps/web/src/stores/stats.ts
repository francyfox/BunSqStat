import { defineStore } from "pinia";
import type { getLogParams } from "server/schema";
import { ref, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useStatsStore = defineStore("stats", () => {
	const accessLog = shallowRef();
	const total = ref();
	const count = ref();
	const loading = ref(true);

	async function getAccessLogs(query?: getLogParams) {
		loading.value = true;
		const response = await api.stats["access-logs"].get({
			query,
		});
		accessLog.value = response.data.items;
		count.value = response.data.count;
		total.value = response.data.total;
		loading.value = false;

		return response;
	}

	return {
		loading,
		count,
		accessLog,
		total,
		getAccessLogs,
	};
});

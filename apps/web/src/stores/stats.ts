import { defineStore } from "pinia";
import type { getLogParams } from "server/schema";
import { ref, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useStatsStore = defineStore("stats", () => {
	const accessLog = shallowRef();
	const total = ref();

	async function getAccessLogs(query?: getLogParams) {
		const response = await api.stats["access-logs"].get({
			query,
		});
		accessLog.value = response.data.items;
		total.value = response.data.total;

		return response;
	}

	return {
		accessLog,
		total,
		getAccessLogs,
	};
});

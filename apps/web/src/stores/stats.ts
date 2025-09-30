import { defineStore } from "pinia";
import type { getLogParams, TAccessLogMetricsResponse } from "server/schema";
import { ref, type ShallowRef, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useStatsStore = defineStore("stats", () => {
	const accessLog = shallowRef();
	const accessMetrics: ShallowRef<TAccessLogMetricsResponse | undefined> =
		shallowRef();
	const total = ref();
	const count = ref();
	const loading = ref(true);
	const error = ref(undefined);
	const sortBy = ref<string>("timestamp,DESC");

	function setSortBy(column: string, order: string) {
		const redisOrder = order === "ascend" ? "DESC" : "ASC";
		sortBy.value = `${column},${redisOrder}`;
	}

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

	async function getAccessMetrics(query?: {
		limit?: number;
		startTime?: number;
		endTime?: number;
	}) {
		loading.value = true;

		const response = await api.stats["access-logs"].metrics.get({
			query,
		});

		accessMetrics.value = response.data;
		loading.value = false;

		return response;
	}

	return {
		error,
		loading,
		count,
		accessLog,
		accessMetrics,
		total,
		sortBy,
		setSortBy,
		getAccessLogs,
		getAccessMetrics,
	};
});

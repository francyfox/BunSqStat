import { createIPProceededQuery } from '@/utils/string.ts'
import { defineStore } from "pinia";
import type { TMetricDomainOptions } from "server/schema";
import { reactive, ref, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useDomainStore = defineStore("domains", () => {
	const items = shallowRef([]);
	const count = ref(0);
	const loading = ref(false);
	const error = ref();
	const query = reactive<Partial<TMetricDomainOptions>>({
		search: "",
		limit: 10,
		page: 1,
		sortBy: "requestCount",
		sortOrder: "DESC",
	});

	const pageCount = ref(0);

	function setSortBy(column: TMetricDomainOptions["sortBy"], order: "ascend" | "descend") {
		const redisOrder = order === "ascend" ? "DESC" : "ASC";
		query.sortBy = column;
		query.sortOrder = redisOrder;
	}

	async function getMetricsDomain() {
		loading.value = true;
		const response = await api.stats["access-logs"].metrics.domains.get({
			query
		});

		if (response.error) {
			error.value = response.error.message;
			loading.value = false;

			return response;
		}

		items.value = response.data.items;
		count.value = response.data.count;
		pageCount.value = Math.ceil(response.data.count / (query.limit || 10));
		loading.value = false;

		return response;
	}

	return {
		items,
		count,
		loading,
		error,
		query,
		pageCount,
		setSortBy,
		getMetricsDomain,
	};
});

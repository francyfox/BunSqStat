import { defineStore } from "pinia";
import type { IMetricDomainOptions } from "server/schema";
import { ref, shallowRef } from "vue";
import { api } from "@/api.ts";

export const useDomainStore = defineStore("domains", () => {
	const items = shallowRef();
	const count = ref(0);
	const loading = ref(false);
	const error = ref();

	async function getMetricsDomain(query: IMetricDomainOptions) {
		loading.value = true;
		const response = await api.stats["access-logs"].metrics.domains.get({
			query,
		});

		if (response.error) {
			error.value = response.error.message;
			loading.value = false;

			return response;
		}

		items.value = response.data.items;
		count.value = response.data.count;
		loading.value = false;

		return response;
	}

	return {
		items,
		count,
		loading,
		error,
		getMetricsDomain,
	};
});

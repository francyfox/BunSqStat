import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { api } from "@/api.ts";

export const useSettingsStore = defineStore("settings", () => {
	const settings = reactive({
		maxMemory: 0,
	});
	const error = ref();
	const loading = ref(false);

	async function getMaxMemory() {
		const response = await api.stats.settings.redis.maxmemory.get();
		const {
			data: { maxMemory },
		} = response;

		if (response.error) {
			error.value = response.error.message;

			return;
		}

		loading.value = false;

		settings.maxMemory = Number(maxMemory);
		return response;
	}

	async function setMaxMemory(value: number) {
		loading.value = true;
		const response = await api.stats.settings.redis.maxmemory.post({
			maxMemory: value,
		});

		if (response.error) {
			error.value = response.error.message;
		}

		loading.value = false;

		return response;
	}

	return {
		getMaxMemory,
		setMaxMemory,
		settings,
		loading,
		error,
	};
});

import { defineStore } from "pinia";
import { createRouter } from "radix3";
import { reactive, ref } from "vue";
import { api } from "@/api.ts";

export const useSettingsStore = defineStore("settings", () => {
	const aliasRouter = createRouter();
	const aliasRouterIsInitialized = ref(false);
	const settings = reactive({
		maxMemory: 0,
		aliases: "",
	});

	const error = ref();
	const loading = ref(false);

	function getAliasByIp(ip: string) {
		const route = ip.replaceAll(".", "/");
		console.log(route);
		return aliasRouter.lookup(route);
	}

	async function getAliases() {
		const response = await api.settings.aliases.get();

		if (response.error) {
			error.value = response.error.message;

			return;
		} else {
			error.value = "";
		}

		loading.value = false;

		const {
			data: { items },
		} = response;
		for (const [ip, alias] of items) {
			aliasRouter.insert(ip.replaceAll(".", "/"), { payload: alias });
		}

		console.log(aliasRouter);
		aliasRouterIsInitialized.value = true;

		return response;
	}

	async function setAliases() {
		const response = await api.settings.aliases.post({
			aliases: settings.aliases,
		});

		if (response.error) {
			error.value = response.error.message;
		} else {
			error.value = "";
		}

		loading.value = false;

		return response;
	}

	async function getMaxMemory() {
		const response = await api.settings.redis.maxmemory.get();
		const {
			data: { item: maxMemory },
		} = response;

		if (response.error) {
			error.value = response.error.message;
		} else {
			error.value = "";
		}

		loading.value = false;

		settings.maxMemory = Number(maxMemory);
		return response;
	}

	async function setMaxMemory(value: number) {
		loading.value = true;
		const response = await api.settings.redis.maxmemory.post({
			maxMemory: value,
		});

		if (response.error) {
			error.value = response.error.message;
		} else {
			error.value = "";
		}

		loading.value = false;

		return response;
	}

	return {
		aliasRouterIsInitialized,
		getAliases,
		getAliasByIp,
		setAliases,
		getMaxMemory,
		setMaxMemory,
		settings,
		loading,
		error,
	};
});

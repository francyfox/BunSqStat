import { defineStore } from "pinia";
import { createRouter } from "radix3";
import { reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "@/api.ts";

export const useSettingsStore = defineStore(
	"settings",
	() => {
		const clientId = ref();
		const masterList = shallowRef({
			master: 0,
		});
		const { locale } = useI18n();
		const aliasRouter = createRouter();
		const aliasRouterIsInitialized = ref(false);
		const language = ref<string>();
		const settings = reactive({
			maxMemory: 0,
			aliases: "",
		});

		const error = ref();
		const loading = ref(false);

		function setLocale(v: string) {
			language.value = v;
			locale.value = v;
		}

		async function parseLogs() {
			const response = await api.settings.parser.post();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";
			}

			return response;
		}

		async function dropLogAccess() {
			const response = await api.stats["access-logs"].delete();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";
			}

			return response;
		}

		async function dropAliases() {
			const response = await api.settings.aliases.delete();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";
			}

			return response;
		}

		function getAliasByIp(ip: string | any) {
			const route = ip.replaceAll(".", "/");
			return aliasRouter.lookup(route);
		}

		async function getAliases() {
			const response = await api.settings.aliases.get();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";

				const {
					data: { items },
				} = response;
				for (const [ip, alias] of items) {
					aliasRouter.insert(ip.replaceAll(".", "/"), { payload: alias });
				}

				aliasRouterIsInitialized.value = true;
			}

			loading.value = false;

			return response;
		}

		async function setAliases() {
			const response = await api.settings.aliases.post({
				aliases: (settings.aliases as any).replaceAll(".", "_"),
			});

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";

				aliasRouterIsInitialized.value = false;
				await getAliases();
				aliasRouterIsInitialized.value = true; // TODO: bad way. Double update. Use watchEffect
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
				settings.maxMemory = Number(maxMemory);
			}

			loading.value = false;
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
			dropAliases,
			dropLogAccess,
			getAliases,
			getAliasByIp,
			setAliases,
			getMaxMemory,
			setMaxMemory,
			parseLogs,
			setLocale,
			getLastClientId,
			getFirstClientId,
			clientId,
			localClientsConnected,
			language,
			aliasRouterIsInitialized,
			settings,
			loading,
			error,
		};
	},
	{
		persist: {
			storage: localStorage,
			pick: ["language", "localClientsConnected"],
		},
	},
);

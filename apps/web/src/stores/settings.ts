import { defineStore } from "pinia";
import { createRouter } from "radix3";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "@/api.ts";

export const useSettingsStore = defineStore(
	"settings",
	() => {
		const currentTab = ref<string>();
		const { locale } = useI18n();
		const aliasRouter = createRouter();
		const aliasRouterIsInitialized = ref(false);
		const language = ref<string>();
		const interval = ref<number>(1000);
		const settings = reactive({
			maxMemory: 0,
			origins: [],
			aliases: "",
		});

		const error = ref();
		const loading = ref(false);

		function setLocale(v: string) {
			language.value = v;
			locale.value = v;
		}

		async function getOrigins() {
			const response = await api.settings.origin.get();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";

				settings.origins = response.data.items;
			}

			return response;
		}

		async function setOrigin(v: any) {
			loading.value = true;
			const response = await api.settings.origin({ id: v.id }).post(v);

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";
			}

			loading.value = false;
			return response;
		}

		async function dropLogAccess() {
			loading.value = true;
			const response = await api.stats["access-logs"].delete();

			if (response.error) {
				error.value = response.error.message;
			} else {
				error.value = "";
			}

			loading.value = false;
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
			loading.value = true;
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
			loading.value = true;

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
			loading.value = true;
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
			setLocale,
			getOrigins,
			setOrigin,
			interval,
			currentTab,
			language,
			aliasRouterIsInitialized,
			settings,
			loading,
			error,
		};
	},
	{
		persist: [
			{
				storage: localStorage,
				pick: ["language", "tabs", "interval"],
			},
		],
	},
);

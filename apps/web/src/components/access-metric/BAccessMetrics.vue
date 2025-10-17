<script setup lang="ts">
import { useWebSocket, watchDebounced } from "@vueuse/core";
import { useRouteHash } from "@vueuse/router";
import { NTabPane, NTabs, useNotification } from "naive-ui";
import { onActivated, onMounted, onUnmounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import BAccessMetricFilter from "@/components/access-metric/BAccessMetricFilter.vue";
import BTabDomains from "@/components/access-metric/BTabDomains.vue";
import BTabGlobal from "@/components/access-metric/BTabGlobal.vue";
import BTabUsers from "@/components/access-metric/BTabUsers.vue";
import { WS_URL } from "@/consts.ts";
import { useDomainStore } from "@/stores/domains.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notification = useNotification();

const statsStore = useStatsStore();
const settingsStore = useSettingsStore();

const domainStore = useDomainStore();

const form = ref({
	limit: 50,
	time: undefined,
});

const tab = ref("global");

function handleTabChange(tab: string) {
	router.push({ name: route.name, hash: `#${tab}` });
}

watchDebounced(
	form,
	async (v) => {
		const { limit, time: [startTime, endTime] = [] } = v;

		await statsStore.getAccessMetrics({
			limit,
			startTime,
			endTime,
		});
	},
	{
		deep: true,
		debounce: 500,
	},
);

watch(
	() => route.hash,
	(v) => {
		tab.value = v ? v.replace("#", "") : "global";
	},
);

const { data, close, open, status } = useWebSocket(`${WS_URL}/ws/access-logs`, {
	autoReconnect: {
		retries: 3,
		delay: 1000,
		onFailed() {
			notification.error({
				content: t("wsError"),
			});
		},
	},
});

watchDebounced(data, async (v) => {
	if (!v) return;
	let value: any;
	try {
		value = JSON.parse(v);
	} catch (_) {
		// Ignore non-JSON messages
		return;
	}

	if (
		typeof value?.changedLinesCount !== "number" ||
		value.changedLinesCount <= 0
	) {
		return;
	}
	console.log(`Received ${value.changedLinesCount} new log entries`);

	await statsStore.getAccessMetrics({
		limit: form.value.limit,
		startTime: form.value.time ? form.value.time[0] : undefined,
		endTime: form.value.time ? form.value.time[1] : undefined,
	});

	if (route.hash === "#domains") {
		await domainStore.getMetricsDomain();
	}
});

onMounted(async () => {
	await Promise.all([
		statsStore.getAccessMetrics(),
		settingsStore.getAliases(),
	]);

	if (status.value === "CLOSED") open();

	if (route.hash) {
		setTimeout(() => {
			tab.value = route.hash?.replace("#", "");
		}, 500);
	}
});

onUnmounted(() => {
	window.location.hash = "";
});

onBeforeRouteLeave(() => {
	close();
});

onActivated(() => {
	if (status.value === "CLOSED") open();
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <BAccessMetricFilter
        v-model="form"
    />

    <NTabs
        v-model:value="tab"
        type="line"
        size="large"
        @update:value="handleTabChange"
        animated
    >
      <NTabPane name="global" :tab="$t('globalTab')">
        <BTabGlobal
            v-model="form"
        />
      </NTabPane>

      <NTabPane name="users" :tab="$t('usersTab')">
        <BTabUsers />
      </NTabPane>

      <NTabPane name="domains" :tab="$t('domainsTab')">
        <BTabDomains />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style lang="postcss" scoped></style>